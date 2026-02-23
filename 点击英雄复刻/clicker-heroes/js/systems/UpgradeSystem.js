/**
 * UpgradeSystem - 升级系统
 * 处理英雄升级、批量升级、成本计算等经济相关逻辑
 */
class UpgradeSystem {
    /**
     * 构造函数
     * @param {Object} game - 游戏主对象
     */
    constructor(game) {
        this.game = game;
        
        // ===== 升级配置 =====
        this.baseCostMultiplier = 1.07;      // 每级成本增长系数
        this.bulkDiscountRate = 0.1;          // 批量购买折扣率
        
        // ===== 批量升级选项 =====
        this.bulkOptions = [1, 10, 25, 100, 'max'];
        this.currentBulkOption = 1;
        
        // ===== 升级历史 =====
        this.upgradeHistory = [];            // 升级记录
        this.maxHistoryLength = 100;         // 最大历史记录数
        
        // ===== 自动升级 =====
        this.autoUpgradeEnabled = false;     // 是否启用自动升级
        this.autoUpgradeHeroId = null;       // 自动升级的英雄ID
        this.autoUpgradeThreshold = 0.9;     // 自动升级金币阈值（保留90%）
    }

    // ==================== 英雄升级 ====================

    /**
     * 升级英雄
     * @param {string|number} heroId - 英雄ID
     * @param {number} levels - 升级等级数（默认1）
     * @returns {Object} 升级结果 {success, levels, totalCost, newLevel}
     */
    upgradeHero(heroId, levels = 1) {
        // 查找英雄
        const hero = this.getHero(heroId);
        if (!hero) {
            return { success: false, error: 'Hero not found' };
        }

        // 检查是否是解锁购买
        if (hero.level === 0) {
            const unlockCost = hero.baseCost;
            if (this.game.gold < unlockCost) {
                return { 
                    success: false, 
                    error: 'Insufficient gold',
                    required: unlockCost,
                    current: this.game.gold
                };
            }

            // 扣除金币并解锁英雄
            this.game.gold -= unlockCost;
            hero.level = 1;
            hero.unlocked = true;
            
            // 触发解锁效果
            this.onHeroUnlocked(hero);
            
            // 记录历史
            this.addToHistory('unlock', hero, 1, unlockCost);

            return {
                success: true,
                levels: 1,
                totalCost: unlockCost,
                newLevel: 1,
                isUnlock: true
            };
        }

        // 计算升级成本
        const costResult = this.calculateBulkUpgradeCost(hero, levels);
        const totalCost = costResult.totalCost;

        // 检查金币是否足够
        if (this.game.gold < totalCost) {
            // 尝试购买尽可能多的等级
            const affordableLevels = this.getMaxAffordableLevels(hero, this.game.gold);
            if (affordableLevels > 0) {
                return this.upgradeHero(heroId, affordableLevels);
            }
            
            return { 
                success: false, 
                error: 'Insufficient gold',
                required: totalCost,
                current: this.game.gold,
                affordable: 0
            };
        }

        // 扣除金币
        this.game.gold -= totalCost;

        // 升级英雄
        const oldLevel = hero.level;
        hero.level += levels;

        // 检查并应用等级奖励
        this.checkLevelBonuses(hero, oldLevel, hero.level);

        // 更新DPS
        if (this.game.combatSystem) {
            this.game.combatSystem.calculateTotalDPS();
        }

        // 触发升级效果
        this.onHeroUpgraded(hero, levels, totalCost);

        // 记录历史
        this.addToHistory('upgrade', hero, levels, totalCost);

        return {
            success: true,
            levels: levels,
            totalCost: totalCost,
            newLevel: hero.level,
            dpsGained: costResult.dpsGained
        };
    }

