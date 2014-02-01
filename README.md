BigInteger
==========

Yet another BigInteger in javascript

The API is a subset of the java.math.BigInteger:

constructor:
BigInteger(string: s, radix: number = 10)

methods:
BigInteger.ptototype.compareTo
BigInteger.prototype.negate
BigInteger.prototype.add
BigInteger.prototype.subtract
BigInteger.prototype.multiply
BigInteger.prototype.divide
BigInteger.ptototype.remainder
BigInteger.prototype.toString

constants:
BigInteger.ZERO;
BigInteger.ONE;

```javascript
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
