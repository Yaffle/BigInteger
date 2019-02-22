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
The API was updated to match the API provided by https://github.com/GoogleChromeLabs/jsbi

Operation              | `BigInteger`                         | `Number`                         | `BigInt` (https://github.com/tc39/proposal-bigint)
-----------------------|--------------------------------------|----------------------------------|---------------------------------------------------
Conversion from String | `BigInteger.BigInt(string)`          | `Number(string)`                 | `BigInt(string)`
Conversion from Number | `BigInteger.BigInt(number)`          | N/A                              | `BigInt(number)`
Conversion to String   | `a.toString(radix)`                  | `a.toString(radix)`              | `a.toString(radix)`
Converstion to Number  | `a.toNumber()`                       | N/A                              | `Number(bigint)`
Addition               | `BigInteger.add(a, b)`               | `a + b`                          | `a + b`
Subtraction            | `BigInteger.subtract(a, b)`          | `a - b`                          | `a - b`
Multiplication         | `BigInteger.multiply(a, b)`          | `0 + a * b`                      | `a * b`
Division               | `BigInteger.divide(a, b)`            | `0 + Math.trunc(a / b)`          | `a / b`
Remainder              | `BigInteger.remainder(a, b)`         | `0 + a % b`                      | `a % b`
Exponentiatio          | `BigInteger.exponentiate(a, b)`      | `0 + a**b`                       | `a**b`
Negation               | `BigInteger.unaryMinus(a)`           | `0 - a`                          | `-a`
Comparison             | `BigInteger.equal(a, b)`             | `a === b`                        | `a === b`
...                    | `BigInteger.lessThan(a, b)`          | `a < b`                          | `a < b`
...                    | `BigInteger.greaterThan(a, b)`       | `a > b`                          | `a > b`

Example
=======
```javascript

var factorial = function (n) {
  var result = BigInteger.BigInt(1);
  var i = 0;
  while (++i <= n) {
    result = BigInteger.multiply(result, BigInteger.BigInt(i));
  }
  return result;
};

console.log(factorial(30).toString(10));

```

Other pure JavaScript implementations:
 1. <http://www.leemon.com/crypto/BigInt.html>
 2. <https://github.com/jtobey/javascript-bignum>
 3. <https://github.com/node-modules/node-biginteger>
 4. <https://github.com/vukicevic/crunch>
 5. <https://github.com/MikeMcl/bignumber.js>
 6. <https://github.com/peterolson/BigInteger.js>
 7. <https://github.com/silentmatt/javascript-biginteger>
 8. <http://www-cs-students.stanford.edu/~tjw/jsbn/>
 9. <https://github.com/Yaffle/BigInteger>
 10. <https://github.com/peteroupc/BigNumber>
 11. <https://github.com/indutny/bn.js>
 12. <https://github.com/dankogai/js-math-bigint>
 13. <https://github.com/defunctzombie/int>
 14. <https://github.com/dtrebbien/BigDecimal.js>
 15. <https://github.com/iriscouch/bigdecimal.js>
 16. <http://ofmind.net/doc/hapint>
 17. <https://github.com/GoogleChromeLabs/jsbi>

Benchmark:
  <http://yaffle.github.io/BigInteger/benchmark/>