    /**
     * 批量升级所有可负担的英雄
     * @returns {Object} 批量升级结果
     */
    upgradeAllAffordable() {
        const results = [];
        let totalSpent = 0;
        let totalLevels = 0;

        // 按DPS效率排序英雄
        const sortedHeroes = [...this.game.heroes].sort((a, b) => {
            const efficiencyA = a.getCurrentDPS() / this.getSingleUpgradeCost(a);
            const efficiencyB = b.getCurrentDPS() / this.getSingleUpgradeCost(b);
            return efficiencyB - efficiencyA;
        });

        for (const hero of sortedHeroes) {
            // 解锁未解锁的英雄
            if (hero.level === 0) {
                const result = this.upgradeHero(hero.id);
                if (result.success) {
                    results.push(result);
                    totalSpent += result.totalCost;
                }
                continue;
            }

            // 计算可购买的最大等级
            const maxLevels = this.getMaxAffordableLevels(hero, this.game.gold);
            if (maxLevels > 0) {
                const result = this.upgradeHero(hero.id, maxLevels);
                if (result.success) {
                    results.push(result);
                    totalSpent += result.totalCost;
                    totalLevels += result.levels;
                }
            }
        }

        return {
            success: results.length > 0,
            upgrades: results,
            totalSpent: totalSpent,
            totalLevels: totalLevels
        };
    }

    // ==================== 成本计算 ====================

    /**
     * 计算单个等级的升级成本
     * @param {Object} hero - 英雄对象
     * @param {number} targetLevel - 目标等级
     * @returns {number} 升级成本
     */
    getSingleUpgradeCost(hero, targetLevel = null) {
        const level = targetLevel || (hero.level + 1);
        
        if (level === 1) {
            return hero.baseCost;
        }

        // 成本公式: baseCost * multiplier^(level-1)
        return Math.floor(hero.baseCost * Math.pow(this.baseCostMultiplier, level - 1));
    }

    /**
     * 计算批量升级成本
     * @param {Object} hero - 英雄对象
     * @param {number} levels - 升级等级数
     * @returns {Object} {totalCost, dpsGained, averageCostPerLevel}
     */
    calculateBulkUpgradeCost(hero, levels) {
        if (levels <= 0) {
            return { totalCost: 0, dpsGained: 0, averageCostPerLevel: 0 };
        }

        let totalCost = 0;
        const currentLevel = hero.level;
        
        // 计算总成本（等比数列求和）
        // 公式: baseCost * (multiplier^currentLevel) * (1 - multiplier^levels) / (1 - multiplier)
        if (currentLevel === 0) {
            // 未解锁，只计算第一级成本
            totalCost = hero.baseCost;
        } else {
            const firstLevelCost = this.getSingleUpgradeCost(hero, currentLevel + 1);
            const ratio = Math.pow(this.baseCostMultiplier, levels);
            totalCost = Math.floor(firstLevelCost * (ratio - 1) / (this.baseCostMultiplier - 1));
        }

        // 计算DPS增益
        const currentDPS = hero.getCurrentDPS ? hero.getCurrentDPS() : (hero.baseDPS * currentLevel);
        const newDPS = hero.baseDPS * (currentLevel + levels);
        const dpsGained = newDPS - currentDPS;

        // 批量购买折扣
        let discount = 1;
        if (levels >= 100) discount = 0.9;
        else if (levels >= 25) discount = 0.95;
        else if (levels >= 10) discount = 0.98;

        totalCost = Math.floor(totalCost * discount);

        return {
            totalCost: totalCost,
            dpsGained: dpsGained,
            averageCostPerLevel: Math.floor(totalCost / levels),
            efficiency: dpsGained / totalCost // DPS/金币效率
        };
    }

    /**
     * 获取可购买的最大等级数
     * @param {Object} hero - 英雄对象
     * @param {number} gold - 可用金币
     * @returns {number} 可购买的等级数
     */
    getMaxAffordableLevels(hero, gold) {
        if (hero.level === 0) {
            return gold >= hero.baseCost ? 1 : 0;
        }

        const currentLevel = hero.level;
        const firstLevelCost = this.getSingleUpgradeCost(hero, currentLevel + 1);

        // 如果买不起第一级，返回0
        if (gold < firstLevelCost) {
            return 0;
        }

        // 使用对数计算最大等级
        // gold = firstLevelCost * (multiplier^n - 1) / (multiplier - 1)
        // 解这个方程得到n
        const ratio = this.baseCostMultiplier;
        const maxLevels = Math.floor(
            Math.log(1 + (gold * (ratio - 1)) / firstLevelCost) / Math.log(ratio)
        );

        return Math.max(0, maxLevels);
    }

