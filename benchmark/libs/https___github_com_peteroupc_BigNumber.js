(function(){
/*
Written in 2013-2015 by Peter O.

Parts of the code were adapted by Peter O. from
the public-domain code from the library
CryptoPP by Wei Dai.

Any copyright is dedicated to the Public Domain.
http://creativecommons.org/publicdomain/zero/1.0/
If you like this, you should donate to Peter O.
at: http://peteroupc.github.io/

 */
if(typeof StringBuilder=="undefined"){
var StringBuilder=function(){
this.str="";
}
}
StringBuilder.prototype.append=function(ch){
if(typeof ch=="number")
 this.str+=String.fromCharCode(ch);
else
 this.str+=ch
}
StringBuilder.prototype.length=function(){
return this.str.length
}
StringBuilder.prototype.charAt=function(index){
// Get the character code, since that's what the caller expects
return this.str.charCodeAt(index)
}
StringBuilder.prototype.toString=function(){
return this.str;
}
if(typeof JSInteropFactory=="undefined"){
var JSInteropFactory={};
}
/////////////////////////////////////
// Adapted by Peter O. from CryptoPP by Wei Dai
JSInteropFactory.divideFourWordsByTwo=function(dividend, divisor){
 var t0=(dividend.lo&0xFFFF);
 var t1=(dividend.lo>>>16);
 var t2=(dividend.hi&0xFFFF);
 var t3=(dividend.hi>>>16);
 var b0=(divisor&0xFFFF);
 var b1=(divisor>>>16);
 var ret=JSInteropFactory.divideThreeWordsByTwo(t1,t2,t3,b0,b1);
 var qhigh=ret[0];
 ret=JSInteropFactory.divideThreeWordsByTwo(t0,ret[1],ret[2],b0,b1);
 var qlow=ret[0];
 return [(qlow|(qhigh<<16))>>>0,(ret[1]|(ret[2]<<16))>>>0];
}

// Adapted by Peter O. from CryptoPP by Wei Dai
JSInteropFactory.divideThreeWordsByTwo=function(a0,a1,a2,b0,b1){
  var q=0;
  if(b1==0xFFFF)
   q=a2;
  else if(b1>0)
   q=((((a1|(a2<<16))>>>0)/((b1+1)&0xFFFF))&0xFFFF)|0;
  else
   q=((((a1|(a2<<16))>>>0)/b0)&0xFFFF)|0;
  var p=(b0*q)>>>0;
  var u=(a0-(p&0xFFFF))>>>0;
  a0=(u&0xFFFF);
  u=(a1-(p>>>16)-(((0-(u>>>16)))&0xFFFF)-((b1*q)>>>0))>>>0;
  a1=(u&0xFFFF);
  a2=((a2+(u>>>16))&0xFFFF);
  while(a2!=0 || a1>b1 || (a1==b1 && a0>=b0)){
   u=(a0-b0)>>>0;
   a0=(u&0xFFFF);
   u=(a1-b1-(((0-(u>>>16)))&0xFFFF))>>>0;
   a1=(u&0xFFFF);
   a2=((a2+(u>>>16))&0xFFFF);
   q++;
   q&=0xFFFF;
  }
  return [q,a0,a1,a2]
}

JSInteropFactory.divide64By32=function(dividendLow,dividendHigh,divisor){
  var remainder=0
  var currentDividend=new ILong(dividendHigh,0);
  var result=JSInteropFactory.divideFourWordsByTwo(currentDividend,divisor);
  var quotientHigh=result[0];
  remainder=result[1];
  currentDividend=new ILong(dividendLow,remainder);
  result=JSInteropFactory.divideFourWordsByTwo(currentDividend,divisor);
  var quotientLow=result[0];
  return new ILong(quotientLow,quotientHigh);
}

/////////////////////////////////////////////
var ILong=function(lo,hi){
// Convert lo and hi to unsigned
this.lo=lo>>>0
this.hi=hi>>>0
}
ILong.prototype.signum=function(){
if((this.lo|this.hi)==0)return 0;
return ((this.hi>>>31)!=0) ? -1 : 1;
}
ILong.prototype.equals=function(other){
 return this.lo==other.lo && this.hi==other.hi
}
ILong.prototype.negate=function(){
var ret=new ILong(this.lo,this.hi);
if((this.lo|this.hi)!=0)ret._twosComplement();
return ret;
}
ILong.prototype.or=function(other){
return new ILong(this.lo|other.lo,this.hi|other.hi);
}
ILong.prototype.andInt=function(otherUnsigned){
return new ILong(this.lo&(otherUnsigned>>>0),0);
}
ILong.prototype.intValue=function(){
return this.lo|0;
}
ILong.prototype.shortValue=function(){
return (this.lo|0)&0xFFFF;
}
ILong.prototype.compareToLongAsInts=function(otherLo,otherHi){
 otherHi|=0;
 // Signed comparison of high words
 if(otherHi!=(this.hi|0)){
  return (otherHi>(this.hi|0)) ? -1 : 1;
 }
 otherLo=otherLo>>>0;
 // Unsigned comparison of low words
 if(otherLo!=this.lo){
  return (otherLo>this.lo) ? -1 : 1;
 }
 return 0;
}
ILong.prototype.compareToInt=function(other){
 other|=0;
 var otherHi=(other<0) ? -1 : 0;
 // Signed comparison of high words
 if(otherHi!=(this.hi|0)){
  return (otherHi>(this.hi|0)) ? -1 : 1;
 }
 other=other>>>0;
 // Unsigned comparison of low words
 if(other!=this.lo){
  return (other>this.lo) ? -1 : 1;
 }
 return 0;
}
ILong.prototype.equalsInt=function(other){
 if(other<0){
  return (~this.hi)==0 && this.lo==(other>>>0);
 } else {
  return this.hi==0 && this.lo==(other>>>0);
 }
}
ILong.prototype._twosComplement=function(){
 if(this.lo==0){
  this.hi=((this.hi-1)>>>0);
 }
 this.lo=((this.lo-1)>>>0);
 this.lo=(~this.lo)>>>0;
 this.hi=(~this.hi)>>>0;
}
ILong.prototype.remainderWithUnsignedDivisor=function(divisor){
 if((this.hi>>>31)!=0){
  // value is negative
  var ret=new ILong(this.lo,this.hi);
  ret._twosComplement();
  // NOTE: since divisor is unsigned, overflow is impossible
  ret=ret._remainderUnsignedDividendUnsigned(divisor);
  ret._twosComplement();
  return ret;
 } else {
  return this._remainderUnsignedDividendUnsigned(divisor);
 }
}
ILong.prototype.divideWithUnsignedDivisor=function(divisor){
 if((this.hi>>>31)!=0){
  // value is negative
  var ret=new ILong(this.lo,this.hi);
  ret._twosComplement();
  // NOTE: since divisor is unsigned, overflow is impossible
  ret=ret._divideUnsignedDividendUnsigned(divisor);
  ret._twosComplement();
  return ret;
 } else {
  return this._divideUnsignedDividendUnsigned(divisor);
 }
}

ILong.prototype._divideUnsignedDividendUnsigned=function(divisor){
 divisor|=0;
 if(divisor<0)throw new RuntimeException("value is less than 0");
 if(divisor==1)return this;
    if (this.hi==0){
    return new ILong((this.lo>>>0)/divisor,0);
    } else {
    var rem=JSInteropFactory.divide64By32(this.lo,this.hi,divisor);
    return rem;
    }
}

ILong.prototype._remainderUnsignedDividendUnsigned=function(divisor){
 divisor|=0;
 if(divisor<0)throw new RuntimeException("value is less than 0");
 if(divisor==1)return this;
    if (divisor < 0x10000 || this.hi==0)
    {
    var r=this.hi%divisor;
    r=((this.lo>>>16)|(r<<16))%divisor;
    return new ILong(
      (((this.lo&0xFFFF)|(r<<16))%divisor)&0xFFFF,
      0
    );
    } else {
    var rem=JSInteropFactory.divideFourWordsByTwo(this,divisor);
    return new ILong(rem[1],(rem[1]>>>31)==0 ? 0 : (1<<31));
    }
}

ILong.prototype.shiftLeft=function(len){
 if(len<=0)return this;
 if(len>=64){
  return JSInteropFactory.LONG_ZERO;
 } else if(len>=32){
  return new ILong(0,this.lo<<(len-32));
 } else if(this.lo==0){
  return new ILong(0,this.hi<<len);
 } else {
  var newhigh=this.hi<<len;
  var newlow=this.lo<<len;
  newhigh|=(this.lo>>>(32-len));
  return new ILong(newlow,newhigh);
 }
}
ILong.prototype.shiftRight=function(len){
 if(len<=0)return this;
 if(len>=64){
  return ((this.hi>>>31)!=0) ?
    JSInteropFactory.LONG_MAX_VALUE() :
    JSInteropFactory.LONG_MIN_VALUE();
 } else if(len>=32){
  return new ILong((this.hi>>len-32),((this.hi>>>31)!=0) ? (~0) : 0);
 } else if(this.hi==0){
  return new ILong(this.lo>>>len,0);
 } else {
  var newhigh=this.hi>>len;
  var newlow=this.lo>>>len;
  newlow|=(this.hi<<(32-len));
  return new ILong(newlow,newhigh);
 }
}
JSInteropFactory.createStringBuilder=function(param){
 return new StringBuilder();
}
JSInteropFactory.createLong=function(param){
 if(param.constructor==ILong)return param;
 return new ILong(param,(param<0) ? (~0) : 0);
}
JSInteropFactory.createLongFromInts=function(a,b){
 return new ILong(a>>>0,b>>>0);
}
JSInteropFactory.LONG_MIN_VALUE_=new ILong(0,(1<<31));
JSInteropFactory.LONG_MAX_VALUE_=new ILong(~0,~0);
JSInteropFactory.LONG_MIN_VALUE=function(){
 return JSInteropFactory.LONG_MIN_VALUE_;
}
JSInteropFactory.LONG_MAX_VALUE=function(){
 return JSInteropFactory.LONG_MAX_VALUE_;
}
JSInteropFactory.LONG_ZERO=new ILong(0,0)
var Extras={}
Extras.IntegersToDouble=function(){throw "Not implemented"}
Extras.DoubleToIntegers=function(){throw "Not implemented"}
if(typeof exports!=="undefined"){
exports.Extras=Extras;
exports.JSInteropFactory=JSInteropFactory;
exports.ILong=ILong;
exports.StringBuilder=StringBuilder;
}
var BigInteger =

function(wordCount, reg, negative) {

    this.wordCount = wordCount;
    this.words = reg;
    this.negative = negative;
};
(function(constructor,prototype){
    constructor.CountWords = function(array, n) {
        while (n != 0 && array[n - 1] == 0) {
            --n;
        }
        return (n|0);
    };
    constructor.ShiftWordsLeftByBits = function(r, rstart, n, shiftBits) {
        {
            var u, carry = 0;
            if (shiftBits != 0) {
                for (var i = 0; i < n; ++i) {
                    u = r[rstart + i];
                    r[rstart + i] = (((((((((u << (shiftBits|0))|0) | (carry & 65535)))|0)) & 65535))|0);
                    carry = (((u & 65535) >> ((16 - shiftBits)|0))|0);
                }
            }
            return carry;
        }
    };
    constructor.ShiftWordsRightByBits = function(r, rstart, n, shiftBits) {
        var u, carry = 0;
        {
            if (shiftBits != 0) {
                for (var i = n; i > 0; --i) {
                    u = r[rstart + i - 1];
                    r[rstart + i - 1] = ((((((((((u & 65535) >> (shiftBits|0)) & 65535) | (carry & 65535)))|0)) & 65535))|0);
                    carry = (((u & 65535) << ((16 - shiftBits)|0))|0);
                }
            }
            return carry;
        }
    };
    constructor.ShiftWordsRightByBitsSignExtend = function(r, rstart, n, shiftBits) {
        {
            var u, carry = ((65535 << ((16 - shiftBits)|0))|0);
            if (shiftBits != 0) {
                for (var i = n; i > 0; --i) {
                    u = r[rstart + i - 1];
                    r[rstart + i - 1] = ((((((((u & 65535) >> (shiftBits|0)) | (carry & 65535))|0)) & 65535))|0);
                    carry = (((u & 65535) << ((16 - shiftBits)|0))|0);
                }
            }
            return carry;
        }
    };
    constructor.ShiftWordsLeftByWords = function(r, rstart, n, shiftWords) {
        shiftWords = (shiftWords < n ? shiftWords : n);
        if (shiftWords != 0) {
            for (var i = n - 1; i >= shiftWords; --i) {
                r[rstart + i] = ((r[rstart + i - shiftWords]) & 65535);
            }
            for (var arrfillI = rstart; arrfillI < (rstart) + (shiftWords); arrfillI++) (r)[arrfillI] = 0;
        }
    };
    constructor.ShiftWordsRightByWordsSignExtend = function(r, rstart, n, shiftWords) {
        shiftWords = (shiftWords < n ? shiftWords : n);
        if (shiftWords != 0) {
            for (var i = 0; i + shiftWords < n; ++i) {
                r[rstart + i] = ((r[rstart + i + shiftWords]) & 65535);
            }
            rstart = rstart + (n - shiftWords);
            for (var i = 0; i < shiftWords; ++i) {
                r[rstart + i] = (65535 & 65535);
            }
        }
    };
    constructor.Compare = function(words1, astart, words2, bstart, n) {
        while ((n--) != 0) {
            var an = (words1[astart + n]) & 65535;
            var bn = (words2[bstart + n]) & 65535;
            if (an > bn) {
                return 1;
            }
            if (an < bn) {
                return -1;
            }
        }
        return 0;
    };
    constructor.CompareWithOneBiggerWords1 = function(words1, astart, words2, bstart, words1Count) {
        if (words1[astart + words1Count - 1] != 0) {
            return 1;
        }
        var w1c = words1Count;
        --w1c;
        while ((w1c--) != 0) {
            var an = (words1[astart + w1c]) & 65535;
            var bn = (words2[bstart + w1c]) & 65535;
            if (an > bn) {
                return 1;
            }
            if (an < bn) {
                return -1;
            }
        }
        return 0;
    };
    constructor.Increment = function(words1, words1Start, n, words2) {
        {
            var tmp = ((words1[words1Start]) & 65535);
            words1[words1Start] = ((tmp + words2) & 65535);
            if (((words1[words1Start]) & 65535) >= (tmp & 65535)) {
                return 0;
            }
            for (var i = 1; i < n; ++i) {
                words1[words1Start + i] = ((words1[words1Start + i] + 1) & 65535);
                if (words1[words1Start + i] != 0) {
                    return 0;
                }
            }
            return 1;
        }
    };
    constructor.Decrement = function(words1, words1Start, n, words2) {
        {
            var tmp = ((words1[words1Start]) & 65535);
            words1[words1Start] = ((tmp - words2) & 65535);
            if (((words1[words1Start]) & 65535) <= (tmp & 65535)) {
                return 0;
            }
            for (var i = 1; i < n; ++i) {
                tmp = words1[words1Start + i];
                words1[words1Start + i] = ((words1[words1Start + i] - 1) & 65535);
                if (tmp != 0) {
                    return 0;
                }
            }
            return 1;
        }
    };
    constructor.TwosComplement = function(words1, words1Start, n) {
        BigInteger.Decrement(words1, words1Start, n, 1);
        for (var i = 0; i < n; ++i) {
            words1[words1Start + i] = ((~words1[words1Start + i]) & 65535);
        }
    };
    constructor.Add = function(c, cstart, words1, astart, words2, bstart, n) {
        {
            var u;
            u = 0;
            for (var i = 0; i < n; i += 2) {
                u = ((words1[astart + i]) & 65535) + ((words2[bstart + i]) & 65535) + ((u >> 16)|0);
                c[cstart + i] = (u & 65535);
                u = ((words1[astart + i + 1]) & 65535) + ((words2[bstart + i + 1]) & 65535) + ((u >> 16)|0);
                c[cstart + i + 1] = (u & 65535);
            }
            return ((u) >>> 16);
        }
    };
    constructor.AddOneByOne = function(c, cstart, words1, astart, words2, bstart, n) {
        {
            var u;
            u = 0;
            for (var i = 0; i < n; i += 1) {
                u = ((words1[astart + i]) & 65535) + ((words2[bstart + i]) & 65535) + ((u >> 16)|0);
                c[cstart + i] = (u & 65535);
            }
            return ((u) >>> 16);
        }
    };
    constructor.SubtractOneBiggerWords1 = function(c, cstart, words1, astart, words2, bstart, words1Count) {
        {
            var u;
            u = 0;
            var cm1 = words1Count - 1;
            for (var i = 0; i < cm1; i += 1) {
                u = ((words1[astart]) & 65535) - ((words2[bstart]) & 65535) - ((u >> 31) & 1);
                c[cstart++] = (u & 65535);
                ++astart;
                ++bstart;
            }
            u = ((words1[astart]) & 65535) - ((u >> 31) & 1);
            c[cstart++] = (u & 65535);
            return ((u >> 31) & 1);
        }
    };
    constructor.SubtractOneBiggerWords2 = function(c, cstart, words1, astart, words2, bstart, words2Count) {
        {
            var u;
            u = 0;
            var cm1 = words2Count - 1;
            for (var i = 0; i < cm1; i += 1) {
                u = ((words1[astart]) & 65535) - ((words2[bstart]) & 65535) - ((u >> 31) & 1);
                c[cstart++] = (u & 65535);
                ++astart;
                ++bstart;
            }
            u = 0 - ((words2[bstart]) & 65535) - ((u >> 31) & 1);
            c[cstart++] = (u & 65535);
            return ((u >> 31) & 1);
        }
    };
    constructor.AddUnevenSize = function(c, cstart, wordsBigger, astart, acount, wordsSmaller, bstart, bcount) {
        {
            var u;
            u = 0;
            for (var i = 0; i < bcount; i += 1) {
                u = ((wordsBigger[astart + i]) & 65535) + ((wordsSmaller[bstart + i]) & 65535) + ((u >> 16)|0);
                c[cstart + i] = (u & 65535);
            }
            for (var i = bcount; i < acount; i += 1) {
                u = ((wordsBigger[astart + i]) & 65535) + ((u >> 16)|0);
                c[cstart + i] = (u & 65535);
            }
            return ((u) >>> 16);
        }
    };
    constructor.Subtract = function(c, cstart, words1, astart, words2, bstart, n) {
        {
            var u;
            u = 0;
            for (var i = 0; i < n; i += 2) {
                u = ((words1[astart]) & 65535) - ((words2[bstart]) & 65535) - ((u >> 31) & 1);
                c[cstart++] = (u & 65535);
                ++astart;
                ++bstart;
                u = ((words1[astart]) & 65535) - ((words2[bstart]) & 65535) - ((u >> 31) & 1);
                c[cstart++] = (u & 65535);
                ++astart;
                ++bstart;
            }
            return ((u >> 31) & 1);
        }
    };
    constructor.SubtractOneByOne = function(c, cstart, words1, astart, words2, bstart, n) {
        {
            var u;
            u = 0;
            for (var i = 0; i < n; i += 1) {
                u = ((words1[astart]) & 65535) - ((words2[bstart]) & 65535) - ((u >> 31) & 1);
                c[cstart++] = (u & 65535);
                ++astart;
                ++bstart;
            }
            return ((u >> 31) & 1);
        }
    };
    constructor.LinearMultiplyAdd = function(productArr, cstart, words1, astart, words2, n) {
        {
            var carry = 0;
            var bint = (words2) & 65535;
            for (var i = 0; i < n; ++i) {
                var p;
                p = ((words1[astart + i]) & 65535) * bint;
                p = p + (carry & 65535);
                p = p + ((productArr[cstart + i]) & 65535);
                productArr[cstart + i] = (p & 65535);
                carry = ((p >> 16)|0);
            }
            return carry;
        }
    };
    constructor.LinearMultiply = function(productArr, cstart, words1, astart, words2, n) {
        {
            var carry = 0;
            var bint = (words2) & 65535;
            for (var i = 0; i < n; ++i) {
                var p;
                p = ((words1[astart + i]) & 65535) * bint;
                p = p + (carry & 65535);
                productArr[cstart + i] = (p & 65535);
                carry = ((p >> 16)|0);
            }
            return carry;
        }
    };
    constructor.BaselineSquare2 = function(result, rstart, words1, astart) {
        {
            var p;
            var c;
            var d;
            var e;
            p = ((words1[astart]) & 65535) * ((words1[astart]) & 65535);
            result[rstart] = (p & 65535);
            e = ((p) >>> 16);
            p = ((words1[astart]) & 65535) * ((words1[astart + 1]) & 65535);
            c = (p|0);
            d = ((p) >>> 16);
            d = ((((d << 1) + (((c|0) >> 15) & 1)))|0);
            c <<= 1;
            e = e + (c & 65535);
            c = (e|0);
            e = d + ((e) >>> 16);
            result[rstart + 1] = (c & 65535);
            p = ((words1[astart + 1]) & 65535) * ((words1[astart + 1]) & 65535);
            p = p + (e);
            result[rstart + 2] = (p & 65535);
            result[rstart + 3] = ((p) >>> 16);
        }
    };
    constructor.BaselineSquare4 = function(result, rstart, words1, astart) {
        {
            var p;
            var c;
            var d;
            var e;
            p = ((words1[astart]) & 65535) * ((words1[astart]) & 65535);
            result[rstart] = (p & 65535);
            e = ((p) >>> 16);
            p = ((words1[astart]) & 65535) * ((words1[astart + 1]) & 65535);
            c = (p|0);
            d = ((p) >>> 16);
            d = ((((d << 1) + (((c|0) >> 15) & 1)))|0);
            c <<= 1;
            e = e + (c & 65535);
            c = (e|0);
            e = d + ((e) >>> 16);
            result[rstart + 1] = (c & 65535);
            p = ((words1[astart]) & 65535) * ((words1[astart + 2]) & 65535);
            c = (p|0);
            d = ((p) >>> 16);
            d = ((((d << 1) + (((c|0) >> 15) & 1)))|0);
            c <<= 1;
            p = ((words1[astart + 1]) & 65535) * ((words1[astart + 1]) & 65535);
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            e = e + (c & 65535);
            c = (e|0);
            e = d + ((e) >>> 16);
            result[rstart + 2] = (c & 65535);
            p = ((words1[astart]) & 65535) * ((words1[astart + 3]) & 65535);
            c = (p|0);
            d = ((p) >>> 16);
            p = ((words1[astart + 1]) & 65535) * ((words1[astart + 2]) & 65535);
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            d = ((((d << 1) + (((c|0) >> 15) & 1)))|0);
            c <<= 1;
            e = e + (c & 65535);
            c = (e|0);
            e = d + ((e) >>> 16);
            result[rstart + 3] = (c & 65535);
            p = ((words1[astart + 1]) & 65535) * ((words1[astart + 3]) & 65535);
            c = (p|0);
            d = ((p) >>> 16);
            d = ((((d << 1) + (((c|0) >> 15) & 1)))|0);
            c <<= 1;
            p = ((words1[astart + 2]) & 65535) * ((words1[astart + 2]) & 65535);
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            e = e + (c & 65535);
            c = (e|0);
            e = d + ((e) >>> 16);
            result[rstart + 4] = (c & 65535);
            p = ((words1[astart + 2]) & 65535) * ((words1[astart + 3]) & 65535);
            c = (p|0);
            d = ((p) >>> 16);
            d = ((((d << 1) + (((c|0) >> 15) & 1)))|0);
            c <<= 1;
            e = e + (c & 65535);
            c = (e|0);
            e = d + ((e) >>> 16);
            result[rstart + (2 * 4) - 3] = (c & 65535);
            p = ((words1[astart + 3]) & 65535) * ((words1[astart + 3]) & 65535);
            p = p + (e);
            result[rstart + 6] = (p & 65535);
            result[rstart + 7] = ((p) >>> 16);
        }
    };
    constructor.BaselineSquare8 = function(result, rstart, words1, astart) {
        {
            var p;
            var c;
            var d;
            var e;
            p = ((words1[astart]) & 65535) * ((words1[astart]) & 65535);
            result[rstart] = (p & 65535);
            e = ((p) >>> 16);
            p = ((words1[astart]) & 65535) * ((words1[astart + 1]) & 65535);
            c = (p|0);
            d = ((p) >>> 16);
            d = ((((d << 1) + (((c|0) >> 15) & 1)))|0);
            c <<= 1;
            e = e + (c & 65535);
            c = (e|0);
            e = d + ((e) >>> 16);
            result[rstart + 1] = (c & 65535);
            p = ((words1[astart]) & 65535) * ((words1[astart + 2]) & 65535);
            c = (p|0);
            d = ((p) >>> 16);
            d = ((((d << 1) + (((c|0) >> 15) & 1)))|0);
            c <<= 1;
            p = ((words1[astart + 1]) & 65535) * ((words1[astart + 1]) & 65535);
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            e = e + (c & 65535);
            c = (e|0);
            e = d + ((e) >>> 16);
            result[rstart + 2] = (c & 65535);
            p = ((words1[astart]) & 65535) * ((words1[astart + 3]) & 65535);
            c = (p|0);
            d = ((p) >>> 16);
            p = ((words1[astart + 1]) & 65535) * ((words1[astart + 2]) & 65535);
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            d = ((((d << 1) + (((c|0) >> 15) & 1)))|0);
            c <<= 1;
            e = e + (c & 65535);
            c = (e|0);
            e = d + ((e) >>> 16);
            result[rstart + 3] = (c & 65535);
            p = ((words1[astart]) & 65535) * ((words1[astart + 4]) & 65535);
            c = (p|0);
            d = ((p) >>> 16);
            p = ((words1[astart + 1]) & 65535) * ((words1[astart + 3]) & 65535);
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            d = ((((d << 1) + (((c|0) >> 15) & 1)))|0);
            c <<= 1;
            p = ((words1[astart + 2]) & 65535) * ((words1[astart + 2]) & 65535);
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            e = e + (c & 65535);
            c = (e|0);
            e = d + ((e) >>> 16);
            result[rstart + 4] = (c & 65535);
            p = ((words1[astart]) & 65535) * ((words1[astart + 5]) & 65535);
            c = (p|0);
            d = ((p) >>> 16);
            p = ((words1[astart + 1]) & 65535) * ((words1[astart + 4]) & 65535);
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 2]) & 65535) * ((words1[astart + 3]) & 65535);
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            d = ((((d << 1) + (((c|0) >> 15) & 1)))|0);
            c <<= 1;
            e = e + (c & 65535);
            c = (e|0);
            e = d + ((e) >>> 16);
            result[rstart + 5] = (c & 65535);
            p = ((words1[astart]) & 65535) * ((words1[astart + 6]) & 65535);
            c = (p|0);
            d = ((p) >>> 16);
            p = ((words1[astart + 1]) & 65535) * ((words1[astart + 5]) & 65535);
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 2]) & 65535) * ((words1[astart + 4]) & 65535);
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            d = ((((d << 1) + (((c|0) >> 15) & 1)))|0);
            c <<= 1;
            p = ((words1[astart + 3]) & 65535) * ((words1[astart + 3]) & 65535);
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            e = e + (c & 65535);
            c = (e|0);
            e = d + ((e) >>> 16);
            result[rstart + 6] = (c & 65535);
            p = ((words1[astart]) & 65535) * ((words1[astart + 7]) & 65535);
            c = (p|0);
            d = ((p) >>> 16);
            p = ((words1[astart + 1]) & 65535) * ((words1[astart + 6]) & 65535);
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 2]) & 65535) * ((words1[astart + 5]) & 65535);
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 3]) & 65535) * ((words1[astart + 4]) & 65535);
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            d = ((((d << 1) + (((c|0) >> 15) & 1)))|0);
            c <<= 1;
            e = e + (c & 65535);
            c = (e|0);
            e = d + ((e) >>> 16);
            result[rstart + 7] = (c & 65535);
            p = ((words1[astart + 1]) & 65535) * ((words1[astart + 7]) & 65535);
            c = (p|0);
            d = ((p) >>> 16);
            p = ((words1[astart + 2]) & 65535) * ((words1[astart + 6]) & 65535);
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 3]) & 65535) * ((words1[astart + 5]) & 65535);
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            d = ((((d << 1) + (((c|0) >> 15) & 1)))|0);
            c <<= 1;
            p = ((words1[astart + 4]) & 65535) * ((words1[astart + 4]) & 65535);
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            e = e + (c & 65535);
            c = (e|0);
            e = d + ((e) >>> 16);
            result[rstart + 8] = (c & 65535);
            p = ((words1[astart + 2]) & 65535) * ((words1[astart + 7]) & 65535);
            c = (p|0);
            d = ((p) >>> 16);
            p = ((words1[astart + 3]) & 65535) * ((words1[astart + 6]) & 65535);
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 4]) & 65535) * ((words1[astart + 5]) & 65535);
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            d = ((((d << 1) + (((c|0) >> 15) & 1)))|0);
            c <<= 1;
            e = e + (c & 65535);
            c = (e|0);
            e = d + ((e) >>> 16);
            result[rstart + 9] = (c & 65535);
            p = ((words1[astart + 3]) & 65535) * ((words1[astart + 7]) & 65535);
            c = (p|0);
            d = ((p) >>> 16);
            p = ((words1[astart + 4]) & 65535) * ((words1[astart + 6]) & 65535);
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            d = ((((d << 1) + (((c|0) >> 15) & 1)))|0);
            c <<= 1;
            p = ((words1[astart + 5]) & 65535) * ((words1[astart + 5]) & 65535);
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            e = e + (c & 65535);
            c = (e|0);
            e = d + ((e) >>> 16);
            result[rstart + 10] = (c & 65535);
            p = ((words1[astart + 4]) & 65535) * ((words1[astart + 7]) & 65535);
            c = (p|0);
            d = ((p) >>> 16);
            p = ((words1[astart + 5]) & 65535) * ((words1[astart + 6]) & 65535);
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            d = ((((d << 1) + (((c|0) >> 15) & 1)))|0);
            c <<= 1;
            e = e + (c & 65535);
            c = (e|0);
            e = d + ((e) >>> 16);
            result[rstart + 11] = (c & 65535);
            p = ((words1[astart + 5]) & 65535) * ((words1[astart + 7]) & 65535);
            c = (p|0);
            d = ((p) >>> 16);
            d = ((((d << 1) + (((c|0) >> 15) & 1)))|0);
            c <<= 1;
            p = ((words1[astart + 6]) & 65535) * ((words1[astart + 6]) & 65535);
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            e = e + (c & 65535);
            c = (e|0);
            e = d + ((e) >>> 16);
            result[rstart + 12] = (c & 65535);
            p = ((words1[astart + 6]) & 65535) * ((words1[astart + 7]) & 65535);
            c = (p|0);
            d = ((p) >>> 16);
            d = ((((d << 1) + (((c|0) >> 15) & 1)))|0);
            c <<= 1;
            e = e + (c & 65535);
            c = (e|0);
            e = d + ((e) >>> 16);
            result[rstart + 13] = (c & 65535);
            p = ((words1[astart + 7]) & 65535) * ((words1[astart + 7]) & 65535);
            p = p + (e);
            result[rstart + 14] = (p & 65535);
            result[rstart + 15] = ((p) >>> 16);
        }
    };
    constructor.BaselineMultiply2 = function(result, rstart, words1, astart, words2, bstart) {
        {
            var p;
            var c;
            var d;
            var a0 = (words1[astart]) & 65535;
            var a1 = (words1[astart + 1]) & 65535;
            var b0 = (words2[bstart]) & 65535;
            var b1 = (words2[bstart + 1]) & 65535;
            p = a0 * b0;
            c = (p|0);
            d = ((p) >>> 16);
            result[rstart] = (c & 65535);
            c = (d|0);
            d = ((d) >>> 16);
            p = a0 * b1;
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = a1 * b0;
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            result[rstart + 1] = (c & 65535);
            p = a1 * b1;
            p = p + (d);
            result[rstart + 2] = (p & 65535);
            result[rstart + 3] = ((p) >>> 16);
        }
    };
    constructor.ShortMask = 65535;
    constructor.BaselineMultiply4 = function(result, rstart, words1, astart, words2, bstart) {
        {
            var SMask = BigInteger.ShortMask;
            var p;
            var c;
            var d;
            var a0 = (words1[astart]) & SMask;
            var b0 = (words2[bstart]) & SMask;
            p = a0 * b0;
            c = (p|0);
            d = (p) >>> 16;
            result[rstart] = (c & 65535);
            c = (d|0);
            d = (d) >>> 16;
            p = a0 * ((words2[bstart + 1]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 1]) & SMask) * b0;
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            result[rstart + 1] = (c & 65535);
            c = (d|0);
            d = (d) >>> 16;
            p = a0 * ((words2[bstart + 2]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 1]) & SMask) * ((words2[bstart + 1]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 2]) & SMask) * b0;
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            result[rstart + 2] = (c & 65535);
            c = (d|0);
            d = (d) >>> 16;
            p = a0 * ((words2[bstart + 3]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 1]) & SMask) * ((words2[bstart + 2]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 2]) & SMask) * ((words2[bstart + 1]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 3]) & SMask) * b0;
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            result[rstart + 3] = (c & 65535);
            c = (d|0);
            d = (d) >>> 16;
            p = ((words1[astart + 1]) & SMask) * ((words2[bstart + 3]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 2]) & SMask) * ((words2[bstart + 2]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 3]) & SMask) * ((words2[bstart + 1]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            result[rstart + 4] = (c & 65535);
            c = (d|0);
            d = (d) >>> 16;
            p = ((words1[astart + 2]) & SMask) * ((words2[bstart + 3]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 3]) & SMask) * ((words2[bstart + 2]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            result[rstart + 5] = (c & 65535);
            p = ((words1[astart + 3]) & SMask) * ((words2[bstart + 3]) & SMask);
            p = p + (d);
            result[rstart + 6] = (p & 65535);
            result[rstart + 7] = ((p) >>> 16);
        }
    };
    constructor.BaselineMultiply8 = function(result, rstart, words1, astart, words2, bstart) {
        {
            var p;
            var c;
            var d;
            var SMask = BigInteger.ShortMask;
            p = ((words1[astart]) & SMask) * ((words2[bstart]) & SMask);
            c = (p|0);
            d = (p) >>> 16;
            result[rstart] = (c & 65535);
            c = (d|0);
            d = (d) >>> 16;
            p = ((words1[astart]) & SMask) * ((words2[bstart + 1]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 1]) & SMask) * ((words2[bstart]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            result[rstart + 1] = (c & 65535);
            c = (d|0);
            d = (d) >>> 16;
            p = ((words1[astart]) & SMask) * ((words2[bstart + 2]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 1]) & SMask) * ((words2[bstart + 1]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 2]) & SMask) * ((words2[bstart]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            result[rstart + 2] = (c & 65535);
            c = (d|0);
            d = (d) >>> 16;
            p = ((words1[astart]) & SMask) * ((words2[bstart + 3]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 1]) & SMask) * ((words2[bstart + 2]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 2]) & SMask) * ((words2[bstart + 1]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 3]) & SMask) * ((words2[bstart]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            result[rstart + 3] = (c & 65535);
            c = (d|0);
            d = (d) >>> 16;
            p = ((words1[astart]) & SMask) * ((words2[bstart + 4]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 1]) & SMask) * ((words2[bstart + 3]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 2]) & SMask) * ((words2[bstart + 2]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 3]) & SMask) * ((words2[bstart + 1]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 4]) & SMask) * ((words2[bstart]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            result[rstart + 4] = (c & 65535);
            c = (d|0);
            d = (d) >>> 16;
            p = ((words1[astart]) & SMask) * ((words2[bstart + 5]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 1]) & SMask) * ((words2[bstart + 4]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 2]) & SMask) * ((words2[bstart + 3]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 3]) & SMask) * ((words2[bstart + 2]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 4]) & SMask) * ((words2[bstart + 1]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 5]) & SMask) * ((words2[bstart]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            result[rstart + 5] = (c & 65535);
            c = (d|0);
            d = (d) >>> 16;
            p = ((words1[astart]) & SMask) * ((words2[bstart + 6]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 1]) & SMask) * ((words2[bstart + 5]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 2]) & SMask) * ((words2[bstart + 4]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 3]) & SMask) * ((words2[bstart + 3]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 4]) & SMask) * ((words2[bstart + 2]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 5]) & SMask) * ((words2[bstart + 1]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 6]) & SMask) * ((words2[bstart]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            result[rstart + 6] = (c & 65535);
            c = (d|0);
            d = (d) >>> 16;
            p = ((words1[astart]) & SMask) * ((words2[bstart + 7]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 1]) & SMask) * ((words2[bstart + 6]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 2]) & SMask) * ((words2[bstart + 5]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 3]) & SMask) * ((words2[bstart + 4]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 4]) & SMask) * ((words2[bstart + 3]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 5]) & SMask) * ((words2[bstart + 2]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 6]) & SMask) * ((words2[bstart + 1]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 7]) & SMask) * ((words2[bstart]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            result[rstart + 7] = (c & 65535);
            c = (d|0);
            d = (d) >>> 16;
            p = ((words1[astart + 1]) & SMask) * ((words2[bstart + 7]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 2]) & SMask) * ((words2[bstart + 6]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 3]) & SMask) * ((words2[bstart + 5]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 4]) & SMask) * ((words2[bstart + 4]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 5]) & SMask) * ((words2[bstart + 3]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 6]) & SMask) * ((words2[bstart + 2]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 7]) & SMask) * ((words2[bstart + 1]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            result[rstart + 8] = (c & 65535);
            c = (d|0);
            d = (d) >>> 16;
            p = ((words1[astart + 2]) & SMask) * ((words2[bstart + 7]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 3]) & SMask) * ((words2[bstart + 6]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 4]) & SMask) * ((words2[bstart + 5]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 5]) & SMask) * ((words2[bstart + 4]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 6]) & SMask) * ((words2[bstart + 3]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 7]) & SMask) * ((words2[bstart + 2]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            result[rstart + 9] = (c & 65535);
            c = (d|0);
            d = (d) >>> 16;
            p = ((words1[astart + 3]) & SMask) * ((words2[bstart + 7]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 4]) & SMask) * ((words2[bstart + 6]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 5]) & SMask) * ((words2[bstart + 5]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 6]) & SMask) * ((words2[bstart + 4]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 7]) & SMask) * ((words2[bstart + 3]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            result[rstart + 10] = (c & 65535);
            c = (d|0);
            d = (d) >>> 16;
            p = ((words1[astart + 4]) & SMask) * ((words2[bstart + 7]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 5]) & SMask) * ((words2[bstart + 6]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 6]) & SMask) * ((words2[bstart + 5]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 7]) & SMask) * ((words2[bstart + 4]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            result[rstart + 11] = (c & 65535);
            c = (d|0);
            d = (d) >>> 16;
            p = ((words1[astart + 5]) & SMask) * ((words2[bstart + 7]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 6]) & SMask) * ((words2[bstart + 6]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 7]) & SMask) * ((words2[bstart + 5]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            result[rstart + 12] = (c & 65535);
            c = (d|0);
            d = (d) >>> 16;
            p = ((words1[astart + 6]) & SMask) * ((words2[bstart + 7]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = ((words1[astart + 7]) & SMask) * ((words2[bstart + 6]) & SMask);
            p = p + ((c) & SMask);
            c = (p|0);
            d = d + ((p) >>> 16);
            result[rstart + 13] = (c & 65535);
            p = ((words1[astart + 7]) & SMask) * ((words2[bstart + 7]) & SMask);
            p = p + (d);
            result[rstart + 14] = (p & 65535);
            result[rstart + 15] = ((p) >>> 16);
        }
    };
    constructor.RecursionLimit = 10;
    constructor.SameSizeMultiply = function(resultArr, resultStart, tempArr, tempStart, words1, words1Start, words2, words2Start, count) {
        if (count <= BigInteger.RecursionLimit) {
            if (count == 2) {
                BigInteger.BaselineMultiply2(resultArr, resultStart, words1, words1Start, words2, words2Start);
            } else if (count == 4) {
                BigInteger.BaselineMultiply4(resultArr, resultStart, words1, words1Start, words2, words2Start);
            } else if (count == 8) {
                BigInteger.BaselineMultiply8(resultArr, resultStart, words1, words1Start, words2, words2Start);
            } else {
                BigInteger.SchoolbookMultiply(resultArr, resultStart, words1, words1Start, count, words2, words2Start, count);
            }
        } else {
            var countA = count;
            while (countA != 0 && words1[words1Start + countA - 1] == 0) {
                --countA;
            }
            var countB = count;
            while (countB != 0 && words2[words2Start + countB - 1] == 0) {
                --countB;
            }
            var offset2For1 = 0;
            var offset2For2 = 0;
            if (countA == 0 || countB == 0) {
                for (var arrfillI = resultStart; arrfillI < (resultStart) + (count << 1); arrfillI++) (resultArr)[arrfillI] = 0;
                return;
            }
            if ((count & 1) == 0) {
                var count2 = count >> 1;
                if (countA <= count2 && countB <= count2) {
                    for (var arrfillI = resultStart + count; arrfillI < (resultStart + count) + (count); arrfillI++) (resultArr)[arrfillI] = 0;
                    if (count2 == 8) {
                        BigInteger.BaselineMultiply8(resultArr, resultStart, words1, words1Start, words2, words2Start);
                    } else {
                        BigInteger.SameSizeMultiply(resultArr, resultStart, tempArr, tempStart, words1, words1Start, words2, words2Start, count2);
                    }
                    return;
                }
                var resultMediumHigh = resultStart + count;
                var resultHigh = resultMediumHigh + count2;
                var resultMediumLow = resultStart + count2;
                var tsn = tempStart + count;
                offset2For1 = BigInteger.Compare(words1, words1Start, words1, words1Start + count2, count2) > 0 ? 0 : count2;
                var tmpvar = ((words1Start + (count2 ^ offset2For1))|0);
                BigInteger.SubtractOneByOne(resultArr, resultStart, words1, words1Start + offset2For1, words1, tmpvar, count2);
                offset2For2 = BigInteger.Compare(words2, words2Start, words2, words2Start + count2, count2) > 0 ? 0 : count2;
                var tmp = words2Start + (count2 ^ offset2For2);
                BigInteger.SubtractOneByOne(resultArr, resultMediumLow, words2, words2Start + offset2For2, words2, tmp, count2);
                BigInteger.SameSizeMultiply(resultArr, resultMediumHigh, tempArr, tsn, words1, words1Start + count2, words2, words2Start + count2, count2);
                BigInteger.SameSizeMultiply(tempArr, tempStart, tempArr, tsn, resultArr, resultStart, resultArr, resultMediumLow, count2);
                BigInteger.SameSizeMultiply(resultArr, resultStart, tempArr, tsn, words1, words1Start, words2, words2Start, count2);
                var c2 = BigInteger.AddOneByOne(resultArr, resultMediumHigh, resultArr, resultMediumHigh, resultArr, resultMediumLow, count2);
                var c3 = c2;
                c2 = c2 + (BigInteger.AddOneByOne(resultArr, resultMediumLow, resultArr, resultMediumHigh, resultArr, resultStart, count2));
                c3 = c3 + (BigInteger.AddOneByOne(resultArr, resultMediumHigh, resultArr, resultMediumHigh, resultArr, resultHigh, count2));
                if (offset2For1 == offset2For2) {
                    c3 -= BigInteger.SubtractOneByOne(resultArr, resultMediumLow, resultArr, resultMediumLow, tempArr, tempStart, count);
                } else {
                    c3 = c3 + (BigInteger.AddOneByOne(resultArr, resultMediumLow, resultArr, resultMediumLow, tempArr, tempStart, count));
                }
                c3 = c3 + (BigInteger.Increment(resultArr, resultMediumHigh, count2, (c2|0)));
                if (c3 != 0) {
                    BigInteger.Increment(resultArr, resultHigh, count2, (c3|0));
                }
            } else {
                var countHigh = count >> 1;
                var countLow = count - countHigh;
                offset2For1 = BigInteger.CompareWithOneBiggerWords1(words1, words1Start, words1, words1Start + countLow, countLow) > 0 ? 0 : countLow;
                if (offset2For1 == 0) {
                    BigInteger.SubtractOneBiggerWords1(resultArr, resultStart, words1, words1Start, words1, words1Start + countLow, countLow);
                } else {
                    BigInteger.SubtractOneBiggerWords2(resultArr, resultStart, words1, words1Start + countLow, words1, words1Start, countLow);
                }
                offset2For2 = BigInteger.CompareWithOneBiggerWords1(words2, words2Start, words2, words2Start + countLow, countLow) > 0 ? 0 : countLow;
                if (offset2For2 == 0) {
                    BigInteger.SubtractOneBiggerWords1(tempArr, tempStart, words2, words2Start, words2, words2Start + countLow, countLow);
                } else {
                    BigInteger.SubtractOneBiggerWords2(tempArr, tempStart, words2, words2Start + countLow, words2, words2Start, countLow);
                }
                var shorterOffset = countHigh << 1;
                var longerOffset = countLow << 1;
                BigInteger.SameSizeMultiply(tempArr, tempStart + shorterOffset, resultArr, resultStart + shorterOffset, resultArr, resultStart, tempArr, tempStart, countLow);
                var resultTmp0 = ((tempArr[tempStart + shorterOffset]) & 65535);
                var resultTmp1 = ((tempArr[tempStart + shorterOffset + 1]) & 65535);
                BigInteger.SameSizeMultiply(resultArr, resultStart + longerOffset, resultArr, resultStart, words1, words1Start + countLow, words2, words2Start + countLow, countHigh);
                BigInteger.SameSizeMultiply(resultArr, resultStart, tempArr, tempStart, words1, words1Start, words2, words2Start, countLow);
                tempArr[tempStart + shorterOffset] = (resultTmp0 & 65535);
                tempArr[tempStart + shorterOffset + 1] = (resultTmp1 & 65535);
                var countMiddle = countLow << 1;
                var c2 = BigInteger.AddOneByOne(resultArr, resultStart + countMiddle, resultArr, resultStart + countMiddle, resultArr, resultStart + countLow, countLow);
                var c3 = c2;
                c2 = c2 + (BigInteger.AddOneByOne(resultArr, resultStart + countLow, resultArr, resultStart + countMiddle, resultArr, resultStart, countLow));
                c3 = c3 + (BigInteger.AddUnevenSize(resultArr, resultStart + countMiddle, resultArr, resultStart + countMiddle, countLow, resultArr, resultStart + countMiddle + countLow, countLow - 2));
                if (offset2For1 == offset2For2) {
                    c3 -= BigInteger.SubtractOneByOne(resultArr, resultStart + countLow, resultArr, resultStart + countLow, tempArr, tempStart + shorterOffset, countLow << 1);
                } else {
                    c3 = c3 + (BigInteger.AddOneByOne(resultArr, resultStart + countLow, resultArr, resultStart + countLow, tempArr, tempStart + shorterOffset, countLow << 1));
                }
                c3 = c3 + (BigInteger.Increment(resultArr, resultStart + countMiddle, countLow, (c2|0)));
                if (c3 != 0) {
                    BigInteger.Increment(resultArr, resultStart + countMiddle + countLow, countLow - 2, (c3|0));
                }
            }
        }
    };
    constructor.RecursiveSquare = function(resultArr, resultStart, tempArr, tempStart, words1, words1Start, count) {
        if (count <= BigInteger.RecursionLimit) {
            if (count == 2) {
                BigInteger.BaselineSquare2(resultArr, resultStart, words1, words1Start);
            } else if (count == 4) {
                BigInteger.BaselineSquare4(resultArr, resultStart, words1, words1Start);
            } else if (count == 8) {
                BigInteger.BaselineSquare8(resultArr, resultStart, words1, words1Start);
            } else {
                BigInteger.SchoolbookSquare(resultArr, resultStart, words1, words1Start, count);
            }
        } else if ((count & 1) == 0) {
            var count2 = count >> 1;
            BigInteger.RecursiveSquare(resultArr, resultStart, tempArr, tempStart + count, words1, words1Start, count2);
            BigInteger.RecursiveSquare(resultArr, resultStart + count, tempArr, tempStart + count, words1, words1Start + count2, count2);
            BigInteger.SameSizeMultiply(tempArr, tempStart, tempArr, tempStart + count, words1, words1Start, words1, words1Start + count2, count2);
            var carry = BigInteger.AddOneByOne(resultArr, resultStart + count2, resultArr, resultStart + count2, tempArr, tempStart, count);
            carry = carry + (BigInteger.AddOneByOne(resultArr, resultStart + count2, resultArr, resultStart + count2, tempArr, tempStart, count));
            BigInteger.Increment(resultArr, ((resultStart + count + count2)|0), count2, (carry|0));
        } else {
            BigInteger.SameSizeMultiply(resultArr, resultStart, tempArr, tempStart, words1, words1Start, words1, words1Start, count);
        }
    };
    constructor.SchoolbookSquare = function(resultArr, resultStart, words1, words1Start, words1Count) {
        var cstart;
        for (var i = 0; i < words1Count; ++i) {
            cstart = resultStart + i;
            {
                var carry = 0;
                var valueBint = (words1[words1Start + i]) & 65535;
                for (var j = 0; j < words1Count; ++j) {
                    var p;
                    p = ((words1[words1Start + j]) & 65535) * valueBint;
                    p = p + (carry & 65535);
                    if (i != 0) {
                        p = p + ((resultArr[cstart + j]) & 65535);
                    }
                    resultArr[cstart + j] = (p & 65535);
                    carry = ((p >> 16)|0);
                }
                resultArr[cstart + words1Count] = (carry & 65535);
            }
        }
    };
    constructor.SchoolbookMultiply = function(resultArr, resultStart, words1, words1Start, words1Count, words2, words2Start, words2Count) {
        var cstart;
        if (words1Count < words2Count) {
            for (var i = 0; i < words1Count; ++i) {
                cstart = resultStart + i;
                {
                    var carry = 0;
                    var valueBint = (words1[words1Start + i]) & 65535;
                    for (var j = 0; j < words2Count; ++j) {
                        var p;
                        p = ((words2[words2Start + j]) & 65535) * valueBint;
                        p = p + (carry & 65535);
                        if (i != 0) {
                            p = p + ((resultArr[cstart + j]) & 65535);
                        }
                        resultArr[cstart + j] = (p & 65535);
                        carry = ((p >> 16)|0);
                    }
                    resultArr[cstart + words2Count] = (carry & 65535);
                }
            }
        } else {
            for (var i = 0; i < words2Count; ++i) {
                cstart = resultStart + i;
                {
                    var carry = 0;
                    var valueBint = (words2[words2Start + i]) & 65535;
                    for (var j = 0; j < words1Count; ++j) {
                        var p;
                        p = ((words1[words1Start + j]) & 65535) * valueBint;
                        p = p + (carry & 65535);
                        if (i != 0) {
                            p = p + ((resultArr[cstart + j]) & 65535);
                        }
                        resultArr[cstart + j] = (p & 65535);
                        carry = ((p >> 16)|0);
                    }
                    resultArr[cstart + words1Count] = (carry & 65535);
                }
            }
        }
    };
    constructor.ChunkedLinearMultiply = function(productArr, cstart, tempArr, tempStart, words1, astart, acount, words2, bstart, bcount) {
        {
            var carryPos = 0;
            for (var arrfillI = cstart; arrfillI < (cstart) + (bcount); arrfillI++) (productArr)[arrfillI] = 0;
            for (var i = 0; i < acount; i += bcount) {
                var diff = acount - i;
                if (diff > bcount) {
                    BigInteger.SameSizeMultiply(tempArr, tempStart, tempArr, tempStart + bcount + bcount, words1, astart + i, words2, bstart, bcount);
                    BigInteger.AddUnevenSize(tempArr, tempStart, tempArr, tempStart, bcount + bcount, productArr, cstart + carryPos, bcount);
                    {
                        var arrfillSrc = tempStart;
                        var arrfillDst = cstart + i;
                        for (var arrfillI = 0; arrfillI < bcount + bcount; arrfillI++) productArr[arrfillDst + arrfillI] = tempArr[arrfillSrc + arrfillI];
                    }
                    carryPos = carryPos + (bcount);
                } else {
                    BigInteger.AsymmetricMultiply(tempArr, tempStart, tempArr, tempStart + diff + bcount, words1, astart + i, diff, words2, bstart, bcount);
                    BigInteger.AddUnevenSize(tempArr, tempStart, tempArr, tempStart, diff + bcount, productArr, cstart + carryPos, bcount);
                    {
                        var arrfillSrc = tempStart;
                        var arrfillDst = cstart + i;
                        for (var arrfillI = 0; arrfillI < diff + bcount; arrfillI++) productArr[arrfillDst + arrfillI] = tempArr[arrfillSrc + arrfillI];
                    }
                }
            }
        }
    };
    constructor.AsymmetricMultiply = function(resultArr, resultStart, tempArr, tempStart, words1, words1Start, words1Count, words2, words2Start, words2Count) {
        if (words1Count == words2Count) {
            if (words1Start == words2Start && words1 == words2) {
                BigInteger.RecursiveSquare(resultArr, resultStart, tempArr, tempStart, words1, words1Start, words1Count);
            } else if (words1Count == 2) {
                BigInteger.BaselineMultiply2(resultArr, resultStart, words1, words1Start, words2, words2Start);
            } else {
                BigInteger.SameSizeMultiply(resultArr, resultStart, tempArr, tempStart, words1, words1Start, words2, words2Start, words1Count);
            }
            return;
        }
        if (words1Count > words2Count) {
            var tmp1 = words1;
            words1 = words2;
            words2 = tmp1;
            var tmp3 = words1Start;
            words1Start = words2Start;
            words2Start = tmp3;
            var tmp2 = words1Count;
            words1Count = words2Count;
            words2Count = tmp2;
        }
        if (words1Count == 1 || (words1Count == 2 && words1[words1Start + 1] == 0)) {
            switch(words1[words1Start]) {
                case 0:
                    for (var arrfillI = resultStart; arrfillI < (resultStart) + (words2Count + 2); arrfillI++) (resultArr)[arrfillI] = 0;
                    return;
                case 1:
                    for (var arrfillI = 0; arrfillI < (words2Count|0); arrfillI++) resultArr[resultStart + arrfillI] = words2[words2Start + arrfillI];
                    resultArr[resultStart + words2Count] = 0;
                    resultArr[resultStart + words2Count + 1] = 0;
                    return;
                default:
                    resultArr[resultStart + words2Count] = ((BigInteger.LinearMultiply(resultArr, resultStart, words2, words2Start, words1[words1Start], words2Count)) & 65535);
                    resultArr[resultStart + words2Count + 1] = 0;
                    return;
            }
        }
        if (words1Count == 2 && (words2Count & 1) == 0) {
            var a0 = (words1[words1Start]) & 65535;
            var a1 = (words1[words1Start + 1]) & 65535;
            resultArr[resultStart + words2Count] = 0;
            resultArr[resultStart + words2Count + 1] = 0;
            BigInteger.AtomicMultiplyOpt(resultArr, resultStart, a0, a1, words2, words2Start, 0, words2Count);
            BigInteger.AtomicMultiplyAddOpt(resultArr, resultStart, a0, a1, words2, words2Start, 2, words2Count);
            return;
        }
        if (words1Count <= 10 && words2Count <= 10) {
            BigInteger.SchoolbookMultiply(resultArr, resultStart, words1, words1Start, words1Count, words2, words2Start, words2Count);
        } else {
            var wordsRem = words2Count % words1Count;
            var evenmult = ((words2Count / words1Count)|0) & 1;
            var i;
            if (wordsRem == 0) {
                if (evenmult == 0) {
                    BigInteger.SameSizeMultiply(resultArr, resultStart, tempArr, tempStart, words1, words1Start, words2, words2Start, words1Count);
                    {
                        var arrfillSrc = resultStart + words1Count;
                        var arrfillDst = ((tempStart + (words1Count << 1))|0);
                        for (var arrfillI = 0; arrfillI < words1Count; arrfillI++) tempArr[arrfillDst + arrfillI] = resultArr[arrfillSrc + arrfillI];
                    }
                    for (i = words1Count << 1; i < words2Count; i += words1Count << 1) {
                        BigInteger.SameSizeMultiply(tempArr, tempStart + words1Count + i, tempArr, tempStart, words1, words1Start, words2, words2Start + i, words1Count);
                    }
                    for (i = words1Count; i < words2Count; i += words1Count << 1) {
                        BigInteger.SameSizeMultiply(resultArr, resultStart + i, tempArr, tempStart, words1, words1Start, words2, words2Start + i, words1Count);
                    }
                } else {
                    for (i = 0; i < words2Count; i += words1Count << 1) {
                        BigInteger.SameSizeMultiply(resultArr, resultStart + i, tempArr, tempStart, words1, words1Start, words2, words2Start + i, words1Count);
                    }
                    for (i = words1Count; i < words2Count; i += words1Count << 1) {
                        BigInteger.SameSizeMultiply(tempArr, tempStart + words1Count + i, tempArr, tempStart, words1, words1Start, words2, words2Start + i, words1Count);
                    }
                }
                if (BigInteger.Add(resultArr, resultStart + words1Count, resultArr, resultStart + words1Count, tempArr, tempStart + (words1Count << 1), words2Count - words1Count) != 0) {
                    BigInteger.Increment(resultArr, ((resultStart + words2Count)|0), words1Count, 1);
                }
            } else if ((words1Count + words2Count) >= (words1Count << 2)) {
                BigInteger.ChunkedLinearMultiply(resultArr, resultStart, tempArr, tempStart, words2, words2Start, words2Count, words1, words1Start, words1Count);
            } else if (words1Count + 1 == words2Count || (words1Count + 2 == words2Count && words2[words2Start + words2Count - 1] == 0)) {
                for (var arrfillI = resultStart; arrfillI < (resultStart) + (words1Count + words2Count); arrfillI++) (resultArr)[arrfillI] = 0;
                BigInteger.SameSizeMultiply(resultArr, resultStart, tempArr, tempStart, words1, words1Start, words2, words2Start, words1Count);
                var carry = ((BigInteger.LinearMultiplyAdd(resultArr, resultStart + words1Count, words1, words1Start, words2[words2Start + words1Count], words1Count)) & 65535);
                resultArr[resultStart + words1Count + words1Count] = (carry & 65535);
            } else {
                var t2 = [];
                for (var arrfillI = 0; arrfillI < words1Count << 2; arrfillI++) t2[arrfillI] = 0;
                BigInteger.ChunkedLinearMultiply(resultArr, resultStart, t2, 0, words2, words2Start, words2Count, words1, words1Start, words1Count);
            }
        }
    };
    constructor.MakeUint = function(first, second) {
        return ((((first & 65535) | ((second|0) << 16))|0));
    };
    constructor.GetLowHalf = function(val) {
        return (val & 65535);
    };
    constructor.GetHighHalf = function(val) {
        return ((val >>> 16)|0);
    };
    constructor.GetHighHalfAsBorrow = function(val) {
        return ((0 - (val >>> 16))|0);
    };
    constructor.BitPrecision = function(numberValue) {
        if (numberValue == 0) {
            return 0;
        }
        var i = 16;
        {
            if ((numberValue >> 8) == 0) {
                numberValue <<= 8;
                i -= 8;
            }
            if ((numberValue >> 12) == 0) {
                numberValue <<= 4;
                i -= 4;
            }
            if ((numberValue >> 14) == 0) {
                numberValue <<= 2;
                i -= 2;
            }
            if ((numberValue >> 15) == 0) {
                --i;
            }
        }
        return i;
    };
    constructor.Divide32By16 = function(dividendLow, divisorShort, returnRemainder) {
        var tmpInt;
        var dividendHigh = 0;
        var intDivisor = (divisorShort) & 65535;
        for (var i = 0; i < 32; ++i) {
            tmpInt = dividendHigh >> 31;
            dividendHigh <<= 1;
            dividendHigh = (((dividendHigh | ((dividendLow >> 31) & 1))|0));
            dividendLow <<= 1;
            tmpInt |= dividendHigh;
            if (((tmpInt >> 31) != 0) || (tmpInt >= intDivisor)) {
                {
                    dividendHigh -= intDivisor;
                    ++dividendLow;
                }
            }
        }
        return returnRemainder ? (dividendHigh & 65535) : (dividendLow & 65535);
    };
    constructor.DivideUnsigned = function(x, y) {
        {
            if ((x >> 31) == 0) {
                var iy = (y) & 65535;
                return (((x|0) / iy) & 65535);
            }
            return BigInteger.Divide32By16(x, y, false);
        }
    };
    constructor.RemainderUnsigned = function(x, y) {
        {
            var iy = (y) & 65535;
            return ((x >> 31) == 0) ? (((x|0) % iy) & 65535) : BigInteger.Divide32By16(x, y, true);
        }
    };
    constructor.DivideThreeWordsByTwo = function(words1, words1Start, valueB0, valueB1) {
        var valueQ;
        {
            valueQ = (((valueB1 + 1)|0) == 0) ? words1[words1Start + 2] : ((valueB1 != 0) ? BigInteger.DivideUnsigned(BigInteger.MakeUint(words1[words1Start + 1], words1[words1Start + 2]), (((valueB1|0) + 1) & 65535)) : BigInteger.DivideUnsigned(BigInteger.MakeUint(words1[words1Start], words1[words1Start + 1]), valueB0));
            var valueQint = (valueQ) & 65535;
            var valueB0int = (valueB0) & 65535;
            var valueB1int = (valueB1) & 65535;
            var p = valueB0int * valueQint;
            var u = ((words1[words1Start]) & 65535) - (p & 65535);
            words1[words1Start] = ((BigInteger.GetLowHalf(u)) & 65535);
            u = ((words1[words1Start + 1]) & 65535) - (p >>> 16) - ((BigInteger.GetHighHalfAsBorrow(u)) & 65535) - (valueB1int * valueQint);
            words1[words1Start + 1] = ((BigInteger.GetLowHalf(u)) & 65535);
            words1[words1Start + 2] = ((words1[words1Start + 2] + BigInteger.GetHighHalf(u)) & 65535);
            while (words1[words1Start + 2] != 0 || ((words1[words1Start + 1]) & 65535) > (valueB1 & 65535) || (words1[words1Start + 1] == valueB1 && ((words1[words1Start]) & 65535) >= (valueB0 & 65535))) {
                u = ((words1[words1Start]) & 65535) - valueB0int;
                words1[words1Start] = ((BigInteger.GetLowHalf(u)) & 65535);
                u = ((words1[words1Start + 1]) & 65535) - valueB1int - ((BigInteger.GetHighHalfAsBorrow(u)) & 65535);
                words1[words1Start + 1] = ((BigInteger.GetLowHalf(u)) & 65535);
                words1[words1Start + 2] = ((words1[words1Start + 2] + BigInteger.GetHighHalf(u)) & 65535);
                ++valueQ;
            }
        }
        return valueQ;
    };
    constructor.DivideFourWordsByTwo = function(quotient, quotientStart, words1, words1Start, word2A, word2B, temp) {
        if (word2A == 0 && word2B == 0) {
            quotient[quotientStart] = ((words1[words1Start + 2]) & 65535);
            quotient[quotientStart + 1] = ((words1[words1Start + 3]) & 65535);
        } else {
            temp[0] = ((words1[words1Start]) & 65535);
            temp[1] = ((words1[words1Start + 1]) & 65535);
            temp[2] = ((words1[words1Start + 2]) & 65535);
            temp[3] = ((words1[words1Start + 3]) & 65535);
            var valueQ1 = ((BigInteger.DivideThreeWordsByTwo(temp, 1, word2A, word2B)) & 65535);
            var valueQ0 = ((BigInteger.DivideThreeWordsByTwo(temp, 0, word2A, word2B)) & 65535);
            quotient[quotientStart] = (valueQ0 & 65535);
            quotient[quotientStart + 1] = (valueQ1 & 65535);
        }
    };
    constructor.AtomicMultiplyOpt = function(c, valueCstart, valueA0, valueA1, words2, words2Start, istart, iend) {
        var s;
        var d;
        var first1MinusFirst0 = ((valueA1|0) - valueA0) & 65535;
        valueA1 &= 65535;
        valueA0 &= 65535;
        {
            if (valueA1 >= valueA0) {
                for (var i = istart; i < iend; i += 4) {
                    var valueB0 = (words2[words2Start + i]) & 65535;
                    var valueB1 = (words2[words2Start + i + 1]) & 65535;
                    var csi = valueCstart + i;
                    if (valueB0 >= valueB1) {
                        s = 0;
                        d = first1MinusFirst0 * (((valueB0|0) - valueB1) & 65535);
                    } else {
                        s = (first1MinusFirst0|0);
                        d = (s & 65535) * (((valueB0|0) - valueB1) & 65535);
                    }
                    var valueA0B0 = valueA0 * valueB0;
                    c[csi] = (valueA0B0 & 65535);
                    var a0b0high = (valueA0B0 >>> 16);
                    var valueA1B1 = valueA1 * valueB1;
                    var tempInt;
                    tempInt = a0b0high + (valueA0B0 & 65535) + (d & 65535) + (valueA1B1 & 65535);
                    c[csi + 1] = (tempInt & 65535);
                    tempInt = valueA1B1 + ((tempInt) >>> 16) + a0b0high + ((d) >>> 16) + ((valueA1B1) >>> 16) - (s & 65535);
                    c[csi + 2] = (tempInt & 65535);
                    c[csi + 3] = (((tempInt) >>> 16)|0);
                }
            } else {
                for (var i = istart; i < iend; i += 4) {
                    var valueB0 = (words2[words2Start + i]) & 65535;
                    var valueB1 = (words2[words2Start + i + 1]) & 65535;
                    var csi = valueCstart + i;
                    if (valueB0 > valueB1) {
                        s = (((valueB0|0) - valueB1) & 65535);
                        d = first1MinusFirst0 * (s & 65535);
                    } else {
                        s = 0;
                        d = (((valueA0|0) - valueA1) & 65535) * (((valueB1|0) - valueB0) & 65535);
                    }
                    var valueA0B0 = valueA0 * valueB0;
                    var a0b0high = (valueA0B0 >>> 16);
                    c[csi] = (valueA0B0 & 65535);
                    var valueA1B1 = valueA1 * valueB1;
                    var tempInt;
                    tempInt = a0b0high + (valueA0B0 & 65535) + (d & 65535) + (valueA1B1 & 65535);
                    c[csi + 1] = (tempInt & 65535);
                    tempInt = valueA1B1 + ((tempInt) >>> 16) + a0b0high + ((d) >>> 16) + ((valueA1B1) >>> 16) - (s & 65535);
                    c[csi + 2] = (tempInt & 65535);
                    c[csi + 3] = (((tempInt) >>> 16)|0);
                }
            }
        }
    };
    constructor.AtomicMultiplyAddOpt = function(c, valueCstart, valueA0, valueA1, words2, words2Start, istart, iend) {
        var s;
        var d;
        var first1MinusFirst0 = ((valueA1|0) - valueA0) & 65535;
        valueA1 &= 65535;
        valueA0 &= 65535;
        {
            if (valueA1 >= valueA0) {
                for (var i = istart; i < iend; i += 4) {
                    var b0 = (words2[words2Start + i]) & 65535;
                    var b1 = (words2[words2Start + i + 1]) & 65535;
                    var csi = valueCstart + i;
                    if (b0 >= b1) {
                        s = 0;
                        d = first1MinusFirst0 * (((b0|0) - b1) & 65535);
                    } else {
                        s = (first1MinusFirst0|0);
                        d = (s & 65535) * (((b0|0) - b1) & 65535);
                    }
                    var valueA0B0 = valueA0 * b0;
                    var a0b0high = (valueA0B0 >>> 16);
                    var tempInt;
                    tempInt = valueA0B0 + ((c[csi]) & 65535);
                    c[csi] = (tempInt & 65535);
                    var valueA1B1 = valueA1 * b1;
                    var a1b1low = valueA1B1 & 65535;
                    var a1b1high = (valueA1B1) >>> 16;
                    tempInt = ((tempInt) >>> 16) + (valueA0B0 & 65535) + (d & 65535) + a1b1low + ((c[csi + 1]) & 65535);
                    c[csi + 1] = (tempInt & 65535);
                    tempInt = ((tempInt) >>> 16) + a1b1low + a0b0high + ((d) >>> 16) + a1b1high - (s & 65535) + ((c[csi + 2]) & 65535);
                    c[csi + 2] = (tempInt & 65535);
                    tempInt = ((tempInt) >>> 16) + a1b1high + ((c[csi + 3]) & 65535);
                    c[csi + 3] = (tempInt & 65535);
                    if ((tempInt >> 16) != 0) {
                        c[csi + 4] = ((c[csi + 4] + 1) & 65535);
                        c[csi + 5] = ((((c[csi + 5] + (((c[csi + 4] == 0) ? 1 : 0)|0)) & 65535))|0);
                    }
                }
            } else {
                for (var i = istart; i < iend; i += 4) {
                    var valueB0 = (words2[words2Start + i]) & 65535;
                    var valueB1 = (words2[words2Start + i + 1]) & 65535;
                    var csi = valueCstart + i;
                    if (valueB0 > valueB1) {
                        s = (((valueB0|0) - valueB1) & 65535);
                        d = first1MinusFirst0 * (s & 65535);
                    } else {
                        s = 0;
                        d = (((valueA0|0) - valueA1) & 65535) * (((valueB1|0) - valueB0) & 65535);
                    }
                    var valueA0B0 = valueA0 * valueB0;
                    var a0b0high = (valueA0B0 >>> 16);
                    var tempInt;
                    tempInt = valueA0B0 + ((c[csi]) & 65535);
                    c[csi] = (tempInt & 65535);
                    var valueA1B1 = valueA1 * valueB1;
                    var a1b1low = valueA1B1 & 65535;
                    var a1b1high = (valueA1B1 >>> 16);
                    tempInt = ((tempInt) >>> 16) + (valueA0B0 & 65535) + (d & 65535) + a1b1low + ((c[csi + 1]) & 65535);
                    c[csi + 1] = (tempInt & 65535);
                    tempInt = ((tempInt) >>> 16) + a1b1low + a0b0high + ((d) >>> 16) + a1b1high - (s & 65535) + ((c[csi + 2]) & 65535);
                    c[csi + 2] = (tempInt & 65535);
                    tempInt = ((tempInt) >>> 16) + a1b1high + ((c[csi + 3]) & 65535);
                    c[csi + 3] = (tempInt & 65535);
                    if ((tempInt >> 16) != 0) {
                        c[csi + 4] = ((c[csi + 4] + 1) & 65535);
                        c[csi + 5] = ((((c[csi + 5] + (((c[csi + 4] == 0) ? 1 : 0)|0)) & 65535))|0);
                    }
                }
            }
        }
    };
    constructor.Divide = function(remainderArr, remainderStart, quotientArr, quotientStart, tempArr, tempStart, words1, words1Start, words1Count, words2, words2Start, words2Count) {
        if (words2Count == 0) {
            throw new Error("division by zero");
        }
        if (words2Count == 1) {
            if (words2[words2Start] == 0) {
                throw new Error("division by zero");
            }
            var smallRemainder = (BigInteger.FastDivideAndRemainder(quotientArr, quotientStart, words1, words1Start, words1Count, words2[words2Start])) & 65535;
            remainderArr[remainderStart] = (smallRemainder & 65535);
            return;
        }
        var quot = quotientArr;
        if (quotientArr == null) {
            quot = [0, 0];
        }
        var valueTBstart = ((tempStart + (words1Count + 2))|0);
        var valueTPstart = ((tempStart + (words1Count + 2 + words2Count))|0);
        {
            var shiftWords = ((words2[words2Start + words2Count - 1] == 0 ? 1 : 0)|0);
            tempArr[valueTBstart] = 0;
            tempArr[valueTBstart + words2Count - 1] = 0;
            {
                var arrfillSrc = words2Start;
                var arrfillDst = ((valueTBstart + shiftWords)|0);
                for (var arrfillI = 0; arrfillI < words2Count - shiftWords; arrfillI++) tempArr[arrfillDst + arrfillI] = words2[arrfillSrc + arrfillI];
            }
            var shiftBits = ((16 - BigInteger.BitPrecision(tempArr[valueTBstart + words2Count - 1])) & 65535);
            BigInteger.ShiftWordsLeftByBits(tempArr, valueTBstart, words2Count, shiftBits);
            tempArr[0] = 0;
            tempArr[words1Count] = 0;
            tempArr[words1Count + 1] = 0;
            {
                var arrfillSrc = words1Start;
                var arrfillDst = ((tempStart + shiftWords)|0);
                for (var arrfillI = 0; arrfillI < words1Count; arrfillI++) tempArr[arrfillDst + arrfillI] = words1[arrfillSrc + arrfillI];
            }
            BigInteger.ShiftWordsLeftByBits(tempArr, tempStart, words1Count + 2, shiftBits);
            if (tempArr[tempStart + words1Count + 1] == 0 && ((tempArr[tempStart + words1Count]) & 65535) <= 1) {
                if (quotientArr != null) {
                    quotientArr[quotientStart + words1Count - words2Count + 1] = 0;
                    quotientArr[quotientStart + words1Count - words2Count] = 0;
                }
                while (tempArr[words1Count] != 0 || BigInteger.Compare(tempArr, ((tempStart + words1Count - words2Count)|0), tempArr, valueTBstart, words2Count) >= 0) {
                    tempArr[words1Count] = ((((tempArr[words1Count] - ((BigInteger.Subtract(tempArr, tempStart + words1Count - words2Count, tempArr, tempStart + words1Count - words2Count, tempArr, valueTBstart, words2Count))|0)) & 65535))|0);
                    if (quotientArr != null) {
                        quotientArr[quotientStart + words1Count - words2Count] = ((quotientArr[quotientStart + words1Count - words2Count] + 1) & 65535);
                    }
                }
            } else {
                words1Count = words1Count + (2);
            }
            var valueBT0 = ((tempArr[valueTBstart + words2Count - 2] + 1) & 65535);
            var valueBT1 = ((((tempArr[valueTBstart + words2Count - 1] + ((valueBT0 == 0 ? 1 : 0)|0)) & 65535))|0);
            var valueTAtomic = [0, 0, 0, 0];
            for (var i = words1Count - 2; i >= words2Count; i -= 2) {
                var qs = (quotientArr == null) ? 0 : quotientStart + i - words2Count;
                BigInteger.DivideFourWordsByTwo(quot, qs, tempArr, tempStart + i - 2, valueBT0, valueBT1, valueTAtomic);
                var valueRstart2 = tempStart + i - words2Count;
                var n = words2Count;
                {
                    var quotient0 = quot[qs];
                    var quotient1 = quot[qs + 1];
                    if (quotient1 == 0) {
                        var carry = ((((BigInteger.LinearMultiply(tempArr, valueTPstart, tempArr, valueTBstart, (quotient0|0), n)) & 65535))|0);
                        tempArr[valueTPstart + n] = (carry & 65535);
                        tempArr[valueTPstart + n + 1] = 0;
                    } else if (n == 2) {
                        BigInteger.BaselineMultiply2(tempArr, valueTPstart, quot, qs, tempArr, valueTBstart);
                    } else {
                        tempArr[valueTPstart + n] = 0;
                        tempArr[valueTPstart + n + 1] = 0;
                        quotient0 &= 65535;
                        quotient1 &= 65535;
                        BigInteger.AtomicMultiplyOpt(tempArr, valueTPstart, quotient0, quotient1, tempArr, valueTBstart, 0, n);
                        BigInteger.AtomicMultiplyAddOpt(tempArr, valueTPstart, quotient0, quotient1, tempArr, valueTBstart, 2, n);
                    }
                    BigInteger.Subtract(tempArr, valueRstart2, tempArr, valueRstart2, tempArr, valueTPstart, n + 2);
                    while (tempArr[valueRstart2 + n] != 0 || BigInteger.Compare(tempArr, valueRstart2, tempArr, valueTBstart, n) >= 0) {
                        tempArr[valueRstart2 + n] = ((((tempArr[valueRstart2 + n] - ((BigInteger.Subtract(tempArr, valueRstart2, tempArr, valueRstart2, tempArr, valueTBstart, n))|0)) & 65535))|0);
                        if (quotientArr != null) {
                            quotientArr[qs] = ((quotientArr[qs] + 1) & 65535);
                            quotientArr[qs + 1] = ((((quotientArr[qs + 1] + (((quotientArr[qs] == 0) ? 1 : 0)|0)) & 65535))|0);
                        }
                    }
                }
            }
            if (remainderArr != null) {
                {
                    var arrfillSrc = ((tempStart + shiftWords)|0);
                    var arrfillDst = remainderStart;
                    for (var arrfillI = 0; arrfillI < words2Count; arrfillI++) remainderArr[arrfillDst + arrfillI] = tempArr[arrfillSrc + arrfillI];
                }
                BigInteger.ShiftWordsRightByBits(remainderArr, remainderStart, words2Count, shiftBits);
            }
        }
    };
    constructor.RoundupSize = function(n) {
        return n + (n & 1);
    };
    prototype['negative'] = prototype.negative = null;
    prototype['wordCount'] = prototype.wordCount = null;
    prototype['words'] = prototype.words = null;

    constructor['fromByteArray'] = constructor.fromByteArray = function(bytes, littleEndian) {
        if (bytes == null) {
            throw new Error("bytes");
        }
        if (bytes.length == 0) {
            return BigInteger.ZERO;
        }
        if (bytes == null) {
            throw new Error("bytes");
        }
        var len = bytes.length;
        var wordLength = ((len|0) + 1) >> 1;
        wordLength = BigInteger.RoundupSize(wordLength);
        var newreg = [];
        for (var arrfillI = 0; arrfillI < wordLength; arrfillI++) newreg[arrfillI] = 0;
        var valueJIndex = littleEndian ? len - 1 : 0;
        var numIsNegative = (bytes[valueJIndex] & 128) != 0;
        var newnegative = numIsNegative;
        var j = 0;
        if (!numIsNegative) {
            for (var i = 0; i < len; i += 2, j++) {
                var index = littleEndian ? i : len - 1 - i;
                var index2 = littleEndian ? i + 1 : len - 2 - i;
                newreg[j] = (bytes[index] & 255);
                if (index2 >= 0 && index2 < len) {
                    newreg[j] = ((((newreg[j] | (((((bytes[index2])|0) << 8)|0))) & 65535))|0);
                }
            }
        } else {
            for (var i = 0; i < len; i += 2, j++) {
                var index = littleEndian ? i : len - 1 - i;
                var index2 = littleEndian ? i + 1 : len - 2 - i;
                newreg[j] = (bytes[index] & 255);
                if (index2 >= 0 && index2 < len) {
                    newreg[j] = ((((newreg[j] | (((((bytes[index2])|0) << 8)|0))) & 65535))|0);
                } else {

                    newreg[j] = ((newreg[j] | (65280)) & 65535);
                }
            }
            for (; j < newreg.length; ++j) {
                newreg[j] = (65535 & 65535);
            }

            BigInteger.TwosComplement(newreg, 0, ((newreg.length)|0));
        }
        var newwordCount = newreg.length;
        while (newwordCount != 0 && newreg[newwordCount - 1] == 0) {
            --newwordCount;
        }
        return (newwordCount == 0) ? BigInteger.ZERO : (new BigInteger(newwordCount, newreg, newnegative));
    };
    constructor.GrowForCarry = function(a, carry) {
        var oldLength = a.length;
        var ret = BigInteger.CleanGrow(a, BigInteger.RoundupSize(oldLength + 1));
        ret[oldLength] = (carry & 65535);
        return ret;
    };
    constructor.CleanGrow = function(a, size) {
        if (size > a.length) {
            var newa = [];
            for (var arrfillI = 0; arrfillI < size; arrfillI++) newa[arrfillI] = 0;
            for (var arrfillI = 0; arrfillI < a.length; arrfillI++) newa[arrfillI] = a[arrfillI];
            return newa;
        }
        return a;
    };

    prototype['testBit'] = prototype.testBit = function(index) {
        if (index < 0) {
            throw new Error("index");
        }
        if (this.wordCount == 0) {
            return false;
        }
        if (this.negative) {
            var tcindex = 0;
            var wordpos = ((index / 16)|0);
            if (wordpos >= this.words.length) {
                return true;
            }
            while (tcindex < wordpos && this.words[tcindex] == 0) {
                ++tcindex;
            }
            var tc;
            {
                tc = this.words[wordpos];
                if (tcindex == wordpos) {
                    --tc;
                }
                tc = ((~tc)|0);
            }
            return (((tc >> (index & 15)) & 1) != 0);
        }
        return this.GetUnsignedBit(index);
    };
    prototype.GetUnsignedBit = function(n) {
        return ((n >> 4) < this.words.length) && ((((this.words[n >> 4] >> (n & 15)) & 1) != 0));
    };

    prototype['toByteArray'] = prototype.toByteArray = function(littleEndian) {
        var sign = this.signum();
        if (sign == 0) {
            return [0];
        }
        if (sign > 0) {
            var byteCount = this.ByteCount();
            var byteArrayLength = byteCount;
            if (this.GetUnsignedBit((byteCount * 8) - 1)) {
                ++byteArrayLength;
            }
            var bytes = [];
            for (var arrfillI = 0; arrfillI < byteArrayLength; arrfillI++) bytes[arrfillI] = 0;
            var j = 0;
            for (var i = 0; i < byteCount; i += 2, j++) {
                var index = littleEndian ? i : bytes.length - 1 - i;
                var index2 = littleEndian ? i + 1 : bytes.length - 2 - i;
                bytes[index] = ((this.words[j] & 255)|0);
                if (index2 >= 0 && index2 < byteArrayLength) {
                    bytes[index2] = ((this.words[j] >> 8) & 255);
                }
            }
            return bytes;
        } else {
            var regdata = [];
            for (var arrfillI = 0; arrfillI < this.words.length; arrfillI++) regdata[arrfillI] = 0;
            for (var arrfillI = 0; arrfillI < this.words.length; arrfillI++) regdata[arrfillI] = this.words[arrfillI];
            BigInteger.TwosComplement(regdata, 0, ((regdata.length)|0));
            var byteCount = regdata.length * 2;
            for (var i = regdata.length - 1; i >= 0; --i) {
                if (regdata[i] == (65535)) {
                    byteCount -= 2;
                } else if ((regdata[i] & 65408) == 65408) {

                    --byteCount;
                    break;
                } else if ((regdata[i] & 32768) == 32768) {

                    break;
                } else {

                    ++byteCount;
                    break;
                }
            }
            if (byteCount == 0) {
                byteCount = 1;
            }
            var bytes = [];
            for (var arrfillI = 0; arrfillI < byteCount; arrfillI++) bytes[arrfillI] = 0;
            bytes[littleEndian ? bytes.length - 1 : 0] = 255;
            byteCount = (byteCount < regdata.length * 2 ? byteCount : regdata.length * 2);
            var j = 0;
            for (var i = 0; i < byteCount; i += 2, j++) {
                var index = littleEndian ? i : bytes.length - 1 - i;
                var index2 = littleEndian ? i + 1 : bytes.length - 2 - i;
                bytes[index] = (regdata[j] & 255);
                if (index2 >= 0 && index2 < byteCount) {
                    bytes[index2] = ((regdata[j] >> 8) & 255);
                }
            }
            return bytes;
        }
    };

    prototype['shiftLeft'] = prototype.shiftLeft = function(numberBits) {
        if (numberBits == 0 || this.wordCount == 0) {
            return this;
        }
        if (numberBits < 0) {
            return (numberBits == -2147483648) ? this.shiftRight(1).shiftRight(2147483647) : this.shiftRight(-numberBits);
        }
        var numWords = ((this.wordCount)|0);
        var shiftWords = ((numberBits >> 4)|0);
        var shiftBits = (numberBits & 15);
        if (!this.negative) {
            var ret = [];
            for (var arrfillI = 0; arrfillI < BigInteger.RoundupSize(numWords + BigInteger.BitsToWords(numberBits|0)); arrfillI++) ret[arrfillI] = 0;
            for (var arrfillI = 0; arrfillI < numWords; arrfillI++) ret[shiftWords + arrfillI] = this.words[arrfillI];
            BigInteger.ShiftWordsLeftByBits(ret, (shiftWords|0), numWords + BigInteger.BitsToWords(shiftBits), shiftBits);
            return new BigInteger(BigInteger.CountWords(ret, ret.length), ret, false);
        } else {
            var ret = [];
            for (var arrfillI = 0; arrfillI < BigInteger.RoundupSize(numWords + BigInteger.BitsToWords(numberBits|0)); arrfillI++) ret[arrfillI] = 0;
            for (var arrfillI = 0; arrfillI < numWords; arrfillI++) ret[arrfillI] = this.words[arrfillI];
            BigInteger.TwosComplement(ret, 0, ((ret.length)|0));
            BigInteger.ShiftWordsLeftByWords(ret, 0, numWords + shiftWords, shiftWords);
            BigInteger.ShiftWordsLeftByBits(ret, (shiftWords|0), numWords + BigInteger.BitsToWords(shiftBits), shiftBits);
            BigInteger.TwosComplement(ret, 0, ((ret.length)|0));
            return new BigInteger(BigInteger.CountWords(ret, ret.length), ret, true);
        }
    };

    prototype['shiftRight'] = prototype.shiftRight = function(numberBits) {
        if (numberBits == 0 || this.wordCount == 0) {
            return this;
        }
        if (numberBits < 0) {
            return (numberBits == -2147483648) ? this.shiftLeft(1).shiftLeft(2147483647) : this.shiftLeft(-numberBits);
        }
        var numWords = ((this.wordCount)|0);
        var shiftWords = ((numberBits >> 4)|0);
        var shiftBits = (numberBits & 15);
        var ret;
        var retWordCount;
        if (this.negative) {
            ret = [];
            for (var arrfillI = 0; arrfillI < this.words.length; arrfillI++) ret[arrfillI] = 0;
            for (var arrfillI = 0; arrfillI < numWords; arrfillI++) ret[arrfillI] = this.words[arrfillI];
            BigInteger.TwosComplement(ret, 0, ((ret.length)|0));
            BigInteger.ShiftWordsRightByWordsSignExtend(ret, 0, numWords, shiftWords);
            if (numWords > shiftWords) {
                BigInteger.ShiftWordsRightByBitsSignExtend(ret, 0, numWords - shiftWords, shiftBits);
            }
            BigInteger.TwosComplement(ret, 0, ((ret.length)|0));
            retWordCount = ret.length;
        } else {
            if (shiftWords >= numWords) {
                return BigInteger.ZERO;
            }
            ret = [];
            for (var arrfillI = 0; arrfillI < this.words.length; arrfillI++) ret[arrfillI] = 0;
            for (var arrfillI = 0; arrfillI < numWords - shiftWords; arrfillI++) ret[arrfillI] = this.words[shiftWords + arrfillI];
            if (shiftBits != 0) {
                BigInteger.ShiftWordsRightByBits(ret, 0, numWords - shiftWords, shiftBits);
            }
            retWordCount = numWords - shiftWords;
        }
        while (retWordCount != 0 && ret[retWordCount - 1] == 0) {
            --retWordCount;
        }
        if (retWordCount == 0) {
            return BigInteger.ZERO;
        }
        if (shiftWords > 2) {
            ret = BigInteger.ShortenArray(ret, retWordCount);
        }
        return new BigInteger(retWordCount, ret, this.negative);
    };

    constructor['valueOf'] = constructor.valueOf = function(longerValue_obj) {
        var longerValue = JSInteropFactory.createLong(longerValue_obj);
        if (longerValue.signum() == 0) {
            return BigInteger.ZERO;
        }
        if (longerValue.equalsInt(1)) {
            return BigInteger.ONE;
        }
        var retreg;
        var retnegative;
        var retwordcount;
        {
            retnegative = longerValue.signum() < 0;
            retreg = [0, 0, 0, 0];
            if (longerValue.equals(JSInteropFactory.LONG_MIN_VALUE())) {
                retreg[0] = 0;
                retreg[1] = 0;
                retreg[2] = 0;
                retreg[3] = (32768 & 65535);
                retwordcount = 4;
            } else {
                var ut = longerValue;
                if (ut.signum() < 0) {
                    ut = ut.negate();
                }
                retreg[0] = ((ut.andInt(65535).shortValue()) & 65535);
                ut = ut.shiftRight(16);
                retreg[1] = ((ut.andInt(65535).shortValue()) & 65535);
                ut = ut.shiftRight(16);
                retreg[2] = ((ut.andInt(65535).shortValue()) & 65535);
                ut = ut.shiftRight(16);
                retreg[3] = ((ut.andInt(65535).shortValue()) & 65535);

                retwordcount = 4;
                while (retwordcount != 0 && retreg[retwordcount - 1] == 0) {
                    --retwordcount;
                }
            }
        }
        return new BigInteger(retwordcount, retreg, retnegative);
    };

    prototype['intValueChecked'] = prototype.intValueChecked = function() {
        var count = this.wordCount;
        if (count == 0) {
            return 0;
        }
        if (count > 2) {
            throw new Error();
        }
        if (count == 2 && (this.words[1] & 32768) != 0) {
            if (this.negative && this.words[1] == (32768) && this.words[0] == 0) {
                return -2147483648;
            }
            throw new Error();
        }
        return this.intValueUnchecked();
    };

    prototype['intValueUnchecked'] = prototype.intValueUnchecked = function() {
        var c = ((this.wordCount)|0);
        if (c == 0) {
            return 0;
        }
        var intRetValue = (this.words[0]) & 65535;
        if (c > 1) {
            intRetValue |= ((this.words[1]) & 65535) << 16;
        }
        if (this.negative) {
            intRetValue = (intRetValue - 1);
            intRetValue = (~intRetValue);
        }
        return intRetValue;
    };

    prototype['longValueChecked'] = prototype.longValueChecked = function() {
        var count = this.wordCount;
        if (count == 0) {
            return JSInteropFactory.createLong(0);
        }
        if (count > 4) {
            throw new Error();
        }
        if (count == 4 && (this.words[3] & 32768) != 0) {
            if (this.negative && this.words[3] == (32768) && this.words[2] == 0 && this.words[1] == 0 && this.words[0] == 0) {
                return JSInteropFactory.LONG_MIN_VALUE();
            }
            throw new Error();
        }
        return this.longValueUnchecked();
    };

    prototype['longValueUnchecked'] = prototype.longValueUnchecked = function() {
        var c = ((this.wordCount)|0);
        if (c == 0) {
            return JSInteropFactory.createLong(0);
        }
        var ivv;
        var intRetValue = (this.words[0]) & 65535;
        if (c > 1) {
            intRetValue |= ((this.words[1]) & 65535) << 16;
        }
        if (c > 2) {
            var intRetValue2 = (this.words[2]) & 65535;
            if (c > 3) {
                intRetValue2 |= ((this.words[3]) & 65535) << 16;
            }
            if (this.negative) {
                if (intRetValue == 0) {
                    intRetValue = (intRetValue - 1);
                    intRetValue2 = (intRetValue2 - 1);
                } else {
                    intRetValue = (intRetValue - 1);
                }
                intRetValue = (~intRetValue);
                intRetValue2 = (~intRetValue2);
            }
            ivv = (JSInteropFactory.createLong(intRetValue)).andInt((~0)|0);
            ivv = ivv.or((JSInteropFactory.createLong(intRetValue2)).shiftLeft(32));
            return ivv;
        }
        ivv = (JSInteropFactory.createLong(intRetValue)).andInt((~0)|0);
        if (this.negative) {
            ivv = ivv.negate();
        }
        return ivv;
    };

    prototype['intValue'] = prototype.intValue = function() {
        return this.intValueChecked();
    };

    prototype['canFitInInt'] = prototype.canFitInInt = function() {
        var c = ((this.wordCount)|0);
        if (c > 2) {
            return false;
        }
        if (c == 2 && (this.words[1] & 32768) != 0) {
            return this.negative && this.words[1] == (32768) && this.words[0] == 0;
        }
        return true;
    };
    prototype.HasSmallValue = function() {
        var c = ((this.wordCount)|0);
        if (c > 4) {
            return false;
        }
        if (c == 4 && (this.words[3] & 32768) != 0) {
            return this.negative && this.words[3] == (32768) && this.words[2] == 0 && this.words[1] == 0 && this.words[0] == 0;
        }
        return true;
    };

    prototype['longValue'] = prototype.longValue = function() {
        return this.longValueChecked();
    };

    prototype['PowBigIntVar'] = prototype.PowBigIntVar = function(power) {
        if (power == null) {
            throw new Error("power");
        }
        var sign = power.signum();
        if (sign < 0) {
            throw new Error("sign (" + sign + ") is less than 0");
        }
        var thisVar = this;
        if (sign == 0) {
            return BigInteger.ONE;
        }
        if (power.equals(BigInteger.ONE)) {
            return this;
        }
        if (power.wordCount == 1 && power.words[0] == 2) {
            return thisVar.multiply(thisVar);
        }
        if (power.wordCount == 1 && power.words[0] == 3) {
            return (thisVar.multiply(thisVar)).multiply(thisVar);
        }
        var r = BigInteger.ONE;
        while (power.signum() != 0) {
            if (power.testBit(0)) {
                r = r.multiply(thisVar);
            }
            power = power.shiftRight(1);
            if (power.signum() != 0) {
                thisVar = thisVar.multiply(thisVar);
            }
        }
        return r;
    };

    prototype['pow'] = prototype.pow = function(powerSmall) {
        if (powerSmall < 0) {
            throw new Error("powerSmall (" + powerSmall + ") is less than 0");
        }
        var thisVar = this;
        if (powerSmall == 0) {

            return BigInteger.ONE;
        }
        if (powerSmall == 1) {
            return this;
        }
        if (powerSmall == 2) {
            return thisVar.multiply(thisVar);
        }
        if (powerSmall == 3) {
            return (thisVar.multiply(thisVar)).multiply(thisVar);
        }
        var r = BigInteger.ONE;
        while (powerSmall != 0) {
            if ((powerSmall & 1) != 0) {
                r = r.multiply(thisVar);
            }
            powerSmall >>= 1;
            if (powerSmall != 0) {
                thisVar = thisVar.multiply(thisVar);
            }
        }
        return r;
    };

    prototype['negate'] = prototype.negate = function() {
        return this.wordCount == 0 ? this : new BigInteger(this.wordCount, this.words, !this.negative);
    };

    prototype['abs'] = prototype.abs = function() {
        return (this.wordCount == 0 || !this.negative) ? this : new BigInteger(this.wordCount, this.words, false);
    };
    prototype.ByteCount = function() {
        var wc = this.wordCount;
        if (wc == 0) {
            return 0;
        }
        var s = ((this.words[wc - 1]) & 65535);
        wc = (wc - 1) << 1;
        return (s == 0) ? wc : (((s >> 8) == 0) ? wc + 1 : wc + 2);
    };

    prototype['getUnsignedBitLength'] = prototype.getUnsignedBitLength = function() {
        var wc = this.wordCount;
        if (wc != 0) {
            var numberValue = (this.words[wc - 1]) & 65535;
            wc = (wc - 1) << 4;
            if (numberValue == 0) {
                return wc;
            }
            wc = wc + (16);
            {
                if ((numberValue >> 8) == 0) {
                    numberValue <<= 8;
                    wc -= 8;
                }
                if ((numberValue >> 12) == 0) {
                    numberValue <<= 4;
                    wc -= 4;
                }
                if ((numberValue >> 14) == 0) {
                    numberValue <<= 2;
                    wc -= 2;
                }
                if ((numberValue >> 15) == 0) {
                    --wc;
                }
            }
            return wc;
        }
        return 0;
    };
    constructor.getUnsignedBitLengthEx = function(numberValue, wordCount) {
        var wc = wordCount;
        if (wc != 0) {
            wc = (wc - 1) << 4;
            if (numberValue == 0) {
                return wc;
            }
            wc = wc + (16);
            {
                if ((numberValue >> 8) == 0) {
                    numberValue <<= 8;
                    wc -= 8;
                }
                if ((numberValue >> 12) == 0) {
                    numberValue <<= 4;
                    wc -= 4;
                }
                if ((numberValue >> 14) == 0) {
                    numberValue <<= 2;
                    wc -= 2;
                }
                if ((numberValue >> 15) == 0) {
                    --wc;
                }
            }
            return wc;
        }
        return 0;
    };

    prototype['bitLength'] = prototype.bitLength = function() {
        var wc = this.wordCount;
        if (wc != 0) {
            if (this.negative) {
                return this.abs().subtract(BigInteger.ONE).bitLength();
            }
            var numberValue = (this.words[wc - 1]) & 65535;
            wc = (wc - 1) << 4;
            if (numberValue == 0) {
                return wc;
            }
            wc = wc + (16);
            {
                if ((numberValue >> 8) == 0) {
                    numberValue <<= 8;
                    wc -= 8;
                }
                if ((numberValue >> 12) == 0) {
                    numberValue <<= 4;
                    wc -= 4;
                }
                if ((numberValue >> 14) == 0) {
                    numberValue <<= 2;
                    wc -= 2;
                }
                return ((numberValue >> 15) == 0) ? wc - 1 : wc;
            }
        }
        return 0;
    };
    constructor.ReverseChars = function(chars, offset, length) {
        var half = length >> 1;
        var right = offset + length - 1;
        for (var i = 0; i < half; i++, right--) {
            var value = chars[offset + i];
            chars[offset + i] = chars[right];
            chars[right] = value;
        }
    };
    prototype.SmallValueToString = function() {
        var value = this.longValue();
        if (value.equals(JSInteropFactory.LONG_MIN_VALUE())) {
            return "-9223372036854775808";
        }
        var neg = value.signum() < 0;
        var chars = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        var count = 0;
        if (neg) {
            chars[0] = '-';
            ++count;
            value = value.negate();
        }
        while (value.signum() != 0) {
            var digit = BigInteger.Digits.charAt(value.remainderWithUnsignedDivisor(10).intValue());
            chars[count++] = digit;
            value = value.divideWithUnsignedDivisor(10);
        }
        if (neg) {
            BigInteger.ReverseChars(chars, 1, count - 1);
        } else {
            BigInteger.ReverseChars(chars, 0, count);
        }
        var tmpbuilder = JSInteropFactory.createStringBuilder(16);
        for (var arrfillI = 0; arrfillI < count; arrfillI++) tmpbuilder.append(chars[arrfillI]);
        return tmpbuilder.toString();
    };
    constructor.ApproxLogTenOfTwo = function(bitlen) {
        var bitlenLow = bitlen & 65535;
        var bitlenHigh = (bitlen >>> 16);
        var resultLow = 0;
        var resultHigh = 0;
        {
            var p;
            var c;
            var d;
            p = bitlenLow * 34043;
            d = ((p) >>> 16);
            c = (d|0);
            d = ((d) >>> 16);
            p = bitlenLow * 8346;
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = bitlenHigh * 34043;
            p = p + (c & 65535);
            d = d + ((p) >>> 16);
            c = (d|0);
            d = ((d) >>> 16);
            p = bitlenLow * 154;
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = bitlenHigh * 8346;
            p = p + (c & 65535);
            c = (p|0);
            d = d + ((p) >>> 16);
            p = (c) & 65535;
            c = (p|0);
            resultLow = c;
            c = (d|0);
            d = ((d) >>> 16);
            p = bitlenHigh * 154;
            p = p + (c & 65535);
            resultHigh = (p|0);
            var result = (resultLow) & 65535;
            result |= (resultHigh & 65535) << 16;
            return (result & 2147483647) >> 9;
        }
    };

    prototype['getDigitCount'] = prototype.getDigitCount = function() {
        if (this.signum() == 0) {
            return 1;
        }
        if (this.HasSmallValue()) {
            var value = this.longValue();
            if (value.equals(JSInteropFactory.LONG_MIN_VALUE())) {
                return 19;
            }
            if (value.signum() < 0) {
                value = value.negate();
            }
            if (value.compareToInt(1000000000) >= 0) {
                return (value.compareToLongAsInts(-1486618624, 232830643) >= 0) ? 19 : ((value.compareToLongAsInts(1569325056, 23283064) >= 0) ? 18 : ((value.compareToLongAsInts(1874919424, 2328306) >= 0) ? 17 : ((value.compareToLongAsInts(-1530494976, 232830) >= 0) ? 16 : ((value.compareToLongAsInts(276447232, 23283) >= 0) ? 15 : ((value.compareToLongAsInts(1316134912, 2328) >= 0) ? 14 : ((value.compareToLongAsInts(-727379968, 232) >= 0) ? 13 : ((value.compareToLongAsInts(1215752192, 23) >= 0) ? 12 : ((value.compareToLongAsInts(1410065408, 2) >= 0) ? 11 : ((value.compareToInt(1000000000) >= 0) ? 10 : 9)))))))));
            } else {
                var v2 = value.intValue();
                return (v2 >= 100000000) ? 9 : ((v2 >= 10000000) ? 8 : ((v2 >= 1000000) ? 7 : ((v2 >= 100000) ? 6 : ((v2 >= 10000) ? 5 : ((v2 >= 1000) ? 4 : ((v2 >= 100) ? 3 : ((v2 >= 10) ? 2 : 1)))))));
            }
        }
        var bitlen = this.getUnsignedBitLength();
        if (bitlen <= 2135) {

            var minDigits = 1 + (((bitlen - 1) * 631305) >> 21);
            var maxDigits = 1 + ((bitlen * 631305) >> 21);
            if (minDigits == maxDigits) {

                return minDigits;
            }
        } else if (bitlen <= 6432162) {

            var minDigits = BigInteger.ApproxLogTenOfTwo(bitlen - 1);
            var maxDigits = BigInteger.ApproxLogTenOfTwo(bitlen);
            if (minDigits == maxDigits) {

                return 1 + minDigits;
            }
        }
        var tempReg = null;
        var currentCount = this.wordCount;
        var i = 0;
        while (currentCount != 0) {
            if (currentCount == 1 || (currentCount == 2 && tempReg[1] == 0)) {
                var rest = (tempReg[0]) & 65535;
                if (rest >= 10000) {
                    i = i + (5);
                } else if (rest >= 1000) {
                    i = i + (4);
                } else if (rest >= 100) {
                    i = i + (3);
                } else if (rest >= 10) {
                    i = i + (2);
                } else {
                    ++i;
                }
                break;
            }
            if (currentCount == 2 && tempReg[1] > 0 && tempReg[1] <= 32767) {
                var rest = (tempReg[0]) & 65535;
                rest |= ((tempReg[1]) & 65535) << 16;
                if (rest >= 1000000000) {
                    i = i + (10);
                } else if (rest >= 100000000) {
                    i = i + (9);
                } else if (rest >= 10000000) {
                    i = i + (8);
                } else if (rest >= 1000000) {
                    i = i + (7);
                } else if (rest >= 100000) {
                    i = i + (6);
                } else if (rest >= 10000) {
                    i = i + (5);
                } else if (rest >= 1000) {
                    i = i + (4);
                } else if (rest >= 100) {
                    i = i + (3);
                } else if (rest >= 10) {
                    i = i + (2);
                } else {
                    ++i;
                }
                break;
            } else {
                var wci = currentCount;
                var remainderShort = 0;
                var quo, rem;
                var firstdigit = false;
                var dividend = (tempReg == null) ? (this.words) : tempReg;

                while ((wci--) > 0) {
                    var curValue = (dividend[wci]) & 65535;
                    var currentDividend = (((curValue | ((remainderShort|0) << 16))|0));
                    quo = ((currentDividend / 10000)|0);
                    if (!firstdigit && quo != 0) {
                        firstdigit = true;

                        bitlen = BigInteger.getUnsignedBitLengthEx(quo, wci + 1);
                        if (bitlen <= 2135) {

                            var minDigits = 1 + (((bitlen - 1) * 631305) >> 21);
                            var maxDigits = 1 + ((bitlen * 631305) >> 21);
                            if (minDigits == maxDigits) {

                                return i + minDigits + 4;
                            }
                        } else if (bitlen <= 6432162) {

                            var minDigits = BigInteger.ApproxLogTenOfTwo(bitlen - 1);
                            var maxDigits = BigInteger.ApproxLogTenOfTwo(bitlen);
                            if (minDigits == maxDigits) {

                                return i + 1 + minDigits + 4;
                            }
                        }
                    }
                    if (tempReg == null) {
                        if (quo != 0) {
                            tempReg = [];
                            for (var arrfillI = 0; arrfillI < this.wordCount; arrfillI++) tempReg[arrfillI] = 0;
                            for (var arrfillI = 0; arrfillI < tempReg.length; arrfillI++) tempReg[arrfillI] = this.words[arrfillI];

                            currentCount = wci + 1;
                            tempReg[wci] = (quo & 65535);
                        }
                    } else {
                        tempReg[wci] = (quo & 65535);
                    }
                    rem = currentDividend - (10000 * quo);
                    remainderShort = (rem|0);
                }

                while (currentCount != 0 && tempReg[currentCount - 1] == 0) {
                    --currentCount;
                }
                i = i + (4);
            }
        }
        return i;
    };
    constructor.Digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    prototype['toRadixString'] = prototype.toRadixString = function(radix) {
        if (radix < 2) {
            throw new Error("radix (" + radix + ") is less than 2");
        }
        if (radix > 36) {
            throw new Error("radix (" + radix + ") is more than 36");
        }
        if (this.wordCount == 0) {
            return "0";
        }
        if (radix == 10) {

            if (this.HasSmallValue()) {
                return this.SmallValueToString();
            }
            var tempReg = [];
            for (var arrfillI = 0; arrfillI < this.wordCount; arrfillI++) tempReg[arrfillI] = 0;
            for (var arrfillI = 0; arrfillI < tempReg.length; arrfillI++) tempReg[arrfillI] = this.words[arrfillI];
            var numWordCount = tempReg.length;
            while (numWordCount != 0 && tempReg[numWordCount - 1] == 0) {
                --numWordCount;
            }
            var i = 0;
            var s = [];
            for (var arrfillI = 0; arrfillI < (numWordCount << 4) + 1; arrfillI++) s[arrfillI] = 0;
            while (numWordCount != 0) {
                if (numWordCount == 1 && tempReg[0] > 0 && tempReg[0] <= 32767) {
                    var rest = tempReg[0];
                    while (rest != 0) {

                        var newrest = (rest * 26215) >> 18;
                        s[i++] = BigInteger.Digits.charAt(rest - (newrest * 10));
                        rest = newrest;
                    }
                    break;
                }
                if (numWordCount == 2 && tempReg[1] > 0 && tempReg[1] <= 32767) {
                    var rest = (tempReg[0]) & 65535;
                    rest |= ((tempReg[1]) & 65535) << 16;
                    while (rest != 0) {
                        var newrest = ((rest / 10)|0);
                        s[i++] = BigInteger.Digits.charAt(rest - (newrest * 10));
                        rest = newrest;
                    }
                    break;
                } else {
                    var wci = numWordCount;
                    var remainderShort = 0;
                    var quo, rem;

                    while ((wci--) > 0) {
                        var currentDividend = (((((tempReg[wci]) & 65535) | ((remainderShort|0) << 16))|0));
                        quo = ((currentDividend / 10000)|0);
                        tempReg[wci] = (quo & 65535);
                        rem = currentDividend - (10000 * quo);
                        remainderShort = (rem|0);
                    }
                    var remainderSmall = remainderShort;

                    while (numWordCount != 0 && tempReg[numWordCount - 1] == 0) {
                        --numWordCount;
                    }

                    var newrest = (remainderSmall * 3277) >> 15;
                    s[i++] = BigInteger.Digits.charAt((remainderSmall - (newrest * 10))|0);
                    remainderSmall = newrest;
                    newrest = (remainderSmall * 3277) >> 15;
                    s[i++] = BigInteger.Digits.charAt((remainderSmall - (newrest * 10))|0);
                    remainderSmall = newrest;
                    newrest = (remainderSmall * 3277) >> 15;
                    s[i++] = BigInteger.Digits.charAt((remainderSmall - (newrest * 10))|0);
                    remainderSmall = newrest;
                    s[i++] = BigInteger.Digits.charAt(remainderSmall);
                }
            }
            BigInteger.ReverseChars(s, 0, i);
            if (this.negative) {
                var sb = JSInteropFactory.createStringBuilder(i + 1);
                sb.append('-');
                for (var arrfillI = 0; arrfillI < (0) + (i); arrfillI++) sb.append(s[arrfillI]);
                return sb.toString();
            }
            var tmpbuilder = JSInteropFactory.createStringBuilder(16);
            for (var arrfillI = 0; arrfillI < i; arrfillI++) tmpbuilder.append(s[arrfillI]);
            return tmpbuilder.toString();
        }
        if (radix == 16) {

            var sb = JSInteropFactory.createStringBuilder(16);
            if (this.negative) {
                sb.append('-');
            }
            var firstBit = true;
            var word = this.words[this.wordCount - 1];
            for (var i = 0; i < 4; ++i) {
                if (!firstBit || (word & 61440) != 0) {
                    sb.append(BigInteger.Digits.charAt((word >> 12) & 15));
                    firstBit = false;
                }
                word <<= 4;
            }
            for (var j = this.wordCount - 2; j >= 0; --j) {
                word = this.words[j];
                for (var i = 0; i < 4; ++i) {
                    sb.append(BigInteger.Digits.charAt((word >> 12) & 15));
                    word <<= 4;
                }
            }
            return sb.toString();
        }
        if (radix == 2) {

            var sb = JSInteropFactory.createStringBuilder(16);
            if (this.negative) {
                sb.append('-');
            }
            var firstBit = true;
            var word = this.words[this.wordCount - 1];
            for (var i = 0; i < 16; ++i) {
                if (!firstBit || (word & 32768) != 0) {
                    sb.append((word & 32768) == 0 ? '0' : '1');
                    firstBit = false;
                }
                word <<= 1;
            }
            for (var j = this.wordCount - 2; j >= 0; --j) {
                word = this.words[j];
                for (var i = 0; i < 16; ++i) {
                    sb.append((word & 32768) == 0 ? '0' : '1');
                    word <<= 1;
                }
            }
            return sb.toString();
        } else {

            var tempReg = [];
            for (var arrfillI = 0; arrfillI < this.wordCount; arrfillI++) tempReg[arrfillI] = 0;
            for (var arrfillI = 0; arrfillI < tempReg.length; arrfillI++) tempReg[arrfillI] = this.words[arrfillI];
            var numWordCount = tempReg.length;
            while (numWordCount != 0 && tempReg[numWordCount - 1] == 0) {
                --numWordCount;
            }
            var i = 0;
            var s = [];
            for (var arrfillI = 0; arrfillI < (numWordCount << 4) + 1; arrfillI++) s[arrfillI] = 0;
            while (numWordCount != 0) {
                if (numWordCount == 1 && tempReg[0] > 0 && tempReg[0] <= 32767) {
                    var rest = tempReg[0];
                    while (rest != 0) {
                        var newrest = ((rest / radix)|0);
                        s[i++] = BigInteger.Digits.charAt(rest - (newrest * radix));
                        rest = newrest;
                    }
                    break;
                }
                if (numWordCount == 2 && tempReg[1] > 0 && tempReg[1] <= 32767) {
                    var rest = (tempReg[0]) & 65535;
                    rest |= ((tempReg[1]) & 65535) << 16;
                    while (rest != 0) {
                        var newrest = ((rest / radix)|0);
                        s[i++] = BigInteger.Digits.charAt(rest - (newrest * radix));
                        rest = newrest;
                    }
                    break;
                } else {
                    var wci = numWordCount;
                    var remainderShort = 0;
                    var quo, rem;

                    while ((wci--) > 0) {
                        var currentDividend = (((((tempReg[wci]) & 65535) | ((remainderShort|0) << 16))|0));
                        quo = ((currentDividend / radix)|0);
                        tempReg[wci] = (quo & 65535);
                        rem = currentDividend - (radix * quo);
                        remainderShort = (rem|0);
                    }
                    var remainderSmall = remainderShort;

                    while (numWordCount != 0 && tempReg[numWordCount - 1] == 0) {
                        --numWordCount;
                    }
                    s[i++] = BigInteger.Digits.charAt(remainderSmall);
                }
            }
            BigInteger.ReverseChars(s, 0, i);
            if (this.negative) {
                var sb = JSInteropFactory.createStringBuilder(i + 1);
                sb.append('-');
                for (var arrfillI = 0; arrfillI < (0) + (i); arrfillI++) sb.append(s[arrfillI]);
                return sb.toString();
            }
            var tmpbuilder = JSInteropFactory.createStringBuilder(16);
            for (var arrfillI = 0; arrfillI < i; arrfillI++) tmpbuilder.append(s[arrfillI]);
            return tmpbuilder.toString();
        }
    };

    prototype['toString'] = prototype.toString = function() {
        if (this.signum() == 0) {
            return "0";
        }
        return this.HasSmallValue() ? this.SmallValueToString() : this.toRadixString(10);
    };

    constructor['fromString'] = constructor.fromString = function(str) {
        if (str == null) {
            throw new Error("str");
        }
        return BigInteger.fromRadixSubstring(str, 10, 0, str.length);
    };

    constructor['fromRadixString'] = constructor.fromRadixString = function(str, radix) {
        if (str == null) {
            throw new Error("str");
        }
        return BigInteger.fromRadixSubstring(str, radix, 0, str.length);
    };

    constructor['fromSubstring'] = constructor.fromSubstring = function(str, index, endIndex) {
        if (str == null) {
            throw new Error("str");
        }
        return BigInteger.fromRadixSubstring(str, 10, index, endIndex);
    };
    constructor.valueMaxSafeInts = [1073741823, 715827881, 536870911, 429496728, 357913940, 306783377, 268435455, 238609293, 214748363, 195225785, 178956969, 165191048, 153391688, 143165575, 134217727, 126322566, 119304646, 113025454, 107374181, 102261125, 97612892, 93368853, 89478484, 85899344, 82595523, 79536430, 76695843, 74051159, 71582787, 69273665, 67108863, 65075261, 63161282, 61356674, 59652322];
    constructor.valueCharToDigit = [36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 36, 36, 36, 36, 36, 36, 36, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 36, 36, 36, 36, 36, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 36, 36, 36, 36];

    constructor['fromRadixSubstring'] = constructor.fromRadixSubstring = function(str, radix, index, endIndex) {
        if (str == null) {
            throw new Error("str");
        }
        if (radix < 2) {
            throw new Error("radix (" + radix + ") is less than 2");
        }
        if (radix > 36) {
            throw new Error("radix (" + radix + ") is more than 36");
        }
        if (index < 0) {
            throw new Error("index (" + index + ") is less than " + "0");
        }
        if (index > str.length) {
            throw new Error("index (" + index + ") is more than " + str.length);
        }
        if (endIndex < 0) {
            throw new Error("endIndex (" + endIndex + ") is less than 0");
        }
        if (endIndex > str.length) {
            throw new Error("endIndex (" + endIndex + ") is more than " + str.length);
        }
        if (endIndex < index) {
            throw new Error("endIndex (" + endIndex + ") is less than " + index);
        }
        if (index == endIndex) {
            throw new Error("No digits");
        }
        var negative = false;
        if (str.charAt(index) == '-') {
            ++index;
            if (index == endIndex) {
                throw new Error("No digits");
            }
            negative = true;
        }

        for (; index < endIndex; ++index) {
            var c = str.charCodeAt(index);
            if (c != 48) {
                break;
            }
        }
        var effectiveLength = endIndex - index;
        if (effectiveLength == 0) {
            return BigInteger.ZERO;
        }
        var bigint;
        if (radix == 16) {

            var leftover = effectiveLength & 3;
            var wordCount = effectiveLength >> 2;
            if (leftover != 0) {
                ++wordCount;
            }
            bigint = [];
            for (var arrfillI = 0; arrfillI < wordCount + (wordCount & 1); arrfillI++) bigint[arrfillI] = 0;
            var currentDigit = wordCount - 1;

            if (leftover != 0) {
                var extraWord = 0;
                for (var i = 0; i < leftover; ++i) {
                    extraWord <<= 4;
                    var c = str.charCodeAt(index + i);
                    var digit = (c >= 128) ? 36 : BigInteger.valueCharToDigit[(c|0)];
                    if (digit >= 16) {
                        throw new Error("Illegal character found");
                    }
                    extraWord |= digit;
                }
                bigint[currentDigit] = (extraWord & 65535);
                --currentDigit;
                index = index + (leftover);
            }
            while (index < endIndex) {
                var c = str.charCodeAt(index + 3);
                var digit = (c >= 128) ? 36 : BigInteger.valueCharToDigit[(c|0)];
                var word = digit;
                c = str.charCodeAt(index + 2);
                digit = (c >= 128) ? 36 : BigInteger.valueCharToDigit[(c|0)];
                word |= digit << 4;
                c = str.charCodeAt(index + 1);
                digit = (c >= 128) ? 36 : BigInteger.valueCharToDigit[(c|0)];
                word |= digit << 8;
                c = str.charCodeAt(index);
                digit = (c >= 128) ? 36 : BigInteger.valueCharToDigit[(c|0)];
                word |= digit << 12;
                index = index + (4);
                bigint[currentDigit] = (word & 65535);
                --currentDigit;
            }
        } else {
            bigint = [0, 0, 0, 0];
            var haveSmallInt = true;
            var maxSafeInt = BigInteger.valueMaxSafeInts[radix - 2];
            var maxShortPlusOneMinusRadix = 65536 - radix;
            var smallInt = 0;
            for (var i = index; i < endIndex; ++i) {
                var c = str.charCodeAt(i);
                var digit = (c >= 128) ? 36 : BigInteger.valueCharToDigit[(c|0)];
                if (digit >= radix) {
                    throw new Error("Illegal character found");
                }
                if (haveSmallInt && smallInt < maxSafeInt) {
                    smallInt *= radix;
                    smallInt = smallInt + (digit);
                } else {
                    if (haveSmallInt) {
                        bigint[0] = (smallInt & 65535);
                        bigint[1] = ((smallInt) >>> 16);
                        haveSmallInt = false;
                    }

                    var carry = 0;
                    var n = bigint.length;
                    for (var j = 0; j < n; ++j) {
                        var p;
                        {
                            p = ((bigint[j]) & 65535) * radix;
                            p = p + (carry & 65535);
                            bigint[j] = (p & 65535);
                            carry = ((p >> 16)|0);
                        }
                    }
                    if (carry != 0) {
                        bigint = BigInteger.GrowForCarry(bigint, carry);
                    }

                    if (digit != 0) {
                        var d = bigint[0] & 65535;
                        if (d <= maxShortPlusOneMinusRadix) {
                            bigint[0] = ((d + digit) & 65535);
                        } else if (BigInteger.Increment(bigint, 0, bigint.length, (digit|0)) != 0) {
                            bigint = BigInteger.GrowForCarry(bigint, 1);
                        }
                    }
                }
            }
            if (haveSmallInt) {
                bigint[0] = (smallInt & 65535);
                bigint[1] = ((smallInt) >>> 16);
            }
        }
        var count = BigInteger.CountWords(bigint, bigint.length);
        return (count == 0) ? BigInteger.ZERO : new BigInteger(count, bigint, negative);
    };

    prototype['getLowestSetBit'] = prototype.getLowestSetBit = function() {
        var retSetBit = 0;
        for (var i = 0; i < this.wordCount; ++i) {
            var c = ((this.words[i]) & 65535);
            if (c == 0) {
                retSetBit = retSetBit + (16);
            } else {
                return (((c << 15) & 65535) != 0) ? (retSetBit + 0) : ((((c << 14) & 65535) != 0) ? (retSetBit + 1) : ((((c << 13) & 65535) != 0) ? (retSetBit + 2) : ((((c << 12) & 65535) != 0) ? (retSetBit + 3) : ((((c << 11) & 65535) != 0) ? (retSetBit + 4) : ((((c << 10) & 65535) != 0) ? (retSetBit + 5) : ((((c << 9) & 65535) != 0) ? (retSetBit + 6) : ((((c << 8) & 65535) != 0) ? (retSetBit + 7) : ((((c << 7) & 65535) != 0) ? (retSetBit + 8) : ((((c << 6) & 65535) != 0) ? (retSetBit + 9) : ((((c << 5) & 65535) != 0) ? (retSetBit + 10) : ((((c << 4) & 65535) != 0) ? (retSetBit + 11) : ((((c << 3) & 65535) != 0) ? (retSetBit + 12) : ((((c << 2) & 65535) != 0) ? (retSetBit + 13) : ((((c << 1) & 65535) != 0) ? (retSetBit + 14) : (retSetBit + 15)))))))))))))));
            }
        }
        return 0;
    };

    prototype['gcd'] = prototype.gcd = function(bigintSecond) {
        if (bigintSecond == null) {
            throw new Error("bigintSecond");
        }
        if (this.signum() == 0) {
            return (bigintSecond).abs();
        }
        if (bigintSecond.signum() == 0) {
            return (this).abs();
        }
        var thisValue = this.abs();
        bigintSecond = bigintSecond.abs();
        if (bigintSecond.equals(BigInteger.ONE) || thisValue.equals(bigintSecond)) {
            return bigintSecond;
        }
        if (thisValue.equals(BigInteger.ONE)) {
            return thisValue;
        }
        if (thisValue.wordCount <= 10 && bigintSecond.wordCount <= 10) {
            var expOfTwo = (thisValue.getLowestSetBit() < bigintSecond.getLowestSetBit() ? thisValue.getLowestSetBit() : bigintSecond.getLowestSetBit());
            while (true) {
                var bigintA = (thisValue.subtract(bigintSecond)).abs();
                if (bigintA.signum() == 0) {
                    if (expOfTwo != 0) {
                        thisValue = thisValue.shiftLeft(expOfTwo);
                    }
                    return thisValue;
                }
                var setbit = bigintA.getLowestSetBit();
                bigintA = bigintA.shiftRight(setbit);
                bigintSecond = (thisValue.compareTo(bigintSecond) < 0) ? thisValue : bigintSecond;
                thisValue = bigintA;
            }
        } else {
            var temp;
            while (thisValue.signum() != 0) {
                if (thisValue.compareTo(bigintSecond) < 0) {
                    temp = thisValue;
                    thisValue = bigintSecond;
                    bigintSecond = temp;
                }
                thisValue = thisValue.remainder(bigintSecond);
            }
            return bigintSecond;
        }
    };

    prototype['ModPow'] = prototype.ModPow = function(pow, mod) {
        if (pow == null) {
            throw new Error("pow");
        }
        if (pow.signum() < 0) {
            throw new Error("pow (" + pow + ") is less than 0");
        }
        if (mod.signum() <= 0) {
            throw new Error("mod (" + mod + ") is not greater than 0");
        }
        var r = BigInteger.ONE;
        var v = this;
        while (pow.signum() != 0) {
            if (pow.testBit(0)) {
                r = (r.multiply(v)).mod(mod);
            }
            pow = pow.shiftRight(1);
            if (pow.signum() != 0) {
                v = (v.multiply(v)).mod(mod);
            }
        }
        return r;
    };

    prototype['equals'] = prototype.equals = function(obj) {
        var other = ((obj.constructor==BigInteger) ? obj : null);
        if (other == null) {
            return false;
        }
        if (this.wordCount == other.wordCount) {
            if (this.negative != other.negative) {
                return false;
            }
            for (var i = 0; i < this.wordCount; ++i) {
                if (this.words[i] != other.words[i]) {
                    return false;
                }
            }
            return true;
        }
        return false;
    };

    prototype['hashCode'] = prototype.hashCode = function() {
        var hashCodeValue = 0;
        {
            hashCodeValue = hashCodeValue + (1000000007 * this.signum());
            if (this.words != null) {
                for (var i = 0; i < this.wordCount; ++i) {
                    hashCodeValue = hashCodeValue + (1000000013 * this.words[i]);
                }
            }
        }
        return hashCodeValue;
    };

    prototype['add'] = prototype.add = function(bigintAugend) {
        if (bigintAugend == null) {
            throw new Error("bigintAugend");
        }
        if (this.wordCount == 0) {
            return bigintAugend;
        }
        if (bigintAugend.wordCount == 0) {
            return this;
        }
        var sumreg;
        if (bigintAugend.wordCount == 1 && this.wordCount == 1) {
            if (this.negative == bigintAugend.negative) {
                var intSum = ((this.words[0]) & 65535) + ((bigintAugend.words[0]) & 65535);
                sumreg = [0, 0];
                sumreg[0] = (intSum & 65535);
                sumreg[1] = ((intSum) >>> 16);
                return new BigInteger(((intSum >> 16) == 0) ? 1 : 2, sumreg, this.negative);
            } else {
                var a = (this.words[0]) & 65535;
                var b = (bigintAugend.words[0]) & 65535;
                if (a == b) {
                    return BigInteger.ZERO;
                }
                if (a > b) {
                    a -= b;
                    sumreg = [0, 0];
                    sumreg[0] = (a & 65535);
                    return new BigInteger(1, sumreg, this.negative);
                }
                b -= a;
                sumreg = [0, 0];
                sumreg[0] = (b & 65535);
                return new BigInteger(1, sumreg, !this.negative);
            }
        }
        if ((!this.negative) == (!bigintAugend.negative)) {
            sumreg = [];
            for (var arrfillI = 0; arrfillI < ((this.words.length > bigintAugend.words.length ? this.words.length : bigintAugend.words.length)|0); arrfillI++) sumreg[arrfillI] = 0;

            var carry;
            var addendCount = this.wordCount;
            var augendCount = bigintAugend.wordCount;
            var desiredLength = (addendCount > augendCount ? addendCount : augendCount);
            if (addendCount == augendCount) {
                carry = BigInteger.AddOneByOne(sumreg, 0, this.words, 0, bigintAugend.words, 0, addendCount);
            } else if (addendCount > augendCount) {

                carry = BigInteger.AddOneByOne(sumreg, 0, this.words, 0, bigintAugend.words, 0, augendCount);
                for (var arrfillI = 0; arrfillI < addendCount - augendCount; arrfillI++) sumreg[augendCount + arrfillI] = this.words[augendCount + arrfillI];
                if (carry != 0) {
                    carry = BigInteger.Increment(sumreg, augendCount, addendCount - augendCount, (carry|0));
                }
            } else {

                carry = BigInteger.AddOneByOne(sumreg, 0, this.words, 0, bigintAugend.words, 0, (addendCount|0));
                for (var arrfillI = 0; arrfillI < augendCount - addendCount; arrfillI++) sumreg[addendCount + arrfillI] = bigintAugend.words[addendCount + arrfillI];
                if (carry != 0) {
                    carry = BigInteger.Increment(sumreg, addendCount, ((augendCount - addendCount)|0), (carry|0));
                }
            }
            var needShorten = true;
            if (carry != 0) {
                var nextIndex = desiredLength;
                var len = BigInteger.RoundupSize(nextIndex + 1);
                sumreg = BigInteger.CleanGrow(sumreg, len);
                sumreg[nextIndex] = (carry & 65535);
                needShorten = false;
            }
            var sumwordCount = BigInteger.CountWords(sumreg, sumreg.length);
            if (sumwordCount == 0) {
                return BigInteger.ZERO;
            }
            if (needShorten) {
                sumreg = BigInteger.ShortenArray(sumreg, sumwordCount);
            }
            return new BigInteger(sumwordCount, sumreg, this.negative);
        }
        var minuend = this;
        var subtrahend = bigintAugend;
        if (this.negative) {

            minuend = bigintAugend;
            subtrahend = this;
        }

        var words1Size = minuend.wordCount;
        words1Size = words1Size + (words1Size & 1);
        var words2Size = subtrahend.wordCount;
        words2Size = words2Size + (words2Size & 1);
        var diffNeg = false;
        var borrow;
        var diffReg = [];
        for (var arrfillI = 0; arrfillI < ((minuend.words.length > subtrahend.words.length ? minuend.words.length : subtrahend.words.length)|0); arrfillI++) diffReg[arrfillI] = 0;
        if (words1Size == words2Size) {
            if (BigInteger.Compare(minuend.words, 0, subtrahend.words, 0, (words1Size|0)) >= 0) {

                BigInteger.Subtract(diffReg, 0, minuend.words, 0, subtrahend.words, 0, words1Size);
            } else {

                BigInteger.Subtract(diffReg, 0, subtrahend.words, 0, minuend.words, 0, words1Size);
                diffNeg = true;
            }
        } else if (words1Size > words2Size) {

            borrow = ((BigInteger.Subtract(diffReg, 0, minuend.words, 0, subtrahend.words, 0, words2Size))|0);
            for (var arrfillI = 0; arrfillI < words1Size - words2Size; arrfillI++) diffReg[words2Size + arrfillI] = minuend.words[words2Size + arrfillI];
            BigInteger.Decrement(diffReg, words2Size, ((words1Size - words2Size)|0), borrow);
        } else {

            borrow = ((BigInteger.Subtract(diffReg, 0, subtrahend.words, 0, minuend.words, 0, words1Size))|0);
            for (var arrfillI = 0; arrfillI < words2Size - words1Size; arrfillI++) diffReg[words1Size + arrfillI] = subtrahend.words[words1Size + arrfillI];
            BigInteger.Decrement(diffReg, words1Size, ((words2Size - words1Size)|0), borrow);
            diffNeg = true;
        }
        var count = BigInteger.CountWords(diffReg, diffReg.length);
        if (count == 0) {
            return BigInteger.ZERO;
        }
        diffReg = BigInteger.ShortenArray(diffReg, count);
        return new BigInteger(count, diffReg, diffNeg);
    };

    prototype['subtract'] = prototype.subtract = function(subtrahend) {
        if (subtrahend == null) {
            throw new Error("subtrahend");
        }
        return (this.wordCount == 0) ? subtrahend.negate() : ((subtrahend.wordCount == 0) ? this : this.add(subtrahend.negate()));
    };
    constructor.ShortenArray = function(reg, wordCount) {
        if (reg.length > 32) {
            var newLength = BigInteger.RoundupSize(wordCount);
            if (newLength < reg.length && (reg.length - newLength) >= 16) {

                var newreg = [];
                for (var arrfillI = 0; arrfillI < newLength; arrfillI++) newreg[arrfillI] = 0;
                for (var arrfillI = 0; arrfillI < (newLength < reg.length ? newLength : reg.length); arrfillI++) newreg[arrfillI] = reg[arrfillI];
                reg = newreg;
            }
        }
        return reg;
    };

    prototype['multiply'] = prototype.multiply = function(bigintMult) {
        if (bigintMult == null) {
            throw new Error("bigintMult");
        }
        if (this.wordCount == 0 || bigintMult.wordCount == 0) {
            return BigInteger.ZERO;
        }
        if (this.wordCount == 1 && this.words[0] == 1) {
            return this.negative ? bigintMult.negate() : bigintMult;
        }
        if (bigintMult.wordCount == 1 && bigintMult.words[0] == 1) {
            return bigintMult.negative ? this.negate() : this;
        }
        var productreg;
        var productwordCount;
        var needShorten = true;
        if (this.wordCount == 1) {
            var wc = bigintMult.wordCount;
            var regLength = BigInteger.RoundupSize(wc + 1);
            productreg = [];
            for (var arrfillI = 0; arrfillI < regLength; arrfillI++) productreg[arrfillI] = 0;
            productreg[wc] = ((BigInteger.LinearMultiply(productreg, 0, bigintMult.words, 0, this.words[0], wc)) & 65535);
            productwordCount = productreg.length;
            needShorten = false;
        } else if (bigintMult.wordCount == 1) {
            var wc = this.wordCount;
            var regLength = BigInteger.RoundupSize(wc + 1);
            productreg = [];
            for (var arrfillI = 0; arrfillI < regLength; arrfillI++) productreg[arrfillI] = 0;
            productreg[wc] = ((BigInteger.LinearMultiply(productreg, 0, this.words, 0, bigintMult.words[0], wc)) & 65535);
            productwordCount = productreg.length;
            needShorten = false;
        } else if (this.equals(bigintMult)) {
            var words1Size = BigInteger.RoundupSize(this.wordCount);
            productreg = [];
            for (var arrfillI = 0; arrfillI < words1Size + words1Size; arrfillI++) productreg[arrfillI] = 0;
            productwordCount = productreg.length;
            var workspace = [];
            for (var arrfillI = 0; arrfillI < words1Size + words1Size; arrfillI++) workspace[arrfillI] = 0;
            BigInteger.RecursiveSquare(productreg, 0, workspace, 0, this.words, 0, words1Size);
        } else if (this.wordCount <= 10 && bigintMult.wordCount <= 10) {
            var wc = this.wordCount + bigintMult.wordCount;
            wc = BigInteger.RoundupSize(wc);
            productreg = [];
            for (var arrfillI = 0; arrfillI < wc; arrfillI++) productreg[arrfillI] = 0;
            productwordCount = productreg.length;
            BigInteger.SchoolbookMultiply(productreg, 0, this.words, 0, this.wordCount, bigintMult.words, 0, bigintMult.wordCount);
            needShorten = false;
        } else {
            var words1Size = this.wordCount;
            var words2Size = bigintMult.wordCount;
            words1Size = BigInteger.RoundupSize(words1Size);
            words2Size = BigInteger.RoundupSize(words2Size);
            productreg = [];
            for (var arrfillI = 0; arrfillI < BigInteger.RoundupSize(words1Size + words2Size); arrfillI++) productreg[arrfillI] = 0;
            var workspace = [];
            for (var arrfillI = 0; arrfillI < words1Size + words2Size; arrfillI++) workspace[arrfillI] = 0;
            productwordCount = productreg.length;
            BigInteger.AsymmetricMultiply(productreg, 0, workspace, 0, this.words, 0, words1Size, bigintMult.words, 0, words2Size);
        }

        while (productwordCount != 0 && productreg[productwordCount - 1] == 0) {
            --productwordCount;
        }
        if (needShorten) {
            productreg = BigInteger.ShortenArray(productreg, productwordCount);
        }
        return new BigInteger(productwordCount, productreg, this.negative ^ bigintMult.negative);
    };
    constructor.BitsToWords = function(bitCount) {
        return (bitCount + 15) >> 4;
    };
    constructor.FastRemainder = function(dividendReg, count, divisorSmall) {
        var i = count;
        var remainder = 0;
        while ((i--) > 0) {
            remainder = BigInteger.RemainderUnsigned(BigInteger.MakeUint(dividendReg[i], remainder), divisorSmall);
        }
        return remainder;
    };
    constructor.FastDivide = function(quotientReg, dividendReg, count, divisorSmall) {
        var i = count;
        var remainderShort = 0;
        var idivisor = (divisorSmall) & 65535;
        var quo, rem;
        while ((i--) > 0) {
            var currentDividend = (((((dividendReg[i]) & 65535) | ((remainderShort|0) << 16))|0));
            if ((currentDividend >> 31) == 0) {
                quo = ((currentDividend / idivisor)|0);
                quotientReg[i] = (quo & 65535);
                if (i > 0) {
                    rem = currentDividend - (idivisor * quo);
                    remainderShort = (rem|0);
                }
            } else {
                quotientReg[i] = ((BigInteger.DivideUnsigned(currentDividend, divisorSmall)) & 65535);
                if (i > 0) {
                    remainderShort = BigInteger.RemainderUnsigned(currentDividend, divisorSmall);
                }
            }
        }
    };
    constructor.FastDivideAndRemainder = function(quotientReg, quotientStart, dividendReg, dividendStart, count, divisorSmall) {
        var i = count;
        var remainderShort = 0;
        var idivisor = (divisorSmall) & 65535;
        var quo, rem;
        while ((i--) > 0) {
            var currentDividend = (((((dividendReg[dividendStart + i]) & 65535) | ((remainderShort|0) << 16))|0));
            if ((currentDividend >> 31) == 0) {
                quo = ((currentDividend / idivisor)|0);
                quotientReg[quotientStart + i] = (quo & 65535);
                rem = currentDividend - (idivisor * quo);
                remainderShort = (rem|0);
            } else {
                quotientReg[quotientStart + i] = ((BigInteger.DivideUnsigned(currentDividend, divisorSmall)) & 65535);
                remainderShort = BigInteger.RemainderUnsigned(currentDividend, divisorSmall);
            }
        }
        return remainderShort;
    };

    prototype['divide'] = prototype.divide = function(bigintDivisor) {
        if (bigintDivisor == null) {
            throw new Error("bigintDivisor");
        }
        var words1Size = this.wordCount;
        var words2Size = bigintDivisor.wordCount;

        if (words2Size == 0) {
            throw new Error();
        }
        if (words1Size < words2Size) {

            return BigInteger.ZERO;
        }
        if (words1Size <= 2 && words2Size <= 2 && this.canFitInInt() && bigintDivisor.canFitInInt()) {
            var valueASmall = this.intValue();
            var valueBSmall = bigintDivisor.intValue();
            if (valueASmall != -2147483648 || valueBSmall != -1) {
                var result = ((valueASmall / valueBSmall)|0);
                return BigInteger.valueOf(result);
            }
        }
        var quotReg;
        var quotwordCount;
        if (words2Size == 1) {

            quotReg = [];
            for (var arrfillI = 0; arrfillI < this.words.length; arrfillI++) quotReg[arrfillI] = 0;
            quotwordCount = this.wordCount;
            BigInteger.FastDivide(quotReg, this.words, words1Size, bigintDivisor.words[0]);
            while (quotwordCount != 0 && quotReg[quotwordCount - 1] == 0) {
                --quotwordCount;
            }
            return (quotwordCount != 0) ? (new BigInteger(quotwordCount, quotReg, this.negative ^ bigintDivisor.negative)) : BigInteger.ZERO;
        }

        words1Size = words1Size + (words1Size & 1);
        words2Size = words2Size + (words2Size & 1);
        quotReg = [];
        for (var arrfillI = 0; arrfillI < BigInteger.RoundupSize((words1Size - words2Size + 2)|0); arrfillI++) quotReg[arrfillI] = 0;
        var tempbuf = [];
        for (var arrfillI = 0; arrfillI < words1Size + (3 * (words2Size + 2)); arrfillI++) tempbuf[arrfillI] = 0;
        BigInteger.Divide(null, 0, quotReg, 0, tempbuf, 0, this.words, 0, words1Size, bigintDivisor.words, 0, words2Size);
        quotwordCount = BigInteger.CountWords(quotReg, quotReg.length);
        quotReg = BigInteger.ShortenArray(quotReg, quotwordCount);
        return (quotwordCount != 0) ? (new BigInteger(quotwordCount, quotReg, this.negative ^ bigintDivisor.negative)) : BigInteger.ZERO;
    };

    prototype['divideAndRemainder'] = prototype.divideAndRemainder = function(divisor) {
        if (divisor == null) {
            throw new Error("divisor");
        }
        var words1Size = this.wordCount;
        var words2Size = divisor.wordCount;
        if (words2Size == 0) {
            throw new Error();
        }
        if (words1Size < words2Size) {

            return [BigInteger.ZERO, this];
        }
        if (words2Size == 1) {

            var quotient = [];
            for (var arrfillI = 0; arrfillI < this.words.length; arrfillI++) quotient[arrfillI] = 0;
            var smallRemainder = (BigInteger.FastDivideAndRemainder(quotient, 0, this.words, 0, words1Size, divisor.words[0])) & 65535;
            var count = this.wordCount;
            while (count != 0 && quotient[count - 1] == 0) {
                --count;
            }
            if (count == 0) {
                return [BigInteger.ZERO, this];
            }
            quotient = BigInteger.ShortenArray(quotient, count);
            var bigquo = new BigInteger(count, quotient, this.negative ^ divisor.negative);
            if (this.negative) {
                smallRemainder = -smallRemainder;
            }
            return [bigquo, BigInteger.valueOf(smallRemainder)];
        }
        if (this.wordCount == 2 && divisor.wordCount == 2 && (this.words[1] >> 15) != 0 && (divisor.words[1] >> 15) != 0) {
            var a = (this.words[0]) & 65535;
            var b = (divisor.words[0]) & 65535;
            {
                a |= ((this.words[1]) & 65535) << 16;
                b |= ((divisor.words[1]) & 65535) << 16;
                var quo = ((a / b)|0);
                if (this.negative) {
                    quo = -quo;
                }
                var rem = a - (b * quo);
                var quotAndRem = [null, null];
                quotAndRem[0] = BigInteger.valueOf(quo);
                quotAndRem[1] = BigInteger.valueOf(rem);
                return quotAndRem;
            }
        }
        words1Size = words1Size + (words1Size & 1);
        words2Size = words2Size + (words2Size & 1);
        var bigRemainderreg = [];
        for (var arrfillI = 0; arrfillI < BigInteger.RoundupSize(words2Size|0); arrfillI++) bigRemainderreg[arrfillI] = 0;
        var quotientreg = [];
        for (var arrfillI = 0; arrfillI < BigInteger.RoundupSize((words1Size - words2Size + 2)|0); arrfillI++) quotientreg[arrfillI] = 0;
        var tempbuf = [];
        for (var arrfillI = 0; arrfillI < words1Size + (3 * (words2Size + 2)); arrfillI++) tempbuf[arrfillI] = 0;
        BigInteger.Divide(bigRemainderreg, 0, quotientreg, 0, tempbuf, 0, this.words, 0, words1Size, divisor.words, 0, words2Size);
        var remCount = BigInteger.CountWords(bigRemainderreg, bigRemainderreg.length);
        var quoCount = BigInteger.CountWords(quotientreg, quotientreg.length);
        bigRemainderreg = BigInteger.ShortenArray(bigRemainderreg, remCount);
        quotientreg = BigInteger.ShortenArray(quotientreg, quoCount);
        var bigrem = (remCount == 0) ? BigInteger.ZERO : new BigInteger(remCount, bigRemainderreg, this.negative);
        var bigquo2 = (quoCount == 0) ? BigInteger.ZERO : new BigInteger(quoCount, quotientreg, this.negative ^ divisor.negative);
        return [bigquo2, bigrem];
    };

    prototype['mod'] = prototype.mod = function(divisor) {
        if (divisor == null) {
            throw new Error("divisor");
        }
        if (divisor.signum() < 0) {
            throw new Error("Divisor is negative");
        }
        var rem = this.remainder(divisor);
        if (rem.signum() < 0) {
            rem = divisor.add(rem);
        }
        return rem;
    };

    prototype['remainder'] = prototype.remainder = function(divisor) {
        if (divisor == null) {
            throw new Error("divisor");
        }
        var words1Size = this.wordCount;
        var words2Size = divisor.wordCount;
        if (words2Size == 0) {
            throw new Error();
        }
        if (words1Size < words2Size) {

            return this;
        }
        if (words2Size == 1) {
            var shortRemainder = ((BigInteger.FastRemainder(this.words, this.wordCount, divisor.words[0])) & 65535);
            var smallRemainder = (shortRemainder) & 65535;
            if (this.negative) {
                smallRemainder = -smallRemainder;
            }
            return BigInteger.valueOf(smallRemainder);
        }
        if (this.PositiveCompare(divisor) < 0) {
            return this;
        }
        words1Size = words1Size + (words1Size & 1);
        words2Size = words2Size + (words2Size & 1);
        var remainderReg = [];
        for (var arrfillI = 0; arrfillI < BigInteger.RoundupSize(words2Size|0); arrfillI++) remainderReg[arrfillI] = 0;
        var tempbuf = [];
        for (var arrfillI = 0; arrfillI < words1Size + (3 * (words2Size + 2)); arrfillI++) tempbuf[arrfillI] = 0;
        BigInteger.Divide(remainderReg, 0, null, 0, tempbuf, 0, this.words, 0, words1Size, divisor.words, 0, words2Size);
        var count = BigInteger.CountWords(remainderReg, remainderReg.length);
        if (count == 0) {
            return BigInteger.ZERO;
        }
        remainderReg = BigInteger.ShortenArray(remainderReg, count);
        return new BigInteger(count, remainderReg, this.negative);
    };
    prototype.PositiveCompare = function(t) {
        var size = this.wordCount, tempSize = t.wordCount;
        return (size == tempSize) ? BigInteger.Compare(this.words, 0, t.words, 0, (size|0)) : (size > tempSize ? 1 : -1);
    };

    prototype['compareTo'] = prototype.compareTo = function(other) {
        if (other == null) {
            return 1;
        }
        if (this == other) {
            return 0;
        }
        var size = this.wordCount, tempSize = other.wordCount;
        var sa = size == 0 ? 0 : (this.negative ? -1 : 1);
        var sb = tempSize == 0 ? 0 : (other.negative ? -1 : 1);
        if (sa != sb) {
            return (sa < sb) ? -1 : 1;
        }
        if (sa == 0) {
            return 0;
        }
        if (size == tempSize) {
            if (size == 1 && this.words[0] == other.words[0]) {
                return 0;
            } else {
                var words1 = this.words;
                var words2 = other.words;
                while ((size--) != 0) {
                    var an = (words1[size]) & 65535;
                    var bn = (words2[size]) & 65535;
                    if (an > bn) {
                        return (sa > 0) ? 1 : -1;
                    }
                    if (an < bn) {
                        return (sa > 0) ? -1 : 1;
                    }
                }
                return 0;
            }
        }
        return ((size > tempSize) ^ (sa <= 0)) ? 1 : -1;
    };

    prototype['signum'] = prototype.signum = function() {
        return (this.wordCount == 0) ? 0 : (this.negative ? -1 : 1);
    };

    prototype['isZero'] = prototype.isZero = function() {
        return this.wordCount == 0;
    };

    prototype['sqrt'] = prototype.sqrt = function() {
        var srrem = this.sqrtWithRemainder();
        return srrem[0];
    };

    prototype['sqrtWithRemainder'] = prototype.sqrtWithRemainder = function() {
        if (this.signum() <= 0) {
            return [BigInteger.ZERO, BigInteger.ZERO];
        }
        if (this.equals(BigInteger.ONE)) {
            return [BigInteger.ONE, BigInteger.ZERO];
        }
        var bigintX;
        var bigintY;
        var thisValue = this;
        var powerBits = (((thisValue.getUnsignedBitLength() + 1) / 2)|0);
        if (thisValue.canFitInInt()) {
            var smallValue = thisValue.intValue();

            var smallintX = 0;
            var smallintY = 1 << powerBits;
            do {
                smallintX = smallintY;
                smallintY = ((smallValue / smallintX)|0);
                smallintY = smallintY + (smallintX);
                smallintY >>= 1;
            } while (smallintY < smallintX);
            smallintY = smallintX * smallintX;
            smallintY = smallValue - smallintY;
            return [BigInteger.valueOf(smallintX), BigInteger.valueOf(smallintY)];
        }
        bigintX = BigInteger.ZERO;
        bigintY = BigInteger.ONE.shiftLeft(powerBits);
        do {
            bigintX = bigintY;
            bigintY = thisValue.divide(bigintX);
            bigintY = bigintY.add(bigintX);
            bigintY = bigintY.shiftRight(1);
        } while (bigintY != null && bigintY.compareTo(bigintX) < 0);
        bigintY = bigintX.multiply(bigintX);
        bigintY = thisValue.subtract(bigintY);
        return [bigintX, bigintY];
    };

    prototype['isEven'] = prototype.isEven = function() {
        return !this.GetUnsignedBit(0);
    };
    constructor['ZERO'] = constructor.ZERO = new BigInteger(0, [0, 0], false);
    constructor['ONE'] = constructor.ONE = new BigInteger(1, [1, 0], false);
    constructor['TEN'] = constructor.TEN = BigInteger.valueOf(10);
})(BigInteger,BigInteger.prototype);

if(typeof exports!=="undefined")exports['BigInteger']=BigInteger;
if(typeof window!=="undefined")window['BigInteger']=BigInteger;
})();
