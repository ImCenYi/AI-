/**
 * Player.js - 玩家类
 * 
 * 负责管理玩家的核心数据，包括金币、英雄、点击伤害、统计信息等
 * 是游戏的主要数据容器和状态管理器
 */

class Player {
    /**
     * 创建一个新的玩家实例
     * 初始化所有玩家属性和统计数据
     */
    constructor() {
        // ===== 核心资源 =====
        // 金币数量（游戏主要货币）
        this.gold = 0;
        
        // ===== 战斗属性 =====
        // 基础点击伤害
        this.clickDamage = 1;
        // 点击伤害倍率
        this.clickDamageMultiplier = 1;
        // 金币获取倍率
        this.goldMultiplier = 1;
        
        // ===== 英雄系统 =====
        // 已雇佣的英雄列表
        this.heroes = [];
        
        // ===== 统计数据 =====
        // 总点击次数
        this.totalClicks = 0;
        // 总击杀数
        this.totalKills = 0;
        // 总金币获取
        this.totalGoldEarned = 0;
        // 最高区域
        this.highestZone = 1;
        
        // ===== 时间记录 =====
        // 游戏开始时间
        this.startTime = Date.now();
        // 总游戏时间（秒）
        this.totalPlayTime = 0;
    }

    /**
     * 获取总DPS（所有英雄DPS之和）
     * @returns {number} 总DPS值
     */
    getTotalDPS() {
        let totalDPS = 0;
        
        // 累加所有英雄的DPS
        for (const hero of this.heroes) {
            totalDPS += hero.getCurrentDPS();
        }
        
        return totalDPS;
    }

    /**
     * 获取当前点击伤害
     * 包含希德等英雄提供的点击伤害加成
     * @returns {number} 当前点击伤害值
     */
    getClickDamage() {
        let damage = this.clickDamage * this.clickDamageMultiplier;
        
        // 希德（cid）特殊处理：每级提供额外点击伤害
        const cid = this.getHero('cid');
        if (cid && cid.level > 0) {
            // 希德每级提供0.5点击伤害
            damage += cid.level * 0.5;
        }
        
        return Math.ceil(damage);
    }

    /**
     * 添加金币
     * @param {number} amount - 要添加的金币数量
     */
    addGold(amount) {
        // 应用金币倍率
        const actualAmount = Math.floor(amount * this.goldMultiplier);
        
        this.gold += actualAmount;
        this.totalGoldEarned += actualAmount;
    }

