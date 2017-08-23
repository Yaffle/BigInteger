"use strict";

if (Object.assign == undefined) {
  Object.assign = function (target) {
    for (var i = 1; i < arguments.length; i += 1) {
      var nextSource = arguments[i];
      if (nextSource != undefined) {
        var keys = Object.keys(nextSource);
        for (var j = 0; j < keys.length; j += 1) {
          var key = keys[j];
          target[key] = nextSource[key];
        }
      }
    }
    return target;
  };
}

if (Math.sign == undefined) {
  Math.sign = function (x) {
    return x < 0 ? -1 : (x > 0 ? 1 : x);
  };
}

if (Number.EPSILON == undefined) {
  Number.EPSILON = 2 / 9007199254740992;
}

if (Number.parseInt == undefined) {
  Number.parseInt = parseInt;
}

// parseInt, toString, shiftLeft, shiftRight, pow: b is a number value

// TODO: mod, modPow, modInverse

var JavaBigInteger = {
  add: "a.add(b)",
  subtract: "a.subtract(b)",
  multiply: "a.multiply(b)",
  divide: "a.divide(b)",
  remainder: "a.remainder(b)",
  negate: "a.negate()",
  compareTo: "a.compareTo(b)",
  parseInt: "new BigInteger(a, b)",
  toString: "a.toString(b)",
  and: "a.and(b)",
  or: "a.or(b)",
  xor: "a.xor(b)",
  not: "a.not()",
  shiftLeft: "a.shiftLeft(b)",
  shiftRight: "a.shiftRight(b)",
  bitLength: "a.bitLength()",
  pow: "a.pow(b)",
  setup: undefined
};

var NodeBigInteger = {
  add: "a.add(b)",
  subtract: "a.sub(b)",
  multiply: "a.mul(b)",
  divide: "a.div(b)",
  remainder: "a.mod(b)",
  negate: "a.neg()",
  compareTo: "a.cmp(b)",
  parseInt: "new BigInteger(a, b)",
  toString: "a.toString(b)",
  and: "a.and(b)",
  or: "a.or(b)",
  xor: "a.xor(b)",
  not: "a.not()",
  shiftLeft: "a.shln(b)",
  shiftRight: "a.shrn(b)",
  bitLength: "a.bitLength()",
  pow: "a.pow(b)",
  setup: undefined
};

var NumberInteger = {
  add: "a + b",
  subtract: "a - b",
  multiply: "0 + a * b",
  divide: "0 + Math.trunc(a / b)",
  remainder: "0 + a % b",
  negate: "0 - a",
  compareTo: "(a < b ? -1 : (b < a ? +1 : 0))",
  parseInt: "Number.parseInt(a, b)",
  toString: "a.toString(b)",
  and: "a & b",
  or: "a | b",
  xor: "a ^ b",
  not: "~a",
  shiftLeft: "a << b",
  shiftRight: "a >> b",
  bitLength: "32 - Math.clz32(a)",
  pow: "Math.pow(a, b)",
  setup: undefined
};

var MikeMclBigNumber = {
  add: "a.plus(b)",
  subtract: "a.minus(b)",
  multiply: "a.times(b)",
  divide: "a.div(b)",
  remainder: "a.mod(b)",
  negate: "a.neg()",
  compareTo: "a.cmp(b)",
  parseInt: "new BigNumber(a, b)",
  toString: "a.toString(b)",
  pow: "a.toPower(b)"
};

