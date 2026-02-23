/**
 * CombatSystem - 战斗系统
 * 处理点击伤害、DPS伤害计算、暴击系统、怪物死亡等核心战斗逻辑
 */
class CombatSystem {
    /**
     * 构造函数
     * @param {Object} game - 游戏主对象
     */
    constructor(game) {
        this.game = game;
        
        // ===== 基础伤害属性 =====
        this.baseClickDamage = 1;           // 基础点击伤害
        this.clickDamageMultiplier = 1;      // 点击伤害倍率
        
        // ===== 暴击系统 =====
        this.baseCritChance = 0;             // 基础暴击率 (0-1)
        this.critChanceBonus = 0;            // 额外暴击率加成
        this.baseCritMultiplier = 2;         // 基础暴击倍率
        this.critMultiplierBonus = 0;        // 额外暴击倍率加成
        
        // ===== DPS系统 =====
        this.totalDPS = 0;                   // 总DPS（每秒伤害）
        this.heroDPS = 0;                    // 英雄提供的DPS
        this.clickDPS = 0;                   // 点击换算的DPS（用于统计）
        
        // ===== 战斗统计 =====
        this.totalClicks = 0;                // 总点击次数
        this.totalDamageDealt = 0;           // 总伤害输出
        this.totalCrits = 0;                 // 总暴击次数
        this.monstersKilled = 0;             // 击杀怪物数
        this.bossesKilled = 0;               // 击杀Boss数
        
        // ===== 伤害数字池 =====
        this.damageNumbers = [];             // 伤害数字对象池
        this.maxDamageNumbers = 50;          // 最大伤害数字数量
        
        // ===== 连击系统 =====
        this.comboCount = 0;                 // 当前连击数
        this.comboTimer = 0;                 // 连击计时器
        this.comboTimeout = 2000;            // 连击超时时间（毫秒）
        this.maxCombo = 0;                   // 最高连击记录
        
        // ===== 自动点击 =====
        this.autoClickRate = 0;              // 自动点击频率（每秒）
        this.autoClickTimer = 0;             // 自动点击计时器
        
        // ===== 金身暴击 =====
        this.goldenClickChance = 0.0001;     // 金身点击触发概率 (0.01%)
        this.goldenClickMultiplier = 10;     // 金身点击倍率
        
        // 初始化
        this.initialize();
    }

    /**
     * 初始化战斗系统
     */
    initialize() {
        this.calculateTotalDPS();
        this.updateClickDamage();
    }

    // ==================== 点击攻击 ====================

    /**
     * 处理点击攻击
     * @param {number} x - 点击位置X坐标（用于伤害数字显示）
     * @param {number} y - 点击位置Y坐标
     * @returns {Object} 攻击结果 {damage, isCrit, isGolden}
     */
    handleClick(x = null, y = null) {
        // 检查是否有当前怪物
        if (!this.game.currentMonster || this.game.currentMonster.isDead) {
            return { damage: 0, isCrit: false, isGolden: false };
        }

        // 增加总点击数
        this.totalClicks++;
        
        // 更新连击
        this.updateCombo();

        // 计算伤害
        const damageResult = this.calculateClickDamage();
        const damage = damageResult.damage;
        const isCrit = damageResult.isCrit;
        const isGolden = damageResult.isGolden;

        // 应用伤害
        this.applyDamage(damage);

        // 记录统计
        this.totalDamageDealt += damage;
        if (isCrit) this.totalCrits++;

        // 生成伤害数字
        const monsterRect = this.getMonsterRect();
        const spawnX = x || (monsterRect ? monsterRect.x + monsterRect.width / 2 : 0);
        const spawnY = y || (monsterRect ? monsterRect.y + monsterRect.height / 3 : 0);
        
        // 添加随机偏移，使伤害数字更自然
        const offsetX = (Math.random() - 0.5) * 60;
        const offsetY = (Math.random() - 0.5) * 40;
        
        this.spawnDamageNumber(damage, isCrit, isGolden, spawnX + offsetX, spawnY + offsetY);

        // 触发点击效果
        this.triggerClickEffect(spawnX, spawnY);

        return { damage, isCrit, isGolden };
    }

