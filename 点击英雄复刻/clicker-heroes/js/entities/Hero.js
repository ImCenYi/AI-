/**
 * Hero.js - 英雄类
 * 
 * 负责管理游戏中的英雄实体，包括DPS计算、升级成本、技能系统等
 * 每个英雄都有独特的属性和成长曲线
 */

class Hero {
    /**
     * 创建一个新的英雄实例
     * @param {Object} config - 英雄配置对象
     * @param {string} config.id - 英雄唯一标识符
     * @param {string} config.name - 英雄名称
     * @param {number} config.baseDPS - 基础DPS（每秒伤害）
     * @param {number} config.baseCost - 雇佣基础成本
     * @param {Array} config.abilities - 英雄技能列表（可选）
     */
    constructor(config) {
        // 基础属性
        this.id = config.id;
        this.name = config.name;
        this.baseDPS = config.baseDPS;
        this.baseCost = config.baseCost;
        
        // 升级成本倍率，每次升级成本增加7%
        this.costMultiplier = 1.07;
        
        // 当前等级（初始为0，表示未雇佣）
        this.level = 0;
        
        // 英雄技能列表
        this.abilities = config.abilities || [];
        
        // 解锁的技能（已激活的技能ID列表）
        this.unlockedAbilities = [];
        
        // 总DPS倍率（来自技能和其他加成）
        this.dpsMultiplier = 1;
    }

    /**
     * 获取当前DPS（每秒伤害输出）
     * 公式: DPS = baseDPS × level × dpsMultiplier
     * 注意: 希德（cid）特殊，DPS为0，但提供点击伤害加成
     * @returns {number} 当前DPS值
     */
    getCurrentDPS() {
        // 等级为0时，没有DPS
        if (this.level === 0) {
            return 0;
        }
        
        // 基础DPS × 等级 × DPS倍率
        return this.baseDPS * this.level * this.dpsMultiplier;
    }

    /**
     * 获取升级成本
     * 公式: Cost = baseCost × (1.07 ^ level)
     * @returns {number} 升级所需金币
     */
    getUpgradeCost() {
        // 使用成本倍率公式计算升级成本
        return Math.ceil(this.baseCost * Math.pow(this.costMultiplier, this.level));
    }

    /**
     * 升级英雄
     * 提升英雄等级并解锁相应技能
     * @returns {boolean} 升级是否成功
     */
    upgrade() {
        // 增加等级
        this.level++;
        
        // 检查并解锁新技能
        this.checkAbilityUnlocks();
        
        return true;
    }

    /**
     * 检查技能解锁条件
     * 某些技能在特定等级时解锁
     */
    checkAbilityUnlocks() {
        // 遍历所有技能，检查是否满足解锁条件
        this.abilities.forEach(ability => {
            if (ability.unlockLevel && this.level >= ability.unlockLevel) {
                if (!this.unlockedAbilities.includes(ability.id)) {
                    this.unlockedAbilities.push(ability.id);
                    // 应用技能效果
                    this.applyAbilityEffect(ability);
                }
            }
        });
    }

    /**
     * 应用技能效果
     * @param {Object} ability - 技能对象
     */
    applyAbilityEffect(ability) {
        // 根据技能类型应用不同效果
        switch (ability.type) {
            case 'dps_boost':
                // DPS提升技能
                this.dpsMultiplier *= (1 + ability.value);
                break;
            case 'click_boost':
                // 点击伤害提升（需要在Player中处理）
                break;
            case 'gold_boost':
                // 金币获取提升（需要在Player中处理）
                break;
            default:
                // 其他类型技能
                break;
        }
    }

    /**
     * 检查是否有足够的金币进行升级
     * @param {number} gold - 当前拥有的金币
     * @returns {boolean} 是否可以升级
     */
    canAfford(gold) {
        return gold >= this.getUpgradeCost();
    }

    /**
     * 检查英雄是否已被雇佣
     * @returns {boolean} 如果等级大于0则返回true
     */
    isHired() {
        return this.level > 0;
    }

