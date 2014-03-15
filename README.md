BigInteger
==========

Yet another BigInteger class in JavaScript

The API is a subset of the java.math.BigInteger:

```javascript
/*
constructor:
BigInteger(s:string, radix:number = 10)

methods:
BigInteger.ptototype.compareTo
BigInteger.prototype.negate
BigInteger.prototype.add
BigInteger.prototype.subtract
BigInteger.prototype.multiply
BigInteger.prototype.divide
BigInteger.ptototype.remainder
BigInteger.prototype.toString(radix:number = 10)

constants:
BigInteger.ZERO
BigInteger.ONE
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
 2. https://github.com/iriscouch/bigdecimal.js
 3. https://github.com/silentmatt/javascript-biginteger
