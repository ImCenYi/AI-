/**
 * AbyssRelic Class - 深渊遗宝系统
 * 管理遗宝的获取、升级、碎片兑换和属性计算
 * 
 * 新系统：
 * 1. N/R/SR/SSR/UR 五级品质，每级有不同的等级上限
 * 2. 重复获得遗宝可升级，满级后自动分解为碎片
 * 3. 碎片可兑换任意遗宝
 * 
 * 品质等级上限：
 * - N: 10级, 溢出10碎片, 兑换需100
 * - R: 8级, 溢出20碎片, 兑换需200
 * - SR: 5级, 溢出50碎片, 兑换需500
 * - SSR: 3级, 溢出100碎片, 兑换需1000
 * - UR: 1级(不可升级), 溢出300碎片, 兑换需3000
 */

class AbyssRelic {
    constructor(game) {
        this.game = game;
        // 玩家已拥有的遗宝 { relicId: { level, acquiredAt, upgradedAt } }
        this.collectedRelics = {};
        // 遗宝碎片 - 每个BOSS独立 { bossId: fragments }
        this.fragments = {
            'dragon_lord': 0,
            'demon_king': 0,
            'void_beast': 0,
            'ancient_god': 0,
            'chaos_overlord': 0
        };
        // 已激活的遗宝效果（乘算属性默认值为1，表示无加成时的基准倍率）
        this.activeBonuses = {
            allStatMult: 1,        // 全属性倍率 (乘算，默认1)
            towerDropRate: 1,      // 爬塔掉率 (乘算，默认1)
            pillEffectMult: 1,     // 刷丹倍率 (乘算，默认1)
            equipLevelBoost: 0,    // 装备等级 (加算，默认0)
            treasureLevelBoost: 0  // 秘宝等级 (加算，默认0)
        };
        
        // 每日掉落计数（21次上限）
        this.dailyDropCount = 0;
        this.maxDailyDrops = 21;
        this.dropsPerKill = 3; // 单次掉落3个
        
        // 品质权重配置（根据表格）
        this.qualityWeights = {
            'UR': 30,
            'SSR': 120,
            'SR': 200,
            'R': 320,
            'N': 400
        };
        
        // 防御性检查
        if (typeof ABYSS_RELIC_POOLS === 'undefined') {
            console.error('AbyssRelic: ABYSS_RELIC_POOLS is not defined!');
        } else {
            const poolCount = Object.keys(ABYSS_RELIC_POOLS).length;
            const totalRelics = Object.values(ABYSS_RELIC_POOLS).reduce((sum, pool) => sum + pool.length, 0);
            console.log(`AbyssRelic initialized: ${poolCount} pools, ${totalRelics} relics`);
        }
    }

    /**
     * 获取当前次数段的保底品质
     */
    getGuaranteedQuality() {
        const count = this.dailyDropCount;
        if (count <= 2) return 'UR';      // 1-2次：UR
        if (count <= 6) return 'SSR';     // 3-6次：SSR
        if (count <= 11) return 'SR';     // 7-11次：SR
        if (count <= 16) return 'R';      // 12-16次：R
        return 'N';                        // 17-21次：N
    }
    
    /**
     * 从指定BOSS的遗宝池中随机掉落遗宝（新机制：每次3个，每日21次上限）
     * @param {string} bossId - BOSS ID
     * @returns {array|null} - 掉落结果数组，每次3个
     */
    dropRelic(bossId) {
        // 防御性检查
        if (typeof ABYSS_RELIC_POOLS === 'undefined') {
            console.error('dropRelic: ABYSS_RELIC_POOLS is undefined');
            return null;
        }
        
        const pool = ABYSS_RELIC_POOLS[bossId];
        if (!pool || pool.length === 0) {
            console.warn(`dropRelic: No relic pool found for boss ${bossId}`);
            return null;
        }
        
        // 检查是否达到每日上限
        if (this.dailyDropCount >= this.maxDailyDrops) {
            this.game.log('SYS', '今日遗宝掉落已达上限（21次）');
            return null;
        }
        
        // 掉落3个遗宝
        const results = [];
        for (let i = 0; i < this.dropsPerKill; i++) {
            if (this.dailyDropCount >= this.maxDailyDrops) break;
            
            this.dailyDropCount++;
            const guaranteedQuality = this.getGuaranteedQuality();
            
            const result = this.dropSingleRelic(pool, guaranteedQuality);
            if (result) {
                results.push(result);
            }
        }
        
        return results;
    }
    