var libs = [
  Object.assign({}, JavaBigInteger, {
    url: "http://www.leemon.com/crypto/BigInt.html",
    source: "http://www.leemon.com/crypto/BigInt.js",
    setup: function () {
      var add = self.add;
      var sub = self.sub;
      var str2bigInt = self.str2bigInt;
      var mult = self.mult;
      var divide_ = self.divide_;
      var mod = self.mod;
      var bigInt2str = self.bigInt2str;
      var zero = str2bigInt("0", 10, 0);
      var greater = self.greater;
      var expand = self.expand;
      var bitSize = self.bitSize;
      var powMod = self.powMod;

      // Big Thanks to @jtobey - https://github.com/jtobey/javascript-bignum/blob/master/lib/leemonBigInt.js
      function BigInt(sign, bigInt) {
          //assert(this instanceof BigInt);
          this._s = sign;
          this._b = bigInt;
          if (isZero(bigInt) && sign !== 1) {
            debugger;
          }
      }
      function BigInt_numberToString(radix) {
          return (this._s === -1 ? "-" : "") + bigInt2str(this._b, radix || 10);
      }
      function _divMod(b1, b2) {
          if (isZero(b2))
              raiseDivisionByExactZero();
          var m = mod(b1, b2);  // s5 contains the quotient.
          return [dup(s5), m];
      }
      function _divAndMod(x, y) {
          var dm = _divMod(x._b, y._b);
          if (x._s > 0)
              // XXX any problem if n is negative and dm[0] is zero?
              return [isZero(dm[0]) ? BigInt.ZERO : new BigInt(y._s, dm[0]), new BigInt(1, dm[1])];
          var q = dm[0], r = dm[1];
          if (isZero(r))
              return [new BigInt(-y._s, q), BigInt.ZERO];
          q.push(0);
          addInt_(q, 1);
          return [new BigInt(-y._s, trim(q, 1)), new BigInt(1, sub(y._b, r))];
      }
      function BigInt_divAndMod(n) {
          return _divAndMod(this, n);
      }
      function BigInt_div(n) {
          return _divAndMod(this, n)[0];
      }
      function BigInt_mod(n) {
          return _divAndMod(this, n)[1];
      }
      function BigInt_negate()     { return isZero(this._b) ? BigInt.ZERO : new BigInt(-this._s, this._b); }
      function BigInt_compare(n) {
          if (isZero(n._b))
              return isZero(this._b) ? 0 : this._s;
          var ret = (this._s - n._s) / 2;
          if (ret)
              return ret;
          if (equals(this._b, n._b))
              return 0;
          return this._s * (greater(this._b, n._b) ? 1 : -1);
      }
      function BigInt_add(n) {
          if (this._s === 1) {
              if (n._s === 1)
                  return new BigInt(1, add(this._b, n._b));
              if (greater(n._b, this._b))
                  return new BigInt(-1, sub(n._b, this._b));
              return new BigInt(1, sub(this._b, n._b));
          }
          if (n._s === -1)
              return new BigInt(-1, add(this._b, n._b));
          if (greater(this._b, n._b))
              return new BigInt(-1, sub(this._b, n._b));
          return new BigInt(1, sub(n._b, this._b));
      }

      function BigInt_multiply(n) {
          var data = mult(this._b, n._b);
          if (isZero(data)) {
            return BigInt.ZERO;
          }
          return new BigInt(this._s * n._s, data);
      }

      BigInt.parseInt = function (string, radix) {
        var sign = +1;
        if (string.slice(0, 1) === "-") {
          sign = -1;
          string = string.slice(1);
        }
        var data = str2bigInt(string, radix == undefined ? 10 : radix, 0);
        if (isZero(data)) {
          return BigInt.ZERO;
        }
        return new BigInt(sign, data);
      };
      BigInt.prototype.negate = BigInt_negate;
      BigInt.prototype.compareTo = BigInt_compare;
      
      BigInt.prototype.add = BigInt_add;
      BigInt.prototype.subtract = function (y) {
        return this.add(y.negate());
      };
      BigInt.prototype.multiply = BigInt_multiply;
      BigInt.prototype.divide = BigInt_div;
      BigInt.prototype.remainder = BigInt_mod;
      BigInt.prototype.toString = BigInt_numberToString;
      BigInt.prototype.bitLength = function () {
        return bitSize(this._b);
      };
      BigInt.prototype.pow = function (y) {
        var n = BigInt.parseInt("1000000000000000000000000000000000000000000000000000000000000000000000000", 16);
        return new BigInt(1, powMod(this._b, y._b, n._b));
      };
      BigInt.ZERO = new BigInt(1, zero);
      self.BigInteger = BigInt;
    },
    parseInt: "BigInteger.parseInt(a, b)",
  }),
  {
    url: "https://github.com/jtobey/javascript-bignum",
    source: "https://raw.githubusercontent.com/jtobey/javascript-bignum/master/biginteger.js https://raw.githubusercontent.com/jtobey/javascript-bignum/master/schemeNumber.js https://raw.githubusercontent.com/jtobey/javascript-bignum/master/lib/hybridBigInteger.js",
    add: "SchemeNumber.fn[\"+\"](a, b)",
    subtract: "SchemeNumber.fn[\"-\"](a, b)",
    multiply: "SchemeNumber.fn[\"*\"](a, b)",
    divide: "SchemeNumber.fn[\"div\"](a, b)",
    remainder: "SchemeNumber.fn[\"mod\"](a, b)",
    negate: "SchemeNumber.fn[\"-\"](a)",
    compareTo: "(SchemeNumber.fn[\"<\"](a, b) ? -1 : (SchemeNumber.fn[\"<\"](b, a) ? +1 : 0))",
    parseInt: "SchemeNumber.plugins.get(\"parseExactInteger\")(1, a, b)",
    toString: "SchemeNumber.plugins.get(\"numberToString\")(a, b, 0)",
    and: "SchemeNumber.plugins.get(\"bitwiseAnd\")(a, b)",
    or: "SchemeNumber.plugins.get(\"bitwiseIor\")(a, b)",
    xor: "SchemeNumber.plugins.get(\"bitwiseXor\")(a, b)",
    shiftLeft: "SchemeNumber.plugins.get(\"bitShift\")(a, SchemeNumber.plugins.get(\"parseExactInteger\")(1, (0 + b).toString(), 10))",
    not: "SchemeNumber.plugins.get(\"bitwiseNot\")(a)",
    shiftRight: "SchemeNumber.plugins.get(\"bitShift\")(a, SchemeNumber.plugins.get(\"parseExactInteger\")(1, (0 - b).toString(), 10))",
    bitLength: "Number.parseInt(SchemeNumber.plugins.get(\"numberToString\")(SchemeNumber.plugins.get(\"bitLength\")(a), 10, 0), 10)",
    pow: "SchemeNumber.plugins.get(\"expt\")(a, SchemeNumber.plugins.get(\"parseExactInteger\")(1, b.toString(), 10))"
  },
  Object.assign({}, JavaBigInteger, {
    url: "https://github.com/node-modules/node-biginteger",
    source: "https://raw.githubusercontent.com/node-modules/node-biginteger/master/lib/BigInteger.js",
    parseInt: "BigInteger.fromString(a, b)",
  }),
  {
    url: "https://github.com/vukicevic/crunch",
    source: "https://raw.githubusercontent.com/vukicevic/crunch/master/crunch.js",
    add: "crunch.add(a, b)",
    subtract: "crunch.sub(a, b)",
    multiply: "crunch.mul(a, b)",
    divide: "crunch.div(a, b)",
    remainder: "crunch.mod(a, b)",
    negate: "crunch.mul(crunch.parse(\"-1\"), a)",
    compareTo: "crunch.compare(a, b)",
    parseInt: "crunch.parse(a)",
    toString: "(a.length === 0 ? \"0\" : (a[0] < 0 ? \"-\" + crunch.stringify(crunch.mul(crunch.parse(\"-1\"), a)) : crunch.stringify(a)))",
    and: "crunch.and(a, b)",
    or: "crunch.or(a, b)",
    xor: "crunch.xor(a, b)",
    not: "crunch.not(a)",
    shiftLeft: "crunch.leftShift(a, b)",
    shiftRight: "crunch.rightShift(a, b)",
    //bitLength: "",
    //modPow: "crunch.exp(a, b, n)",
    setup: function () {
      self.crunch = self.Crunch();
    }
  },
  Object.assign({}, MikeMclBigNumber, {
    url: "https://github.com/MikeMcl/bignumber.js",
    source: "https://raw.githubusercontent.com/MikeMcl/bignumber.js/master/bignumber.js",
    setup: function () {
      //BigNumber.config({precision: 2048, rounding: 1, toExpPos: 2048});
      //BigNumber.DP = 0;
      //BigNumber.RM = 0;
      //BigNumber.E_POS = 2048;
      BigNumber.config({DECIMAL_PLACES: 0, ROUNDING_MODE: 1, EXPONENTIAL_AT: 2048});
    }
  }),
  Object.assign({}, MikeMclBigNumber, {
    url: "https://github.com/MikeMcl/big.js",
    source: "https://raw.githubusercontent.com/MikeMcl/big.js/master/big.js",
    parseInt: "(b === 10 ? new BigNumber(a, b) : new BigNumber(\"0\"))",
    setup: function () {
      self.BigNumber = self.Big;
      //BigNumber.config({precision: 2048, rounding: 1, toExpPos: 2048});
      BigNumber.DP = 0;
      BigNumber.RM = 0;
      BigNumber.E_POS = 2048;
      //BigNumber.config({DECIMAL_PLACES: 0, ROUNDING_MODE: 1, EXPONENTIAL_AT: 2048});
      var MINUS_ONE = new BigNumber("-1", 10);
      BigNumber.prototype.neg = function () {
        return MINUS_ONE.times(this);
      };
    }
  }),
  Object.assign({}, MikeMclBigNumber, {
    url: "https://github.com/MikeMcl/decimal.js",
    parseInt: "(b === 10 ? new BigNumber(a, b) : new BigNumber(\"0\"))",
    source: "https://raw.githubusercontent.com/MikeMcl/decimal.js/master/decimal.js",
    divide: "a.div(b).trunc()",
    remainder: "a.minus(a.div(b).trunc().times(b))",
    setup: function () {
      self.BigNumber = self.Decimal;
      BigNumber.config({precision: 2048, rounding: 1, toExpPos: 2048});
      //BigNumber.DP = 0;
      //BigNumber.RM = 0;
      //BigNumber.E_POS = 2048;
      //BigNumber.config({DECIMAL_PLACES: 0, ROUNDING_MODE: 1, EXPONENTIAL_AT: 2048});
    }
  }),
  Object.assign({}, JavaBigInteger, {
    url: "https://github.com/peterolson/BigInteger.js",
    source: "https://rawgit.com/peterolson/BigInteger.js/master/BigInteger.js",
    parseInt: "bigInt(a, b === 10 ? undefined : b)",
  }),
  Object.assign({}, JavaBigInteger, {
    url: "https://github.com/silentmatt/javascript-biginteger",
    source: "https://rawgit.com/silentmatt/javascript-biginteger/master/biginteger.js",
    parseInt: "BigInteger.parse(a, b)",
    compareTo: "a.compare(b)"
  }),
  Object.assign({}, JavaBigInteger, {
    url: "http://www-cs-students.stanford.edu/~tjw/jsbn/",
    source: "https://raw.githubusercontent.com/jasondavies/jsbn/master/jsbn.js https://raw.githubusercontent.com/jasondavies/jsbn/master/jsbn2.js",
  }),
  {
    url: "https://github.com/Yaffle/BigInteger",
    source: "https://rawgit.com/Yaffle/BigInteger/master/BigInteger.js",
    add: "BigInteger.add(a, b)",
    subtract: "BigInteger.subtract(a, b)",
    multiply: "BigInteger.multiply(a, b)",
    divide: "BigInteger.divide(a, b)",
    remainder: "BigInteger.remainder(a, b)",
    negate: "BigInteger.negate(a)",
    compareTo: "BigInteger.compareTo(a, b)",
    parseInt: "BigInteger.parseInt(a, b)",
    toString: "a.toString(b)",
    setup: undefined
  },
  Object.assign({}, NumberInteger, {
    url: "data:application/javascript,%3B",
    source: "data:application/javascript,%3B",
  }),
  Object.assign({}, JavaBigInteger, {
    npm: "bignumber-petero",
    url: "https://github.com/peteroupc/BigNumber",
    source: "https://rawgit.com/peteroupc/BigNumber/master/BigInteger.js",
    parseInt: "BigInteger.fromRadixString(a, b)",
    toString: "a.toRadixString(b)"
  }),
  Object.assign({}, NodeBigInteger, {
    url: "https://github.com/indutny/bn.js",
    source: "https://rawgit.com/indutny/bn.js/master/lib/bn.js",
    pow: "BigInteger.pow(a, b)",
    setup: function () {
      self.BigInteger = self.module.exports;
      self.BigInteger.pow = function (x, n) {
        return x.pow(new BigInteger(n.toString(), 10));
      };
    }
  }),
  Object.assign({}, NodeBigInteger, {
    url: "https://github.com/dankogai/js-math-bigint",
    source: "https://rawgit.com/dankogai/js-math-bigint/master/bigint.js",
    parseInt: "Math.BigInt.parseInt(a, b)",
    toString: "a.toStringBase(b)",
    setup: function () {
      Math.BigInt.parseInt = function (string, radix) {
        radix = radix == undefined ? 10 : radix;
        string = string.replace(/^(\-?)0*/, "$1");
        string = string === "-" || string === "" ? "0" : string;
        var prefix = "";
        if (radix === 16) {
          prefix = "0x";
        }
        if (radix === 8) {
          prefix = "0o";
        }
        if (radix === 2) {
          prefix = "0b";
        }
        if (prefix !== "") {
          string = string.replace(/^(\-)?/, "$1" + prefix);
        }
        return self.bigint(string);
      };
    }
  }),
  Object.assign({}, NodeBigInteger, {
    url: "https://github.com/defunctzombie/int",
    source: "https://raw.githubusercontent.com/defunctzombie/int/master/int.js",
    parseInt: "new Int(a, b)",
    pow: "a.pow2(b)"
  }),
  Object.assign({}, JavaBigInteger, {
    url: "https://github.com/dtrebbien/BigDecimal.js",
    source: "https://rawgit.com/dtrebbien/BigDecimal.js/master/build/BigDecimal-all-last.js",
    parseInt: "(b === 10 ? new BigDecimal(a) : new BigDecimal(\"0\"))",
    pow: "a.pow(new BigDecimal(b.toString()))",
    setup: function () {
      var BigDecimal = self.BigDecimal;
      var divideFunction = BigDecimal.prototype.divide;
      var mc = new MathContext(0, MathContext.prototype.PLAIN, false, BigDecimal.ROUND_DOWN);
      BigDecimal.prototype.divide = function (x) {
        return divideFunction.call(this, x, mc);
      };
    }
  }),
  Object.assign({}, JavaBigInteger, {
    url: "https://github.com/iriscouch/bigdecimal.js",
    source: "http://jhs.iriscouch.com/demo/_design/bigdecimal/bigdecimal.js"
  }),
  Object.assign({}, JavaBigInteger, {
    url: "http://ofmind.net/doc/hapint",
    source: "http://ofmind.net/script/hapint/hapint.es",
    parseInt: "new self.Math.BigInt(a, b)",
  })
];

