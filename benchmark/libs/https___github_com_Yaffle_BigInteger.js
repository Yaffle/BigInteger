/*jslint plusplus: true, vars: true, indent: 2*/

(function (global) {
  "use strict";

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

  var epsilon = 2 / (9007199254740991 + 1);
  while (1 + epsilon / 2 !== 1) {
    epsilon /= 2;
  }
  var BASE = 2 / epsilon;
  var s = 134217728;
  while (s * s < 2 / epsilon) {
    s *= 2;
  }
  var SPLIT = s + 1;

  // Veltkamp-Dekker's algorithm
  // see http://web.mit.edu/tabbott/Public/quaddouble-debian/qd-2.3.4-old/docs/qd.pdf
  var fms = function (a, b, product) {
    var at = SPLIT * a;
    var ahi = at - (at - a);
    var alo = a - ahi;
    var bt = SPLIT * b;
    var bhi = bt - (bt - b);
    var blo = b - bhi;
    var error = ((ahi * bhi - product) + ahi * blo + alo * bhi) + alo * blo;
    return error;
  };

  var fastTrunc = function (x) {
    var v = (x - BASE) + BASE;
    return v > x ? v - 1 : v;
  };

  var performMultiplication = function (carry, a, b) {
    var product = a * b;
    var error = fms(a, b, product);

    var hi = (product / BASE) - BASE + BASE;
    var lo = product - hi * BASE + error;

    if (lo >= 0) {
      lo -= BASE;
      hi += 1;
    }

    lo += carry;
    if (lo < 0) {
      lo += BASE;
      hi -= 1;
    }

    return {lo: lo, hi: hi};
  };

  var performDivision = function (a, b, divisor) {
    if (a >= divisor) {
      throw new RangeError();
    }
    var p = a * BASE;
    var q = fastTrunc(p / divisor);

    var r = 0 - fms(q, divisor, p);
    if (r < 0) {
      q -= 1;
      r += divisor;
    }

    r += b - divisor;
    if (r < 0) {
      r += divisor;
    } else {
      q += 1;
    }
    var y = fastTrunc(r / divisor);
    r -= y * divisor;
    q += y;
    return {q: q, r: r};
  };

  function BigIntegerInternal(sign, magnitude, length) {
    this.sign = sign;
    this.magnitude = magnitude;
    this.length = length;
  }

  var createBigInteger = function (sign, magnitude, length) {
    return new BigIntegerInternal(sign, magnitude, length);
  };

  var fromNumber = function (n) {
    if (n >= BASE || 0 - n >= BASE) {
      throw new RangeError();
    }
    var a = createArray(1);
    a[0] = n < 0 ? 0 - n : 0 + n;
    return createBigInteger(n < 0 ? 1 : 0, a, n === 0 ? 0 : 1);
  };

  var fromString = function (s) {
    var length = s.length;
    if (length === 0) {
      throw new RangeError();
    }
    var sign = 0;
    var signCharCode = s.charCodeAt(0);
    var from = 0;
    if (signCharCode === 43) { // "+"
      from = 1;
    }
    if (signCharCode === 45) { // "-"
      from = 1;
      sign = 1;
    }
    var radix = 10;
    if (from === 0 && length >= 2 && s.charCodeAt(0) === 48) {
      if (s.charCodeAt(1) === 98) {
        radix = 2;
        from = 2;
      } else if (s.charCodeAt(1) === 111) {
        radix = 8;
        from = 2;
      } else if (s.charCodeAt(1) === 120) {
        radix = 16;
        from = 2;
      }
    }
    length -= from;
    if (length === 0) {
      throw new RangeError();
    }

    var groupLength = 0;
    var groupRadix = 1;
    var limit = fastTrunc(BASE / radix);
    while (groupRadix <= limit) {
      groupLength += 1;
      groupRadix *= radix;
    }

    var size = Math.floor((length - 1) / groupLength) + 1;
    var magnitude = createArray(size);
    var start = from + 1 + (length - 1 - (size - 1) * groupLength) - groupLength;

    var j = -1;
    while (++j < size) {
      var groupStart = start + j * groupLength;
      var c = parseInteger(s, (groupStart >= from ? groupStart : from), groupStart + groupLength, radix);
      var l = -1;
      while (++l < j) {
        var tmp = performMultiplication(c, magnitude[l], groupRadix);
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

    return createBigInteger(size === 0 ? 0 : sign, magnitude, size);
  };

  BigIntegerInternal.BigInt = function (x) {
    if (typeof x === "number") {
      return fromNumber(x);
    }
    if (typeof x === "string") {
      return fromString(x);
    }
    if (x instanceof BigIntegerInternal) {
      return x;
    }
    throw new RangeError();
  };

  BigIntegerInternal.toNumber = function (a) {
    if (a.length === 0) {
      return 0;
    }
    if (a.length === 1) {
      return a.sign === 1 ? 0 - a.magnitude[0] : a.magnitude[0];
    }
    if (BASE + 1 !== BASE) {
      throw new RangeError();
    }
    var x = a.magnitude[a.length - 1];
    var y = a.magnitude[a.length - 2];
    var i = a.length - 3;
    while (i >= 0 && a.magnitude[i] === 0) {
      i -= 1;
    }
    if (i >= 0 && y % 2 === 1) {
      y += 1;
    }
    var z = (x * BASE + y) * Math.pow(BASE, a.length - 2);
    return a.sign === 1 ? 0 - z : z;
  };

  var compareMagnitude = function (a, b) {
    if (a === b) {
      return 0;
    }
    if (a.length !== b.length) {
      return a.length < b.length ? -1 : +1;
    }
    var i = a.length;
    while (--i >= 0) {
      if (a.magnitude[i] !== b.magnitude[i]) {
        return a.magnitude[i] < b.magnitude[i] ? -1 : +1;
      }
    }
    return 0;
  };

  var compareTo = function (a, b) {
    var c = a.sign === b.sign ? compareMagnitude(a, b) : 1;
    return a.sign === 1 ? 0 - c : c; // positive zero will be returned for c === 0
  };

  var addAndSubtract = function (a, b, isSubtraction) {
    var z = compareMagnitude(a, b);
    var resultSign = z < 0 ? (isSubtraction !== 0 ? 1 - b.sign : b.sign) : a.sign;
    var min = z < 0 ? a : b;
    var max = z < 0 ? b : a;
    // |a| <= |b|
    if (min.length === 0) {
      return createBigInteger(resultSign, max.magnitude, max.length);
    }
    var subtract = 0;
    var resultLength = max.length;
    if (a.sign !== (isSubtraction !== 0 ? 1 - b.sign : b.sign)) {
      subtract = 1;
      if (min.length === resultLength) {
        while (resultLength > 0 && min.magnitude[resultLength - 1] === max.magnitude[resultLength - 1]) {
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
    while (++i < min.length) {
      var aDigit = min.magnitude[i];
      c += max.magnitude[i] + (subtract !== 0 ? 0 - aDigit : aDigit - BASE);
      if (c < 0) {
        result[i] = BASE + c;
        c = 0 - subtract;
      } else {
        result[i] = c;
        c = 1 - subtract;
      }
    }
    i -= 1;
    while (++i < resultLength) {
      c += max.magnitude[i] + (subtract !== 0 ? 0 : 0 - BASE);
      if (c < 0) {
        result[i] = BASE + c;
        c = 0 - subtract;
      } else {
        result[i] = c;
        c = 1 - subtract;
      }
    }
    if (subtract === 0) {
      result[resultLength] = c;
      resultLength += c !== 0 ? 1 : 0;
    } else {
      while (resultLength > 0 && result[resultLength - 1] === 0) {
        resultLength -= 1;
      }
    }
    return createBigInteger(resultSign, result, resultLength);
  };

  BigIntegerInternal.add = function (a, b) {
    return addAndSubtract(a, b, 0);
  };

  BigIntegerInternal.subtract = function (a, b) {
    return addAndSubtract(a, b, 1);
  };

  BigIntegerInternal.multiply = function (a, b) {
    var alength = a.length;
    var blength = b.length;
    var am = a.magnitude;
    var bm = b.magnitude;
    var asign = a.sign;
    var bsign = b.sign;
    if (alength === 0 || blength === 0) {
      return createBigInteger(0, createArray(0), 0);
    }
    if (alength === 1 && am[0] === 1) {
      return createBigInteger(asign === 1 ? 1 - bsign : bsign, bm, blength);
    }
    if (blength === 1 && bm[0] === 1) {
      return createBigInteger(asign === 1 ? 1 - bsign : bsign, am, alength);
    }
    var resultSign = asign === 1 ? 1 - bsign : bsign;
    var resultLength = alength + blength;
    var result = createArray(resultLength);
    var i = -1;
    while (++i < blength) {
      var digit = bm[i];
      if (digit !== 0) { // to optimize multiplications by a power of BASE
        var c = 0;
        var j = -1;
        while (++j < alength) {
          var carry = 1;
          c += result[j + i] - BASE;
          if (c < 0) {
            c += BASE;
            carry = 0;
          }
          var tmp = performMultiplication(c, am[j], digit);
          var lo = tmp.lo;
          var hi = tmp.hi;
          result[j + i] = lo;
          c = hi + carry;
        }
        result[alength + i] = c;
      }
    }
    if (result[resultLength - 1] === 0) {
      resultLength -= 1;
    }
    return createBigInteger(resultSign, result, resultLength);
  };

  var divideAndRemainder = function (a, b, isDivision) {
    if (b.length === 0) {
      throw new RangeError();
    }
    if (a.length === 0) {
      return createBigInteger(0, createArray(0), 0);
    }
    var quotientSign = a.sign === 1 ? 1 - b.sign : b.sign;
    if (b.length === 1 && b.magnitude[0] === 1) {
      if (isDivision !== 0) {
        return createBigInteger(quotientSign, a.magnitude, a.length);
      }
      return createBigInteger(0, createArray(0), 0);
    }

    var divisorOffset = a.length + 1; // `+ 1` for extra digit in case of normalization
    var divisorAndRemainder = createArray(divisorOffset + b.length + 1); // `+ 1` to avoid `index < length` checks
    var divisor = divisorAndRemainder;
    var remainder = divisorAndRemainder;
    var n = -1;
    while (++n < a.length) {
      remainder[n] = a.magnitude[n];
    }
    var m = -1;
    while (++m < b.length) {
      divisor[divisorOffset + m] = b.magnitude[m];
    }

    var top = divisor[divisorOffset + b.length - 1];

    // normalization
    var lambda = 1;
    if (b.length > 1) {
      lambda = fastTrunc(BASE / (top + 1));
      if (lambda > 1) {
        var carry = 0;
        var l = -1;
        while (++l < divisorOffset + b.length) {
          var tmp = performMultiplication(carry, divisorAndRemainder[l], lambda);
          var lo = tmp.lo;
          var hi = tmp.hi;
          divisorAndRemainder[l] = lo;
          carry = hi;
        }
        divisorAndRemainder[divisorOffset + b.length] = carry;
        top = divisor[divisorOffset + b.length - 1];
      }
      // assertion
      if (top < fastTrunc(BASE / 2)) {
        throw new RangeError();
      }
    }

    var shift = a.length - b.length + 1;
    if (shift < 0) {
      shift = 0;
    }
    var quotient = undefined;
    var quotientLength = 0;

    // to optimize divisions by a power of BASE
    var lastNonZero = 0;
    while (divisor[divisorOffset + lastNonZero] === 0) {
      lastNonZero += 1;
    }

    var i = shift;
    while (--i >= 0) {
      var t = b.length + i;
      var q = BASE - 1;
      if (remainder[t] !== top) {
        var tmp2 = performDivision(remainder[t], remainder[t - 1], top);
        var q2 = tmp2.q;
        //var r2 = tmp2.r;
        q = q2;
      }

      var ax = 0;
      var bx = 0;
      var j = i - 1 + lastNonZero;
      while (++j <= t) {
        var tmp3 = performMultiplication(bx, q, divisor[divisorOffset + j - i]);
        var lo3 = tmp3.lo;
        var hi3 = tmp3.hi;
        bx = hi3;
        ax += remainder[j] - lo3;
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
        var k = i - 1 + lastNonZero;
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
      if (isDivision !== 0 && q !== 0) {
        if (quotientLength === 0) {
          quotientLength = i + 1;
          quotient = createArray(quotientLength);
        }
        quotient[i] = q;
      }
    }

    if (isDivision !== 0) {
      if (quotientLength === 0) {
        return createBigInteger(0, createArray(0), 0);
      }
      return createBigInteger(quotientSign, quotient, quotientLength);
    }

    var remainderLength = a.length + 1;
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
    return createBigInteger(a.sign, result, remainderLength);
  };

  BigIntegerInternal.divide = function (a, b) {
    return divideAndRemainder(a, b, 1);
  };

  BigIntegerInternal.remainder = function (a, b) {
    return divideAndRemainder(a, b, 0);
  };

  BigIntegerInternal.unaryMinus = function (a) {
    return createBigInteger(a.length === 0 ? a.sign : 1 - a.sign, a.magnitude, a.length);
  };

  BigIntegerInternal.equal = function (a, b) {
    return compareTo(a, b) === 0;
  };
  BigIntegerInternal.lessThan = function (a, b) {
    return compareTo(a, b) < 0;
  };
  BigIntegerInternal.greaterThan = function (a, b) {
    return compareTo(a, b) > 0;
  };
  BigIntegerInternal.notEqual = function (a, b) {
    return compareTo(a, b) !== 0;
  };
  BigIntegerInternal.lessThanOrEqual = function (a, b) {
    return compareTo(a, b) <= 0;
  };
  BigIntegerInternal.greaterThanOrEqual = function (a, b) {
    return compareTo(a, b) >= 0;
  };

  BigIntegerInternal.exponentiate = function (a, b) {
    var n = BigIntegerInternal.toNumber(b);
    if (n < 0) {
      throw new RangeError();
    }
    if (n > 9007199254740991) {
      var y = BigIntegerInternal.toNumber(a);
      if (y === 0 || y === -1 || y === +1) {
        return y === -1 && BigIntegerInternal.toNumber(BigIntegerInternal.remainder(b, BigIntegerInternal.BigInt(2))) === 0 ? BigIntegerInternal.unaryMinus(a) : a;
      }
      throw new RangeError();
    }
    if (n === 0) {
      return BigIntegerInternal.BigInt(1);
    }
    var x = a;
    while (n % 2 === 0) {
      n = Math.floor(n / 2);
      x = BigIntegerInternal.multiply(x, x);
    }
    var accumulator = x;
    n -= 1;
    if (n >= 2) {
      while (n >= 2) {
        var t = Math.floor(n / 2);
        if (t * 2 !== n) {
          accumulator = BigIntegerInternal.multiply(accumulator, x);
        }
        n = t;
        x = BigIntegerInternal.multiply(x, x);
      }
      accumulator = BigIntegerInternal.multiply(accumulator, x);
    }
    return accumulator;
  };

  BigIntegerInternal.prototype.toString = function (radix) {
    if (radix == undefined) {
      radix = 10;
    }
    if (radix !== 10 && (radix < 2 || radix > 36 || radix !== Math.floor(radix))) {
      throw new RangeError("radix argument must be an integer between 2 and 36");
    }

    // console.time(); var n = BigInteger.exponentiate(2**4, 2**16); console.timeEnd(); console.time(); n.toString(16).length; console.timeEnd();
    if (this.length > 8 && true) { // https://github.com/GoogleChromeLabs/jsbi/blob/c9b179a4d5d34d35dd24cf84f7c1def54dc4a590/jsbi.mjs#L880
      if (this.sign === 1) {
        return '-' + BigIntegerInternal.unaryMinus(this).toString(radix);
      }
      var s = Math.floor(this.length * Math.log(BASE) / Math.log(radix) / 2 + 0.5 - 1);
      var split = BigIntegerInternal.exponentiate(BigIntegerInternal.BigInt(radix), BigIntegerInternal.BigInt(s));
      var q = BigIntegerInternal.divide(this, split);
      var r = BigIntegerInternal.subtract(this, BigIntegerInternal.multiply(q, split));
      var a = r.toString(radix);
      return q.toString(radix) + '0'.repeat(s - a.length) + a;
    }

    var a = this;
    var result = a.sign === 1 ? "-" : "";

    var remainderLength = a.length;
    if (remainderLength === 0) {
      return "0";
    }
    if (remainderLength === 1) {
      result += a.magnitude[0].toString(radix);
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
    var size = remainderLength + Math.floor((remainderLength - 1) / groupLength) + 1;
    var remainder = createArray(size);
    var n = -1;
    while (++n < remainderLength) {
      remainder[n] = a.magnitude[n];
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
      result += "0".repeat(groupLength - t.length) + t;
    }
    return result;
  };

  function BigIntWrapper() {
  }

  BigIntWrapper.BigInt = function (x) {
    return BigInt(x);
  };
  BigIntWrapper.toNumber = function (bigint) {
    return Number(bigint);
  };
  BigIntWrapper.add = function (a, b) {
    return a + b;
  };
  BigIntWrapper.subtract = function (a, b) {
    return a - b;
  };
  BigIntWrapper.multiply = function (a, b) {
    return a * b;
  };
  BigIntWrapper.divide = function (a, b) {
    return a / b;
  };
  BigIntWrapper.remainder = function (a, b) {
    return a % b;
  };
  BigIntWrapper.unaryMinus = function (a) {
    return -a;
  };
  BigIntWrapper.equal = function (a, b) {
    return a === b;
  };
  BigIntWrapper.lessThan = function (a, b) {
    return a < b;
  };
  BigIntWrapper.greaterThan = function (a, b) {
    return a > b;
  };
  BigIntWrapper.notEqual = function (a, b) {
    return a !== b;
  };
  BigIntWrapper.lessThanOrEqual = function (a, b) {
    return a <= b;
  };
  BigIntWrapper.greaterThanOrEqual = function (a, b) {
    return a >= b;
  };

  BigIntWrapper.exponentiate = function (a, b) { // a**b
    if (typeof a !== "bigint") {
      throw new TypeError();
    }
    if (typeof b !== "bigint") {
      throw new TypeError();
    }
    var n = Number(b);
    if (n < 0) {
      throw new RangeError();
    }
    if (n > 9007199254740991) {
      var y = Number(a);
      if (y === 0 || y === -1 || y === +1) {
        return y === -1 && Number(b % BigInt(2)) === 0 ? -a : a;
      }
      throw new RangeError();
    }
    if (a === BigInt(2)) {
      return BigInt(1) << b;
    }
    if (n === 0) {
      return BigInt(1);
    }
    var x = a;
    while (n % 2 === 0) {
      n = Math.floor(n / 2);
      x *= x;
    }
    var accumulator = x;
    n -= 1;
    if (n >= 2) {
      while (n >= 2) {
        var t = Math.floor(n / 2);
        if (t * 2 !== n) {
          accumulator *= x;
        }
        n = t;
        x *= x;
      }
      accumulator *= x;
    }
    return accumulator;
  };

  // noinline
  var n = function (f) {
    return function (x, y) {
      return f(x, y);
    };
  };

  var Internal = typeof BigInt !== "undefined" && BigInt(9007199254740991) + BigInt(2) - BigInt(2) === BigInt(9007199254740991) ? BigIntWrapper : BigIntegerInternal;

  var toNumber = n(function (a) {
    return Internal.toNumber(a);
  });
  var valueOf = function (x) {
    if (typeof x === "number") {
      return Internal.BigInt(x);
    }
    return x;
  };
  var toResult = function (x) {
    var value = Internal.toNumber(x);
    if (value >= -9007199254740991 && value <= +9007199254740991) {
      return value;
    }
    return x;
  };
  var add = n(function (x, y) {
    if (typeof x === "number" && x === 0) {
      return y;
    }
    if (typeof y === "number" && y === 0) {
      return x;
    }
    var a = valueOf(x);
    var b = valueOf(y);
    return toResult(Internal.add(a, b));
  });
  var subtract = n(function (x, y) {
    var a = valueOf(x);
    var b = valueOf(y);
    return toResult(Internal.subtract(a, b));
  });
  var multiply = n(function (x, y) {
    if (x === y) {
      var c = valueOf(x);
      return Internal.multiply(c, c);
    }
    if (typeof x === "number" && x === 0 || typeof y === "number" && y === 0) {
      return 0;
    }
    if (typeof x === "number" && x === 1) {
      return y;
    }
    if (typeof y === "number" && y === 1) {
      return x;
    }
    var a = valueOf(x);
    var b = valueOf(y);
    return Internal.multiply(a, b);
  });
  var divide = n(function (x, y) {
    if (typeof y === "number" && y === 1) {
      return x;
    }
    var a = valueOf(x);
    var b = valueOf(y);
    return toResult(Internal.divide(a, b));
  });
  var remainder = n(function (x, y) {
    var a = valueOf(x);
    var b = valueOf(y);
    return toResult(Internal.remainder(a, b));
  });
  var exponentiate = n(function (x, y) {
    if (typeof y === "number") {
      if (y === 0) {
        return 1;
      }
      if (y === 1) {
        return x;
      }
      if (y === 2) {
        var c = valueOf(x);
        return Internal.multiply(c, c);
      }
      if (typeof x === "number" && Math.abs(x) > 2 && y >= 0) {
        if (x % 2 === 0 && y > 42) {//TODO: ?
          return multiply(exponentiate(2, y), exponentiate(x / 2, y));
        }
        var k = Math.floor(Math.log(9007199254740991) / Math.log(Math.abs(x) + 0.5));
        if (k >= 2) {
          return multiply(Math.pow(x, y % k), exponentiate(Math.pow(x, k), Math.floor(y / k)));
        }
      }
    }
    var a = valueOf(x);
    var b = valueOf(y);
    return Internal.exponentiate(a, b);
  });
  var unaryMinus = n(function (x) {
    var a = valueOf(x);
    return Internal.unaryMinus(a);
  });
  var equal = n(function (x, y) {
    if (typeof x === "number") {
      return x === Internal.toNumber(y);
    }
    if (typeof y === "number") {
      return Internal.toNumber(x) === y;
    }
    return Internal.equal(x, y);
  });
  var lessThan = n(function (x, y) {
    if (typeof x === "number") {
      return x < Internal.toNumber(y);
    }
    if (typeof y === "number") {
      return Internal.toNumber(x) < y;
    }
    return Internal.lessThan(x, y);
  });
  var greaterThan = n(function (x, y) {
    if (typeof x === "number") {
      return x > Internal.toNumber(y);
    }
    if (typeof y === "number") {
      return Internal.toNumber(x) > y;
    }
    return Internal.greaterThan(x, y);
  });

  function BigInteger() {
  }

  // Conversion from String:
  // Conversion from Number:
  BigInteger.BigInt = function (x) {
    if (typeof x === "number") {
      return x;
    }
    if (typeof x === "string") {
      var value = 0 + Number(x);
      if (value >= -9007199254740991 && value <= +9007199254740991) {
        return value;
      }
    }
    return Internal.BigInt(x);
  };
  // Conversion to Number:
  BigInteger.toNumber = function (x) {
    if (typeof x === "number") {
      return x;
    }
    return toNumber(x);
  };

  // Arithmetic:
  BigInteger.add = function (x, y) {
    if (typeof x === "number" && typeof y === "number") {
      var value = x + y;
      if (value >= -9007199254740991 && value <= +9007199254740991) {
        return value;
      }
    }
    return add(x, y);
  };
  BigInteger.subtract = function (x, y) {
    if (typeof x === "number" && typeof y === "number") {
      var value = x - y;
      if (value >= -9007199254740991 && value <= +9007199254740991) {
        return value;
      }
    }
    return subtract(x, y);
  };
  BigInteger.multiply = function (x, y) {
    if (typeof x === "number" && typeof y === "number") {
      var value = 0 + x * y;
      if (value >= -9007199254740991 && value <= +9007199254740991) {
        return value;
      }
    }
    return multiply(x, y);
  };
  BigInteger.divide = function (x, y) {
    if (typeof x === "number" && typeof y === "number") {
      if (y !== 0) {
        return x === 0 ? 0 : (x > 0 && y > 0) || (x < 0 && y < 0) ? 0 + Math.floor(x / y) : 0 - Math.floor((0 - x) / y);
      }
    }
    return divide(x, y);
  };
  BigInteger.remainder = function (x, y) {
    if (typeof x === "number" && typeof y === "number") {
      if (y !== 0) {
        return 0 + x % y;
      }
    }
    return remainder(x, y);
  };
  BigInteger.unaryMinus = function (x) {
    if (typeof x === "number") {
      return 0 - x;
    }
    return unaryMinus(x);
  };

  // Comparison:
  BigInteger.equal = function (x, y) {
    if (typeof x === "number" && typeof y === "number") {
      return x === y;
    }
    return equal(x, y);
  };
  BigInteger.lessThan = function (x, y) {
    if (typeof x === "number" && typeof y === "number") {
      return x < y;
    }
    return lessThan(x, y);
  };
  BigInteger.greaterThan = function (x, y) {
    if (typeof x === "number" && typeof y === "number") {
      return x > y;
    }
    return greaterThan(x, y);
  };
  BigInteger.notEqual = function (x, y) {
    return !BigInteger.equal(x, y);
  };
  BigInteger.lessThanOrEqual = function (x, y) {
    return !BigInteger.greaterThan(x, y);
  };
  BigInteger.greaterThanOrEqual = function (x, y) {
    return !BigInteger.lessThan(x, y);
  };

  BigInteger.exponentiate = function (x, y) {
    if (typeof x === "number" && typeof y === "number" && y >= 0 && y < 53) { // 53 === log2(9007199254740991 + 1)
      var value = 0 + Math.pow(x, y);
      if (value >= -9007199254740991 && value <= 9007199254740991) {
        return value;
      }
    }
    return exponentiate(x, y);
  };

  global.BigInteger = BigInteger;

}(this));
