/*jslint plusplus: true, vars: true, indent: 2 */

(function (exports) {
  "use strict";

  if (Math.trunc == undefined) {
    Math.trunc = function (x) {
      return x < 0 ? Math.ceil(x) : Math.floor(x);
    };
  }
  if (Math.sign == undefined) {
    Math.sign = function (x) {
      return x < 0 ? -1 : (x > 0 ? +1 : 0 * x);
    };
  }
  if (Number.EPSILON == undefined) {
    Number.EPSILON = (function (x) {
      return x(x, 1 / 4503599627370496);
    }(function (f, epsilon) {
      return (1 + epsilon / 2) !== 1 ? f(f, epsilon / 2) : epsilon;
    }));
  }

  // BigInteger.js
  // Available under Public Domain
  // https://github.com/Yaffle/BigInteger/

  // For implementation details, see "The Handbook of Applied Cryptography"
  // http://www.cacr.math.uwaterloo.ca/hac/about/chap14.pdf

  var parseInteger = function (s, from, to, radix) {
    var i = from - 1;
    var n = 0;
    var y = radix < 10 ? radix : 10;
    while (++i < to) {
      var code = s.charCodeAt(i);
      var v = code - 48;
      if (v < 0 || y <= v) {
        v = 10 - 65 + code;
        if (v < 10 || radix <= v) {
          v = 10 - 97 + code;
          if (v < 10 || radix <= v) {
            throw new RangeError();
          }
        }
      }
      n = n * radix + v;
    }
    return n;
  };

  var createArray = function (length) {
    var x = new Array(length);
    var i = -1;
    while (++i < length) {
      x[i] = 0;
    }
    return x;
  };

  // count >= 1
  var pow = function (x, count) {
    var accumulator = 1;
    var v = x;
    var c = count;
    while (c > 1) {
      var q = Math.trunc(c / 2);
      if (q * 2 !== c) {
        accumulator *= v;
      }
      v *= v;
      c = q;
    }
    return accumulator * v;
  };

  var BASE = 2 / Number.EPSILON;
  var SPLIT = 67108864 * pow(2, Math.trunc((Math.trunc(Math.log(BASE) / Math.log(2) + 0.5) - 53) / 2) + 1) + 1;

  var fastTrunc = function (x) {
    var v = (x - BASE) + BASE;
    return v > x ? v - 1 : v;
  };

  // Veltkamp-Dekker's algorithm
  // see http://web.mit.edu/tabbott/Public/quaddouble-debian/qd-2.3.4-old/docs/qd.pdf
  // with FMA:
  // var product = a * b;
  // var error = Math.fma(a, b, -product);
  var performMultiplication = function (carry, a, b) {
    var at = SPLIT * a;
    var ahi = at - (at - a);
    var alo = a - ahi;
    var bt = SPLIT * b;
    var bhi = bt - (bt - b);
    var blo = b - bhi;
    var product = a * b;
    var error = ((ahi * bhi - product) + ahi * blo + alo * bhi) + alo * blo;

    var hi = fastTrunc(product / BASE);
    var lo = product - hi * BASE + error;

    if (lo < 0) {
      lo += BASE;
      hi -= 1;
    }

    lo += carry - BASE;
    if (lo < 0) {
      lo += BASE;
    } else {
      hi += 1;
    }

    return {lo: lo, hi: hi};
  };

  var performDivision = function (a, b, divisor) {
    if (a >= divisor) {
      throw new RangeError();
    }
    var p = a * BASE;
    var y = p / divisor;
    var r = p % divisor;
    var q = fastTrunc(y);
    if (y === q && r > divisor - r) {
      q -= 1;
    }
    r += b - divisor;
    if (r < 0) {
      r += divisor;
    } else {
      q += 1;
    }
    y = fastTrunc(r / divisor);
    r -= y * divisor;
    q += y;
    return {q: q, r: r};
  };

  function BigInteger(signum, magnitude, length) {
    this.signum = signum;
    this.magnitude = magnitude;
    this.length = length;
  }

  var createBigInteger = function (signum, magnitude, length) {
    return length < 2 ? (length === 0 ? 0 : (signum < 0 ? 0 - magnitude[0] : magnitude[0])) : new BigInteger(signum, magnitude, length);
  };

  var parseBigInteger = function (s, radix) {
    if (radix === undefined) {
      radix = 10;
    }
    if (Math.trunc(radix) !== radix || !(radix >= 2 && radix <= 36)) {
      throw new RangeError("radix argument must be an integer between 2 and 36");
    }
    var length = s.length;
    if (length === 0) {
      throw new RangeError();
    }
    var signum = 1;
    var signCharCode = s.charCodeAt(0);
    var from = 0;
    if (signCharCode === 43) { // "+"
      from = 1;
    }
    if (signCharCode === 45) { // "-"
      from = 1;
      signum = -1;
    }

    length -= from;
    if (length === 0) {
      throw new RangeError();
    }
    if (pow(radix, length) <= BASE) {
      var value = parseInteger(s, from, from + length, radix);
      return signum < 0 ? 0 - value : value;
    }
    var groupLength = 0;
    var groupRadix = 1;
    var limit = fastTrunc(BASE / radix);
    while (groupRadix <= limit) {
      groupLength += 1;
      groupRadix *= radix;
    }
    var size = Math.trunc((length - 1) / groupLength) + 1;

    var magnitude = createArray(size);
    var k = size;
    var i = length;
    while (i > 0) {
      k -= 1;
      magnitude[k] = parseInteger(s, from + (i > groupLength ? i - groupLength : 0), from + i, radix);
      i -= groupLength;
    }

    var j = -1;
    while (++j < size) {
      var c = magnitude[j];
      var l = -1;
      while (++l < j) {
        var tmp = performMultiplication(c, magnitude[l], groupRadix, magnitude, l);
        var lo = tmp.lo;
        var hi = tmp.hi;
        magnitude[l] = lo;
        c = hi;
      }
      magnitude[j] = c;
    }

    while (size > 0 && magnitude[size - 1] === 0) {
      size -= 1;
    }

    return createBigInteger(size === 0 ? 0 : signum, magnitude, size);
  };

  var compareMagnitude = function (aMagnitude, aLength, aValue, bMagnitude, bLength, bValue) {
    if (aLength !== bLength) {
      return aLength < bLength ? -1 : +1;
    }
    var i = aLength;
    while (--i >= 0) {
      if ((aMagnitude === undefined ? aValue : aMagnitude[i]) !== (bMagnitude === undefined ? bValue : bMagnitude[i])) {
        return (aMagnitude === undefined ? aValue : aMagnitude[i]) < (bMagnitude === undefined ? bValue : bMagnitude[i]) ? -1 : +1;
      }
    }
    return 0;
  };

  var compareTo = function (aSignum, aMagnitude, aLength, aValue, bSignum, bMagnitude, bLength, bValue) {
    if (aSignum === bSignum) {
      var c = compareMagnitude(aMagnitude, aLength, aValue, bMagnitude, bLength, bValue);
      return aSignum < 0 ? 0 - c : c; // positive zero will be returned for c === 0
    }
    if (aSignum === 0) {
      return 0 - bSignum;
    }
    return aSignum;
  };

  var add = function (aSignum, aMagnitude, aLength, aValue, bSignum, bMagnitude, bLength, bValue) {
    var z = compareMagnitude(aMagnitude, aLength, aValue, bMagnitude, bLength, bValue);
    var minSignum = z < 0 ? aSignum : bSignum;
    var minMagnitude = z < 0 ? aMagnitude : bMagnitude;
    var minLength = z < 0 ? aLength : bLength;
    var minValue = z < 0 ? aValue : bValue;
    var maxSignum = z < 0 ? bSignum : aSignum;
    var maxMagnitude = z < 0 ? bMagnitude : aMagnitude;
    var maxLength = z < 0 ? bLength : aLength;
    var maxValue = z < 0 ? bValue : aValue;

    // |a| <= |b|
    if (minSignum === 0) {
      return maxMagnitude === undefined ? (maxSignum < 0 ? 0 - maxValue : maxValue) : createBigInteger(maxSignum, maxMagnitude, maxLength);
    }
    var subtract = 0;
    var resultLength = maxLength;
    if (minSignum !== maxSignum) {
      subtract = 1;
      if (minLength === resultLength) {
        while (resultLength > 0 && (minMagnitude === undefined ? minValue : minMagnitude[resultLength - 1]) === (maxMagnitude === undefined ? maxValue : maxMagnitude[resultLength - 1])) {
          resultLength -= 1;
        }
      }
      if (resultLength === 0) { // a === (-b)
        return createBigInteger(0, createArray(0), 0);
      }
    }
    // result !== 0
    var result = createArray(resultLength + (1 - subtract));
    var i = -1;
    var c = 0;
    while (++i < resultLength) {
      var aDigit = i < minLength ? (minMagnitude === undefined ? minValue : minMagnitude[i]) : 0;
      c += (maxMagnitude === undefined ? maxValue : maxMagnitude[i]) + (subtract === 1 ? 0 - aDigit : aDigit - BASE);
      if (c < 0) {
        result[i] = BASE + c;
        c = 0 - subtract;
      } else {
        result[i] = c;
        c = 1 - subtract;
      }
    }
    if (c !== 0) {
      result[resultLength] = c;
      resultLength += 1;
    }
    while (resultLength > 0 && result[resultLength - 1] === 0) {
      resultLength -= 1;
    }
    return createBigInteger(maxSignum, result, resultLength);
  };

  var multiply = function (aSignum, aMagnitude, aLength, aValue, bSignum, bMagnitude, bLength, bValue) {
    if (aLength === 0 || bLength === 0) {
      return createBigInteger(0, createArray(0), 0);
    }
    var resultSign = aSignum < 0 ? 0 - bSignum : bSignum;
    if (aLength === 1 && (aMagnitude === undefined ? aValue : aMagnitude[0]) === 1) {
      return bMagnitude === undefined ? (resultSign < 0 ? 0 - bValue : bValue) : createBigInteger(resultSign, bMagnitude, bLength);
    }
    if (bLength === 1 && (bMagnitude === undefined ? bValue : bMagnitude[0]) === 1) {
      return aMagnitude === undefined ? (resultSign < 0 ? 0 - aValue : aValue) : createBigInteger(resultSign, aMagnitude, aLength);
    }
    var resultLength = aLength + bLength;
    var result = createArray(resultLength);
    var i = -1;
    while (++i < bLength) {
      var c = 0;
      var j = -1;
      while (++j < aLength) {
        var carry = 0;
        c += result[j + i] - BASE;
        if (c >= 0) {
          carry = 1;
        } else {
          c += BASE;
        }
        var tmp = performMultiplication(c, aMagnitude === undefined ? aValue : aMagnitude[j], bMagnitude === undefined ? bValue : bMagnitude[i]);
        var lo = tmp.lo;
        var hi = tmp.hi;
        result[j + i] = lo;
        c = hi + carry;
      }
      result[aLength + i] = c;
    }
    while (resultLength > 0 && result[resultLength - 1] === 0) {
      resultLength -= 1;
    }
    return createBigInteger(resultSign, result, resultLength);
  };

  var divideAndRemainder = function (aSignum, aMagnitude, aLength, aValue, bSignum, bMagnitude, bLength, bValue, divide) {
    if (bLength === 0) {
      throw new RangeError();
    }
    if (aLength === 0) {
      return createBigInteger(0, createArray(0), 0);
    }
    var quotientSign = aSignum < 0 ? 0 - bSignum : bSignum;
    if (bLength === 1 && (bMagnitude === undefined ? bValue : bMagnitude[0]) === 1) {
      if (divide === 1) {
        return aMagnitude === undefined ? (quotientSign < 0 ? 0 - aValue : aValue) : createBigInteger(quotientSign, aMagnitude, aLength);
      }
      return createBigInteger(0, createArray(0), 0);
    }

    var divisorOffset = aLength + 1; // `+ 1` for extra digit in case of normalization
    var divisorAndRemainder = createArray(divisorOffset + bLength + 1); // `+ 1` to avoid `index < length` checks
    var divisor = divisorAndRemainder;
    var remainder = divisorAndRemainder;
    var n = -1;
    while (++n < aLength) {
      remainder[n] = aMagnitude === undefined ? aValue : aMagnitude[n];
    }
    var m = -1;
    while (++m < bLength) {
      divisor[divisorOffset + m] = bMagnitude === undefined ? bValue : bMagnitude[m];
    }

    var top = divisor[divisorOffset + bLength - 1];

    // normalization
    var lambda = 1;
    if (bLength > 1) {
      lambda = fastTrunc(BASE / (top + 1));
      if (lambda > 1) {
        var carry = 0;
        var l = -1;
        while (++l < divisorOffset + bLength) {
          var tmp = performMultiplication(carry, divisorAndRemainder[l], lambda);
          var lo = tmp.lo;
          var hi = tmp.hi;
          divisorAndRemainder[l] = lo;
          carry = hi;
        }
        divisorAndRemainder[divisorOffset + bLength] = carry;
        top = divisor[divisorOffset + bLength - 1];
      }
      // assertion
      if (top < fastTrunc(BASE / 2)) {
        throw new RangeError();
      }
    }

    var shift = aLength - bLength + 1;
    if (shift < 0) {
      shift = 0;
    }
    var quotient = undefined;
    var quotientLength = 0;

    var i = shift;
    while (--i >= 0) {
      var t = bLength + i;
      var q = BASE - 1;
      if (remainder[t] !== top) {
        var tmp2 = performDivision(remainder[t], remainder[t - 1], top);
        var q2 = tmp2.q;
        var r2 = tmp2.r;
        q = q2;
      }

      var ax = 0;
      var bx = 0;
      var j = i - 1;
      while (++j <= t) {
        var rj = remainder[j];
        var tmp3 = performMultiplication(bx, q, divisor[divisorOffset + j - i]);
        var lo3 = tmp3.lo;
        var hi3 = tmp3.hi;
        remainder[j] = lo3;
        bx = hi3;
        ax += rj - remainder[j];
        if (ax < 0) {
          remainder[j] = BASE + ax;
          ax = -1;
        } else {
          remainder[j] = ax;
          ax = 0;
        }
      }
      while (ax !== 0) {
        q -= 1;
        var c = 0;
        var k = i - 1;
        while (++k <= t) {
          c += remainder[k] - BASE + divisor[divisorOffset + k - i];
          if (c < 0) {
            remainder[k] = BASE + c;
            c = 0;
          } else {
            remainder[k] = c;
            c = +1;
          }
        }
        ax += c;
      }
      if (divide === 1 && q !== 0) {
        if (quotientLength === 0) {
          quotientLength = i + 1;
          quotient = createArray(quotientLength);
        }
        quotient[i] = q;
      }
    }

    if (divide === 1) {
      if (quotientLength === 0) {
        return createBigInteger(0, createArray(0), 0);
      }
      return createBigInteger(quotientSign, quotient, quotientLength);
    }

    var remainderLength = aLength + 1;
    if (lambda > 1) {
      var r = 0;
      var p = remainderLength;
      while (--p >= 0) {
        var tmp4 = performDivision(r, remainder[p], lambda);
        var q4 = tmp4.q;
        var r4 = tmp4.r;
        remainder[p] = q4;
        r = r4;
      }
      if (r !== 0) {
        // assertion
        throw new RangeError();
      }
    }
    while (remainderLength > 0 && remainder[remainderLength - 1] === 0) {
      remainderLength -= 1;
    }
    if (remainderLength === 0) {
      return createBigInteger(0, createArray(0), 0);
    }
    var result = createArray(remainderLength);
    var o = -1;
    while (++o < remainderLength) {
      result[o] = remainder[o];
    }
    return createBigInteger(aSignum, result, remainderLength);
  };

  var toString = function (signum, magnitude, length, radix) {
    var result = signum < 0 ? "-" : "";

    var remainderLength = length;
    if (remainderLength === 0) {
      return "0";
    }
    if (remainderLength === 1) {
      result += magnitude[0].toString(radix);
      return result;
    }
    var groupLength = 0;
    var groupRadix = 1;
    var limit = fastTrunc(BASE / radix);
    while (groupRadix <= limit) {
      groupLength += 1;
      groupRadix *= radix;
    }
    // assertion
    if (groupRadix * radix <= BASE) {
      throw new RangeError();
    }
    var size = remainderLength + Math.trunc((remainderLength - 1) / groupLength) + 1;
    var remainder = createArray(size);
    var n = -1;
    while (++n < remainderLength) {
      remainder[n] = magnitude[n];
    }

    var k = size;
    while (remainderLength !== 0) {
      var groupDigit = 0;
      var i = remainderLength;
      while (--i >= 0) {
        var tmp = performDivision(groupDigit, remainder[i], groupRadix);
        var q = tmp.q;
        var r = tmp.r;
        remainder[i] = q;
        groupDigit = r;
      }
      while (remainderLength > 0 && remainder[remainderLength - 1] === 0) {
        remainderLength -= 1;
      }
      k -= 1;
      remainder[k] = groupDigit;
    }
    result += remainder[k].toString(radix);
    while (++k < size) {
      var t = remainder[k].toString(radix);
      var j = groupLength - t.length;
      while (--j >= 0) {
        result += "0";
      }
      result += t;
    }
    return result;
  };

  BigInteger.parseInt = parseBigInteger;

  Number.prototype["BigInteger.toString"] = Number.prototype.toString;
  Number.prototype["BigInteger.compareTo"] = function (y) {
    return y["BigInteger.compareToNumber"](this);
  };
  Number.prototype["BigInteger.negate"] = function () {
    return 0 - this;
  };
  Number.prototype["BigInteger.add"] = function (y) {
    return y["BigInteger.addNumber"](this);
  };
  Number.prototype["BigInteger.subtract"] = function (y) {
    return y["BigInteger.subtractNumber"](this);
  };
  Number.prototype["BigInteger.multiply"] = function (y) {
    return y["BigInteger.multiplyNumber"](this);
  };
  Number.prototype["BigInteger.divide"] = function (y) {
    return y["BigInteger.divideNumber"](this);
  };
  Number.prototype["BigInteger.remainder"] = function (y) {
    return y["BigInteger.remainderNumber"](this);
  };

  Number.prototype["BigInteger.compareToBigInteger"] = function (x) {
    return compareTo(x.signum, x.magnitude, x.length, 0, Math.sign(this), undefined, Math.sign(Math.abs(this)), Math.abs(this));
  };
  Number.prototype["BigInteger.addBigInteger"] = function (x) {
    return add(x.signum, x.magnitude, x.length, 0, Math.sign(this), undefined, Math.sign(Math.abs(this)), Math.abs(this));
  };
  Number.prototype["BigInteger.subtractBigInteger"] = function (x) {
    return add(x.signum, x.magnitude, x.length, 0, 0 - Math.sign(this), undefined, Math.sign(Math.abs(this)), Math.abs(this));
  };
  Number.prototype["BigInteger.multiplyBigInteger"] = function (x) {
    return multiply(x.signum, x.magnitude, x.length, 0, Math.sign(this), undefined, Math.sign(Math.abs(this)), Math.abs(this));
  };
  Number.prototype["BigInteger.divideBigInteger"] = function (x) {
    return divideAndRemainder(x.signum, x.magnitude, x.length, 0, Math.sign(this), undefined, Math.sign(Math.abs(this)), Math.abs(this), 1);
  };
  Number.prototype["BigInteger.remainderBigInteger"] = function (x) {
    return divideAndRemainder(x.signum, x.magnitude, x.length, 0, Math.sign(this), undefined, Math.sign(Math.abs(this)), Math.abs(this), 0);
  };

  Number.prototype["BigInteger.compareToNumber"] = function (x) {
    return x < this ? -1 : (this < x ? +1 : 0);
  };
  Number.prototype["BigInteger.addNumber"] = function (x) {
    var value = x + this;
    if (value > -BASE && value < +BASE) {
      return value;
    }
    return add(Math.sign(x), undefined, Math.sign(Math.abs(x)), Math.abs(x), Math.sign(this), undefined, Math.sign(Math.abs(this)), Math.abs(this));
  };
  Number.prototype["BigInteger.subtractNumber"] = function (x) {
    var value = x - this;
    if (value > -BASE && value < +BASE) {
      return value;
    }
    return add(Math.sign(x), undefined, Math.sign(Math.abs(x)), Math.abs(x), 0 - Math.sign(this), undefined, Math.sign(Math.abs(this)), Math.abs(this));
  };
  Number.prototype["BigInteger.multiplyNumber"] = function (x) {
    var value = 0 + x * this;
    if (value > -BASE && value < +BASE) {
      return value;
    }
    return multiply(Math.sign(x), undefined, Math.sign(Math.abs(x)), Math.abs(x), Math.sign(this), undefined, Math.sign(Math.abs(this)), Math.abs(this));
  };
  Number.prototype["BigInteger.divideNumber"] = function (x) {
    if (0 + this === 0) {
      throw new RangeError();
    }
    // `0 + Math.trunc(x / this)` is slow in Chrome
    return 0 + Math.sign(x) * Math.sign(this) * Math.floor(Math.abs(x) / Math.abs(this));
  };
  Number.prototype["BigInteger.remainderNumber"] = function (x) {
    if (0 + this === 0) {
      throw new RangeError();
    }
    return 0 + x % this;
  };

  function F() {
  }
  F.prototype = Number.prototype;

  BigInteger.prototype = new F();

  BigInteger.prototype.toString = function (radix) {
    if (radix === undefined) {
      radix = 10;
    }
    if (Math.trunc(radix) !== radix || !(radix >= 2 && radix <= 36)) {
      throw new RangeError("radix argument must be an integer between 2 and 36");
    }
    return toString(this.signum, this.magnitude, this.length, radix);
  };
  BigInteger.prototype["BigInteger.toString"] = BigInteger.prototype.toString;
  BigInteger.prototype["BigInteger.compareTo"] = function (y) {
    return y["BigInteger.compareToBigInteger"](this);
  };
  BigInteger.prototype["BigInteger.negate"] = function () {
    return createBigInteger(0 - this.signum, this.magnitude, this.length);
  };
  BigInteger.prototype["BigInteger.add"] = function (y) {
    return y["BigInteger.addBigInteger"](this);
  };
  BigInteger.prototype["BigInteger.subtract"] = function (y) {
    return y["BigInteger.subtractBigInteger"](this);
  };
  BigInteger.prototype["BigInteger.multiply"] = function (y) {
    return y["BigInteger.multiplyBigInteger"](this);
  };
  BigInteger.prototype["BigInteger.divide"] = function (y) {
    return y["BigInteger.divideBigInteger"](this);
  };
  BigInteger.prototype["BigInteger.remainder"] = function (y) {
    return y["BigInteger.remainderBigInteger"](this);
  };

  BigInteger.prototype["BigInteger.compareToBigInteger"] = function (x) {
    return compareTo(x.signum, x.magnitude, x.length, 0, this.signum, this.magnitude, this.length, 0);
  };
  BigInteger.prototype["BigInteger.addBigInteger"] = function (x) {
    return add(x.signum, x.magnitude, x.length, 0, this.signum, this.magnitude, this.length, 0);
  };
  BigInteger.prototype["BigInteger.subtractBigInteger"] = function (x) {
    return add(x.signum, x.magnitude, x.length, 0, 0 - this.signum, this.magnitude, this.length, 0);
  };
  BigInteger.prototype["BigInteger.multiplyBigInteger"] = function (x) {
    return multiply(x.signum, x.magnitude, x.length, 0, this.signum, this.magnitude, this.length, 0);
  };
  BigInteger.prototype["BigInteger.divideBigInteger"] = function (x) {
    return divideAndRemainder(x.signum, x.magnitude, x.length, 0, this.signum, this.magnitude, this.length, 0, 1);
  };
  BigInteger.prototype["BigInteger.remainderBigInteger"] = function (x) {
    return divideAndRemainder(x.signum, x.magnitude, x.length, 0, this.signum, this.magnitude, this.length, 0, 0);
  };

  BigInteger.prototype["BigInteger.compareToNumber"] = function (x) {
    return compareTo(Math.sign(x), undefined, Math.sign(Math.abs(x)), Math.abs(x), this.signum, this.magnitude, this.length, 0);
  };
  BigInteger.prototype["BigInteger.addNumber"] = function (x) {
    return add(Math.sign(x), undefined, Math.sign(Math.abs(x)), Math.abs(x), this.signum, this.magnitude, this.length, 0);
  };
  BigInteger.prototype["BigInteger.subtractNumber"] = function (x) {
    return add(Math.sign(x), undefined, Math.sign(Math.abs(x)), Math.abs(x), 0 - this.signum, this.magnitude, this.length, 0);
  };
  BigInteger.prototype["BigInteger.multiplyNumber"] = function (x) {
    return multiply(Math.sign(x), undefined, Math.sign(Math.abs(x)), Math.abs(x), this.signum, this.magnitude, this.length, 0);
  };
  BigInteger.prototype["BigInteger.divideNumber"] = function (x) {
    return divideAndRemainder(Math.sign(x), undefined, Math.sign(Math.abs(x)), Math.abs(x), this.signum, this.magnitude, this.length, 0, 1);
  };
  BigInteger.prototype["BigInteger.remainderNumber"] = function (x) {
    return divideAndRemainder(Math.sign(x), undefined, Math.sign(Math.abs(x)), Math.abs(x), this.signum, this.magnitude, this.length, 0, 0);
  };

  exports.BigInteger = BigInteger;

}(this));