    /**
     * 雇佣英雄（首次购买）
     * @returns {boolean} 雇佣是否成功
     */
    hire() {
        if (this.level === 0) {
            return this.upgrade();
        }
        return false;
    }

    /**
     * 获取英雄信息摘要
     * @returns {Object} 英雄信息对象
     */
    getInfo() {
        return {
            id: this.id,
            name: this.name,
            level: this.level,
            currentDPS: this.getCurrentDPS(),
            upgradeCost: this.getUpgradeCost(),
            isHired: this.isHired(),
            unlockedAbilities: this.unlockedAbilities.length
        };
    }

    /**
     * 将英雄数据序列化为JSON对象
     * 用于游戏存档
     * @returns {Object} 序列化后的英雄数据
     */
    serialize() {
        return {
            id: this.id,
            name: this.name,
            baseDPS: this.baseDPS,
            baseCost: this.baseCost,
            costMultiplier: this.costMultiplier,
            level: this.level,
            abilities: this.abilities,
            unlockedAbilities: this.unlockedAbilities,
            dpsMultiplier: this.dpsMultiplier
        };
    }

    /**
     * 从序列化数据反序列化英雄对象
     * 用于加载游戏存档
     * @param {Object} data - 序列化的英雄数据
     * @returns {Hero} 反序列化后的英雄实例
     */
    static deserialize(data) {
        const hero = new Hero({
            id: data.id,
            name: data.name,
            baseDPS: data.baseDPS,
            baseCost: data.baseCost,
            abilities: data.abilities
        });
        
        // 恢复其他属性
        hero.costMultiplier = data.costMultiplier || 1.07;
        hero.level = data.level || 0;
        hero.unlockedAbilities = data.unlockedAbilities || [];
        hero.dpsMultiplier = data.dpsMultiplier || 1;
        
        return hero;
    }
}

// 预定义英雄配置（前5个英雄）
const HEROES_CONFIG = [
    { 
        id: 'cid', 
        name: '热心冒险者希德', 
        baseDPS: 0, 
        baseCost: 5,
        abilities: [
            { id: 'cid_1', name: '点击强化', type: 'click_boost', value: 0.5, unlockLevel: 10 },
            { id: 'cid_2', name: '超级点击', type: 'click_boost', value: 1.0, unlockLevel: 25 }
        ]
    },
    { 
        id: 'treebeast', 
        name: '树兽', 
        baseDPS: 5, 
        baseCost: 50,
        abilities: [
            { id: 'tree_1', name: '树皮硬化', type: 'dps_boost', value: 1.0, unlockLevel: 10 },
            { id: 'tree_2', name: '自然之力', type: 'dps_boost', value: 1.5, unlockLevel: 25 }
        ]
    },
    { 
        id: 'ivan', 
        name: '醉拳伊万', 
        baseDPS: 22, 
        baseCost: 250,
        abilities: [
            { id: 'ivan_1', name: '醉酒狂暴', type: 'dps_boost', value: 1.0, unlockLevel: 10 },
            { id: 'ivan_2', name: '醉拳连击', type: 'dps_boost', value: 1.5, unlockLevel: 25 }
        ]
    },
    { 
        id: 'brittany', 
        name: '海滩公主', 
        baseDPS: 74, 
        baseCost: 1000,
        abilities: [
            { id: 'brit_1', name: '海浪冲击', type: 'dps_boost', value: 1.0, unlockLevel: 10 },
            { id: 'brit_2', name: '潮汐之力', type: 'dps_boost', value: 1.5, unlockLevel: 25 }
        ]
    },
    { 
        id: 'fisherman', 
        name: '流浪渔夫', 
        baseDPS: 245, 
        baseCost: 4000,
        abilities: [
            { id: 'fish_1', name: '渔网束缚', type: 'dps_boost', value: 1.0, unlockLevel: 10 },
            { id: 'fish_2', name: '深海召唤', type: 'dps_boost', value: 1.5, unlockLevel: 25 }
        ]
    }
];

// 导出Hero类和配置（支持ES6模块和CommonJS）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Hero, HEROES_CONFIG };
}
