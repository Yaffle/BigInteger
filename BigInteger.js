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
    var x = new Array(length);
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

  var zeros = new Array(32);
  var u = -1;
  var s = "";
  while (++u < 32) {
    zeros[u] = s;
    s += "0";
  }

  var base = 16777216;

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
      flag = null;
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
  }

  var createBigInteger = function (sign, a) {
    flag = a;
    return new BigInteger("", a.length > 0 ? sign : 0);
  };

  function compareMagnitude(aMagnitude, bMagnitude) {
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
  }

  var compareTo = function (a, b) {
    var aSignum = a.signum;
    var bSignum = b.signum;
    if (aSignum === 0) {
      return -bSignum;
    }
    return (aSignum === bSignum ? compareMagnitude(a.magnitude, b.magnitude) : 1) * aSignum;
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
        return ZERO;
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
      c += bMagnitude[i] + (i < aMagnitudeLength ? (subtract ? -aMagnitude[i] : aMagnitude[i]) : 0);
      if (c < 0) {
        c = -1;
        result[i] = base + c;
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
    var i = -1;
    var aLength = aMagnitude.length;
    var bLength = bMagnitude.length;
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
    var div = which === 0 ? createArray(shift > 0 ? shift : 0) : null; // ZERO

    var remainderData = copyArray(aMagnitude);
    var resultSign = a.signum * b.signum;
    var i = shift;
    while (--i >= 0) {
      x = (shift - 1 === i ? 0 : remainderData[remainderData.length - (shift - i) + 1] * base) + remainderData[remainderData.length - (shift - i)];
      q = floor(x / top);
      if (q > base - 1) {
        q = base - 1;
      }

      if (q > 0) {
        var ax = 0;
        var bx = 0;
        var j = -1;
        while (++j < bMagnitude.length) {
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
        if (bMagnitude.length + i < remainderData.length) {
          ax += remainderData[bMagnitude.length + i] - bx;
          if (ax < 0) {
            remainderData[bMagnitude.length + i] = base + ax;
            ax = -1;
          } else {
            remainderData[bMagnitude.length + i] = ax;
            ax = 0;
          }
          bx = 0;
        }
        while (ax !== 0 || bx !== 0) {
          --q;
          j = -1;
          var c = 0;
          while (++j < bMagnitude.length) {
            c += remainderData[j + i] + bMagnitude[j];
            if (c < base) {
              remainderData[j + i] = c;
              c = 0;
            } else {
              remainderData[j + i] = c - base;
              c = 1;
            }
          }
          if (bMagnitude.length + i < remainderData.length) {
            c += remainderData[bMagnitude.length + i];
            if (c < base) {
              remainderData[bMagnitude.length + i] = c;
              c = 0;
            } else {
              remainderData[bMagnitude.length + i] = c - base;
              c = 1;
            }
          }
          if (ax !== 0) {
            ax += c;
            c = 0;
          }
          bx -= c;
        }
      }
      if (which === 0) {
        div[i] = q;
      }
    }

    if (which === 1 && lambda > 1) {
      divideBySmall(remainderData, remainderData.length, lambda);
    }
    return which === 0 ? createBigInteger(resultSign, trimArray(div)) : createBigInteger(resultSign, trimArray(remainderData));
  };

  BigInteger.prototype = {

    compareTo: function (b) {
      return compareTo(this, b);
    },

    negate: function () {
      return createBigInteger(-this.signum, this.magnitude);
    },

    add: function (b) {
      return add(this.magnitude, this.signum, b.magnitude, b.signum);
    },

    subtract: function (b) {
      return add(this.magnitude, this.signum, b.magnitude, -b.signum);
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
