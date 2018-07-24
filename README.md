BigInteger
==========

Yet another BigInteger class in JavaScript
This library performs arithmetic operations on integers of arbitrary size.

To use it from a web browser:
```
<script src="BigInteger.js"></script>
```
To use it from the node.js:
```
npm install Yaffle/BigInteger
```
Then:
```
var BigInteger = require("js-big-integer").BigInteger;
```

The API is terrible, but small integers are stored as primitive numbers, so operations on small integers are faster.

  `BigInteger`                        | `Number`                         | `BigInt` (https://github.com/tc39/proposal-bigint)
--------------------------------------|----------------------------------|----------------------------------------------------
 `BigInteger.parseInt(string, radix)` | `Number.parseInt(string, radix)` | `BigInt(radix === 16 ? "0x" + string : string)`
 `BigInteger.compareTo(a, b)`         | `Math.sign(a - b)`               | `a < b ? -1 : (b < a ? +1 : 0)`
 `BigInteger.negate(a)`               | `0 - a`                          | `-a`
 `BigInteger.add(a, b)`               | `a + b`                          | `a + b`
 `BigInteger.subtract(a, b)`          | `a - b`                          | `a - b`
 `BigInteger.multiply(a, b)`          | `0 + a * b`                      | `a * b`
 `BigInteger.divide(a, b)`            | `0 + Math.trunc(a / b)`          | `a / b`
 `BigInteger.remainder(a, b)`         | `0 + a % b`                      | `a % b`
 `a.toString(radix)`                  | `a.toString(radix)`              | `a.toString(radix)`

Example
=======
```javascript

var factorial = function (n) {
  var result = BigInteger.parseInt("1", 10);
  var i = 0;
  while (++i <= n) {
    result = BigInteger.multiply(result, BigInteger.parseInt(i.toString(), 10));
  }
  return result;
};

console.log(factorial(30).toString(10));

```

Other pure JavaScript implementations:
 1. http://www.leemon.com/crypto/BigInt.html
 2. https://github.com/jtobey/javascript-bignum
 3. https://github.com/node-modules/node-biginteger
 4. https://github.com/vukicevic/crunch
 5. https://github.com/MikeMcl/bignumber.js
 6. https://github.com/peterolson/BigInteger.js
 7. https://github.com/silentmatt/javascript-biginteger
 8. http://www-cs-students.stanford.edu/~tjw/jsbn/
 9. https://github.com/Yaffle/BigInteger
 10. https://github.com/peteroupc/BigNumber
 11. https://github.com/indutny/bn.js
 12. https://github.com/dankogai/js-math-bigint
 13. https://github.com/defunctzombie/int
 14. https://github.com/dtrebbien/BigDecimal.js
 15. https://github.com/iriscouch/bigdecimal.js
 16. http://ofmind.net/doc/hapint

Benchmark:
  http://yaffle.github.io/BigInteger/benchmark/