    /**
     * 计算点击伤害
     * @returns {Object} {damage, isCrit, isGolden}
     */
    calculateClickDamage() {
        // 基础伤害
        let damage = this.getCurrentClickDamage();
        let isCrit = false;
        let isGolden = false;

        // 检查金身点击（极稀有）
        if (Math.random() < this.goldenClickChance) {
            damage *= this.goldenClickMultiplier;
            isGolden = true;
            this.triggerGoldenClickEffect();
        }

        // 检查暴击
        const currentCritChance = this.getCurrentCritChance();
        if (Math.random() < currentCritChance) {
            damage *= this.getCurrentCritMultiplier();
            isCrit = true;
        }

        // 应用连击加成
        if (this.comboCount > 1) {
            const comboBonus = 1 + (this.comboCount * 0.01); // 每连击+1%伤害
            damage *= comboBonus;
        }

        // 应用全局伤害倍率
        damage *= this.game.damageMultiplier || 1;

        return { 
            damage: Math.floor(damage), 
            isCrit, 
            isGolden 
        };
    }

    /**
     * 获取当前点击伤害
     * @returns {number} 当前点击伤害值
     */
    getCurrentClickDamage() {
        // 基础伤害 + 英雄提供的点击伤害加成
        let damage = this.baseClickDamage;
        
        // 添加英雄提供的点击伤害（部分英雄会提供点击伤害加成）
        if (this.game.heroes) {
            this.game.heroes.forEach(hero => {
                if (hero.level > 0 && hero.clickDamageBonus) {
                    damage += hero.clickDamageBonus * hero.level;
                }
            });
        }

        // 应用倍率
        damage *= this.clickDamageMultiplier;

        return Math.max(1, damage);
    }

    /**
     * 获取当前暴击率
     * @returns {number} 当前暴击率 (0-1)
     */
    getCurrentCritChance() {
        return Math.min(0.75, this.baseCritChance + this.critChanceBonus); // 最高75%暴击率
    }

    /**
     * 获取当前暴击倍率
     * @returns {number} 当前暴击倍率
     */
    getCurrentCritMultiplier() {
        return this.baseCritMultiplier + this.critMultiplierBonus;
    }

    // ==================== DPS伤害 ====================

    /**
     * 计算总DPS
     * 汇总所有英雄的DPS贡献
     */
    calculateTotalDPS() {
        let dps = 0;

        if (this.game.heroes) {
            this.game.heroes.forEach(hero => {
                if (hero.level > 0) {
                    dps += hero.getCurrentDPS();
                }
            });
        }

        // 应用全局DPS倍率
        dps *= this.game.dpsMultiplier || 1;

        this.heroDPS = dps;
        this.totalDPS = dps;
        
        // 更新点击DPS（用于统计）
        this.clickDPS = this.getCurrentClickDamage() * (this.game.clicksPerSecond || 0);

        return this.totalDPS;
    }

    /**
     * 应用DPS伤害（每帧调用）
     * @param {number} deltaTime - 时间增量（毫秒）
     */
    applyDPSDamage(deltaTime) {
        if (!this.game.currentMonster || this.game.currentMonster.isDead) {
            return;
        }

        // 计算这帧应该造成的伤害
        const damage = this.totalDPS * (deltaTime / 1000);
        
        if (damage > 0) {
            this.applyDamage(damage);
            this.totalDamageDealt += damage;
        }
    }

    /**
     * 应用伤害到当前怪物
     * @param {number} damage - 伤害值
     */
    applyDamage(damage) {
        if (!this.game.currentMonster || this.game.currentMonster.isDead) {
            return;
        }

        const monster = this.game.currentMonster;
        const actualDamage = Math.min(damage, monster.currentHealth);
        
        monster.currentHealth -= actualDamage;

        // 检查怪物是否死亡
        if (monster.currentHealth <= 0) {
            monster.isDead = true;
            this.onMonsterKilled(monster);
        }
    }

    // ==================== 怪物死亡处理 ====================

    /**
     * 处理怪物死亡
     * @param {Object} monster - 死亡的怪物对象
     */
    onMonsterKilled(monster) {
        // 增加击杀计数
        this.monstersKilled++;
        if (monster.isBoss) {
            this.bossesKilled++;
        }

        // 计算金币奖励
        const goldReward = this.calculateGoldReward(monster);
        
        // 发放金币
        this.game.addGold(goldReward);

        // 发放经验值
        const expReward = this.calculateExpReward(monster);
        this.game.addExperience(expReward);

        // 触发死亡效果
        this.triggerDeathEffect(monster);

        // 检查Boss战
        if (monster.isBoss && this.game.progressSystem) {
            this.game.progressSystem.onBossDefeated();
        }

        // 通知游戏主逻辑生成新怪物
        this.game.onMonsterDefeated();

        // 连击奖励
        if (this.comboCount >= 10) {
            const comboBonus = Math.floor(this.comboCount / 10) * 0.1; // 每10连击+10%金币
            const bonusGold = goldReward * comboBonus;
            this.game.addGold(bonusGold);
        }
    }