    /**
     * 单次掉落一个遗宝（内部方法）
     */
    dropSingleRelic(pool, guaranteedQuality) {
        // 按品质权重随机选择
        const weightedRandom = (relics, minQuality) => {
            // 过滤出满足保底品质的遗宝
            const qualityOrder = ['N', 'R', 'SR', 'SSR', 'UR'];
            const minIndex = qualityOrder.indexOf(minQuality);
            
            let filtered = relics.filter(r => {
                const qIndex = qualityOrder.indexOf(r.quality);
                return qIndex >= minIndex;
            });
            
            // 如果没有满足条件的，使用原始列表
            if (filtered.length === 0) filtered = relics;
            
            // 使用新的权重配置
            const totalWeight = filtered.reduce((sum, r) => {
                return sum + (this.qualityWeights[r.quality] || 100);
            }, 0);
            
            let random = Math.random() * totalWeight;
            for (const relic of filtered) {
                const weight = this.qualityWeights[relic.quality] || 100;
                random -= weight;
                if (random <= 0) return relic;
            }
            return filtered[0];
        };

        // 先尝试从未拥有的遗宝中选择
        const unownedRelics = pool.filter(relic => !this.collectedRelics[relic.id]);
        
        if (unownedRelics.length > 0) {
            const selectedRelic = weightedRandom(unownedRelics, guaranteedQuality);
            return this.addRelic(selectedRelic);
        }
        
        // 所有遗宝都已拥有，尝试从未满级的中选择
        const upgradableRelics = pool.filter(relic => {
            const owned = this.collectedRelics[relic.id];
            if (!owned) return false;
            const maxLevel = RELIC_QUALITIES[relic.quality]?.maxLevel || 1;
            return owned.level < maxLevel;
        });
        
        if (upgradableRelics.length > 0) {
            const selectedRelic = weightedRandom(upgradableRelics, guaranteedQuality);
            return this.upgradeRelic(selectedRelic.id);
        }
        
        // 所有遗宝都已满级，随机选择一个转换为碎片
        const selectedRelic = weightedRandom(pool, guaranteedQuality);
        return this.overflowToFragments(selectedRelic);
    }

    /**
     * 添加新遗宝到收藏
     * @param {object} relic - 遗宝数据
     * @returns {object} - 结果 { type: 'new', relic }
     */
    addRelic(relic) {
        if (this.collectedRelics[relic.id]) {
            // 已存在，尝试升级
            return this.upgradeRelic(relic.id);
        }

        const relicData = {
            ...relic,
            level: 1,
            acquiredAt: Date.now(),
            upgradedAt: Date.now()
        };

        this.collectedRelics[relic.id] = relicData;
        this.recalculateBonuses();
        
        return {
            type: 'new',
            relic: relicData
        };
    }

    /**
     * 升级遗宝
     * @param {string} relicId - 遗宝ID
     * @returns {object} - 结果 { type: 'upgrade', relic, newLevel } 或 { type: 'maxed' }
     */
    upgradeRelic(relicId) {
        const relic = this.collectedRelics[relicId];
        if (!relic) return null;

        const maxLevel = RELIC_QUALITIES[relic.quality]?.maxLevel || 1;
        
        if (relic.level >= maxLevel) {
            // 已满级
            return { type: 'maxed', relic };
        }

        const oldLevel = relic.level;
        relic.level++;
        relic.upgradedAt = Date.now();
        
        this.recalculateBonuses();
        
        return {
            type: 'upgrade',
            relic: relic,
            oldLevel: oldLevel,
            newLevel: relic.level
        };
    }

    /**
     * 获取遗宝所属的BOSS ID
     * @param {string} relicId - 遗宝ID
     * @returns {string|null} - BOSS ID
     */
    getRelicBossId(relicId) {
        for (const bossId in ABYSS_RELIC_POOLS) {
            const pool = ABYSS_RELIC_POOLS[bossId];
            if (pool.find(r => r.id === relicId)) {
                return bossId;
            }
        }
        return null;
    }
    