    /**
     * 消费金币
     * @param {number} amount - 要消费的金币数量
     * @returns {boolean} 消费是否成功
     */
    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            return true;
        }
        return false;
    }

    /**
     * 检查是否有足够的金币
     * @param {number} amount - 需要的金币数量
     * @returns {boolean} 是否有足够金币
     */
    hasEnoughGold(amount) {
        return this.gold >= amount;
    }

    /**
     * 雇佣新英雄
     * @param {Object} heroConfig - 英雄配置对象
     * @returns {Object} 结果对象 { success: boolean, message: string, hero: Hero }
     */
    hireHero(heroConfig) {
        // 检查英雄是否已存在
        const existingHero = this.getHero(heroConfig.id);
        if (existingHero) {
            return {
                success: false,
                message: '该英雄已经被雇佣了',
                hero: existingHero
            };
        }
        
        // 创建新英雄
        const hero = new Hero(heroConfig);
        
        // 检查是否有足够金币
        if (!hero.canAfford(this.gold)) {
            return {
                success: false,
                message: '金币不足，无法雇佣该英雄',
                hero: null
            };
        }
        
        // 扣除金币并雇佣
        this.spendGold(hero.getUpgradeCost());
        hero.hire();
        this.heroes.push(hero);
        
        return {
            success: true,
            message: `成功雇佣 ${hero.name}!`,
            hero: hero
        };
    }

    /**
     * 升级指定英雄
     * @param {string} heroId - 英雄ID
     * @returns {Object} 结果对象 { success: boolean, message: string, hero: Hero }
     */
    upgradeHero(heroId) {
        const hero = this.getHero(heroId);
        
        if (!hero) {
            return {
                success: false,
                message: '未找到该英雄',
                hero: null
            };
        }
        
        // 检查是否有足够金币
        if (!hero.canAfford(this.gold)) {
            return {
                success: false,
                message: '金币不足，无法升级',
                hero: hero
            };
        }
        
        // 扣除金币并升级
        this.spendGold(hero.getUpgradeCost());
        hero.upgrade();
        
        return {
            success: true,
            message: `${hero.name} 升级到了等级 ${hero.level}!`,
            hero: hero
        };
    }

    /**
     * 获取指定英雄
     * @param {string} heroId - 英雄ID
     * @returns {Hero|null} 英雄实例或null
     */
    getHero(heroId) {
        return this.heroes.find(h => h.id === heroId) || null;
    }

    /**
     * 记录点击
     * @param {number} damage - 造成的伤害
     */
    recordClick(damage) {
        this.totalClicks++;
    }

    /**
     * 记录击杀
     */
    recordKill() {
        this.totalKills++;
    }

    /**
     * 更新最高区域
     * @param {number} zone - 当前区域
     */
    updateHighestZone(zone) {
        if (zone > this.highestZone) {
            this.highestZone = zone;
        }
    }

    /**
     * 获取玩家统计信息
     * @returns {Object} 统计信息对象
     */
    getStats() {
        return {
            gold: this.gold,
            totalDPS: this.getTotalDPS(),
            clickDamage: this.getClickDamage(),
            heroCount: this.heroes.length,
            totalHeroLevels: this.heroes.reduce((sum, h) => sum + h.level, 0),
            totalClicks: this.totalClicks,
            totalKills: this.totalKills,
            totalGoldEarned: this.totalGoldEarned,
            highestZone: this.highestZone,
            playTime: this.getPlayTime()
        };
    }

    /**
     * 获取游戏时长（秒）
     * @returns {number} 游戏时长
     */
    getPlayTime() {
        return Math.floor((Date.now() - this.startTime) / 1000) + this.totalPlayTime;
    }

    /**
     * 获取格式化后的游戏时长
     * @returns {string} 格式化的时间字符串
     */
    getFormattedPlayTime() {
        const seconds = this.getPlayTime();
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return `${hours}小时 ${minutes}分钟 ${secs}秒`;
    }

    /**
     * 获取可购买的英雄列表
     * @returns {Array} 可购买的英雄配置列表
     */
    getAvailableHeroes() {
        // 已雇佣的英雄ID集合
        const hiredIds = new Set(this.heroes.map(h => h.id));
        
        // 过滤出未雇佣的英雄
        return HEROES_CONFIG.filter(config => !hiredIds.has(config.id));
    }

    /**
     * 批量升级英雄（用于自动升级功能）
     * @param {number} maxSpend - 最大花费金币
     * @returns {number} 实际花费的金币
     */
    bulkUpgrade(maxSpend) {
        let spent = 0;
        
        // 按DPS/成本比排序英雄，优先升级性价比高的
        const sortedHeroes = [...this.heroes].sort((a, b) => {
            const ratioA = a.getCurrentDPS() / a.getUpgradeCost();
            const ratioB = b.getCurrentDPS() / b.getUpgradeCost();
            return ratioB - ratioA;
        });
        
        for (const hero of sortedHeroes) {
            while (spent < maxSpend && hero.canAfford(this.gold)) {
                const cost = hero.getUpgradeCost();
                if (spent + cost > maxSpend) break;
                
                this.spendGold(cost);
                hero.upgrade();
                spent += cost;
            }
        }
        
        return spent;
    }

    /**
     * 将玩家数据序列化为JSON对象
     * 用于游戏存档
     * @returns {Object} 序列化后的玩家数据
     */
    serialize() {
        return {
            gold: this.gold,
            clickDamage: this.clickDamage,
            clickDamageMultiplier: this.clickDamageMultiplier,
            goldMultiplier: this.goldMultiplier,
            heroes: this.heroes.map(h => h.serialize()),
            totalClicks: this.totalClicks,
            totalKills: this.totalKills,
            totalGoldEarned: this.totalGoldEarned,
            highestZone: this.highestZone,
            totalPlayTime: this.getPlayTime()
        };
    }

    /**
     * 从序列化数据反序列化玩家对象
     * 用于加载游戏存档
     * @param {Object} data - 序列化的玩家数据
     * @returns {Player} 反序列化后的玩家实例
     */
    static deserialize(data) {
        const player = new Player();
        
        // 恢复基础属性
        player.gold = data.gold || 0;
        player.clickDamage = data.clickDamage || 1;
        player.clickDamageMultiplier = data.clickDamageMultiplier || 1;
        player.goldMultiplier = data.goldMultiplier || 1;
        
        // 恢复英雄
        if (data.heroes && Array.isArray(data.heroes)) {
            player.heroes = data.heroes.map(h => Hero.deserialize(h));
        }
        
        // 恢复统计数据
        player.totalClicks = data.totalClicks || 0;
        player.totalKills = data.totalKills || 0;
        player.totalGoldEarned = data.totalGoldEarned || 0;
        player.highestZone = data.highestZone || 1;
        player.totalPlayTime = data.totalPlayTime || 0;
        
        // 重置开始时间
        player.startTime = Date.now();
        
        return player;
    }
}

// 导出Player类（支持ES6模块和CommonJS）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
}
