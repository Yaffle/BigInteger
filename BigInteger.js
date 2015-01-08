/*jslint plusplus: true, vars: true, indent: 2 */

(function (exports) {
  "use strict";

  // BigInteger.js
  // Available under Public Domain
  // https://github.com/Yaffle/BigInteger/

  // For implementation details, see "The Handbook of Applied Cryptography"
  // http://www.cacr.math.uwaterloo.ca/hac/about/chap14.pdf

  if (Math.trunc === undefined) {
    Math.trunc = function (value) {
      var number = Number(value);
      return number < 0 ? -Math.floor(-number) : Math.floor(number);
    };
  }

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

  var pow = function (x, n) {
    var accumulator = 1;
    while (n !== 0) {
      var t = Math.floor(n / 2);
      if (t * 2 !== n) {
        accumulator *= x;
        n -= 1;
      } else {
        x *= x;
        n = t;
      }
    }
    return accumulator;
  };

  var firstHalf = 134217728;
  var secondHalf = 67108864;
  var base = 134217728 * 67108864;

  var performMultiplication = function (carry, a, b, result, index) {
    var a1 = Math.floor(a / firstHalf);
    var b1 = Math.floor(b / firstHalf);
    a -= a1 * firstHalf;
    b -= b1 * firstHalf;

    // a1 * b1
    var m1 = a1 * b1;
    if (firstHalf !== secondHalf) {
      m1 *= 2;
    }
    var x = 0;

    // a * b1 + a1 * b
    var middle = a * b1 - base + a1 * b;
    if (middle < 0) {
      middle += base;
    } else {
      m1 += firstHalf;
    }
    x = Math.floor(middle / secondHalf);
    m1 += x;
    var m = (middle - x * secondHalf) * firstHalf;

    // a * b
    if (b > a) {
      var t = b;
      b = a;
      a = t;
    }
    if (a > secondHalf) {
      a -= secondHalf;
      m += b * secondHalf - base;
      if (m < 0) {
        m += base;
      } else {
        m1 += 1;
      }
    }
    m += a * b - base;
    if (m < 0) {
      m += base;
    } else {
      m1 += 1;
    }

    // + carry
    m += carry - base;
    if (m < 0) {
      m += base;
    } else {
      m1 += 1;
    }

    result[index] = m;
    return m1;
  };

  var performDivision = function (a, b, divisor, result, index) {
    // assert(a < divisor)
    var q = Math.trunc((a * base + b) / divisor);

    // z = q * divisor
    var z = performMultiplication(0, q, divisor, result, index);
    var r = (a - z) * base + (b - result[index]);

    if (r < 0) {
      r += divisor;
      q -= 1;
    }

    // assert(-divisor < r && r < 2 * divisor)
    if (r < 0) {
      r += divisor;
      q -= 1;
    } else if (r >= divisor) {
      r -= divisor;
      q += 1;
    }

    result[index] = q;
    return r;
  };

/*
  var base = 67108864;

  var performMultiplication = function (carry, a, b, result, index) {
    var c = carry + a * b;
    var q = Math.floor(c / base);
    result[index] = (c - q * base);
    return q;
  };

  var performDivision = function (a, b, divisor, result, index) {
    var carry = a * base + b;
    var q = Math.floor(carry / divisor);
    result[index] = q;
    return (carry - q * divisor);
  };
*/

  var checkRadix = function (radix) {
    if (radix !== Number(radix) || Math.floor(radix) !== radix) {
      throw new RangeError();
    }
    if (radix < 2 || radix > 36) {
      throw new RangeError("radix argument must be between 2 and 36");
    }
  };

  var divideBySmall = function (magnitude, length, lambda) {
    var c = 0;
    var i = length;
    while (--i >= 0) {
      c = performDivision(c, magnitude[i], lambda, magnitude, i);
    }
    return c;
  };

  var multiplyBySmall = function (c, magnitude, length, lambda) {
    var i = -1;
    while (++i < length) {
      c = performMultiplication(c, magnitude[i], lambda, magnitude, i);
    }
    magnitude[length] = c;
  };

  var isSmallInteger = function (value) {
    return value > -base && value < base;
  };

  var parseBigInteger = function (s, radix, forceBigInteger) {
    checkRadix(radix);
    var length = s.length;
    if (length === 0) {
      throw new RangeError();
    }
    var sign = 1;
    var signCharCode = s.charCodeAt(0);
    var from = 0;
    if (signCharCode === 43) { // "+"
      from = 1;
    }
    if (signCharCode === 45) { // "-"
      from = 1;
      sign = -1;
    }

    length -= from;
    if (length === 0) {
      throw new RangeError();
    }
    var groupLength = Math.floor(Math.log(base) / Math.log(radix) - 0.5);
    if (!forceBigInteger && length <= groupLength) {
      var value = parseInteger(s, from, from + length, radix);
      if (sign < 0) {
        value = 0 - value;
      }
      if (isSmallInteger(value)) {
        return value;
      }
    }
    var groupRadix = pow(radix, groupLength);
    var size = Math.floor((length - 1) / groupLength) + 1;

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
      multiplyBySmall(magnitude[j], magnitude, j, groupRadix);
    }

    while (size > 0 && magnitude[size - 1] === 0) {
      size -= 1;
    }

    return createBigInteger(size === 0 ? 0 : sign, magnitude, size);
  };

  // BigInteger(string[, radix = 10]), (2 <= radix <= 36)
  // throws RangeError
  function BigInteger(s, radix, magnitude) {
    if (radix === undefined) {
      radix = 10;
    }
    if (magnitude === undefined) {
      magnitude = undefined;
    }
    var sign = 1;
    var length = 0;
    if (magnitude !== undefined) {
      sign = radix < 0 ? -1 : 1;
      length = sign * radix;
    } else {
      // deprecated
      var x = parseBigInteger(s, radix, true);
      sign = x.signum;
      magnitude = x.magnitude;
      length = x.length;
    }
    this.signum = length === 0 ? 0 : sign;
    this.magnitude = magnitude;
    this.length = length;
  }

  var createBigInteger = function (signum, magnitude, length) {
    return new BigInteger("", signum * length, magnitude);
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
      if (c === 0) {
        return c; // positive zero
      }
      return aSignum * c;
    }
    if (aSignum === 0) {
      return -bSignum;
    }
    return aSignum;
  };

  var addNext = function (aSignum, aMagnitude, aLength, aValue, bSignum, bMagnitude, bLength, bValue) {
    // |a| <= |b|
    if (aSignum === 0) {
      return bMagnitude === undefined ? bSignum * bValue : createBigInteger(bSignum, bMagnitude, bLength);
    }
    var subtract = false;
    if (aSignum !== bSignum) {
      subtract = true;
      if (aLength === bLength) {
        while (bLength > 0 && (aMagnitude === undefined ? aValue : aMagnitude[bLength - 1]) === (bMagnitude === undefined ? bValue : bMagnitude[bLength - 1])) {
          bLength -= 1;
        }
      }
      if (bLength === 0) { // a === (-b)
        return createBigInteger(0, createArray(0), 0);
      }
    }
    // result !== 0
    var resultLength = bLength + (subtract ? 0 : 1);
    var result = createArray(resultLength);
    var i = -1;
    var c = 0;
    while (++i < bLength) {
      if (i < aLength) {
        if (subtract) {
          c += (bMagnitude === undefined ? bValue : bMagnitude[i]) - (aMagnitude === undefined ? aValue : aMagnitude[i]);
        } else {
          c += (bMagnitude === undefined ? bValue : bMagnitude[i]) - base + (aMagnitude === undefined ? aValue : aMagnitude[i]);
        }
      } else {
        if (subtract) {
          c += (bMagnitude === undefined ? bValue : bMagnitude[i]);
        } else {
          c += (bMagnitude === undefined ? bValue : bMagnitude[i]) - base;
        }
      }
      if (c < 0) {
        result[i] = base + c;
        c = subtract ? -1 : 0;
      } else {
        result[i] = c;
        c = subtract ? 0 : +1;
      }
    }
    if (c !== 0) {
      result[bLength] = c;
    }
    while (resultLength > 0 && result[resultLength - 1] === 0) {
      resultLength -= 1;
    }
    return createBigInteger(bSignum, result, resultLength);
  };

  var add = function (aSignum, aMagnitude, aLength, aValue, bSignum, bMagnitude, bLength, bValue) {
    var z = compareMagnitude(aMagnitude, aLength, aValue, bMagnitude, bLength, bValue);
    if (z > 0) {
      return addNext(bSignum, bMagnitude, bLength, bValue, aSignum, aMagnitude, aLength, aValue);
    }
    return addNext(aSignum, aMagnitude, aLength, aValue, bSignum, bMagnitude, bLength, bValue);
  };

  var multiply = function (aSignum, aMagnitude, aLength, aValue, bSignum, bMagnitude, bLength, bValue) {
    if (aLength === 0 || bLength === 0) {
      return createBigInteger(0, createArray(0), 0);
    }
    var resultSign = aSignum * bSignum;
    if (aLength === 1 && (aMagnitude === undefined ? aValue : aMagnitude[0]) === 1) {
      return bMagnitude === undefined ? resultSign * bValue : createBigInteger(resultSign, bMagnitude, bLength);
    }
    if (bLength === 1 && (bMagnitude === undefined ? bValue : bMagnitude[0]) === 1) {
      return aMagnitude === undefined ? resultSign * aValue : createBigInteger(resultSign, aMagnitude, aLength);
    }
    var resultLength = aLength + bLength;
    var result = createArray(resultLength);
    var i = -1;
    while (++i < bLength) {
      var c = 0;
      var j = -1;
      while (++j < aLength) {
        var carry = 0;
        c += result[j + i] - base;
        if (c >= 0) {
          carry = 1;
        } else {
          c += base;
        }
        c = carry + performMultiplication(c, (aMagnitude === undefined ? aValue : aMagnitude[j]), (bMagnitude === undefined ? bValue : bMagnitude[i]), result, j + i);
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
    if (bLength === 1 && (bMagnitude === undefined ? bValue : bMagnitude[0]) === 1) {
      if (divide) {
        return aMagnitude === undefined ? aSignum * bSignum * aValue : createBigInteger(aSignum * bSignum, aMagnitude, aLength);
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
      //lambda = Math.trunc((Math.trunc(base / 2) - 1) / top) + 1;
      lambda = Math.trunc(base / (top + 1));
      if (lambda > 1) {
        multiplyBySmall(0, divisorAndRemainder, divisorOffset + bLength, lambda);
        top = divisor[divisorOffset + bLength - 1];
      }
      // assertion
      if (top < Math.trunc(base / 2)) {
        throw new RangeError();
      }
    }

    var shift = aLength - bLength + 1;
    if (shift < 0) {
      shift = 0;
    }
    var quotinent = undefined;
    var quotinentLength = 0;

    var i = shift;
    while (--i >= 0) {
      var t = bLength + i;
      var tmp = remainder[t];
      performDivision(remainder[t], remainder[t - 1], top, remainder, t);
      var q = remainder[t];
      remainder[t] = tmp;

      var ax = 0;
      var bx = 0;
      var j = i - 1;
      while (++j <= t) {
        var rj = remainder[j];
        bx = performMultiplication(bx, q, divisor[divisorOffset + j - i], remainder, j);
        ax += rj - remainder[j];
        if (ax < 0) {
          remainder[j] = base + ax;
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
          c += remainder[k] - base + divisor[divisorOffset + k - i];
          if (c < 0) {
            remainder[k] = c + base;
            c = 0;
          } else {
            remainder[k] = c;
            c = +1;
          }
        }
        ax += c;
      }
      if (divide && q !== 0) {
        if (quotinentLength === 0) {
          quotinentLength = i + 1;
          quotinent = createArray(quotinentLength);
        }
        quotinent[i] = q;
      }
    }

    if (divide) {
      if (quotinentLength === 0) {
        return createBigInteger(0, createArray(0), 0);
      }
      return createBigInteger(aSignum * bSignum, quotinent, quotinentLength);
    }

    var remainderLength = aLength + 1;
    if (lambda > 1) {
      divideBySmall(remainder, remainderLength, lambda);
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
    var groupLength = Math.floor(Math.log(base) / Math.log(radix) - 0.5);
    var groupRadix = pow(radix, groupLength);
    var size = remainderLength + Math.floor((remainderLength - 1) / groupLength) + 1;
    var remainder = createArray(size);
    var n = -1;
    while (++n < remainderLength) {
      remainder[n] = magnitude[n];
    }

    var k = size;
    while (remainderLength !== 0) {
      var q = divideBySmall(remainder, remainderLength, groupRadix);
      while (remainderLength > 0 && remainder[remainderLength - 1] === 0) {
        remainderLength -= 1;
      }
      k -= 1;
      remainder[k] = q;
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

  function F() {}
  F.prototype = Number.prototype;

  BigInteger.prototype = new F();

  BigInteger.prototype.toString = function (radix) {
    if (radix === undefined) {
      radix = 10;
    }
    checkRadix(radix);
    return toString(this.signum, this.magnitude, this.length, radix);
  };

  var compareToBigIntegerBigInteger = function (x, y) {
    return compareTo(x.signum, x.magnitude, x.length, 0, y.signum, y.magnitude, y.length, 0);
  };

  var negateBigInteger = function (x) {
    return createBigInteger(0 - x.signum, x.magnitude, x.length);
  };

  var addBigIntegerBigInteger = function (x, y) {
    return add(x.signum, x.magnitude, x.length, 0, y.signum, y.magnitude, y.length, 0);
  };

  var subtractBigIntegerBigInteger = function (x, y) {
    return add(x.signum, x.magnitude, x.length, 0, 0 - y.signum, y.magnitude, y.length, 0);
  };

  var multiplyBigIntegerBigInteger = function (x, y) {
    return multiply(x.signum, x.magnitude, x.length, 0, y.signum, y.magnitude, y.length, 0);
  };

  var divideBigIntegerBigInteger = function (x, y) {
    return divideAndRemainder(x.signum, x.magnitude, x.length, 0, y.signum, y.magnitude, y.length, 0, true);
  };

  var remainderBigIntegerBigInteger = function (x, y) {
    return divideAndRemainder(x.signum, x.magnitude, x.length, 0, y.signum, y.magnitude, y.length, 0, false);
  };

  exports.BigInteger = BigInteger;
  
  var sign = function (x) {
    return x === 0 ? 0 : (x < 0 ? -1 : +1);
  };

  var abs = function (x) {
    return x === 0 ? 0 : (x < 0 ? -x : +x);
  };

  var compareToBigIntegerNumber = function (x, y) {
    return compareTo(x.signum, x.magnitude, x.length, 0, sign(y), undefined, y === 0 ? 0 : 1, abs(y));
  };

  var compareToNumberBigInteger = function (x, y) {
    return compareTo(sign(x), undefined, x === 0 ? 0 : 1, abs(x), y.signum, y.magnitude, y.length, 0);
  };

  var compareToNumberNumber = function (x, y) {
    return x < y ? -1 : (y < x ? +1 : 0);
  };

  var negateNumber = function (x) {
    return 0 - x;
  };

  var addBigIntegerNumber = function (x, y) {
    return add(x.signum, x.magnitude, x.length, 0, sign(y), undefined, y === 0 ? 0 : 1, abs(y));
  };

  var addNumberBigInteger = function (x, y) {
    return add(sign(x), undefined, x === 0 ? 0 : 1, abs(x), y.signum, y.magnitude, y.length, 0);
  };

  var addNumberNumber = function (x, y) {
    var value = x + y;
    if (isSmallInteger(value)) {
      return value;
    }
    return add(sign(x), undefined, x === 0 ? 0 : 1, abs(x), sign(y), undefined, y === 0 ? 0 : 1, abs(y));
  };

  var subtractBigIntegerNumber = function (x, y) {
    return add(x.signum, x.magnitude, x.length, 0, 0 - sign(y), undefined, y === 0 ? 0 : 1, abs(y));
  };

  var subtractNumberBigInteger = function (x, y) {
    return add(sign(x), undefined, x === 0 ? 0 : 1, abs(x), 0 - y.signum, y.magnitude, y.length, 0);
  };

  var subtractNumberNumber = function (x, y) {
    var value = x - y;
    if (isSmallInteger(value)) {
      return value;
    }
    return add(sign(x), undefined, x === 0 ? 0 : 1, abs(x), 0 - sign(y), undefined, y === 0 ? 0 : 1, abs(y));
  };

  var multiplyBigIntegerNumber = function (x, y) {
    return multiply(x.signum, x.magnitude, x.length, 0, sign(y), undefined, y === 0 ? 0 : 1, abs(y));
  };

  var multiplyNumberBigInteger = function (x, y) {
    return multiply(sign(x), undefined, x === 0 ? 0 : 1, abs(x), y.signum, y.magnitude, y.length, 0);
  };

  var multiplyNumberNumber = function (x, y) {
    var value = 0 + x * y;
    if (isSmallInteger(value)) {
      return value;
    }
    return multiply(sign(x), undefined, x === 0 ? 0 : 1, abs(x), sign(y), undefined, y === 0 ? 0 : 1, abs(y));
  };

  var divideBigIntegerNumber = function (x, y) {
    return divideAndRemainder(x.signum, x.magnitude, x.length, 0, sign(y), undefined, y === 0 ? 0 : 1, abs(y), true);
  };

  var divideNumberBigInteger = function (x, y) {
    return divideAndRemainder(sign(x), undefined, x === 0 ? 0 : 1, abs(x), y.signum, y.magnitude, y.length, 0, true);
  };

  var divideNumberNumber = function (x, y) {
    if (y === 0) {
      throw new RangeError();
    }
    return 0 + Math.trunc(x / y);
  };

  var remainderBigIntegerNumber = function (x, y) {
    return divideAndRemainder(x.signum, x.magnitude, x.length, 0, sign(y), undefined, y === 0 ? 0 : 1, abs(y), false);
  };

  var remainderNumberBigInteger = function (x, y) {
    return divideAndRemainder(sign(x), undefined, x === 0 ? 0 : 1, abs(x), y.signum, y.magnitude, y.length, 0, false);
  };

  var remainderNumberNumber = function (x, y) {
    if (y === 0) {
      throw new RangeError();
    }
    return x % y;
  };

  BigInteger.parseInteger = function (s, radix) {
    if (radix === undefined) {
      radix = 10;
    }
    return parseBigInteger(s, radix, false);
  };

  // see http://jsperf.com/symbol-vs-property/3

  var Symbol = function (s) {
    return s;
  };

  // public:
  BigInteger.COMPARE_TO = Symbol("BigInteger.COMPARE_TO");
  BigInteger.NEGATE = Symbol("BigInteger.NEGATE");
  BigInteger.ADD = Symbol("BigInteger.ADD");
  BigInteger.SUBTRACT = Symbol("BigInteger.SUBTRACT");
  BigInteger.MULTIPLY = Symbol("BigInteger.MULTIPLY");
  BigInteger.DIVIDE = Symbol("BigInteger.DIVIDE");
  BigInteger.REMAINDER = Symbol("BigInteger.REMAINDER");

  // private:
  //var COMPARE_TO_NUMBER = Symbol("1");
  //var COMPARE_TO_BIG_INTEGER = Symbol("2");
  //var ADD_NUMBER = Symbol("3");
  //var ADD_BIG_INTEGER = Symbol("4");
  //var SUBTRACT_NUMBER = Symbol("5");
  //var SUBTRACT_BIG_INTEGER = Symbol("6");
  //var MULTIPLY_NUMBER = Symbol("7");
  //var MULTIPLY_BIG_INTEGER = Symbol("8");
  //var DIVIDE_NUMBER = Symbol("9");
  //var DIVIDE_BIG_INTEGER = Symbol("10");
  //var REMAINDER_NUMBER = Symbol("11");
  //var REMAINDER_BIG_INTEGER = Symbol("12");

  Number.prototype["BigInteger.COMPARE_TO"] = function (y) {
    return y["COMPARE_TO_NUMBER"](0 + this);
  };
  Number.prototype["BigInteger.NEGATE"] = function () {
    return negateNumber(0 + this);
  };
  Number.prototype["BigInteger.ADD"] = function (y) {
    return y["ADD_NUMBER"](0 + this);
  };
  Number.prototype["BigInteger.SUBTRACT"] = function (y) {
    return y["SUBTRACT_NUMBER"](0 + this);
  };
  Number.prototype["BigInteger.MULTIPLY"] = function (y) {
    return y["MULTIPLY_NUMBER"](0 + this);
  };
  Number.prototype["BigInteger.DIVIDE"] = function (y) {
    return y["DIVIDE_NUMBER"](0 + this);
  };
  Number.prototype["BigInteger.REMAINDER"] = function (y) {
    return y["REMAINDER_NUMBER"](0 + this);
  };

  Number.prototype["COMPARE_TO_BIG_INTEGER"] = function (x) {
    return compareToBigIntegerNumber(x, 0 + this);
  };
  Number.prototype["ADD_BIG_INTEGER"] = function (x) {
    return addBigIntegerNumber(x, 0 + this);
  };
  Number.prototype["SUBTRACT_BIG_INTEGER"] = function (x) {
    return subtractBigIntegerNumber(x, 0 + this);
  };
  Number.prototype["MULTIPLY_BIG_INTEGER"] = function (x) {
    return multiplyBigIntegerNumber(x, 0 + this);
  };
  Number.prototype["DIVIDE_BIG_INTEGER"] = function (x) {
    return divideBigIntegerNumber(x, 0 + this);
  };
  Number.prototype["REMAINDER_BIG_INTEGER"] = function (x) {
    return remainderBigIntegerNumber(x, 0 + this);
  };

  Number.prototype["COMPARE_TO_NUMBER"] = function (x) {
    return compareToNumberNumber(x, 0 + this);
  };
  Number.prototype["ADD_NUMBER"] = function (x) {
    return addNumberNumber(x, 0 + this);
  };
  Number.prototype["SUBTRACT_NUMBER"] = function (x) {
    return subtractNumberNumber(x, 0 + this);
  };
  Number.prototype["MULTIPLY_NUMBER"] = function (x) {
    return multiplyNumberNumber(x, 0 + this);
  };
  Number.prototype["DIVIDE_NUMBER"] = function (x) {
    return divideNumberNumber(x, 0 + this);
  };
  Number.prototype["REMAINDER_NUMBER"] = function (x) {
    return remainderNumberNumber(x, 0 + this);
  };

  BigInteger.prototype["BigInteger.COMPARE_TO"] = function (y) {
    return y["COMPARE_TO_BIG_INTEGER"](this);
  };
  BigInteger.prototype["BigInteger.NEGATE"] = function () {
    return negateBigInteger(this);
  };
  BigInteger.prototype["BigInteger.ADD"] = function (y) {
    return y["ADD_BIG_INTEGER"](this);
  };
  BigInteger.prototype["BigInteger.SUBTRACT"] = function (y) {
    return y["SUBTRACT_BIG_INTEGER"](this);
  };
  BigInteger.prototype["BigInteger.MULTIPLY"] = function (y) {
    return y["MULTIPLY_BIG_INTEGER"](this);
  };
  BigInteger.prototype["BigInteger.DIVIDE"] = function (y) {
    return y["DIVIDE_BIG_INTEGER"](this);
  };
  BigInteger.prototype["BigInteger.REMAINDER"] = function (y) {
    return y["REMAINDER_BIG_INTEGER"](this);
  };

  BigInteger.prototype["COMPARE_TO_BIG_INTEGER"] = function (x) {
    return compareToBigIntegerBigInteger(x, this);
  };
  BigInteger.prototype["ADD_BIG_INTEGER"] = function (x) {
    return addBigIntegerBigInteger(x, this);
  };
  BigInteger.prototype["SUBTRACT_BIG_INTEGER"] = function (x) {
    return subtractBigIntegerBigInteger(x, this);
  };
  BigInteger.prototype["MULTIPLY_BIG_INTEGER"] = function (x) {
    return multiplyBigIntegerBigInteger(x, this);
  };
  BigInteger.prototype["DIVIDE_BIG_INTEGER"] = function (x) {
    return divideBigIntegerBigInteger(x, this);
  };
  BigInteger.prototype["REMAINDER_BIG_INTEGER"] = function (x) {
    return remainderBigIntegerBigInteger(x, this);
  };

  BigInteger.prototype["COMPARE_TO_NUMBER"] = function (x) {
    return compareToNumberBigInteger(x, this);
  };
  BigInteger.prototype["ADD_NUMBER"] = function (x) {
    return addNumberBigInteger(x, this);
  };
  BigInteger.prototype["SUBTRACT_NUMBER"] = function (x) {
    return subtractNumberBigInteger(x, this);
  };
  BigInteger.prototype["MULTIPLY_NUMBER"] = function (x) {
    return multiplyNumberBigInteger(x, this);
  };
  BigInteger.prototype["DIVIDE_NUMBER"] = function (x) {
    return divideNumberBigInteger(x, this);
  };
  BigInteger.prototype["REMAINDER_NUMBER"] = function (x) {
    return remainderNumberBigInteger(x, this);
  };

  // deprecated methods:

  BigInteger.prototype.compareTo = function (y) {
    return compareToBigIntegerBigInteger(this, y);
  };
  BigInteger.prototype.negate = function () {
    return negateBigInteger(this);
  };
  BigInteger.prototype.add = function (y) {
    return addBigIntegerBigInteger(this, y);
  };
  BigInteger.prototype.subtract = function (y) {
    return subtractBigIntegerBigInteger(this, y);
  };
  BigInteger.prototype.multiply = function (y) {
    return multiplyBigIntegerBigInteger(this, y);
  };
  BigInteger.prototype.divide = function (y) {
    return divideBigIntegerBigInteger(this, y);
  };
  BigInteger.prototype.remainder = function (y) {
    return remainderBigIntegerBigInteger(this, y);
  };

}(this));
