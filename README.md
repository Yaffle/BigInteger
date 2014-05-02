BigInteger
==========

Yet another BigInteger class in JavaScript

The API is a subset of the java.math.BigInteger:

```javascript
/*

constructor:
function BigInteger(s:string, radix:number = 10) { ... }

methods:
BigInteger.prototype.compareTo = function (x:BigInteger):number { ... };
BigInteger.prototype.negate = function ():BigInteger { ... };
BigInteger.prototype.add = function (x:BigInteger):BigInteger { ... };
BigInteger.prototype.subtract = function (x:BigInteger):BigInteger { ... };
BigInteger.prototype.multiply = function (x:BigInteger):BigInteger { ... };
BigInteger.prototype.divide = function (x:BigInteger):BigInteger { ... };
BigInteger.prototype.remainder = function (x:BigInteger):BigInteger { ... };
BigInteger.prototype.toString = function (radix:number = 10):string { ... };

constants:
BigInteger.ZERO = new BigInteger("0");
BigInteger.ONE = new BigInteger("1");

*/

function factorial(n) {
  var result = BigInteger.ONE;
  var i = 0;
  while (++i <= n) {
    result = result.multiply(new BigInteger(String(i)));
  }
  return result;
}
console.log(factorial(30).toString());

```

Other implementations with Java-like API:
 1. http://www-cs-students.stanford.edu/~tjw/jsbn/
 2. https://github.com/silentmatt/javascript-biginteger
 3. https://github.com/iriscouch/bigdecimal.js
 4. https://github.com/dtrebbien/BigDecimal.js
