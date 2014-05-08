/*jslint plusplus: true, vars: true, indent: 2 */

(function (exports) {
  "use strict";

  // http://cacr.uwaterloo.ca/hac/about/chap14.pdf

  var floor = Math.floor;

  var parseInteger = function (s, from, to, radix) {
    var i = from - 1;
    var n = 0;
    var y = radix < 10 ? radix : 10;
    while (++i < to) {
      var code = s.charCodeAt(i);
      var v = code - 48;
      if (v < 0 || y <= v) {
        v = code - 65 + 10;
        if (v < 10 || radix <= v) {
          v = code - 97 + 10;
          if (v < 10 || radix <= v) {
            throw new RangeError();
          }
        }
      }
      n = n * radix + v;
    }
    return n;
  };

  var base = 67108864;

  var createArray = function (length) {
    var x = new Array(length);
    var i = -1;
    while (++i < length) {
      x[i] = 0;
    }
    return x;
  };

  var trimArray = function (a) {
    var length = a.length;
    var k = length;
    while (k > 0 && a[k - 1] === 0) {
      --k;
    }
    if (length !== k) {
      var x = createArray(k);
      var i = k;
      while (--i >= 0) {
        x[i] = a[i];
      }
      a = x;
    }
    return a;
  };

  var repeat = function (s, count, accumulator) {
    while (count > 0) {
      var c = floor(count / 2);
      if (count !== c * 2) {
        count -= 1;
        accumulator += s;
      } else {
        count = c;
        s += s;
      }
    }
    return accumulator;
  };

  var toRadix = function (radix) {
    if (radix < 2 || radix > 36) {
      throw new RangeError("radix argument must be between 2 and 36");
    }
    return radix;
  };

  var convertRadix = function (magnitude, size, radix) {
    var i = -1;
    while (++i < size) {
      var j = -1;
      var x = magnitude[i];
      magnitude[i] = 0;
      while (++j < i + 1) {
        x += magnitude[j] * radix;
        var q = floor(x / base);
        magnitude[j] = x - q * base;
        x = q;
      }
    }
  };

  // BigInteger(String[, radix = 10]), (2 <= radix <= 36)
  // throws RangeError, TypeError
  function BigInteger(s, radix, m) {
    if (typeof s !== "string") {
      throw new TypeError();
    }
    var magnitude = null;
    var sign = 1;
    if (m !== undefined) {
      magnitude = m;
      sign = radix;
    } else {
      radix = toRadix(radix === undefined ? 10 : floor(Number(radix)));
      var length = s.length;
      if (length === 0) {
        throw new RangeError();
      }
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

      var groupLength = 0;
      var groupRadix = 1;
      var y = floor(base / radix);
      while (y >= groupRadix && groupLength < length) {
        groupLength += 1;
        groupRadix *= radix;
      }
      var size = -floor(-length / groupLength);

      magnitude = createArray(size);
      var k = size;
      var i = length;
      while (i > 0) {
        magnitude[--k] = parseInteger(s, from + (i > groupLength ? i - groupLength : 0), from + i, radix);
        i -= groupLength;
      }

      convertRadix(magnitude, size, groupRadix);
      magnitude = trimArray(magnitude);
    }
    this.signum = magnitude.length === 0 ? 0 : sign;
    this.magnitude = magnitude;
  }

  var createBigInteger = function (signum, magnitude) {
    return new BigInteger("", signum, magnitude);
  };

  var compareMagnitude = function (aMagnitude, bMagnitude) {
    var aLength = aMagnitude.length;
    var bLength = bMagnitude.length;
    if (aLength !== bLength) {
      return aLength < bLength ? -1 : +1;
    }
    var i = aLength;
    while (--i >= 0) {
      if (aMagnitude[i] !== bMagnitude[i]) {
        return aMagnitude[i] < bMagnitude[i] ? -1 : +1;
      }
    }
    return 0;
  };

  var compareTo = function (aSignum, aMagnitude, bSignum, bMagnitude) {
    if (aSignum === bSignum) {
      var c = compareMagnitude(aMagnitude, bMagnitude);
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

  var add = function (aSignum, aMagnitude, bSignum, bMagnitude) {
    var z = compareMagnitude(aMagnitude, bMagnitude);
    if (z > 0) {
      return add(bSignum, bMagnitude, aSignum, aMagnitude);
    }
    // |a| <= |b|
    if (aSignum === 0) {
      return createBigInteger(bSignum, bMagnitude);
    }
    var subtract = false;
    if (aSignum !== bSignum) {
      if (z === 0) { // a === (-b)
        return createBigInteger(0, createArray(0));
      }
      subtract = true;
    }
    // result !== 0
    var aLength = aMagnitude.length;
    var bLength = bMagnitude.length;
    var result = createArray(bLength + (subtract ? 0 : 1));
    var i = -1;
    var c = 0;
    while (++i < bLength) {
      c += (i < aLength ? (subtract ? bMagnitude[i] - aMagnitude[i] : bMagnitude[i] + aMagnitude[i]) : bMagnitude[i]);
      if (c < 0) {
        result[i] = base + c;
        c = -1;
      } else if (c < base) {
        result[i] = c;
        c = 0;
      } else {
        result[i] = c - base;
        c = +1;
      }
    }
    if (c !== 0) {
      result[bLength] = c;
    }
    return createBigInteger(bSignum, trimArray(result));
  };

  var multiply = function (aSignum, aMagnitude, bSignum, bMagnitude) {
    var aLength = aMagnitude.length;
    var bLength = bMagnitude.length;
    if (aLength === 0 || bLength === 0) {
      return createBigInteger(0, createArray(0));
    }
    var resultSign = aSignum * bSignum;
    if (aLength === 1 && aMagnitude[0] === 1) {
      return createBigInteger(resultSign, bMagnitude);
    }
    if (bLength === 1 && bMagnitude[0] === 1) {
      return createBigInteger(resultSign, aMagnitude);
    }
    var result = createArray(aLength + bLength);
    var i = -1;
    while (++i < bLength) {
      var c = 0;
      var j = -1;
      while (++j < aLength) {
        c += aMagnitude[j] * bMagnitude[i] + result[j + i];
        var q = floor(c / base);
        result[j + i] = c - q * base;
        c = q;
      }
      result[aLength + i] = c;
    }
    return createBigInteger(resultSign, trimArray(result));
  };

  var divideBySmall = function (magnitude, length, lambda) {
    var i = length;
    var x = 0;
    while (--i >= 0) {
      x *= base;
      x += magnitude[i];
      var q = floor(x / lambda);
      magnitude[i] = q;
      x -= q * lambda;
    }
    return x;
  };

  var multiplyBySmall = function (magnitude, lambda) {
    var length = magnitude.length;
    var result = createArray(length + 1);
    var c = 0;
    var i = -1;
    while (++i < length) {
      c += magnitude[i] * lambda;
      var q = floor(c / base);
      result[i] = c - q * base;
      c = q;
    }
    result[length] = c;
    return trimArray(result);
  };

  var divideAndRemainder = function (aSignum, aMagnitude, bSignum, bMagnitude, divide) {
    if (bMagnitude.length === 0) {
      throw new RangeError();
    }
    if (aMagnitude.length === 0) {
      return createBigInteger(0, createArray(0));
    }
    if (bMagnitude.length === 1 && bMagnitude[0] === 1) {
      return divide ? createBigInteger(aSignum === 0 ? 0 : aSignum * bSignum, aMagnitude) : createBigInteger(0, createArray(0));
    }

    var top = bMagnitude[bMagnitude.length - 1];

    // normalization
    var lambda = 1;
    if (bMagnitude.length > 1) {
      //lambda = -floor(-floor(base / 2) / top);
      lambda = floor(base / (top + 1));
      if (lambda > 1) {
        aMagnitude = multiplyBySmall(aMagnitude, lambda);
        bMagnitude = multiplyBySmall(bMagnitude, lambda);
        top = bMagnitude[bMagnitude.length - 1];
      }
      if (top < floor(base / 2)) {
        throw new RangeError();
      }
    }

    var aLength = aMagnitude.length;
    var bLength = bMagnitude.length;
    var shift = aLength - bLength + 1;
    var quotinent = divide ? createArray(shift > 0 ? shift : 0) : null; // ZERO

    var remainder = createArray(aLength + 1); // `+ 1` to avoid `index < remainder.length`
    var n = -1;
    while (++n < aLength) {
      remainder[n] = aMagnitude[n];
    }

    var resultSign = aSignum * bSignum;
    var i = shift;
    while (--i >= 0) {
      var t = bLength + i;
      var q = floor((remainder[t] * base + remainder[t - 1]) / top);
      if (q > base - 1) {
        q = base - 1;
      }

      var ax = 0;
      var bx = 0;
      var j = i - 1;
      while (++j < t) {
        bx += q * bMagnitude[j - i];
        var qbx = floor(bx / base);
        ax += remainder[j] - (bx - qbx * base);
        if (ax < 0) {
          remainder[j] = base + ax;
          ax = -1;
        } else {
          remainder[j] = ax;
          ax = 0;
        }
        bx = qbx;
      }
      ax += remainder[t] - bx;
      if (ax < 0) {
        remainder[t] = base + ax;
        ax = -1;
      } else {
        remainder[t] = ax;
        ax = 0;
      }
      while (ax !== 0) {
        --q;
        var c = 0;
        var k = i - 1;
        while (++k < t) {
          c += remainder[k] + bMagnitude[k - i];
          if (c < base) {
            remainder[k] = c;
            c = 0;
          } else {
            remainder[k] = c - base;
            c = +1;
          }
        }
        c += remainder[t];
        if (c < base) {
          remainder[t] = c;
          c = 0;
        } else {
          remainder[t] = c - base;
          c = +1;
        }
        ax += c;
      }
      if (quotinent !== null) {
        quotinent[i] = q;
      }
    }

    if (!divide && lambda > 1) {
      divideBySmall(remainder, remainder.length, lambda);
    }

    if (divide) {
      quotinent = trimArray(quotinent);
    } else {
      remainder = trimArray(remainder);
    }
    return divide ? createBigInteger(quotinent.length === 0 ? 0 : resultSign, quotinent) : createBigInteger(remainder.length === 0 ? 0 : aSignum, remainder);
  };

  var toString = function (signum, magnitude, radix) {
    var result = "";

    var remainderLength = magnitude.length;
    if (remainderLength === 0) {
      return "0";
    }
    if (remainderLength === 1) {
      return (signum * magnitude[0]).toString(radix);
    }
    var groupLength = 0;
    var groupRadix = 1;
    var y = floor(base / radix);
    while (y >= groupRadix) {
      groupLength += 1;
      groupRadix *= radix;
    }
    var remainder = createArray(remainderLength);
    var n = -1;
    while (++n < remainderLength) {
      remainder[n] = magnitude[n];
    }

    while (remainderLength !== 0) {
      var q = divideBySmall(remainder, remainderLength, groupRadix);
      while (remainderLength !== 0 && remainder[remainderLength - 1] === 0) {
        --remainderLength;
      }
      var t = q.toString(radix);
      result = repeat("0", remainderLength !== 0 ? groupLength - t.length : 0, "") + t + result;
    }

    return (signum < 0 ? "-" + result : result);
  };

  BigInteger.prototype = {

    compareTo: function (b) {
      return compareTo(this.signum, this.magnitude, b.signum, b.magnitude);
    },

    negate: function () {
      return createBigInteger(0 - this.signum, this.magnitude);
    },

    add: function (b) {
      return add(this.signum, this.magnitude, b.signum, b.magnitude);
    },

    subtract: function (b) {
      return add(this.signum, this.magnitude, 0 - b.signum, b.magnitude);
    },

    multiply: function (b) {
      return multiply(this.signum, this.magnitude, b.signum, b.magnitude);
    },

    divide: function (b) {
      return divideAndRemainder(this.signum, this.magnitude, b.signum, b.magnitude, true);
    },

    remainder: function (b) {
      return divideAndRemainder(this.signum, this.magnitude, b.signum, b.magnitude, false);
    },

    toString: function (radix) {
      return toString(this.signum, this.magnitude, toRadix(radix === undefined ? 10 : floor(Number(radix))));
    }

  };

  var ZERO = createBigInteger(0, createArray(0));
  var oneMagnitude = createArray(1);
  oneMagnitude[0] = 1;
  var ONE = createBigInteger(1, oneMagnitude);

  BigInteger.ZERO = ZERO;
  BigInteger.ONE = ONE;
  exports.BigInteger = BigInteger;

}(this));
