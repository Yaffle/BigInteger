BigInteger
==========

Yet another BigInteger class in JavaScript

```javascript
/*

factory:
BigInteger.parseInteger = function (s:string, radix:number = 10):any {...};

methods:
BigInteger.prototype[BigInteger.COMPARE_TO] = function (x:BigInteger|number):any { ... };
BigInteger.prototype[BigInteger.NEGATE] = function ():any { ... };
BigInteger.prototype[BigInteger.ADD] = function (x:BigInteger|number):any { ... };
BigInteger.prototype[BigInteger.SUBTRACT] = function (x:BigInteger|number):any { ... };
BigInteger.prototype[BigInteger.MULTIPLY] = function (x:BigInteger|number):any { ... };
BigInteger.prototype[BigInteger.DIVIDE] = function (x:BigInteger|number):any { ... };
BigInteger.prototype[BigInteger.REMAINDER] = function (x:BigInteger|number):any { ... };
BigInteger.prototype.toString = function (radix:number = 10):string { ... };

Number.prototype[BigInteger.COMPARE_TO] = function (x:BigInteger|number):any { ... };
Number.prototype[BigInteger.NEGATE] = function ():any { ... };
Number.prototype[BigInteger.ADD] = function (x:BigInteger|number):any { ... };
Number.prototype[BigInteger.SUBTRACT] = function (x:BigInteger|number):any { ... };
Number.prototype[BigInteger.MULTIPLY] = function (x:BigInteger|number):any { ... };
Number.prototype[BigInteger.DIVIDE] = function (x:BigInteger|number):any { ... };
Number.prototype[BigInteger.REMAINDER] = function (x:BigInteger|number):any { ... };

*/

function factorial(n) {
  var result = 1;
  var i = 0;
  while (++i <= n) {
    result = result[BigInteger.MULTIPLY](i);
  }
  return result;
}
console.log(factorial(30).toString());

```

Other pure JavaScript implementations with Java-like API:
 1. http://www-cs-students.stanford.edu/~tjw/jsbn/
 2. https://github.com/silentmatt/javascript-biginteger
 3. https://github.com/peterolson/BigInteger.js
 4. https://github.com/iriscouch/bigdecimal.js
 5. https://github.com/dtrebbien/BigDecimal.js
 6. https://github.com/node-modules/BigInteger

And with another API:
 1. https://github.com/indutny/bn.js
 2. https://github.com/dankogai/js-math-bigint
