/**
 * Treasure Class - 秘宝物品生成类
 * 
 * 数值公式：10 ^ (品质偏移系数 * 秘宝等级)
 * 品质偏移系数：N=0.65, R=0.75, SR=0.9, SSR=1.1, UR=1.5
 * 秘宝等级：根据玩家主线难度计算，等级 = floor(难度/300) + 1
 * 
 * 多件秘宝效果为乘算：如两件全属性x10的秘宝，实际效果为x100
 */

class Treasure {
    constructor(level) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.slot = TREASURE_SLOTS[Math.floor(Math.random() * TREASURE_SLOTS.length)];
        this.qKey = getWeightedRandom(TREASURE_QUALITIES, 'weight');
        this.qualityConf = TREASURE_QUALITIES[this.qKey];
        this.level = level;
        this.isLocked = false;
        this.attrType = getWeightedRandom(TREASURE_ATTRS, 'weight');
        
        const offset = this.qualityConf.val;
        // 数值公式：10 ^ (品质偏移系数 * 秘宝等级)
        const exponent = offset * this.level;
        this.val = new BigNum(10).pow(exponent);
        
        this.hasExtra = Math.random() < 0.5;
        this.extraVal = new BigNum(0);
        if (this.hasExtra) {
            this.extraVal = new BigNum(10).pow(offset * this.level);
        }
        this.name = `${this.qKey}·${this.slot}·${this.attrType.name}`;
        this.score = offset * this.level * 10;
    }
}

// Export for module systems if needed
try {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Treasure;
    }
} catch (e) {}