    /**
     * 遗宝溢转为碎片（存入对应BOSS的碎片池）
     * @param {object} relic - 遗宝数据
     * @returns {object} - 结果 { type: 'overflow', relic, fragments, bossId }
     */
    overflowToFragments(relic) {
        const bossId = this.getRelicBossId(relic.id);
        const overflowPoints = RELIC_QUALITIES[relic.quality]?.overflowPoints || 10;
        
        if (bossId && this.fragments[bossId] !== undefined) {
            this.fragments[bossId] += overflowPoints;
        }
        
        return {
            type: 'overflow',
            relic: relic,
            fragments: overflowPoints,
            bossId: bossId,
            totalFragments: bossId ? this.fragments[bossId] : 0
        };
    }

    /**
     * 使用碎片兑换遗宝（只能使用对应BOSS的碎片）
     * @param {string} relicId - 要兑换的遗宝ID
     * @returns {object|null} - 结果 { success, relic?, message? }
     */
    exchangeRelic(relicId) {
        // 查找遗宝定义和所属BOSS
        let relicDef = null;
        let bossId = null;
        for (const bid in ABYSS_RELIC_POOLS) {
            const pool = ABYSS_RELIC_POOLS[bid];
            const found = pool.find(r => r.id === relicId);
            if (found) {
                relicDef = found;
                bossId = bid;
                break;
            }
        }
        
        if (!relicDef || !bossId) {
            return { success: false, message: '遗宝不存在' };
        }

        // 检查是否已拥有
        if (this.collectedRelics[relicId]) {
            return { success: false, message: '已拥有该遗宝' };
        }

        // 检查对应BOSS的碎片是否足够
        const cost = RELIC_QUALITIES[relicDef.quality]?.exchangeCost || 100;
        const bossFragments = this.fragments[bossId] || 0;
        if (bossFragments < cost) {
            return { 
                success: false, 
                message: `${this.getBossName(bossId)}碎片不足，需要${cost}，当前${bossFragments}` 
            };
        }

        // 扣除对应BOSS的碎片并添加遗宝
        this.fragments[bossId] -= cost;
        const result = this.addRelic(relicDef);
        
        return {
            success: true,
            relic: result.relic,
            bossId: bossId,
            remainingFragments: this.fragments[bossId]
        };
    }
    
    /**
     * 获取BOSS名称
     * @param {string} bossId - BOSS ID
     * @returns {string} - BOSS名称
     */
    getBossName(bossId) {
        const bossNames = {
            'dragon_lord': '深渊龙主',
            'demon_king': '魔王',
            'void_beast': '虚空巨兽',
            'ancient_god': '古神',
            'chaos_overlord': '混沌主宰'
        };
        return bossNames[bossId] || bossId;
    }

    /**
     * 重新计算所有遗宝属性加成
     * 
     * 设计区分：
     * - 乘算属性（全属性、爬塔掉率、刷丹倍率）：指数级成长，遗宝之间独立相乘
     *   每个遗宝加成 = 10^(基础指数 × 品质倍率 × 等级)
     * - 加算属性（装备等级、秘宝等级）：线性成长，遗宝之间累加
     *   每个遗宝加成 = 基础值 × 品质倍率 × 等级
     */
    recalculateBonuses() {
        // 重置：乘算属性为1，加算属性为0
        this.activeBonuses = {
            // 乘算属性（指数级）
            allStatMult: 1,        // 全属性倍率
            towerDropRate: 1,      // 爬塔掉率
            pillEffectMult: 1,     // 刷丹倍率
            // 加算属性（线性）
            equipLevelBoost: 0,    // 装备等级
            treasureLevelBoost: 0  // 秘宝等级
        };

        // 遍历所有已收集遗宝
        for (const relicId in this.collectedRelics) {
            const relic = this.collectedRelics[relicId];
            if (relic && relic.attrType) {
                const level = relic.level || 1;
                const baseValue = RELIC_BASE_VALUES[relic.attrType] || 0.02;
                const qualityMult = RELIC_QUALITIES[relic.quality]?.multiplier || 1;
                
                switch (relic.attrType) {
                    case 'all_stat_mult':
                    case 'tower_drop_rate':
                    case 'pill_effect_mult': {
                        // 乘算属性：指数级加成 10^(基础指数 × 品质 × 等级)
                        const exponent = baseValue * qualityMult * level;
                        const multiplier = Math.pow(10, exponent);
                        if (relic.attrType === 'all_stat_mult') {
                            this.activeBonuses.allStatMult *= multiplier;
                        } else if (relic.attrType === 'tower_drop_rate') {
                            this.activeBonuses.towerDropRate *= multiplier;
                        } else {
                            this.activeBonuses.pillEffectMult *= multiplier;
                        }
                        break;
                    }
                    case 'equip_level_boost':
                    case 'treasure_level_boost': {
                        // 加算属性：线性加成 基础值 × 品质 × 等级
                        const addValue = baseValue * qualityMult * level;
                        if (relic.attrType === 'equip_level_boost') {
                            this.activeBonuses.equipLevelBoost += addValue;
                        } else {
                            this.activeBonuses.treasureLevelBoost += addValue;
                        }
                        break;
                    }
                }
            }
        }
    }

