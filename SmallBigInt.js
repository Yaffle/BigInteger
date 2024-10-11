
(function () {
  "use strict";

  function BigIntWrapper() {
  }
  BigIntWrapper.BigInt = function (x) {
    return BigInt(x);
  };
  BigIntWrapper.asIntN = function (bits, bigint) {
    return BigInt.asIntN(bits, bigint);
  };
  BigIntWrapper.asUintN = function (bits, bigint) {
    return BigInt.asUintN(bits, bigint);
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
    if (typeof a !== "bigint" || typeof b !== "bigint") {
      throw new TypeError();
    }
    var n = Number(b);
    if (n < 0) {
      throw new RangeError();
    }
    if (n > Number.MAX_SAFE_INTEGER) {
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
  BigIntWrapper.signedRightShift = function (a, n) {
    return a >> n;
  };
  BigIntWrapper.leftShift = function (a, n) {
    return a << n;
  };
  if (Symbol.hasInstance != undefined) {
    Object.defineProperty(BigIntWrapper, Symbol.hasInstance, {
      value: function (a) {
        return typeof a === 'bigint';
      }
    });
  }

  var supportsBigInt = Symbol.hasInstance != undefined &&
                       typeof BigInt !== "undefined" &&
                       BigInt(Number.MAX_SAFE_INTEGER) + BigInt(2) - BigInt(2) === BigInt(Number.MAX_SAFE_INTEGER);

  if (supportsBigInt) {
    // https://twitter.com/mild_sunrise/status/1339174371550760961
    // Chrome < 87
    if (((-BigInt('0xffffffffffffffffffffffffffffffff')) >> BigInt(0x40)).toString() !== '-18446744073709551616') { // ((-(2**128 - 1)) >> 64) !== -1 * 2**64
      BigIntWrapper.signedRightShift = function (a, n) {
        var b = BigInt(1) << n;
        return a >= BigInt(0) ? a / b : (a - b + BigInt(1)) / b;
      };
    }
  }
  if (supportsBigInt) {
    try {
      BigInt(Number.MAX_SAFE_INTEGER + 1);
    } catch (error) {
      // Chrome 67
      BigIntWrapper.BigInt = function (x) {
        if (typeof x === "number") {
          var e = 0;
          var f = x;
          while (f >= Number.MAX_SAFE_INTEGER + 1) {
            f /= (Number.MAX_SAFE_INTEGER + 1);
            e += Math.round(Math.log2(Number.MAX_SAFE_INTEGER + 1));
          }
          if (e !== 0) {
            return BigInt(f) << BigInt(e);
          }
        }
        return BigInt(x);
      };
    }
  }

  var Internal = BigIntWrapper;

  // noinline
  var n = function (f) {
    return function (x, y) {
      return f(x, y);
    };
  };

  var cache = new Array(16 * 2 + 1);
  for (var i = 0; i < cache.length; i += 1) {
    cache[i] = undefined;
  }
  function LastTwoMap() {
    this.a = undefined;
    this.aKey = 0;
    this.b = undefined;
    this.bKey = 0;
    this.last = 0;
  }
  LastTwoMap.prototype.get = function (key) {
    if (this.aKey === key) {
      this.last = 0;
      return this.a;
    }
    if (this.bKey === key) {
      this.last = 1;
      return this.b;
    }
    return undefined;
  };
  LastTwoMap.prototype.set = function (key, value) {
    if (this.last === 0) {
      this.bKey = key;
      this.b = value;
      this.last = 1;
    } else {
      this.aKey = key;
      this.a = value;
      this.last = 0;
    }
  };
  var map = new LastTwoMap(); // to optimize when some number is multiplied by few numbers sequencely
  var toNumber = n(function (a) {
    return Internal.toNumber(a);
  });
  var valueOf = function (x) {
    if (typeof x === "number") {
      if (x >= -16 && x <= +16) {
        var value = cache[x + 16];
        if (value == undefined) {
          value = Internal.BigInt(x);
          cache[x + 16] = value;
        }
        return value;
      }
      var value = map.get(x);
      if (value == undefined) {
        value = Internal.BigInt(x);
        map.set(x, value);
      }
      return value;
    }
    return x;
  };
  var B1 = undefined;
  var B2 = undefined;
  var initB1B2 = function () {
    B1 = Internal.BigInt(-9007199254740991);
    B2 = Internal.BigInt(9007199254740991);
  };
  var toResult = function (x) {
    if (!Internal.lessThan(x, B1) && !Internal.greaterThan(x, B2)) {
      return Internal.toNumber(x);
    }
    return x;
  };
  // the version above much faster somehow (when false) with native bigint in Chrome
  //var toResult = function (x) {
  //  var value = Internal.toNumber(x);
  //  if (value >= -9007199254740991 && value <= 9007199254740991) {
  //    return value;
  //  }
  //  return x;
  //};
  var add = n(function (x, y) {
    if (typeof x === "string" || typeof y === "string") {
      return x + y;
    }
    if (typeof x === "number" && x === 0) {
      return y;
    }
    if (typeof y === "number" && y === 0) {
      return x;
    }
    var a = valueOf(x);
    var b = valueOf(y);
    var sum = Internal.add(a, b);
    return typeof x === "number" && typeof y === "number" ? sum : toResult(sum);
  });
  var subtract = n(function (x, y) {
    if (typeof x === "number" && x === 0) {
      return unaryMinus(y);
    }
    // quite good optimization for comparision of big integers
    if (typeof y === "number" && y === 0) {
      return x;
    }
    var a = valueOf(x);
    var b = valueOf(y);
    var difference = Internal.subtract(a, b);
    return typeof x === "number" && typeof y === "number" ? difference : toResult(difference);
  });
  var multiply = n(function (x, y) {
    if (typeof x === "number" && x === 0) {
      return 0;
    }
    if (typeof x === "number" && x === 1) {
      return y;
    }
    if (typeof x === "number" && x === -1) {
      return Internal.unaryMinus(y);
    }
    if (typeof y === "number" && y === 0) {
      return 0;
    }
    if (typeof y === "number" && y === 1) {
      return x;
    }
    if (typeof y === "number" && y === -1) {
      return Internal.unaryMinus(x);
    }
    var a = valueOf(x);
    var b = valueOf(y);
    return Internal.multiply(a, b);
  });
  var divide = n(function (x, y) {
    if (typeof x === "number" && typeof y !== "number") {
      return 0;
    }
    if (typeof y === "number" && y === 1) {
      return x;
    }
    if (typeof y === "number" && y === -1) {
      return Internal.unaryMinus(x);
    }
    var a = valueOf(x);
    var b = valueOf(y);
    return toResult(Internal.divide(a, b));
  });
  var remainder = n(function (x, y) {
    if (typeof x === "number" && typeof y !== "number") {
      return x;
    }
    if (typeof y === "number" && y === 1) {
      return 0;
    }
    if (typeof y === "number" && y === -1) {
      return 0;
    }
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
        return multiply(x, x);
      }
      if (typeof x === "number" && Math.abs(x) > 2 && y >= 0) {
        if (y > 42 && x % 2 === 0) {//TODO: ?
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
    var power = Internal.exponentiate(a, b);
    return typeof x === "number" && Math.abs(x) <= 1 ? toResult(power) : power;
  });
  var unaryMinus = n(function (x) {
    var a = valueOf(x);
    return Internal.unaryMinus(a);
  });
  var equal = n(function (x, y) {
    if (typeof x === "number") {
      return false;
    }
    if (typeof y === "number") {
      return false;
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

  function SmallBigInt() {
  }

  // Conversion from String:
  // Conversion from Number:
  SmallBigInt.BigInt = function (x) {
    if (typeof x === "number" || typeof x === "string" || typeof x === "bigint") {
      var value = 0 + (typeof x === "number" ? x : Number(x));
      if (value >= -9007199254740991 && value <= 9007199254740991) {
        return value;
      }
    }
    return toResult(Internal.BigInt(x));
  };
  SmallBigInt.asIntN = function (n, x) {
    return toResult(Internal.asIntN(n, Internal.BigInt(x)));
  };
  SmallBigInt.asUintN = function (n, x) {
    if (typeof x === "number" && x >= 0 && n >= 0 && n <= 53) {
      var m = Math.pow(2, n);
      return x - Math.floor(x / m) * m;
    }
    return toResult(Internal.asUintN(n, Internal.BigInt(x)));
  };
  // Conversion to Number:
  SmallBigInt.toNumber = function (x) {
    if (typeof x === "number") {
      return x;
    }
    return toNumber(x);
  };

  // Arithmetic:
  SmallBigInt.add = function (x, y) {
    if (typeof x === "number" && typeof y === "number") {
      var value = x + y;
      if (value >= -9007199254740991 && value <= 9007199254740991) {
        return value;
      }
    }
    return add(x, y);
  };
  SmallBigInt.subtract = function (x, y) {
    if (typeof x === "number" && typeof y === "number") {
      var value = x - y;
      if (value >= -9007199254740991 && value <= 9007199254740991) {
        return value;
      }
    }
    return subtract(x, y);
  };
  SmallBigInt.multiply = function (x, y) {
    if (typeof x === "number" && typeof y === "number") {
      var value = 0 + x * y;
      if (value >= -9007199254740991 && value <= 9007199254740991) {
        return value;
      }
    }
    return multiply(x, y);
  };
  SmallBigInt.divide = function (x, y) {
    if (typeof x === "number" && typeof y === "number") {
      if (y !== 0) {
        return x === 0 ? 0 : (x > 0 && y > 0) || (x < 0 && y < 0) ? 0 + Math.floor(x / y) : 0 - Math.floor((0 - x) / y);
      }
    }
    return divide(x, y);
  };
  SmallBigInt.remainder = function (x, y) {
    if (typeof x === "number" && typeof y === "number") {
      if (y !== 0) {
        return 0 + x % y;
      }
    }
    return remainder(x, y);
  };
  SmallBigInt.unaryMinus = function (x) {
    if (typeof x === "number") {
      return 0 - x;
    }
    return unaryMinus(x);
  };

  // Comparison:
  SmallBigInt.equal = function (x, y) {
    if (typeof x === "number" && typeof y === "number") {
      return x === y;
    }
    return equal(x, y);
  };
  SmallBigInt.lessThan = function (x, y) {
    if (typeof x === "number" && typeof y === "number") {
      return x < y;
    }
    return lessThan(x, y);
  };
  SmallBigInt.greaterThan = function (x, y) {
    if (typeof x === "number" && typeof y === "number") {
      return x > y;
    }
    return greaterThan(x, y);
  };
  SmallBigInt.notEqual = function (x, y) {
    return !SmallBigInt.equal(x, y);
  };
  SmallBigInt.lessThanOrEqual = function (x, y) {
    return !SmallBigInt.greaterThan(x, y);
  };
  SmallBigInt.greaterThanOrEqual = function (x, y) {
    return !SmallBigInt.lessThan(x, y);
  };

  SmallBigInt.exponentiate = function (x, y) {
    if (typeof x === "number" && typeof y === "number") {
      if (y >= 0 && (y < 53 || x >= -1 && x <= 1)) { // 53 === log2(9007199254740991 + 1)
        var value = 0 + Math.pow(x, y);
        if (value >= -9007199254740991 && value <= 9007199254740991) {
          return value;
        }
      }
    }
    return exponentiate(x, y);
  };
  SmallBigInt.signedRightShift = function (x, n) {
    return toResult(Internal.signedRightShift(valueOf(x), valueOf(n)));
  };
  SmallBigInt.leftShift = function (x, n) {
    if (typeof n === "number" && n >= 0) {
      if (typeof x === "number") {
        var value = n === 0 ? x : x * Math.pow(2, n);
        if (value >= -9007199254740991 && value <= 9007199254740991) {
          return value;
        }
      }
      return Internal.leftShift(valueOf(x), valueOf(n));
    }
    return toResult(Internal.leftShift(valueOf(x), valueOf(n)));
  };
  if (Symbol.hasInstance != undefined) {
    Object.defineProperty(SmallBigInt, Symbol.hasInstance, {
      value: function (a) {
        return typeof a === 'number' || a instanceof Internal;
      }
    });
  }

  globalThis.SmallBigInt = SmallBigInt;

  globalThis.JSBI = supportsBigInt ? BigIntWrapper : (globalThis.JSBI || globalThis.BigInteger);
  Internal = globalThis.JSBI;
  initB1B2();

}());
