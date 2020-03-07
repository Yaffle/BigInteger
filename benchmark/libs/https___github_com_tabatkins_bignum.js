Math.MAX_INT = Math.pow(2,53);
function Z(num, base) {
	if(!(this instanceof Z)) return new Z(num, base);
	if(base === undefined) base = num.base || Z.defaultBase;
	this.base = base;
	this.sign = 1;
	this.digits = [];
	if(!num) return this;

	if(typeof num == "number" || num instanceof Number) {
		return Z._fromNum(num, this);
	} else if(typeof num == "string" || num instanceof String) {
		return Z._fromString(num, base, this);
	} else if(num instanceof Array) {
		return Z._fromArray(num, base);
	} else if(num instanceof Z) {
		this.digits = num.digits.slice();
		this.sign = num.sign;
		return this._normalize();
	} else {
		throw TypeError("Can't understand type of first argument.");
	}
}
Z.of = function(num) {
	return new Z(num);
}
Z.lift = function(num) {
	if(num instanceof Z) return num;
	return new Z(num);
}
Z._fromNum = function(num, z) {
	if(num < 0) {
		num *= -1;
		z.sign = -1;
	}
	if(num < Z.innerBase) {
		z.digits = [num];
		return z;
	} else if(num < Math.MAX_INT) {
		z.digits = [];
		while(num > 0) {
			z.digits.push(num % Z.innerBase);
			num = Math.floor(num / Z.innerBase);
		}
		return z;
	}
	throw TypeError("Number is too large to reliably generate a Z from.");
}
Z._fromString = function(num, base, z) {
	var sign = 1;
	if(num[0] == "-") {
		num = num.slice(1);
		sign = -1;
	}
	var digits = num.split('').map(function(x){
		var digit = parseInt(x,base);
		if(Number.isNaN(digit))
			throw TypeError('"'+num+'" is not a base '+base+' number.');
		return digit;
	});
	return Z._fromArray(digits, base, sign);
}
Z._fromArray = function(num, base, sign) {
	// Put the digits in LSD order.
	var digits = num.slice().reverse();
	// First, collect input digits together into a larger base,
	// as large as I can get without overshooting innerBase,
	// for better efficiency (less steps later).
	// Then, just use Z math to do the conversion for me;
	// nothing particularly clever going on here.
	var size = Math.floor(Math.log(Z.innerBase) / Math.log(base));
	var bigDigits = Math.ceil(digits.length / size);
	var pieces = [];
	for(var i = 0; i < bigDigits; i++) {
		var offset = i*size;
		var sum = 0;
		for(var j = 0; j < size; j++) {
			sum += (digits[offset+j]||0) * Math.pow(base, j);
		}
		pieces.push(Z(sum).mul(Z(base).pow(offset)));
	}
	var result = pieces.reduce(Z.add, Z(0));
	result.sign = sign;
	return result;
}
Z._fromDigits = function(digits) {
	// This function does nothing intelligent.
	// It assumes that the digit array is in innerBase already.
	var result = new Z(0);
	result.digits = digits;
	return result;
}
Z.innerBase = Math.pow(2, 25);
Z.defaultBase = 10;
Object.defineProperty(Z.prototype, "length", {
	get: function() { return this.digits.length; }
});
Z.length = function(a) {
	return Z.lift(a).length;
}
Object.defineProperty(Z.prototype, "sign", {
	get: function() {
		if(this.digits.length == 0)
			return 0;
		return this._sign;
	},
	set: function(val) {
		if(val < 0)
			this._sign = -1;
		else
			this._sign = 1;
		return val;
	}
});
Z.sign = function(a) {
	if(a instanceof Number || typeof a == "number") {
		if(a < 0) return -1;
		if(a > 0) return 1;
		return 0;
	}
	return Z.lift(a).sign;
}
Z.prototype.add = function(that) {
	// Fath-path special cases.
	if(Z.isZero(that)) return this;
	if(this.isZero()) return this.adopt(that);
	var digit;
	if(digit = Z._singleDigit(that, "allow-negative")) {
		if(this.sign == 1) this.digits[0] += digit;
		else this.digits[0] -= digit;
		if(this.digits[0] < 0 || this.digits[0] >= Z.innerBase) this._normalize();
		return this;
	}
	return this._add(Z.lift(that));
}
Z.prototype._add = function(that) {
	// Expects that to be a Z.
	// Non-destructive; this is just the shared slowpath for add/sub.
	var thisSign = this.sign;
	var thatSign = that.sign;
	var len = Math.max(this.digits.length, that.digits.length);
	if(thisSign == thatSign) {
		for(var i = 0; i < len; i++) {
			this.digits[i] = (this.digits[i]||0) + (that.digits[i]||0);
		}
		return this._normalize();
	}
	this.sign = 1;
	that.sign = 1;
	if(this.ge(that)) {
		for(var i = 0; i < len; i++) {
			this.digits[i] = (this.digits[i]||0) - (that.digits[i]||0);
		}
		this.sign = thisSign;
	} else {
		for(var i = 0; i < len; i++) {
			this.digits[i] = (that.digits[i]||0) - (this.digits[i]||0);
		}
		this.sign = thatSign;
	}
	that.sign = thatSign;
	return this._normalize();
}
Z.add = function(a,b) {
	return Z(a).add(b);
}
Z.prototype.sub = function(that) {
	// Fast-path special cases.
	if(Z.isZero(that)) return this;
	if(this.isZero()) return this.adopt(that).negate();
	var digit;
	if(digit = Z._singleDigit(that, "allow-negative")) {
		if(this.sign == 1) this.digits[0] -= digit;
		else this.digits[0] += digit;
		if(this.digits[0] < 0 || this.digits[0] >= Z.innerBase) this._normalize();
		return this;
	}
	// General case
	that = Z.lift(that).negate()
	this._add(that);
	that.negate(); // Restore original sign of that.
	return this;
}
Z.sub = function(a,b) {
	return Z(a).sub(b);
}
Z.prototype._normalize = function() {
	// Put every digit back into the range [0, 2^25)
	var carry = 0;
	for(var i = 0; i < this.length; i++) {
		var digit = this.digits[i] + carry;
		carry = Math.floor(digit / Z.innerBase);
		this.digits[i] = (digit % Z.innerBase + Z.innerBase) % Z.innerBase;
	}
	// If final carry is negative, entire number was negative.
	if(carry < 0) {
		this.sign *= -1;
		carry = -carry - 1;
		for(var i = 0; i < this.digits.length; i++)
			this.digits[i] = Z.innerBase - this.digits[i] + (i == 0 ? 0 : -1);
	}
	// If there's any final carry, add more digits.
	while(carry > 0) {
		this.digits.push(carry % Z.innerBase);
		carry = Math.floor(carry / Z.innerBase);
	}
	// Drop any leading zeros.
	for(var i = this.digits.length-1; i>=0; i--) {
		if(this.digits[i] === 0)
			this.digits.pop();
		else
			break;
	}
	return this;
}
Z.prototype.negate = function() {
	this.sign *= -1;
	return this;
}
Z.negate = function(a) { 
	return Z(a).negate();
}
Z.prototype.mul = function(that) {
	// Fast-path special cases.
	if(this.isZero()) return this;
	if(Z.isZero(that)) { this.digits = []; return this; }
	var thisDigit, thatDigit;
	if(thatDigit = Z._singleDigit(that, "allow-negative")) {
		for(var i = 0; i < this.digits.length; i++)
			this.digits[i] *= thatDigit;
		return this._normalize();
	}
	// General case.
	that = Z.lift(that);
	var answerSign = this.sign * that.sign;
	var thisLength = this.digits.length;
	var thatLength = that.digits.length;
	var karatsubaBound = 25; // Experimentally determined, but could still be +- 5 or so.
	if(thisLength < karatsubaBound || thatLength < karatsubaBound) {
		var thisDigits = this.digits.slice();
		// Preload this with first multiplication.
		var thatDigit = that.digits[0];
		for(var i = 0; i < thisLength; i++)
			this.digits[i] *= thatDigit;
		// Manually push multiplied digits from thisClone directly into this, shifted appropriately.
		for(var thatIndex = 1; thatIndex < thatLength; thatIndex++) {
			var thatDigit = that.digits[thatIndex];
			for(var thisIndex = 0; thisIndex < thisLength; thisIndex++) {
				this.digits[thisIndex+thatIndex] = (this.digits[thisIndex+thatIndex]||0) + thisDigits[thisIndex] * thatDigit;
			}
			// I have enough wiggle room that 6 or 7 additions can be done without normalizing.
			if(thatIndex%6 == 0) this._normalize();
		}
	} else {
		// Karatsuba algorithm
		var chunkLength = Math.ceil(thisLength > thatLength ? thisLength/2 : thatLength/2);
		var a2 = Z._fromDigits(this.digits.slice(0, chunkLength));
		var a1 = Z._fromDigits(this.digits.slice(chunkLength));
		var b2 = Z._fromDigits(that.digits.slice(0, chunkLength));
		var b1 = Z._fromDigits(that.digits.slice(chunkLength));
		var z0 = Z.mul(a1, b1);
		var z2 = Z.mul(a2, b2);
		var z1 = a1.add(a2).mul(b1.add(b2)).sub(z0).sub(z2);
		var result = z0._shift(chunkLength*2).add(z1._shift(chunkLength)).add(z2);
		this.digits = result.digits;
	}
	this.sign = answerSign;
	return this;
}
Z.prototype._shift = function(digits) {
	if(this.digits.length == 0) return this;
	this.digits.reverse();
	for(var i = 0; i < digits; i++)
		this.digits.push(0);
	this.digits.reverse();
	return this;
}
Z.mul = function(a,b) {
	return Z(a).mul(b);
}
Z.prototype.pow = function(exp) {
	if(Z.isZero(exp)) return this.adopt(1);
	if(this.isZero()) return this; // 0^n = 0 (Except 0^0=1, caught by previous line.)
	expDigit = Z.toNum(exp);
	if(expDigit == 1) return this;
	if(expDigit == 2) return this.square();
	var digit;
	if(expDigit && (digit = this._singleDigit())) {
		if(digit == 1) return this; // 1^n = 1
		// Power of 2 fast-paths
		for(var i = 1; i < 25; i++) {
			if(digit == Math.pow(2,i) && expDigit*i <= Math.MAX_INT) return this.adopt(Z._pow2(expDigit*i));
		}
		// Computable within JS num limits (answer is less than 2^53)
		if(	(digit == 3 && expDigit <= 33) ||
			(digit == 5 && expDigit <= 22) ||
			(digit == 6 && expDigit <= 20) ||
			(digit == 7 && expDigit <= 18) ||
			(digit == 9 && expDigit <= 16) ||
			(digit <= 11 && expDigit <= 15) ||
			(digit <= 13 && expDigit <= 14) ||
			(digit <= 16 && expDigit <= 13) ||
			(digit <= 21 && expDigit <= 12) ||
			(digit <= 28 && expDigit <= 11) ||
			(digit <= 39 && expDigit <= 10) ||
			(digit <= 59 && expDigit <= 9) ||
			(digit <= 98 && expDigit <= 8) ||
			(digit <= 190 && expDigit <= 7) ||
			(digit <= 456 && expDigit <= 6) ||
			(digit <= 1552 && expDigit <= 5) ||
			(digit <= 9741 && expDigit <= 4) ||
			(digit <= 208063 && expDigit <= 3))
			return this.adopt(Math.pow(digit, expDigit));
		// Otherwise, fall through to the slow path!
	}
	var originalBase = this.clone();
	var bitPattern = Z.digitsInBase(exp, 2);
	for(var i = 1; i < bitPattern.length; i++) {
		this.square();
		if(bitPattern[i] == 1) this.mul(originalBase);
	}
	return this;
}
Z.pow = function(a,b) {
	return Z(a).pow(b);
}
Z._pow2 = function(exp) {
	// Quick 2^n - this assumes that the innerBase is a power of 2 (specifically, 2^25).
	var n = Z(0);
	while(exp >= 25) {
		n.digits.push(0);
		exp -= 25; // innerBase exponent
	}
	n.digits.push(Math.pow(2, exp));
	return n;
}
Z.prototype.square = function() {
	if(this.isZero()) return this;
	this.sign = 1;  // Squaring always gives a positive number.
	var digit;
	if(digit = this._singleDigit()) {
		this.digits[0] *= this.digits[0];
		if(this.digits[0] >= Z.innerBase) this._normalize();
		return this;
	}
	if(this.digits.length < 10) {
		var self = this;
		var result = self.digits.map(function(d, i) {
			var digits = self.digits.map(function(d2){return d*d2;}).reverse();
			for(;i > 0;i--) digits.push(0);
			return Z._fromDigits(digits.reverse());
		}).reduce(Z.add, Z(0));
		this.digits = result.digits;
		return this;
	}
	var chunkLength = Math.ceil(this.digits.length/2);
	var high = Z._fromDigits(this.digits.slice(chunkLength));
	this.digits.length = chunkLength; // truncate - one less copy!
	var low = this;
	var z0 = Z.square(high);
	var z2 = Z.square(low);
	var z1 = high.add(low).square().sub(z0).sub(z2);
	var result = z0._shift(chunkLength*2).add(z1._shift(chunkLength)).add(z2);
	this.digits = result.digits;
	return this;
}
Z.square = function(a) {
	return Z(a).square();
}
Z.prototype.powmod = function(exponent, modulus) {
	if(Z.isZero(modulus)) throw "Division by 0 is not allowed.";
	if(Z.isZero(exponent)) return this.adopt(1);
	if(this.isZero()) return this;
	if(Z.toNum(exponent) == 1) return this.mod(modulus);
	var digit;
	if(digit = Z._singleDigit(modulus)) {
		var base = this.mod(digit).digits[0];
		var accum = base;
		var bitPattern = Z.digitsInBase(exponent, 2);
		for(var i = 1; i < bitPattern.length; i++) {
			accum = accum * accum % digit;
			if(bitPattern[i] == 1) accum = accum * base % digit;
		}
		return this.adopt(accum);
	}
	var base = this.mod(modulus).clone();
	var bitPattern = Z.digitsInBase(exponent, 2);
	for(var i = 1; i < bitPattern.length; i++) {
		this.square().mod(modulus);
		if(bitPattern[i] == 1) this.mul(base).mod(modulus);
	}
	return this;
}
Z.powmod = function(a,b,c) {
	return Z(a).powmod(b,c);
}
Z.prototype.divmod = function(divisor, modOrRem="rem") {
	if(Z.isZero(divisor)) throw "Division by 0 is not allowed.";
	if(this.isZero()) return [this, Z(0)];
	if(Z._singleDigit(divisor, "allow-negative")) {
		divisor = Z._singleDigit(divisor, "allow-negative");
		if(this._singleDigit("allow-negative")) {
			var dividend = this._singleDigit("allow-negative");
			if(modOrRem == "rem") return [this.adopt(Math.trunc(dividend/divisor)), Z(dividend % divisor)];
			else return [this.adopt(Math.floor(dividend/divisor)), Z(((dividend % divisor)+divisor)%divisor)];
		}
		var mod = 0;
		for(var i = this.length-1; i >= 0; i--) {
			var digit = this.digits[i] + mod * Z.innerBase;
			mod = digit % divisor;
			this.digits[i] = Math.floor(digit / divisor);
		}
		if(mod < 0 && remainderPositive == "positive") mod += divisor;
		return [this._normalize(), Z(mod)];
	} else {
		divisor = Z.lift(divisor);
		remainder = new Z(0);
		for(var i = this.digits.length -1; i >= 0; i--) {
			var digit = this.digits[i];
			if (digit !== 0 || !remainder.isZero()) {
				remainder.digits.unshift(digit);
			}
			if(remainder.lt(divisor)) {
				// Fast-path, since this'll be common and it's slow to find via binary-search.
				var factor = 0;
			} else {
				var factor = Z._divmodFindFactor(divisor, remainder, 1, Z.innerBase-1);
			}
			this.digits[i] = factor;
			remainder.sub(Z(factor).mul(divisor)); // replace with mod later
		}
		this._normalize();
		remainder.sign = this.sign;
		this.sign *= divisor.sign;
		if(remainder.isNeg() && remainderPositive == "positive") remainder.add(divisor);
		return [this._normalize(), remainder];
	}
}
Z._divmodFindFactor = function(factor1, product, low, high) {
	// Binary search to find largest n that satisfies `factor1 * n <= product`
	while(true) {
		var n = Math.ceil((low+high)/2);
		var candidateProduct = Z.mul(factor1, n);
		if(candidateProduct.gt(product)) {
			high = n-1; continue;
		} else if(Z.add(candidateProduct, factor1).gt(product)) {
			return n;
		} else {
			low = n+1; continue;
		}
	}
}
Z.divmod = function(a,b) {
	return Z(a).divmod(b);
}
Z.prototype.div = function(divisor) {
	return this.divmod(divisor)[0];
}
Z.div = function(a,b) {
	return Z(a).divmod(b)[0];
}
Z.prototype.mod = function(modulus, remainderPositive) {
	if(Z.isZero(modulus)) throw "Division by 0 is not allowed.";
	if(this.isZero()) return this;
	var digit;
	if(digit = Z._singleDigit(modulus)) {
		if(this.toNum()) return this.adopt(this.toNum() % digit);
		accumulatedBaseMod = 1;
		var sum = 0;
		for(var i = 0; i < this.digits.length; i++) {
			sum = (this.digits[i]%digit * accumulatedBaseMod + sum) % digit;
			accumulatedBaseMod = accumulatedBaseMod * Z.innerBase % digit;
		}
		this.digits[0] = sum;
		this.digits.length = 1;
		if(remainderPositive == "positive")
			this.sign = 1;
		else if (this.sign == -1)
			this.digits[0] = digit - this.digits[0];
		return this;
	}
	// For now, just use the full divmod algo.
	// Complexity of multi-digit mod is high enough to not be worth implementing yet.
	return this.adopt(this.divmod(modulus, remainderPositive)[1]);
}
Z.mod = function(a,b,remainderPositive) {
	return Z(a).mod(b, remainderPositive);
}
Z.fact = function(num) {
	num = Z.toNum(num);
	if(num === false) throw "Keep your factorials less than Math.MAX_INT, please."
	var product = Z(1);
	for(var i = 2; i <= num; i++)
		product.mul(i);
	return product;
}
Z.prototype.factorize = function() {
	let digit;
	if(digit = this._singleDigit()) {
		return Primes.factorize(digit);
	}
	let factors = new Map();
	let num = this.clone();
	let i = 0;
	for(let p of Primes.primes(Z)) {
		let count = Z(0);
		while(Z.mod(num, p).isZero()) {
			count.add(1);
			num.div(p);
		}
		if(count.isPos())
			factors.set(Z(p), count);
		if(num._singleDigit() === 1)
			return factors;
	}
}
Z.prototype.lt = function(that) {
	that = new Z(that);
	if(this.sign != that.sign) return this.sign < that.sign;
	if(this.digits.length != that.digits.length) {
		if(this.sign == 1) return this.digits.length < that.digits.length;
		else return this.digits.length > that.digits.length;
	}
	for(var i = this.length - 1; i >= 0; i--) {
		if(this.digits[i] < that.digits[i])
			return true;
		if(this.digits[i] > that.digits[i])
			return false;
	}
	return false;
}
Z.prototype.eq = function(that) {
	that = new Z(that);
	if(this.sign != that.sign) return false;
	if(this.digits.length != that.digits.length) return false;
	for(var i = 0; i < this.length; i++) {
		if(this.digits[i] != that.digits[i])
			return false;
	}
	return true;
}
Z.prototype.ne = function(that) { return !this.eq(that); }
Z.prototype.ge = function(that) { return !this.lt(that); }
Z.prototype.le = function(that) { return this.eq(that) || this.lt(that); }
Z.prototype.gt = function(that) { return !this.le(that); }
Z.lt = function(a,b) { return Z.lift(a).lt(b); }
Z.le = function(a,b) { return Z.lift(a).le(b); }
Z.gt = function(a,b) { return Z.lift(a).gt(b); }
Z.ge = function(a,b) { return Z.lift(a).ge(b); }
Z.eq = function(a,b) { return Z.lift(a).eq(b); }
Z.ne = function(a,b) { return Z.lift(a).ne(b); }
Z.prototype.isZero = function() {
	for(var i = 0; i < this.digits.length; i++)
		if(this.digits[i] != 0) return false;
	return true;
}
Z.isZero = function(a) {
	if(a instanceof Number || typeof a == "number") return a == 0;
	return Z.lift(a).isZero();
}
Z.prototype._singleDigit = function(allowNegative) {
	// Many functions can be optimized for single-digit Zs.
	// If the Z is single-digit, returns that digit. This is a truthy value.
	// Note, this returns false for 0; use isZero() instead.
	if(this.digits.length == 1) {
		if(allowNegative === "allow-negative") return this.digits[0] * this.sign;
		if(this.sign == 1) return this.digits[0];
	}
	return false;
}
Z._singleDigit = function(a, allowNegative) {
	if((a instanceof Number || typeof a == "number") && a < Z.innerBase) {
		if(a > 0) return a;	
		if(allowNegative == "allow-negative" && a > -Z.innerBase) return a;
	} 
	return Z.lift(a)._singleDigit();
}
Z.prototype.toNum = function() {
	// Converts the Z into a JS num, if possible; otherwise returns false.
	if(this.isZero()) return 0;
	if(this._singleDigit("allow-negative")) return this._singleDigit("allow-negative");
	if(this.digits.length == 2) return (this.digits[0] + this.digits[1]*Z.innerBase)*this.sign;
	if(this.digits.length == 3 && this.digits[3] < 8)
		return (this.digits[0] + this.digits[1]*Z.innerBase + this.digits[2]*Z.innerBase*Z.innerBase)*this.sign;
	return false;
}
Z.toNum = function(a) {
	if((a instanceof Number || typeof a == "number") && a >= -Math.MAX_INT && a <= Math.MAX_INT) return a;
	return Z.lift(a).toNum();
}
Z.prototype.isPos = function() {
	return this.sign == 1;
}
Z.isPos = function(a) {
	if(a instanceof Number || typeof a == "number") return a > 0;
	return Z.lift(a).isPos();
}
Z.prototype.isNeg = function() {
	return this.sign == -1;
}
Z.isNeg = function(a) {
	if(a instanceof Number || typeof a == "number") return a < 0;
	return Z.lift(a).isNeg();
}
Z.prototype.clone = function() {
	return new Z(this);
}
Z.clone = Z.of;
Z.prototype.adopt = function(that) {
	// Mutates this to have the same value as that.
	return Z.call(this, Z.lift(that));
}
Z.adopt = function(a,b) {
	return Z.lift(a).adopt(b);
}
Z.prototype.digitsInBase = function(base) {
	base = Math.floor(base || this.base);
	var num = new Z(this);
	var digits = [];
	do {
		var result = num.divmod(base);
		digits.push(result[1]);
		num = result[0];
	} while(!num.isZero());
	return digits.reverse();
}
Z.digitsInBase = function(a, base) {
	return Z.lift(a).digitsInBase(base);
}
Z.prototype.toString = function(base) {
	base = Math.floor(base || this.base);
	if(base < 2 || base > 36)
		throw TypeError("Can only toString a Z when 2 <= base <= 36.");
	var s;
	if(s = this._singleDigit("allow-negative")) return s.toString(base);
	var result = this.digitsInBase(base).map(function(x){return x.toNum().toString(base);}).join('');
	if(this.sign == -1)
		result = "-" + result;
	return result;
}
Z.toString = function(a, base) {
	if(a instanceof Number || typeof a == "number") return a.toString(base);
	return Z.lift(a).toString(base);
}
Z.prototype.valueOf = function() {
	var val = this.toNum();
	if(val !== false) return val;
	return NaN;
}
Z.prototype.__traceToString__ = function() { return "Z("+(this.sign<0?'-':'+')+'['+this.digits.reverse()+"])"; }