    /**
     * 获取遗宝的完整属性信息（考虑等级）
     */
    /**
     * 获取遗宝的完整属性信息
     * 
     * 区分显示：
     * - 乘算属性（全属性/爬塔/刷丹）：显示指数级倍数
     * - 加算属性（装备/秘宝等级）：显示线性累加值
     */
    getRelicAttrInfo(relic) {
        if (!relic || !relic.attrType) return null;
        
        const attrType = RELIC_ATTR_TYPES.find(t => t.id === relic.attrType);
        if (!attrType) return null;
        
        const level = relic.level || 1;
        const baseValue = RELIC_BASE_VALUES[relic.attrType] || 0.02;
        const qualityMult = RELIC_QUALITIES[relic.quality]?.multiplier || 1;
        
        // 从配置中读取计算类型
        const calcType = attrType.calcType || 'multiplicative';
        
        if (calcType === 'multiplicative') {
            // 乘算属性：指数级加成 10^(基础值 × 品质 × 等级)
            const exponent = baseValue * qualityMult * level;
            const multiplier = Math.pow(10, exponent);
            const perLevelExponent = baseValue * qualityMult;
            const perLevelMultiplier = Math.pow(10, perLevelExponent);
            
            return {
                name: attrType.name,
                value: multiplier,                // 总倍数
                perLevelValue: perLevelMultiplier, // 每级倍数
                exponent: exponent,               // 总指数
                perLevelExponent: perLevelExponent, // 每级指数
                level: level,
                suffix: '×',
                desc: attrType.desc,
                calcType: 'multiplicative'        // 计算类型标识
            };
        } else {
            // 加算属性：线性加成 基础值 × 品质 × 等级
            const totalValue = baseValue * qualityMult * level;
            const perLevelValue = baseValue * qualityMult;
            
            return {
                name: attrType.name,
                value: totalValue,                // 总加成值
                perLevelValue: perLevelValue,     // 每级加成
                level: level,
                suffix: '',
                desc: attrType.desc,
                calcType: 'additive'             // 计算类型标识
            };
        }
    }

    /**
     * 获取属性加成后的实际效果
     */
    /**
     * 获取属性加成后的实际效果
     * 
     * 区分处理：
     * - 乘算属性：直接返回倍数
     * - 加算属性：直接返回累加值（已在线性计算中累加）
     */
    getEffectiveBonuses() {
        return {
            // 乘算属性（指数级）：直接返回倍数
            allStatMultiplier: this.activeBonuses.allStatMult,
            towerDropMultiplier: this.activeBonuses.towerDropRate,
            pillEffectMultiplier: this.activeBonuses.pillEffectMult,
            // 加算属性（线性）：直接返回累加值
            equipLevelBoost: Math.floor(this.activeBonuses.equipLevelBoost),
            treasureLevelBoost: Math.floor(this.activeBonuses.treasureLevelBoost)
        };
    }

    /**
     * 获取遗宝的等级进度
     */
    getRelicLevelProgress(relicId) {
        const relic = this.collectedRelics[relicId];
        if (!relic) return null;
        
        const maxLevel = RELIC_QUALITIES[relic.quality]?.maxLevel || 1;
        return {
            level: relic.level,
            maxLevel: maxLevel,
            isMaxed: relic.level >= maxLevel,
            percentage: (relic.level / maxLevel) * 100
        };
    }

