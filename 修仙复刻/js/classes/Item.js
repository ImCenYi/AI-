/**
 * Item Class - Equipment and Pill generation
 */

class Item {
    constructor(difficulty, typeOverride = null) {
        this.id = Math.random().toString(36).substr(2, 9);
        if (typeOverride === 'pill') {
            this.type = 'pill';
            this.level = difficulty; 
            this.name = `混元丹 (Lv.${this.level})`;
            this.quality = 3; 
            this.hpValue = new BigNum(5).mul(new BigNum(SCALE_PILL).pow(this.level));
            this.atkValue = new BigNum(1).mul(new BigNum(SCALE_PILL).pow(this.level));
            return;
        }
        this.type = typeOverride || getWeightedRandom(SLOTS_CONFIG, 'weight');
        const baseLevel = difficulty * 3;
        this.level = Math.max(0, baseLevel + Math.floor(Math.random()*5)-2);
        this.quality = parseInt(getWeightedRandom(QUALITIES, 'weight'));
        const qConfig = QUALITIES[this.quality];
        this.name = ['破铁','精钢','玄铁','秘银','龙鳞','混沌'][Math.min(5, Math.floor(this.level/10))] + SLOTS_CONFIG[this.type].name;
        
        const baseVal = new BigNum(10).mul(new BigNum(SCALE_EQUIP).pow(this.level));
        this.atk = baseVal.mul(qConfig.mult * (Math.random() < 0.5 ? 1 : 0));
        this.hp = baseVal.mul(qConfig.mult * 5 * (this.atk.gt(0) ? 0 : 1));
        
        if (SLOTS_CONFIG[this.type].hasCrit) {
             this.crit = qConfig.crit || 0;
        } else {
             this.crit = 0;
        }
    }
}

// Export for module systems if needed
try {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Item;
    }
} catch (e) {}