    /**
     * 获取下一级成本
     * @param {Object} hero - 英雄对象
     * @returns {number} 下一级成本
     */
    getNextLevelCost(hero) {
        if (hero.level === 0) {
            return hero.baseCost;
        }
        return this.getSingleUpgradeCost(hero, hero.level + 1);
    }

    // ==================== 等级奖励 ====================

    /**
     * 检查并应用等级奖励
     * @param {Object} hero - 英雄对象
     * @param {number} oldLevel - 旧等级
     * @param {number} newLevel - 新等级
     */
    checkLevelBonuses(hero, oldLevel, newLevel) {
        // 检查每10级奖励
        for (let level = Math.ceil(oldLevel / 10) * 10; level <= newLevel; level += 10) {
            this.applyLevelBonus(hero, level);
        }

        // 检查特殊等级奖励（25, 50, 75, 100, 125, 150, 175, 200...）
        const specialLevels = [25, 50, 75, 100, 125, 150, 175, 200, 250, 300, 400, 500, 750, 1000];
        for (const level of specialLevels) {
            if (oldLevel < level && newLevel >= level) {
                this.applySpecialBonus(hero, level);
            }
        }

        // 检查1000级以上奖励
        if (newLevel > 1000) {
            const thousandBonus = Math.floor(newLevel / 1000) - Math.floor(oldLevel / 1000);
            for (let i = 0; i < thousandBonus; i++) {
                this.applyThousandBonus(hero);
            }
        }
    }

    /**
     * 应用每10级奖励
     * @param {Object} hero - 英雄对象
     * @param {number} level - 达到的等级
     */
    applyLevelBonus(hero, level) {
        // 每10级：DPS x2
        hero.dpsMultiplier = (hero.dpsMultiplier || 1) * 2;
        
        // 触发奖励效果
        if (this.game.uiManager) {
            this.game.uiManager.showLevelBonus(hero, level, 'DPS x2');
        }
    }

    /**
     * 应用特殊等级奖励
     * @param {Object} hero - 英雄对象
     * @param {number} level - 达到的等级
     */
    applySpecialBonus(hero, level) {
        let bonusText = '';
        
        switch (level) {
            case 25:
                // 25级：DPS x4
                hero.dpsMultiplier = (hero.dpsMultiplier || 1) * 4;
                bonusText = 'DPS x4';
                break;
            case 50:
                // 50级：DPS x4
                hero.dpsMultiplier = (hero.dpsMultiplier || 1) * 4;
                bonusText = 'DPS x4';
                break;
            case 75:
                // 75级：DPS x4
                hero.dpsMultiplier = (hero.dpsMultiplier || 1) * 4;
                bonusText = 'DPS x4';
                break;
            case 100:
            case 125:
            case 150:
            case 175:
                // 100-175级：DPS x2
                hero.dpsMultiplier = (hero.dpsMultiplier || 1) * 2;
                bonusText = 'DPS x2';
                break;
            case 200:
                // 200级：DPS x2 + 解锁新技能
                hero.dpsMultiplier = (hero.dpsMultiplier || 1) * 2;
                this.unlockHeroSkill(hero, 2);
                bonusText = 'DPS x2 + New Skill!';
                break;
            case 250:
            case 300:
            case 400:
            case 500:
                // 250-500级：DPS x2
                hero.dpsMultiplier = (hero.dpsMultiplier || 1) * 2;
                bonusText = 'DPS x2';
                break;
            case 750:
                // 750级：DPS x2
                hero.dpsMultiplier = (hero.dpsMultiplier || 1) * 2;
                bonusText = 'DPS x2';
                break;
            case 1000:
                // 1000级：DPS x10
                hero.dpsMultiplier = (hero.dpsMultiplier || 1) * 10;
                bonusText = 'DPS x10!!!';
                break;
        }

        // 触发奖励效果
        if (this.game.uiManager && bonusText) {
            this.game.uiManager.showLevelBonus(hero, level, bonusText);
        }
    }