    /**
     * 获取指定BOSS的收集进度
     */
    getBossCollectionProgress(bossId) {
        const pool = ABYSS_RELIC_POOLS[bossId];
        if (!pool) return { collected: 0, total: 0, percentage: 0 };

        let collected = 0;
        let totalLevel = 0;
        let maxTotalLevel = 0;
        
        pool.forEach(relic => {
            const owned = this.collectedRelics[relic.id];
            const maxLevel = RELIC_QUALITIES[relic.quality]?.maxLevel || 1;
            maxTotalLevel += maxLevel;
            
            if (owned) {
                collected++;
                totalLevel += owned.level;
            }
        });

        return {
            collected: collected,
            total: pool.length,
            percentage: Math.floor((collected / pool.length) * 100),
            levelProgress: Math.floor((totalLevel / maxTotalLevel) * 100)
        };
    }

    /**
     * 获取总体收集进度
     */
    getTotalProgress() {
        let totalCollected = 0;
        let totalPool = 0;
        let totalFragments = this.fragments;
        
        // 防御性检查
        if (typeof ABYSS_RELIC_POOLS === 'undefined') {
            console.error('getTotalProgress: ABYSS_RELIC_POOLS is undefined');
            return { collected: 0, total: 0, percentage: 0, fragments: totalFragments };
        }

        for (const bossId in ABYSS_RELIC_POOLS) {
            const pool = ABYSS_RELIC_POOLS[bossId];
            if (Array.isArray(pool)) {
                pool.forEach(relic => {
                    totalPool++;
                    if (this.collectedRelics[relic.id]) {
                        totalCollected++;
                    }
                });
            }
        }

        return {
            collected: totalCollected,
            total: totalPool,
            percentage: totalPool > 0 ? Math.floor((totalCollected / totalPool) * 100) : 0,
            fragments: totalFragments
        };
    }

    /**
     * 检查是否已收集某遗宝
     */
    hasRelic(relicId) {
        return !!this.collectedRelics[relicId];
    }

    /**
     * 获取品质名称
     */
    getQualityName(qualityKey) {
        return RELIC_QUALITIES[qualityKey]?.name || '未知';
    }

    /**
     * 获取品质颜色
     */
    getQualityColor(qualityKey) {
        return RELIC_QUALITIES[qualityKey]?.color || '#888';
    }

    /**
     * 获取品质排序值（用于排序）
     */
    getQualitySortValue(qualityKey) {
        const order = { 'UR': 5, 'SSR': 4, 'SR': 3, 'R': 2, 'N': 1 };
        return order[qualityKey] || 0;
    }

    /**
     * 获取所有已收集的遗宝列表（按品质排序）
     */
    getCollectedRelicsList() {
        const list = Object.values(this.collectedRelics);
        return list.sort((a, b) => {
            const qualityDiff = this.getQualitySortValue(b.quality) - this.getQualitySortValue(a.quality);
            if (qualityDiff !== 0) return qualityDiff;
            return b.level - a.level;
        });
    }

    /**
     * 获取可兑换的遗宝列表
     */
    getExchangeableRelics() {
        const result = [];
        for (const bossId in ABYSS_RELIC_POOLS) {
            const pool = ABYSS_RELIC_POOLS[bossId];
            pool.forEach(relic => {
                if (!this.collectedRelics[relic.id]) {
                    const cost = RELIC_QUALITIES[relic.quality]?.exchangeCost || 100;
                    result.push({
                        ...relic,
                        exchangeCost: cost,
                        canAfford: this.fragments >= cost
                    });
                }
            });
        }
        return result.sort((a, b) => {
            const qualityDiff = this.getQualitySortValue(b.quality) - this.getQualitySortValue(a.quality);
            if (qualityDiff !== 0) return qualityDiff;
            return a.exchangeCost - b.exchangeCost;
        });
    }

    /**
     * 序列化数据（用于保存）
     */
    serialize() {
        return {
            collectedRelics: this.collectedRelics,
            fragments: this.fragments
        };
    }

    /**
     * 加载数据
     */
    load(data) {
        if (data) {
            if (data.collectedRelics) {
                this.collectedRelics = data.collectedRelics;
            }
            if (data.fragments !== undefined) {
                this.fragments = data.fragments;
            }
            this.recalculateBonuses();
        }
    }
}

// Export for module systems if needed
try {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = AbyssRelic;
    }
} catch (e) {}
