BigInteger
==========

Yet another BigInteger class in JavaScript
This library performs arithmetic operations on integers of arbitrary size.

To use it from browser:t
```
<script src="BigInteger.js"></script>
```

To use it from node.js:
```
npm install js-big-integer
```
Then:
```
var BigInteger = require("BigInteger").BigInteger;
```

The API is terrible, but small integers are stored as primitive numbers, so operations on small integers are faster.

```javascript
// `BigInteger.parseInt` converts the string representation with specified radix into an integer
var a = BigInteger.parseInt("42", 13);
var b = BigInteger.parseInt("CAFE", 16);
var c = 0;

c = a[BigInteger.compareTo](b) < 0; // c = a < b;
c = a[BigInteger.compareTo](b) === 0; // c = a === b;
c = a[BigInteger.compareTo](b) > 0; // c = a > b;

a = a[BigInteger.negate](); // a = 0 - a;

a = a[BigInteger.add](b); // a = a + b;

a = a[BigInteger.subtract](b); // a = a - b;

a = a[BigInteger.multiply](b); // a = a * b;

a = a[BigInteger.divide](b); // a = Math.trunc(a / b);

a = a[BigInteger.remainder](b); // a = a % b;

// `BigInteger.prototype[BigInteger.toString]` converts the integer into a string representation in specified radix
var s = a[BigInteger.toString](10); // s = a.toString(10);
```

Example
=======
```javascript

var factorial = function (n) {
  var result = 1;
  var i = 0;
  while (++i <= n) {
    result = result[BigInteger.multiply](i);
  }
  return result;
};

console.log(factorial(30)[BigInteger.toString]());

```

Other pure JavaScript implementations:
 1. http://www-cs-students.stanford.edu/~tjw/jsbn/
 2. https://github.com/silentmatt/javascript-biginteger
 3. https://github.com/peterolson/BigInteger.js
 4. https://github.com/iriscouch/bigdecimal.js
 5. https://github.com/dtrebbien/BigDecimal.js
 6. https://github.com/node-modules/BigInteger
 7. https://github.com/jtobey/javascript-bignum
 8. https://github.com/indutny/bn.js
 9. https://github.com/dankogai/js-math-bigint