    /**
     * 应用1000级奖励
     * @param {Object} hero - 英雄对象
     */
    applyThousandBonus(hero) {
        // 每1000级：DPS x2
        hero.dpsMultiplier = (hero.dpsMultiplier || 1) * 2;
    }

    /**
     * 解锁英雄技能
     * @param {Object} hero - 英雄对象
     * @param {number} skillIndex - 技能索引
     */
    unlockHeroSkill(hero, skillIndex) {
        if (hero.skills && hero.skills[skillIndex]) {
            hero.skills[skillIndex].unlocked = true;
            
            // 应用技能效果
            this.applySkillEffect(hero, hero.skills[skillIndex]);
        }
    }

    /**
     * 应用技能效果
     * @param {Object} hero - 英雄对象
     * @param {Object} skill - 技能对象
     */
    applySkillEffect(hero, skill) {
        if (!skill.effect) return;

        switch (skill.effect.type) {
            case 'dpsMultiplier':
                // 全局DPS倍率
                this.game.dpsMultiplier = (this.game.dpsMultiplier || 1) * skill.effect.value;
                break;
            case 'clickDamageMultiplier':
                // 点击伤害倍率
                if (this.game.combatSystem) {
                    this.game.combatSystem.addClickDamageMultiplier(skill.effect.value);
                }
                break;
            case 'goldMultiplier':
                // 金币倍率
                this.game.goldMultiplier = (this.game.goldMultiplier || 1) * skill.effect.value;
                break;
            case 'critChance':
                // 暴击率
                if (this.game.combatSystem) {
                    this.game.combatSystem.addCritChance(skill.effect.value);
                }
                break;
            case 'critMultiplier':
                // 暴击倍率
                if (this.game.combatSystem) {
                    this.game.combatSystem.addCritMultiplier(skill.effect.value);
                }
                break;
        }
    }

    // ==================== 事件处理 ====================

    /**
     * 英雄解锁时调用
     * @param {Object} hero - 解锁的英雄
     */
    onHeroUnlocked(hero) {
        // 播放解锁效果
        if (this.game.uiManager) {
            this.game.uiManager.playUnlockEffect(hero);
        }

        // 触发游戏事件
        this.game.triggerEvent('heroUnlocked', { hero });
    }

    /**
     * 英雄升级时调用
     * @param {Object} hero - 升级的英雄
     * @param {number} levels - 升级的等级数
     * @param {number} cost - 花费的金币
     */
    onHeroUpgraded(hero, levels, cost) {
        // 播放升级效果
        if (this.game.uiManager) {
            this.game.uiManager.playUpgradeEffect(hero, levels);
        }

        // 触发游戏事件
        this.game.triggerEvent('heroUpgraded', { hero, levels, cost });
    }

    // ==================== 辅助方法 ====================

    /**
     * 获取英雄
     * @param {string|number} heroId - 英雄ID
     * @returns {Object|null} 英雄对象
     */
    getHero(heroId) {
        if (!this.game.heroes) return null;
        
        return this.game.heroes.find(h => h.id === heroId || h.id === parseInt(heroId));
    }

    /**
     * 设置批量升级选项
     * @param {number|string} option - 批量选项
     */
    setBulkOption(option) {
        if (this.bulkOptions.includes(option)) {
            this.currentBulkOption = option;
        }
    }

    /**
     * 获取下一个批量选项
     * @returns {number|string} 下一个批量选项
     */
    getNextBulkOption() {
        const currentIndex = this.bulkOptions.indexOf(this.currentBulkOption);
        const nextIndex = (currentIndex + 1) % this.bulkOptions.length;
        return this.bulkOptions[nextIndex];
    }

    /**
     * 切换批量选项
     */
    toggleBulkOption() {
        this.currentBulkOption = this.getNextBulkOption();
        return this.currentBulkOption;
    }

    /**
     * 添加历史记录
     * @param {string} type - 记录类型
     * @param {Object} hero - 英雄对象
     * @param {number} levels - 等级数
     * @param {number} cost - 成本
     */
    addToHistory(type, hero, levels, cost) {
        this.upgradeHistory.push({
            type,
            heroId: hero.id,
            heroName: hero.name,
            levels,
            cost,
            timestamp: Date.now()
        });

        // 限制历史记录长度
        if (this.upgradeHistory.length > this.maxHistoryLength) {
            this.upgradeHistory.shift();
        }
    }