    /**
     * 计算金币奖励
     * @param {Object} monster - 怪物对象
     * @returns {number} 金币奖励
     */
    calculateGoldReward(monster) {
        let baseGold = monster.goldReward || 1;
        
        // 应用金币倍率
        baseGold *= this.game.goldMultiplier || 1;
        
        // Boss额外金币
        if (monster.isBoss) {
            baseGold *= 10;
        }

        // 连击加成
        if (this.comboCount > 5) {
            baseGold *= (1 + this.comboCount * 0.01);
        }

        return Math.floor(baseGold);
    }

    /**
     * 计算经验值奖励
     * @param {Object} monster - 怪物对象
     * @returns {number} 经验值奖励
     */
    calculateExpReward(monster) {
        let baseExp = monster.expReward || 1;
        
        if (monster.isBoss) {
            baseExp *= 5;
        }

        return Math.floor(baseExp);
    }

    // ==================== 伤害数字系统 ====================

    /**
     * 生成伤害数字
     * @param {number} damage - 伤害值
     * @param {boolean} isCrit - 是否暴击
     * @param {boolean} isGolden - 是否金身点击
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    spawnDamageNumber(damage, isCrit, isGolden, x, y) {
        // 限制伤害数字数量
        if (this.damageNumbers.length >= this.maxDamageNumbers) {
            this.damageNumbers.shift(); // 移除最旧的
        }

        const damageNumber = {
            id: Date.now() + Math.random(),
            value: damage,
            isCrit: isCrit,
            isGolden: isGolden,
            x: x,
            y: y,
            startY: y,
            velocityY: -2 - Math.random() * 2, // 向上飘动
            velocityX: (Math.random() - 0.5) * 2, // 轻微左右漂移
            opacity: 1,
            scale: isGolden ? 2 : (isCrit ? 1.5 : 1),
            life: 1000, // 存活时间（毫秒）
            maxLife: 1000,
            color: isGolden ? '#FFD700' : (isCrit ? '#FF4444' : '#FFFFFF')
        };

        this.damageNumbers.push(damageNumber);

        // 触发渲染更新
        if (this.game.uiManager) {
            this.game.uiManager.showDamageNumber(damageNumber);
        }
    }

    /**
     * 更新伤害数字（每帧调用）
     * @param {number} deltaTime - 时间增量
     */
    updateDamageNumbers(deltaTime) {
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const dn = this.damageNumbers[i];
            
            // 更新位置
            dn.x += dn.velocityX;
            dn.y += dn.velocityY;
            
            // 更新生命周期
            dn.life -= deltaTime;
            dn.opacity = dn.life / dn.maxLife;
            
            // 移除过期的伤害数字
            if (dn.life <= 0) {
                this.damageNumbers.splice(i, 1);
            }
        }
    }

    // ==================== 连击系统 ====================

    /**
     * 更新连击计数
     */
    updateCombo() {
        const now = Date.now();
        
        // 检查连击是否中断
        if (now - this.comboTimer > this.comboTimeout) {
            this.comboCount = 0;
        }
        
        // 增加连击
        this.comboCount++;
        this.comboTimer = now;
        
        // 更新最高连击
        if (this.comboCount > this.maxCombo) {
            this.maxCombo = this.comboCount;
        }

        // 触发连击效果
        if (this.comboCount >= 10 && this.comboCount % 10 === 0) {
            this.triggerComboEffect();
        }
    }

    /**
     * 获取连击倍率
     * @returns {number} 连击伤害倍率
     */
    getComboMultiplier() {
        if (this.comboCount <= 1) return 1;
        return 1 + (this.comboCount * 0.01); // 每连击+1%
    }

    // ==================== 效果触发 ====================

    /**
     * 触发点击效果
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    triggerClickEffect(x, y) {
        if (this.game.uiManager) {
            this.game.uiManager.playClickEffect(x, y);
        }
    }

    /**
     * 触发金身点击效果
     */
    triggerGoldenClickEffect() {
        if (this.game.uiManager) {
            this.game.uiManager.playGoldenClickEffect();
        }
    }

    /**
     * 触发连击效果
     */
    triggerComboEffect() {
        if (this.game.uiManager) {
            this.game.uiManager.showComboText(this.comboCount);
        }
    }

    /**
     * 触发死亡效果
     * @param {Object} monster - 死亡的怪物
     */
    triggerDeathEffect(monster) {
        if (this.game.uiManager) {
            this.game.uiManager.playDeathEffect(monster);
        }
    }

    // ==================== 辅助方法 ====================

    /**
     * 获取怪物矩形区域（用于伤害数字定位）
     * @returns {Object|null} {x, y, width, height}
     */
    getMonsterRect() {
        if (this.game.uiManager && this.game.uiManager.getMonsterRect) {
            return this.game.uiManager.getMonsterRect();
        }
        return null;
    }

    /**
     * 更新点击伤害（当英雄升级时调用）
     */
    updateClickDamage() {
        // 重新计算点击伤害
        const oldDamage = this.baseClickDamage;
        
        // 基础点击伤害可以通过某些升级提升
        if (this.game.upgrades) {
            this.game.upgrades.forEach(upgrade => {
                if (upgrade.purchased && upgrade.effect === 'clickDamage') {
                    this.clickDamageMultiplier *= upgrade.multiplier;
                }
            });
        }
    }

    /**
     * 增加暴击率
     * @param {number} amount - 增加的暴击率（0-1）
     */
    addCritChance(amount) {
        this.critChanceBonus += amount;
    }

    /**
     * 增加暴击倍率
     * @param {number} amount - 增加的暴击倍率
     */
    addCritMultiplier(amount) {
        this.critMultiplierBonus += amount;
    }

    /**
     * 增加点击伤害倍率
     * @param {number} multiplier - 倍率
     */
    addClickDamageMultiplier(multiplier) {
        this.clickDamageMultiplier *= multiplier;
    }

    /**
     * 获取战斗统计
     * @returns {Object} 战斗统计数据
     */
    getStats() {
        return {
            totalClicks: this.totalClicks,
            totalDamageDealt: this.totalDamageDealt,
            totalCrits: this.totalCrits,
            critRate: this.totalClicks > 0 ? (this.totalCrits / this.totalClicks * 100).toFixed(2) + '%' : '0%',
            monstersKilled: this.monstersKilled,
            bossesKilled: this.bossesKilled,
            maxCombo: this.maxCombo,
            currentDPS: this.totalDPS,
            currentClickDamage: this.getCurrentClickDamage(),
            critChance: (this.getCurrentCritChance() * 100).toFixed(2) + '%',
            critMultiplier: this.getCurrentCritMultiplier().toFixed(2) + 'x'
        };
    }

    /**
     * 序列化战斗系统数据
     * @returns {Object} 序列化数据
     */
    serialize() {
        return {
            totalClicks: this.totalClicks,
            totalDamageDealt: this.totalDamageDealt,
            totalCrits: this.totalCrits,
            monstersKilled: this.monstersKilled,
            bossesKilled: this.bossesKilled,
            maxCombo: this.maxCombo,
            critChanceBonus: this.critChanceBonus,
            critMultiplierBonus: this.critMultiplierBonus,
            clickDamageMultiplier: this.clickDamageMultiplier
        };
    }

    /**
     * 反序列化战斗系统数据
     * @param {Object} data - 序列化数据
     */
    deserialize(data) {
        if (!data) return;
        
        this.totalClicks = data.totalClicks || 0;
        this.totalDamageDealt = data.totalDamageDealt || 0;
        this.totalCrits = data.totalCrits || 0;
        this.monstersKilled = data.monstersKilled || 0;
        this.bossesKilled = data.bossesKilled || 0;
        this.maxCombo = data.maxCombo || 0;
        this.critChanceBonus = data.critChanceBonus || 0;
        this.critMultiplierBonus = data.critMultiplierBonus || 0;
        this.clickDamageMultiplier = data.clickDamageMultiplier || 1;
    }

    /**
     * 重置战斗系统
     */
    reset() {
        this.totalClicks = 0;
        this.totalDamageDealt = 0;
        this.totalCrits = 0;
        this.monstersKilled = 0;
        this.bossesKilled = 0;
        this.maxCombo = 0;
        this.comboCount = 0;
        this.damageNumbers = [];
        
        this.initialize();
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CombatSystem;
}
