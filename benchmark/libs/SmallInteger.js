/*jslint plusplus: true, vars: true, indent: 2 */

(function (global) {
  "use strict";

  function SmallInteger(value) {
    this.value = value;
  }

  SmallInteger.add = function (x, y) {
    return new SmallInteger(x.value + y.value);
  };
  SmallInteger.subtract = function (x, y) {
    return new SmallInteger(x.value - y.value);
  };
  SmallInteger.multiply = function (x, y) {
    return new SmallInteger(0 + x.value * y.value);
  };
  SmallInteger.divide = function (x, y) {
    return new SmallInteger(0 + Math.trunc(x.value / y.value));
  };
  SmallInteger.remainder = function (x, y) {
    return new SmallInteger(0 + x.value % y.value);
  };
  SmallInteger.negate = function (x) {
    return new SmallInteger(0 - x.value);
  };
  SmallInteger.compareTo = function (x, y) {
    return (x.value < y.value ? -1 : (x.value < y.value ? +1 : 0));
  };
  SmallInteger.parseInt = function (string, radix) {
    return new SmallInteger(0 + Number.parseInt(string, radix));
  };
  SmallInteger.prototype.toString = function (radix) {
    return this.value.toString(radix);
  };
  SmallInteger.and = function (x, y) {
    return new SmallInteger(x.value & y.value);
  };
  SmallInteger.or = function (x, y) {
    return new SmallInteger(x.value | y.value);
  };
  SmallInteger.xor = function (x, y) {
    return new SmallInteger(x.value ^ y.value);
  };
  SmallInteger.not = function (x) {
    return new SmallInteger(~x.value);
  };
  SmallInteger.shiftLeft = function (x, y) {
    return new SmallInteger(x.value << y.value);
  };
  SmallInteger.shiftRight = function (x, y) {
    return new SmallInteger(x.value >> y.value);
  };
  SmallInteger.bitLength = function (x) {
    return new SmallInteger(32 - Math.clz32(x.value));
  };
  SmallInteger.pow = function (x, y) {
    return new SmallInteger(Math.pow(x.value, y.value));
  };

  global.SmallInteger = SmallInteger;

}(this));
