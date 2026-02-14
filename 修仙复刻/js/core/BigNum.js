/**
 * BigNum Class for handling large numbers
 */
class BigNum {
    constructor(val, exp = 0) {
        if (val instanceof BigNum) { this.m = val.m; this.e = val.e; }
        else if (typeof val === 'string') {
            const parts = val.toLowerCase().split('e');
            this.m = parseFloat(parts[0]);
            this.e = parts[1] ? parseFloat(parts[1]) : 0;
            this.normalize();
        } else {
            this.m = val;
            this.e = exp;
            this.normalize();
        }
    }
    
    normalize() {
        if (this.m === 0) { this.e = 0; return; }
        const abs = Math.abs(this.m);
        if (abs >= 10 || (abs > 0 && abs < 1)) {
            const shift = Math.floor(Math.log10(abs));
            this.m /= Math.pow(10, shift);
            this.e += shift;
        }
    }

    add(other) {
        const o = other instanceof BigNum ? other : new BigNum(other);
        if (this.e === o.e) return new BigNum(this.m + o.m, this.e);
        const diff = this.e - o.e;
        if (Math.abs(diff) > 15) return diff > 0 ? new BigNum(this) : new BigNum(o);
        if (diff > 0) return new BigNum(this.m + o.m / Math.pow(10, diff), this.e);
        return new BigNum(this.m / Math.pow(10, -diff) + o.m, o.e);
    }
    
    sub(other) {
        const o = other instanceof BigNum ? other : new BigNum(other);
        return this.add(new BigNum(-o.m, o.e));
    }

    mul(other) {
        const o = other instanceof BigNum ? other : new BigNum(other);
        return new BigNum(this.m * o.m, this.e + o.e);
    }

    div(other) {
        const o = other instanceof BigNum ? other : new BigNum(other);
        if (o.m === 0) return new BigNum(Infinity);
        return new BigNum(this.m / o.m, this.e - o.e);
    }
    
    pow(power) {
        if (this.m === 0) return new BigNum(0);
        const valLog = Math.log10(this.m) + this.e;
        const newLog = valLog * power;
        const newE = Math.floor(newLog);
        const newM = Math.pow(10, newLog - newE);
        return new BigNum(newM, newE);
    }
    
    /**
     * 指数加成 - 对数值的指数部分进行加成
     * 例如: 1e1000 经过 5% 指数加成 -> 1e1050
     * @param {number} bonusPercent - 加成百分比 (如 0.05 表示 5%)
     * @returns {BigNum} 加成后的数值
     */
    expBonus(bonusPercent) {
        if (this.m === 0) return new BigNum(0);
        // 计算总对数值 (log10(值) = log10(尾数) + 指数)
        const totalLog = Math.log10(this.m) + this.e;
        // 对总对数值进行加成
        const newLog = totalLog * (1 + bonusPercent);
        // 转换回 BigNum
        const newE = Math.floor(newLog);
        const newM = Math.pow(10, newLog - newE);
        return new BigNum(newM, newE);
    }

    log10() {
        if (this.m <= 0) return 0;
        return Math.log10(this.m) + this.e;
    }

    compare(other) {
        const o = other instanceof BigNum ? other : new BigNum(other);
        if (this.m === 0 && o.m === 0) return 0;
        if (this.m < 0 && o.m >= 0) return -1;
        if (this.m >= 0 && o.m < 0) return 1;
        
        if (this.e > o.e) return this.m > 0 ? 1 : -1;
        if (this.e < o.e) return this.m > 0 ? -1 : 1;
        
        if (this.m > o.m) return 1;
        if (this.m < o.m) return -1;
        return 0;
    }

    gt(other) { return this.compare(other) > 0; }
    gte(other) { return this.compare(other) >= 0; }
    lt(other) { return this.compare(other) < 0; }
    lte(other) { return this.compare(other) <= 0; }
    eq(other) { return this.compare(other) === 0; }
    
    toNumber() {
        if (this.e > 308) return Infinity;
        return this.m * Math.pow(10, this.e);
    }

    toString() {
        if (this.e < 6) {
            let val = this.m * Math.pow(10, this.e);
            if (Math.abs(val) < 0.001 && val !== 0) return val.toExponential(2);
            return parseFloat(val.toFixed(2)).toString();
        }
        return `${this.m.toFixed(2)}e${this.e}`;
    }
}

// Export for module systems if needed
try {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = BigNum;
    }
} catch (e) {}
