/**
 * Treasure Class - Treasure item generation
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
        // Formula: 10 ^ (Offset * Level / 10)
        const exponent = (offset * this.level) / 10;
        this.val = new BigNum(10).pow(exponent);
        
        this.hasExtra = Math.random() < 0.5;
        this.extraVal = new BigNum(0);
        if (this.hasExtra) {
            this.extraVal = new BigNum(10).pow((offset * this.level) / 10);
        }
        this.name = `${this.qKey}·${this.slot}·${this.attrType.name}`;
        this.score = offset * this.level * 10;
    }
}

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Treasure;
}
