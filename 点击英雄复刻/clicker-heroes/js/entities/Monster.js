/**
 * Monster.js - 怪物类
 * 
 * 负责管理游戏中的怪物实体，包括生命值计算、金币奖励、伤害处理等
 * 怪物的强度和奖励随区域等级递增
 */

class Monster {
    /**
     * 创建一个新的怪物实例
     * @param {number} zone - 当前区域编号
     * @param {boolean} isBoss - 是否为Boss怪物
     */
    constructor(zone, isBoss = false) {
        this.zone = zone;
        this.isBoss = isBoss;
        this.maxHP = this.calculateHP();
        this.currentHP = this.maxHP;
        this.name = this.generateName();
        this.goldReward = this.calculateGold();
    }

    /**
     * 计算怪物的最大生命值
     * 公式: HP = 10 × (1.6 ^ (zone - 1))
     * Boss怪物有10倍生命值
     * @returns {number} 怪物的最大生命值
     */
    calculateHP() {
        // 基础生命值公式: 10 × 1.6^(zone-1)
        let hp = 10 * Math.pow(1.6, this.zone - 1);
        
        // Boss怪物拥有10倍生命值
        if (this.isBoss) {
            hp *= 10;
        }
        
        // 返回向上取整的整数值
        return Math.ceil(hp);
    }

    /**
     * 计算怪物死亡后掉落的金币
     * 公式: Gold = 1 × (1.15 ^ (zone - 1))
     * Boss怪物有10倍金币奖励
     * @returns {number} 金币奖励数量
     */
    calculateGold() {
        // 基础金币公式: 1 × 1.15^(zone-1)
        let gold = 1 * Math.pow(1.15, this.zone - 1);
        
        // Boss怪物提供10倍金币奖励
        if (this.isBoss) {
            gold *= 10;
        }
        
        // 返回向上取整的整数值
        return Math.ceil(gold);
    }

    /**
     * 怪物受到伤害
     * @param {number} damage - 受到的伤害值
     * @returns {number} 实际造成的伤害值
     */
    takeDamage(damage) {
        // 确保伤害值至少为0
        const actualDamage = Math.max(0, damage);
        
        // 扣除生命值
        this.currentHP -= actualDamage;
        
        // 确保生命值不会低于0
        if (this.currentHP < 0) {
            this.currentHP = 0;
        }
        
        return actualDamage;
    }

    /**
     * 检查怪物是否已死亡
     * @returns {boolean} 如果怪物死亡返回true，否则返回false
     */
    isDead() {
        return this.currentHP <= 0;
    }

    /**
     * 获取怪物的当前生命值百分比
     * @returns {number} 生命值百分比 (0-100)
     */
    getHealthPercentage() {
        if (this.maxHP === 0) return 0;
        return (this.currentHP / this.maxHP) * 100;
    }

    /**
     * 生成怪物名称
     * 普通怪物和Boss怪物有不同的命名规则
     * @returns {string} 怪物名称
     */
    generateName() {
        // 普通怪物名称列表
        const normalNames = [
            '小软泥怪', '森林史莱姆', '岩石傀儡', '暗影蝙蝠',
            '荒野狼', '沼泽蟹', '骷髅兵', '哥布林',
            '毒蜘蛛', '野猪', '食人花', '地精盗贼'
        ];
        
        // Boss名称列表
        const bossNames = [
            '毁灭者', '深渊领主', '混沌之王', '末日使者',
            '虚空行者', '死亡骑士', '魔龙', '泰坦巨人'
        ];
        
        // 根据是否为Boss选择名称列表
        const names = this.isBoss ? bossNames : normalNames;
        
        // 随机选择一个名称
        const baseName = names[Math.floor(Math.random() * names.length)];
        
        // Boss添加区域前缀
        if (this.isBoss) {
            return `第${this.zone}区·${baseName}`;
        }
        
        return baseName;
    }

    /**
     * 重置怪物状态（用于复活或刷新）
     */
    reset() {
        this.currentHP = this.maxHP;
    }

    /**
     * 将怪物数据序列化为JSON对象
     * 用于游戏存档
     * @returns {Object} 序列化后的怪物数据
     */
    serialize() {
        return {
            zone: this.zone,
            isBoss: this.isBoss,
            maxHP: this.maxHP,
            currentHP: this.currentHP,
            name: this.name,
            goldReward: this.goldReward
        };
    }

    /**
     * 从序列化数据反序列化怪物对象
     * 用于加载游戏存档
     * @param {Object} data - 序列化的怪物数据
     * @returns {Monster} 反序列化后的怪物实例
     */
    static deserialize(data) {
        const monster = new Monster(data.zone, data.isBoss);
        monster.maxHP = data.maxHP;
        monster.currentHP = data.currentHP;
        monster.name = data.name;
        monster.goldReward = data.goldReward;
        return monster;
    }
}

// 导出Monster类（支持ES6模块和CommonJS）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Monster;
}
