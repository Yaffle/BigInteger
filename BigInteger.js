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

  var base = 67108864;

  var createArray = function (length) {
    var x = new Array(length);
    if (x.length !== length) {
      x.length = length; // see https://bugzilla.mozilla.org/show_bug.cgi?id=989586 , http://stackoverflow.com/questions/22726716/new-arraylength-gives-wrong-size
    }
    var i = -1;
    while (++i < length) {
      x[i] = 0;
    }
    return x;
  };

  var trimArray = function (a, length) {
    var k = length;
    while (k > 0 && a[k - 1] === 0) {
      k -= 1;
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
      magnitude = trimArray(magnitude, size);
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
    var resultLength = bLength + (subtract ? 0 : 1);
    var result = createArray(resultLength);
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
    return createBigInteger(bSignum, trimArray(result, resultLength));
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
    var resultLength = aLength + bLength;
    var result = createArray(resultLength);
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
    return createBigInteger(resultSign, trimArray(result, resultLength));
  };

  var divideBySmall = function (magnitude, length, lambda) {
    var c = 0;
    var i = length;
    while (--i >= 0) {
      c *= base;
      c += magnitude[i];
      var q = floor(c / lambda);
      magnitude[i] = q;
      c -= q * lambda;
    }
    return c;
  };

  var multiplyBySmall = function (magnitude, length, lambda) {
    var c = 0;
    var i = -1;
    while (++i < length) {
      c += magnitude[i] * lambda;
      var q = floor(c / base);
      magnitude[i] = c - q * base;
      c = q;
    }
    magnitude[length] = c;
  };

  var divideAndRemainder = function (aSignum, aMagnitude, bSignum, bMagnitude, divide) {
    var aLength = aMagnitude.length;
    var bLength = bMagnitude.length;
    if (bLength === 0) {
      throw new RangeError();
    }
    if (aLength === 0) {
      return createBigInteger(0, createArray(0));
    }
    if (bLength === 1 && bMagnitude[0] === 1) {
      return divide ? createBigInteger(aSignum === 0 ? 0 : aSignum * bSignum, aMagnitude) : createBigInteger(0, createArray(0));
    }

    var remainder = createArray(aLength + 1); // `+ 1` to avoid `index < remainder.length` and for extra digit in case of normalization
    var n = -1;
    while (++n < aLength) {
      remainder[n] = aMagnitude[n];
    }
    var divisor = createArray(bLength + 1); // `+ 1` to avoid `index < divisor.length`
    var m = -1;
    while (++m < bLength) {
      divisor[m] = bMagnitude[m];
    }

    var top = divisor[bLength - 1];

    // normalization
    var lambda = 1;
    if (bLength > 1) {
      //lambda = -floor(-floor(base / 2) / top);
      lambda = floor(base / (top + 1));
      if (lambda > 1) {
        multiplyBySmall(remainder, aLength, lambda);
        multiplyBySmall(divisor, bLength, lambda);
        //aLength += 1;
        top = divisor[bLength - 1];
      }
      if (top < floor(base / 2)) {
        throw new RangeError();
      }
    }

    var shift = aLength - bLength + 1;
    if (shift < 0) {
      shift = 0;
    }
    var quotinent = null;

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
      while (++j <= t) {
        bx += q * divisor[j - i];
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
      while (ax !== 0) {
        q -= 1;
        var c = 0;
        var k = i - 1;
        while (++k <= t) {
          c += remainder[k] + divisor[k - i];
          if (c < base) {
            remainder[k] = c;
            c = 0;
          } else {
            remainder[k] = c - base;
            c = +1;
          }
        }
        ax += c;
      }
      if (divide && q !== 0) {
        if (quotinent === null) {
          quotinent = createArray(i + 1);
        }
        quotinent[i] = q;
      }
    }

    if (!divide && lambda > 1) {
      divideBySmall(remainder, aLength + 1, lambda);
    }

    if (divide) {
      if (quotinent === null) {
        quotinent = createArray(0);
      }
    } else {
      remainder = trimArray(remainder, aLength + 1);
    }
    return divide ? createBigInteger(quotinent.length === 0 ? 0 : aSignum * bSignum, quotinent) : createBigInteger(remainder.length === 0 ? 0 : aSignum, remainder);
  };

  var toString = function (signum, magnitude, radix) {
    var result = signum < 0 ? "-" : "";

    var remainderLength = magnitude.length;
    if (remainderLength === 0) {
      return "0";
    }
    if (remainderLength === 1) {
      result += magnitude[0].toString(radix);
      return result;
    }
    var groupLength = 0;
    var groupRadix = 1;
    var y = floor(base / radix);
    while (y >= groupRadix) {
      groupLength += 1;
      groupRadix *= radix;
    }
    var size = remainderLength - floor(-remainderLength / groupLength);
    var remainder = createArray(size);
    var n = -1;
    while (++n < remainderLength) {
      remainder[n] = magnitude[n];
    }

    var k = size;
    while (remainderLength !== 0) {
      var q = divideBySmall(remainder, remainderLength, groupRadix);
      while (remainderLength !== 0 && remainder[remainderLength - 1] === 0) {
        remainderLength -= 1;
      }
      remainder[--k] = q;
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
