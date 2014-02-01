/*jslint plusplus: true, vars: true, indent: 2 */

(function (exports) {
  "use strict";

  // http://cacr.uwaterloo.ca/hac/about/chap14.pdf

  var floor = Math.floor;
  var log = Math.log;

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

  function pow(x, count, accumulator) {
    while (count > 0) {
      if (count % 2 !== 0) {
        count -= 1;
        accumulator *= x;
      } else {
        count /= 2;
        x *= x;
      }
    }
    return accumulator;
  }

  function ArithmeticException() {
    Function.prototype.apply.call(RangeError, this);
  }

  var F = function () {
  };
  F.prototype = RangeError.prototype;

  ArithmeticException.prototype = new F();

  var flag = null;
  var ZERO = null;
  var ONE = null;
  var createArray = function (length) {
    var x = [];
    var i = -1;
    while (++i < length) {
      x[i] = 0;
    }
    return x;
  };

  var copyArray = function (y) {
    var length = y.length;
    var x = createArray(length);
    var i = -1;
    while (++i < length) {
      x[i] = y[i];
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

  var zeros = [];
  var u = -1;
  var s = "";
  while (++u < 32) {
    zeros[u] = s;
    s += "0";
  }

  var base = 67108864;

  var checkRadix = function (radix) {
    if (!(2 <= radix && radix <= 36)) {
      throw new RangeError("radix argument must be between 2 and 36");
    }
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
      sign = radix;
    } else {
      radix = floor(+radix) || 10;
      checkRadix(radix);
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

      var groupLength = floor(log(base) / log(radix));
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

    //Object.freeze(this);
    return this;
  }

  var createBigInteger = function (sign, a) {
    flag = a;
    var bi = new BigInteger("", a.length > 0 ? sign : 0);
    flag = null;
    return bi;
  };

  function compareMagnitude(aMagnitude, bMagnitude) {
    var aMagnitudeLength = aMagnitude.length;
    var bMagnitudeLength = bMagnitude.length;
    if (aMagnitudeLength < bMagnitudeLength) {
      return -1;
    }
    if (bMagnitudeLength < aMagnitudeLength) {
      return +1;
    }
    var i = aMagnitudeLength;
    while (--i >= 0) {
      if (aMagnitude[i] !== bMagnitude[i]) {
        return aMagnitude[i] < bMagnitude[i] ? -1 : +1;
      }
    }
    return 0;
  }

  var compareTo = function (a, b) {
    var aSignum = a.signum;
    var bSignum = b.signum;
    if (aSignum === 0) {
      return -bSignum;
    }
    return (aSignum === bSignum ? compareMagnitude(a.magnitude, b.magnitude) : 1) * aSignum;
  };

  var add = function (a, b) {
    var aMagnitude = a.magnitude;
    var bMagnitude = b.magnitude;
    var z = compareMagnitude(aMagnitude, bMagnitude);
    if (z > 0) {
      var tmp = a;
      a = b;
      b = tmp;
      tmp = aMagnitude;
      aMagnitude = bMagnitude;
      bMagnitude = tmp;
    }
    // |a| <= |b|
    if (compareMagnitude(aMagnitude, ZERO.magnitude) === 0) {
      return b;
    }
    var aSignum = a.signum;
    var bSignum = b.signum;
    var result = null;
    var qs = 1;
    if (aSignum !== bSignum) {
      if (z === 0) { // a === (-b)
        return ZERO;
      }
      qs = -1;
    }
    // result !== 0
    var aMagnitudeLength = aMagnitude.length;
    var bMagnitudeLength = bMagnitude.length;
    result = createArray(bMagnitudeLength + 1);
    var x = 1;
    var i = -1;
    while (++i < bMagnitudeLength || x !== 1) {
      x += base - 1 + (i < bMagnitudeLength ? bMagnitude[i] : 0) + (i < aMagnitudeLength ? qs * aMagnitude[i] : 0);
      var q = floor(x / base);
      result[i] = x - q * base;
      x = q;
    }
    return createBigInteger(bSignum, trimArray(result));
  };

  var multiply = function (a, b) {
    var aMagnitude = a.magnitude;
    var bMagnitude = b.magnitude;
    if (compareMagnitude(aMagnitude, ZERO.magnitude) === 0 || compareMagnitude(bMagnitude, ZERO.magnitude) === 0) {
      return ZERO;
    }
    var resultSign = a.signum * b.signum;
    if (compareMagnitude(aMagnitude, ONE.magnitude) === 0) {
      return createBigInteger(resultSign, bMagnitude);
    }
    if (compareMagnitude(bMagnitude, ONE.magnitude) === 0) {
      return createBigInteger(resultSign, aMagnitude);
    }
    var result = createArray(aMagnitude.length + bMagnitude.length);
    var x = 0;
    var j = 0;
    var i = -1;
    while (++i < bMagnitude.length) {
      j = -1;
      x = 0;
      while (++j < aMagnitude.length || x !== 0) {
        x += (j < aMagnitude.length ? aMagnitude[j] * bMagnitude[i] : 0) + result[j + i];
        var q = floor(x / base);
        result[j + i] = x - q * base;
        x = q;
      }
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
    var x = 0;
    var i = -1;
    while (++i < length) {
      x += data[i] * lambda;
      var q = floor(x / base);
      result[i] = x - q * base;
      x = q;
    }
    result[length] = x;
    return trimArray(result);
  };

  var divideAndRemainder = function (a, b, which) {
    var aMagnitude = a.magnitude;
    var bMagnitude = b.magnitude;
    if (compareMagnitude(bMagnitude, ZERO.magnitude) === 0) {
      throw new ArithmeticException();
    }
    if (compareMagnitude(aMagnitude, ZERO.magnitude) === 0) {
      return ZERO;
    }
    if (compareMagnitude(bMagnitude, ONE.magnitude) === 0) {
      return (which === 1 ? ZERO : multiply(a, b));
    }

    var top = bMagnitude[bMagnitude.length - 1];

    // normalization
    var lambda = 1;
    if (bMagnitude.length > 1) {
      lambda = -floor(-floor(base / 2) / top);
      if (lambda > 1) {
        aMagnitude = multiplyBySmall(a.magnitude, lambda);
        bMagnitude = multiplyBySmall(b.magnitude, lambda);
        top = bMagnitude[bMagnitude.length - 1];
      }
      if (top < floor(base / 2)) {
        throw new Error();
      }
    }

    var x = 0;
    var q = 0;
    var shift = aMagnitude.length - bMagnitude.length + 1;
    var div = which === 0 ? createArray(shift > 0 ? shift : 1) : null; // ZERO

    var reminderData = copyArray(aMagnitude);
    var resultSign = a.signum * b.signum;

    var i = shift;
    var ax = 0;
    var bx = 0;
    var j = 0;
    var firstIndex = 0;
    while (--i >= 0) {

      if (shift - 1 === i) {
        x = reminderData[reminderData.length - (shift - i)];
      } else {
        x = reminderData[reminderData.length - (shift - i) + 1] * base + reminderData[reminderData.length - (shift - i)];
      }

      if (bMagnitude.length > 1) {
        firstIndex = floor(x / (top + 1));
        q = firstIndex;

        ax = 1;
        bx = 0;
        do {
          ++q;
          j = -1;
          while (++j < bMagnitude.length) {
            bx += q * bMagnitude[j];
            ax += base - 1 + reminderData[j + i] - (bx % base);
            bx = floor(bx / base);
            ax = floor(ax / base);
          }
          if (j + i < reminderData.length) {
            ax += base - 1 + reminderData[j + i] - (bx % base);
            bx = floor(bx / base);// bx = 0;
            ax = floor(ax / base);
          }
        } while (ax === 1 && bx === 0);
        --q;
      } else {
        q = floor(x / top);
      }
      if (which === 0) {
        div[i] = q;
      }

      if (q > 0) {
        ax = 1;
        bx = 0;
        j = -1;
        while (++j < bMagnitude.length) {
          bx += q * bMagnitude[j];
          ax += base - 1 + reminderData[j + i] - (bx % base);
          reminderData[j + i] = ax % base;
          bx = floor(bx / base);
          ax = floor(ax / base);
        }
        if (j + i < reminderData.length) {
          ax += base - 1 + reminderData[j + i] - (bx % base);
          reminderData[j + i] = ax % base;
        }
      }
    }

    if (which === 1 && lambda > 1) {
      divideBySmall(reminderData, reminderData.length, lambda);
    }
    return which === 0 ? createBigInteger(resultSign, trimArray(div)) : createBigInteger(resultSign, trimArray(reminderData));
  };

  BigInteger.prototype = {

    compareTo: function (b) {
      return compareTo(this, b);
    },

    negate: function () {
      return createBigInteger(-this.signum, this.magnitude);
    },

    add: function (b) {
      return add(this, b);
    },

    subtract: function (b) {
      return add(this, createBigInteger(-b.signum, b.magnitude));
    },

    multiply: function (b) {
      return multiply(this, b);
    },

    divide: function (b) {
      return divideAndRemainder(this, b, 0);
    },

    remainder: function (b) {
      return divideAndRemainder(this, b, 1);
    },

    toString: function (radix) { // 2 <= radix <= 36 < base
      radix = floor(+radix) || 10;
      checkRadix(radix);

      var result = "";
      var magnitude = this.magnitude;

      var groupLength = floor(log(base) / log(radix));
      var wr = pow(radix, groupLength, 1);
      var remainderMagnitude = copyArray(magnitude);
      var remainderMagnitudeLength = remainderMagnitude.length;

      while (remainderMagnitudeLength !== 0) {
        var q = divideBySmall(remainderMagnitude, remainderMagnitudeLength, wr);
        while (remainderMagnitudeLength !== 0 && remainderMagnitude[remainderMagnitudeLength - 1] === 0) {
          --remainderMagnitudeLength;
        }
        var t = q.toString(radix);
        result = zeros[remainderMagnitudeLength !== 0 ? groupLength - t.length : 0] + t + result;
      }

      return (this.signum < 0 ? "-" + result : (result === "" ? "0" : result));
    }

  };

  ZERO = createBigInteger(0, createArray(0));
  var oneData = createArray(1);
  oneData[0] = 1;
  ONE = createBigInteger(1, oneData);

  BigInteger.ZERO = ZERO;
  BigInteger.ONE = ONE;
  exports.ArithmeticException = ArithmeticException;
  exports.BigInteger = BigInteger;

}(this));
