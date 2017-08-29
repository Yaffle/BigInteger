/*jslint plusplus: true, vars: true, indent: 2 */

(function (global) {
  "use strict";

  function SmallInteger(value) {
    this.value = value;
  }

  SmallInteger.add = function (x, y) {
    var value = x.value + y.value;
    if (value >= -9007199254740991 && value <= +9007199254740991) {
      return new SmallInteger(value);
    }
    throw new RangeError();
  };
  SmallInteger.subtract = function (x, y) {
    var value = x.value - y.value;
    if (value >= -9007199254740991 && value <= +9007199254740991) {
      return new SmallInteger(value);
    }
    throw new RangeError();
  };
  SmallInteger.multiply = function (x, y) {
    var value = 0 + x.value * y.value;
    if (value >= -9007199254740991 && value <= +9007199254740991) {
      return new SmallInteger(value);
    }
    throw new RangeError();
  };
  SmallInteger.divide = function (x, y) {
    if (y.value !== 0) {
      return new SmallInteger(0 + Math.trunc(x.value / y.value));
    }
    throw new RangeError();
  };
  SmallInteger.remainder = function (x, y) {
    if (y.value !== 0) {
      return new SmallInteger(0 + x.value % y.value);
    }
    throw new RangeError();
  };
  SmallInteger.negate = function (x) {
    return new SmallInteger(0 - x.value);
  };
  SmallInteger.compareTo = function (x, y) {
    return (x.value < y.value ? -1 : (x.value < y.value ? +1 : 0));
  };
  SmallInteger.parseInt = function (string, radix) {
    var value = 0 + Number.parseInt(string, radix);
    if (value >= -9007199254740991 && value <= +9007199254740991) {
      return new SmallInteger(value);
    }
    throw new RangeError();
  };
  SmallInteger.prototype.toString = function (radix) {
    return this.value.toString(radix);
  };

  global.SmallInteger = SmallInteger;

}(this));
