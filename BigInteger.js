/*jslint plusplus: true, vars: true, indent: 2 */


(function (exports) {
  "use strict";

  // http://cacr.uwaterloo.ca/hac/about/chap14.pdf

  var floor = Math.floor;

  var parseInteger = function (s, from, to, radix) {
    var i = from - 1;
    var n = 0;
    while (++i < to) {
      var code = s.charCodeAt(i);
      var v = code - 48;
      if (radix <= 10) {
        if (v < 0 || radix <= v) {
          throw new RangeError();
        }
      } else {
        if (v < 0 || 10 <= v) {
          v = code - 65 + 10;
          if (v < 10 || radix <= v) {
            v = code - 97 + 10;
            if (v < 10 || radix <= v) {
              throw new RangeError();
            }
          }
        }
      }
      n = n * radix + v;
    }
    return n;
  };

  var pow = function (x, count, accumulator) {
    while (count > 0) {
      var c = floor(count / 2);
      if (count !== c * 2) {
        count -= 1;
        accumulator *= x;
      } else {
        count = c;
        x *= x;
      }
    }
    return accumulator;
  };

  var log = function (a, b) {
    var x = floor(a / b) >= b ? 2 * log(a, b * b) : 0;
    return floor(a / pow(b, x, 1)) >= b ? x + 1 : x;
  };

  var flag = null;
  var createArray = function (length) {
    var x = new Array(length);
    var i = -1;
    while (++i < length) {
      x[i] = 0;
    }
    return x;
  };

  var copyArray = function (y, x) {
    var length = y.length;
    var i = -1;
    while (++i < length) {
      x[i] = y[i];
    }
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

  var base = 67108864;

  var toRadix = function (radix) {
    radix = floor(Number(radix)) || 10;
    if (!(2 <= radix && radix <= 36)) {
      throw new RangeError("radix argument must be between 2 and 36");
    }
    return radix;
  };

  var convertRadix = function (data, size, radix) {
    var i = -1;
    while (++i < size) {
      var j = -1;
      var x = data[i];
      data[i] = 0;
      while (++j < i + 1) {
        x += data[j] * radix;
        var q = floor(x / base);
        data[j] = x - q * base;
        x = q;
      }
    }
  };

  // BigInteger(String[, radix = 10]), (2 <= radix <= 36)
  // throws RangeError, TypeError
  function BigInteger(s, radix) {
    if (typeof s !== "string") {
      throw new TypeError();
    }
    var magnitude = null;
    var sign = 1;
    if (flag !== null) {
      magnitude = flag;
      flag = null;
      sign = radix;
    } else {
      radix = toRadix(radix);
      if (s === "") {
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

      var length = s.length - from;
      if (length === 0) {
        throw new RangeError();
      }

      var groupLength = log(base, radix);
      var size = -floor(-length / groupLength);

      magnitude = createArray(size);
      var k = size;
      var i = length;
      while (i > 0) {
        magnitude[--k] = parseInteger(s, from + (i > groupLength ? i - groupLength : 0), from + i, radix);
        i -= groupLength;
      }

      convertRadix(magnitude, size, pow(radix, groupLength, 1));
      magnitude = trimArray(magnitude);
    }
    this.magnitude = magnitude;
    this.signum = magnitude.length === 0 ? 0 : sign;
  }

  var createBigInteger = function (sign, a) {
    flag = a;
    return new BigInteger("", a.length > 0 ? sign : 0);
  };

  var compareMagnitude = function (aMagnitude, bMagnitude) {
    var aMagnitudeLength = aMagnitude.length;
    var bMagnitudeLength = bMagnitude.length;
    if (aMagnitudeLength !== bMagnitudeLength) {
      return aMagnitudeLength < bMagnitudeLength ? -1 : +1;
    }
    var i = aMagnitudeLength;
    while (--i >= 0) {
      if (aMagnitude[i] !== bMagnitude[i]) {
        return aMagnitude[i] < bMagnitude[i] ? -1 : +1;
      }
    }
    return 0;
  };

  var compareTo = function (a, b) {
    var aSignum = a.signum;
    var bSignum = b.signum;
    if (aSignum === bSignum) {
      var c = compareMagnitude(a.magnitude, b.magnitude);
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

  var add = function (aMagnitude, aSignum, bMagnitude, bSignum) {
    var z = compareMagnitude(aMagnitude, bMagnitude);
    if (z > 0) {
      return add(bMagnitude, bSignum, aMagnitude, aSignum);
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
    var aMagnitudeLength = aMagnitude.length;
    var bMagnitudeLength = bMagnitude.length;
    var result = createArray(bMagnitudeLength + (subtract ? 0 : 1));
    var i = -1;
    var c = 0;
    while (++i < bMagnitudeLength) {
      c += (i < aMagnitudeLength ? (subtract ? bMagnitude[i] - aMagnitude[i] : bMagnitude[i] + aMagnitude[i]) : bMagnitude[i]);
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
      result[bMagnitudeLength] = c;
    }
    return createBigInteger(bSignum, trimArray(result));
  };

  var multiply = function (a, b) {
    var aMagnitude = a.magnitude;
    var bMagnitude = b.magnitude;
    var aLength = aMagnitude.length;
    var bLength = bMagnitude.length;
    if (aLength === 0 || bLength === 0) {
      return createBigInteger(0, createArray(0));
    }
    var resultSign = a.signum * b.signum;
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

  var multiplyBySmall = function (data, lambda) {
    var length = data.length;
    var result = createArray(length + 1);
    var c = 0;
    var i = -1;
    while (++i < length) {
      c += data[i] * lambda;
      var q = floor(c / base);
      result[i] = c - q * base;
      c = q;
    }
    result[length] = c;
    return trimArray(result);
  };

  var divideAndRemainder = function (a, b, divide) {
    var aMagnitude = a.magnitude;
    var bMagnitude = b.magnitude;
    if (bMagnitude.length === 0) {
      throw new RangeError();
    }
    if (aMagnitude.length === 0) {
      return createBigInteger(0, createArray(0));
    }
    if (bMagnitude.length === 1 && bMagnitude[0] === 1) {
      return divide ? multiply(a, b) : createBigInteger(0, createArray(0));
    }

    var top = bMagnitude[bMagnitude.length - 1];

    // normalization
    var lambda = 1;
    if (bMagnitude.length > 1) {
      //lambda = -floor(-floor(base / 2) / top);
      lambda = floor(base / (top + 1));
      if (lambda > 1) {
        aMagnitude = multiplyBySmall(a.magnitude, lambda);
        bMagnitude = multiplyBySmall(b.magnitude, lambda);
        top = bMagnitude[bMagnitude.length - 1];
      }
      if (top < floor(base / 2)) {
        throw new RangeError();
      }
    }

    var aLength = aMagnitude.length;
    var bLength = bMagnitude.length;
    var shift = aLength - bLength + 1;
    var div = divide ? createArray(shift > 0 ? shift : 0) : null; // ZERO

    var remainderData = createArray(aLength + 1); // +1 to avoid some `index < remainderData.length`
    copyArray(aMagnitude, remainderData);
    var resultSign = a.signum * b.signum;
    var i = shift;
    while (--i >= 0) {
      var q = floor((remainderData[bLength + i] * base + remainderData[bLength + i - 1]) / top);
      if (q > base - 1) {
        q = base - 1;
      }

      var ax = 0;
      var bx = 0;
      var j = -1;
      while (++j < bLength) {
        bx += q * bMagnitude[j];
        var qbx = floor(bx / base);
        ax += remainderData[j + i] - (bx - qbx * base);
        if (ax < 0) {
          remainderData[j + i] = base + ax;
          ax = -1;
        } else {
          remainderData[j + i] = ax;
          ax = 0;
        }
        bx = qbx;
      }
      ax += remainderData[bLength + i] - bx;
      if (ax < 0) {
        remainderData[bLength + i] = base + ax;
        ax = -1;
      } else {
        remainderData[bLength + i] = ax;
        ax = 0;
      }
      while (ax !== 0) {
        --q;
        var c = 0;
        var k = -1;
        while (++k < bLength) {
          c += remainderData[k + i] + bMagnitude[k];
          if (c < base) {
            remainderData[k + i] = c;
            c = 0;
          } else {
            remainderData[k + i] = c - base;
            c = 1;
          }
        }
        c += remainderData[bLength + i];
        if (c < base) {
          remainderData[bLength + i] = c;
          c = 0;
        } else {
          remainderData[bLength + i] = c - base;
          c = 1;
        }
        ax += c;
      }
      if (div !== null) {
        div[i] = q;
      }
    }

    if (!divide && lambda > 1) {
      divideBySmall(remainderData, remainderData.length, lambda);
    }

    return divide ? createBigInteger(resultSign, trimArray(div)) : createBigInteger(a.signum, trimArray(remainderData));
  };

  BigInteger.prototype = {

    compareTo: function (b) {
      return compareTo(this, b);
    },

    negate: function () {
      return createBigInteger(0 - this.signum, this.magnitude);
    },

    add: function (b) {
      return add(this.magnitude, this.signum, b.magnitude, b.signum);
    },

    subtract: function (b) {
      return add(this.magnitude, this.signum, b.magnitude, 0 - b.signum);
    },

    multiply: function (b) {
      return multiply(this, b);
    },

    divide: function (b) {
      return divideAndRemainder(this, b, true);
    },

    remainder: function (b) {
      return divideAndRemainder(this, b, false);
    },

    toString: function (radix) { // 2 <= radix <= 36 < base
      radix = toRadix(radix);

      var result = "";
      var magnitude = this.magnitude;

      var groupLength = log(base, radix);
      var wr = pow(radix, groupLength, 1);
      var remainderMagnitude = createArray(magnitude.length);
      copyArray(magnitude, remainderMagnitude);
      var remainderMagnitudeLength = remainderMagnitude.length;

      while (remainderMagnitudeLength !== 0) {
        var q = divideBySmall(remainderMagnitude, remainderMagnitudeLength, wr);
        while (remainderMagnitudeLength !== 0 && remainderMagnitude[remainderMagnitudeLength - 1] === 0) {
          --remainderMagnitudeLength;
        }
        var t = q.toString(radix);
        result = repeat("0", remainderMagnitudeLength !== 0 ? groupLength - t.length : 0, "") + t + result;
      }

      return (this.signum < 0 ? "-" + result : (result === "" ? "0" : result));
    }

  };

  var ZERO = createBigInteger(0, createArray(0));
  var oneData = createArray(1);
  oneData[0] = 1;
  var ONE = createBigInteger(1, oneData);

  BigInteger.ZERO = ZERO;
  BigInteger.ONE = ONE;
  exports.BigInteger = BigInteger;

}(this));