    /**
     * 获取升级历史
     * @param {number} limit - 限制数量
     * @returns {Array} 历史记录
     */
    getHistory(limit = 10) {
        return this.upgradeHistory.slice(-limit).reverse();
    }

    /**
     * 获取最佳升级建议
     * @returns {Object|null} 最佳升级建议
     */
    getBestUpgradeSuggestion() {
        if (!this.game.heroes || this.game.heroes.length === 0) {
            return null;
        }

        let bestHero = null;
        let bestEfficiency = 0;

        for (const hero of this.game.heroes) {
            // 跳过已解锁但未购买的英雄
            if (hero.level === 0) {
                if (this.game.gold >= hero.baseCost) {
                    const efficiency = hero.baseDPS / hero.baseCost;
                    if (efficiency > bestEfficiency) {
                        bestEfficiency = efficiency;
                        bestHero = hero;
                    }
                }
                continue;
            }

            // 计算升级效率
            const cost = this.getNextLevelCost(hero);
            if (this.game.gold >= cost) {
                const currentDPS = hero.getCurrentDPS ? hero.getCurrentDPS() : (hero.baseDPS * hero.level);
                const newDPS = hero.baseDPS * (hero.level + 1);
                const dpsGain = newDPS - currentDPS;
                const efficiency = dpsGain / cost;

                if (efficiency > bestEfficiency) {
                    bestEfficiency = efficiency;
                    bestHero = hero;
                }
            }
        }

        if (bestHero) {
            return {
                hero: bestHero,
                cost: bestHero.level === 0 ? bestHero.baseCost : this.getNextLevelCost(bestHero),
                efficiency: bestEfficiency
            };
        }

        return null;
    }

    /**
     * 启用/禁用自动升级
     * @param {boolean} enabled - 是否启用
     * @param {string|number} heroId - 目标英雄ID（可选）
     */
    setAutoUpgrade(enabled, heroId = null) {
        this.autoUpgradeEnabled = enabled;
        this.autoUpgradeHeroId = heroId;
    }

    /**
     * 更新自动升级（每帧调用）
     */
    updateAutoUpgrade() {
        if (!this.autoUpgradeEnabled) return;

        const thresholdGold = this.game.gold * this.autoUpgradeThreshold;
        const availableGold = this.game.gold - thresholdGold;

        if (availableGold <= 0) return;

        if (this.autoUpgradeHeroId) {
            // 升级指定英雄
            const hero = this.getHero(this.autoUpgradeHeroId);
            if (hero) {
                const maxLevels = this.getMaxAffordableLevels(hero, availableGold);
                if (maxLevels > 0) {
                    this.upgradeHero(hero.id, maxLevels);
                }
            }
        } else {
            // 自动选择最佳升级
            const suggestion = this.getBestUpgradeSuggestion();
            if (suggestion && suggestion.cost <= availableGold) {
                this.upgradeHero(suggestion.hero.id);
            }
        }
    }

    // ==================== 序列化 ====================

    /**
     * 序列化升级系统数据
     * @returns {Object} 序列化数据
     */
    serialize() {
        return {
            currentBulkOption: this.currentBulkOption,
            autoUpgradeEnabled: this.autoUpgradeEnabled,
            autoUpgradeHeroId: this.autoUpgradeHeroId,
            upgradeHistory: this.upgradeHistory
        };
    }

    /**
     * 反序列化升级系统数据
     * @param {Object} data - 序列化数据
     */
    deserialize(data) {
        if (!data) return;

        this.currentBulkOption = data.currentBulkOption || 1;
        this.autoUpgradeEnabled = data.autoUpgradeEnabled || false;
        this.autoUpgradeHeroId = data.autoUpgradeHeroId || null;
        this.upgradeHistory = data.upgradeHistory || [];
    }

    /**
     * 重置升级系统
     */
    reset() {
        this.upgradeHistory = [];
        this.currentBulkOption = 1;
        this.autoUpgradeEnabled = false;
        this.autoUpgradeHeroId = null;
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UpgradeSystem;
}