if (this.window != undefined && this.window.opera != undefined) {
  libs = libs.filter(function (x) {
    return x.url !== "https://github.com/node-modules/node-biginteger";
  });
}

var i = -1;
while (++i < libs.length) {
  if (libs[i].url.indexOf("data:") === -1) {
    libs[i].src = "./libs/" + libs[i].url.replace(/[^a-zA-Z0-9]/g, "_") + ".js";
  } else {
    libs[i].src = libs[i].url;
  }
}

if (typeof self === "undefined") {
  libs.forEach(function (x, index) {
    setTimeout(function () {
      var https = require("https");
      var http = require("http");
      var fs = require("fs");
      var fileData = "";
      var sources = x.source.split(" ");
      var i = 0;
      var download = function () {
        if (i < sources.length) {
          var source = sources[i];
          i += 1;
          console.log(x.source);
          
          if (source.slice(0, 5) === "data:") {
            download();
          } else {
            (source.slice(0, 6) === "https:" ? https : http).get(source, function (response) {
              if (response.statusCode === 200) {
                response.on("data", function (chunk) {
                  fileData += chunk;
                });
                response.on("end", function () {
                  download();
                });
              }
            }).on("error", function (error) {
              console.log(error);
            });
          }
        } else {
          var fs = require("fs");
          fs.writeFile(x.src, fileData, function (error) {
            if (error != undefined) {
              return console.log(error);
            }
          }); 
        }
      };
      download();

    }, index * 300);
  });
} else {
  // will not work with jtobey
  //this.require = function () {
  //  return {};
  //};
  //iriscouch
  if (this.window == undefined) {
    this.window = this;
  }
  this.module = this;
}

this.libs = libs;
