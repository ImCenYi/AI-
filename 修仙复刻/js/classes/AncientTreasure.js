/**
 * AncientTreasure Class - 大千宝录古宝系统（重构版）
 *
 * 古宝收集与养成机制：
 * - 6界域，每域25个古宝，共150个
 * - 9种属性：全属性/攻击/生命/爬塔/刷丹/装备等级/神器等级/指数加成/生灵精华
 * - 品质金字塔：R(13) > SR(6) > SSR(4) > UR(2)
 * - 羁绊系统：9大羁绊，按属性自动归类
 */

class AncientTreasure {
    constructor(game) {
        this.game = game;
        this.activeTab = '凡界古宝';
        this.selectedId = null;
        this.isDrawing = false;
        this.showResult = false;
        this.drawResults = [];
        this.pityCount = 0;
        this.toastMsg = "";
        this.toastTimer = null;

        // 配置引用（必须先初始化，initLibrary会用到）
        this.attrTypes = ANCIENT_TREASURE_ATTR_TYPES;
        this.upgradeCosts = ANCIENT_TREASURE_UPGRADE_COST;
        this.drawRates = ANCIENT_TREASURE_DRAW_RATES;
        this.pityThreshold = ANCIENT_TREASURE_PITY;
        this.synergies = JSON.parse(JSON.stringify(ANCIENT_TREASURE_SYNERGIES));

        // 初始化
        this.library = this.initLibrary();
        this.playerData = {};
        this.completedRealms = new Set();

        // 自动绑定羁绊
        this.bindSynergies();

        // 品质颜色
        this.rankColors = {
            'UR': { bg: 'linear-gradient(135deg, #dc2626, #ea580c)', shadow: '0 0 10px rgba(220, 38, 38, 0.5)', text: '#fca5a5' },
            'SSR': { bg: 'linear-gradient(135deg, #ea580c, #facc15)', shadow: '0 0 10px rgba(234, 88, 12, 0.5)', text: '#fde047' },
            'SR': { bg: 'linear-gradient(135deg, #9333ea, #ec4899)', shadow: '0 0 10px rgba(147, 51, 234, 0.5)', text: '#e9d5ff' },
            'R': { bg: 'linear-gradient(135deg, #3b82f6, #22d3ee)', shadow: '0 0 10px rgba(59, 130, 246, 0.5)', text: '#bae6fd' }
        };

        // 品质基础成长率（用于UI显示，取全属性加成的成长率）
        this.rankGrowth = {
            'UR': 1.15,
            'SSR': 1.10,
            'SR': 1.06,
            'R': 1.03
        };
    }

    /**
     * 生成古宝库 - 6界域 × 25古宝 = 150总计
     */
    initLibrary() {
        const realms = ['凡界古宝', '灵界古宝', '仙界古宝', '神界古宝', '圣界古宝', '道界古宝'];
        const attrKeys = Object.keys(this.attrTypes || {
            ALL_STAT_MULT: {}, ATTACK_MULT: {}, HP_MULT: {}, TOWER_DROP: {},
            PILL_EFFICIENCY: {}, EQUIP_LEVEL: {}, TREASURE_LEVEL: {}, ALL_EXP_BONUS: {}, LIFE_ESSENCE: {}
        });

        // 每个界域的配置
        const realmConfig = {
            '凡界古宝': { iconBase: ['⚔️', '🛡️', '💍', '🏰', '💊', '⚒️', '🔮', '✨', '🌿'], theme: '基础修行' },
            '灵界古宝': { iconBase: ['🗡️', '🧿', '📿', '🗼', '🧪', '🔨', '💎', '🌟', '🍃'], theme: '灵力凝聚' },
            '仙界古宝': { iconBase: ['🔱', '🛡️', '👑', '🏯', '🧫', '⚔️', '🔮', '✨', '🌱'], theme: '仙道法则' },
            '神界古宝': { iconBase: ['⚡', '🛡️', '💠', '🏛️', '💉', '🛠️', '💍', '⭐', '🌾'], theme: '神力加持' },
            '圣界古宝': { iconBase: ['🗡️', '🛡️', '🔱', '🏰', '🧬', '🔨', '💎', '🌟', '🌿'], theme: '圣光庇佑' },
            '道界古宝': { iconBase: ['☯️', '🛡️', '🔮', '🏯', '⚗️', '⚒️', '💍', '✨', '🍃'], theme: '大道本源' }
        };

        // 品质分布：25个 = R13 + SR6 + SSR4 + UR2
        const qualityDistribution = [
            'UR', 'UR',
            'SSR', 'SSR', 'SSR', 'SSR',
            'SR', 'SR', 'SR', 'SR', 'SR', 'SR',
            'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'
        ];

        // 属性分配：确保每种属性至少出现2次，然后随机分配剩余
        const baseAttrDistribution = [
            ...attrKeys, ...attrKeys, // 每种至少2个
            'ALL_STAT_MULT', 'ATTACK_MULT', 'HP_MULT', 'TOWER_DROP', 'PILL_EFFICIENCY' // 补充常用属性
        ];

        const library = {};
        let globalId = 1;

        realms.forEach((realm, realmIdx) => {
            library[realm] = [];
            const config = realmConfig[realm];

            // 打乱品质顺序（但保持UR在后，R在前的大致分布）
            const shuffledQualities = [...qualityDistribution];
            for (let i = shuffledQualities.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledQualities[i], shuffledQualities[j]] = [shuffledQualities[j], shuffledQualities[i]];
            }

            // 打乱属性分配
            const attrPool = [...baseAttrDistribution];
            while (attrPool.length < 25) {
                attrPool.push(attrKeys[Math.floor(Math.random() * attrKeys.length)]);
            }
            for (let i = attrPool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [attrPool[i], attrPool[j]] = [attrPool[j], attrPool[i]];
            }

            // 生成25个古宝
            for (let i = 0; i < 25; i++) {
                const rank = shuffledQualities[i];
                const attrKey = attrPool[i];
                const attrConfig = this.attrTypes?.[attrKey] || { name: '未知', icon: '❓', growthRate: { R: 1.05, SR: 1.08, SSR: 1.12, UR: 1.15 } };

                // 生成名字
                const name = this.generateTreasureName(realm, rank, attrKey, i);

                library[realm].push({
                    id: globalId++,
                    name: name,
                    rank: rank,
                    attr: attrKey,
                    icon: attrConfig.icon || '🔮',
                    desc: `${attrConfig.name}型古宝，${this.getRankDesc(rank)}`,
                    baseValue: attrConfig.growthRate?.[rank] || 1.05
                });
            }

            // 按品质排序：UR > SSR > SR > R
            const rankOrder = { 'UR': 4, 'SSR': 3, 'SR': 2, 'R': 1 };
            library[realm].sort((a, b) => rankOrder[b.rank] - rankOrder[a.rank]);
        });

        console.log('[AncientTreasure] Library initialized:', Object.keys(library).length, 'realms,', Object.values(library).flat().length, 'treasures');
        return library;
    }

    /**
     * 生成古宝名字
     */
    generateTreasureName(realm, rank, attr, index) {
        const prefixes = {
            '凡界古宝': ['青竹', '玄铁', '白玉', '金石', '灵木', '紫云', '丹霞', '黄沙', '黑水', '赤焰'],
            '灵界古宝': ['幽冥', '玄冰', '紫电', '青霜', '赤霞', '金光', '银辉', '黑煞', '白骨', '血影'],
            '仙界古宝': ['九天', '八卦', '七星', '六合', '五行', '四象', '三清', '两仪', '太极', '无极'],
            '神界古宝': ['昊天', '瑶池', '昆仑', '蓬莱', '方丈', '瀛洲', '扶桑', '建木', '不周', '混沌'],
            '圣界古宝': ['永恒', '真理', '正义', '希望', '自由', '和平', '慈爱', '谦逊', '勇气', '智慧'],
            '道界古宝': ['太初', '太始', '太素', '太极', '太易', '太清', '玉清', '上清', '混元', '无极']
        };

        const suffixes = {
            'ALL_STAT_MULT': ['环', '佩', '珠', '印', '镜'],
            'ATTACK_MULT': ['剑', '刀', '枪', '戟', '刃'],
            'HP_MULT': ['鼎', '钟', '塔', '炉', '罐'],
            'TOWER_DROP': ['旗', '幡', '幢', '盖', '罗'],
            'PILL_EFFICIENCY': ['葫', '瓶', '壶', '钵', '盂'],
            'EQUIP_LEVEL': ['锤', '砧', '凿', '锯', '钳'],
            'TREASURE_LEVEL': ['盒', '匣', '囊', '袋', '柜'],
            'ALL_EXP_BONUS': ['碟', '盘', '图', '卷', '册'],
            'LIFE_ESSENCE': ['锄', '镰', '铲', '耙', '叉']
        };

        const realmPrefix = prefixes[realm] || prefixes['凡界古宝'];
        const attrSuffix = suffixes[attr] || suffixes['ALL_STAT_MULT'];

        const prefix = realmPrefix[index % realmPrefix.length];
        const suffix = attrSuffix[Math.floor(index / 5) % attrSuffix.length];
        const rankMarker = rank === 'UR' ? '·至尊' : rank === 'SSR' ? '·传说' : rank === 'SR' ? '·稀有' : '';

        return `${prefix}${suffix}${rankMarker}`;
    }

    /**
     * 获取品质描述
     */
    getRankDesc(rank) {
        const descs = {
            'UR': '天地至宝，万世难求',
            'SSR': '稀世奇珍，有缘者得之',
            'SR': '灵物天成，修行良伴',
            'R': '法器通灵，初窥门径'
        };
        return descs[rank] || '普通灵器';
    }

    /**
     * 自动绑定羁绊 - 按属性归类
     */
    bindSynergies() {
        // 羁绊与属性的映射
        const synergyAttrMap = {
            'warrior_path': ['ATTACK_MULT'],
            'immortal_body': ['HP_MULT'],
            'master_of_all': ['ALL_STAT_MULT'],
            'tower_master': ['TOWER_DROP'],
            'pill_master': ['PILL_EFFICIENCY'],
            'equipment_master': ['EQUIP_LEVEL'],
            'treasure_master': ['TREASURE_LEVEL'],
            'life_master': ['LIFE_ESSENCE'],
            'transcendent': ['ALL_EXP_BONUS']
        };

        // 收集所有古宝按属性分类
        const attrToTreasures = {};
        Object.keys(this.library || {}).forEach(realm => {
            (this.library[realm] || []).forEach(treasure => {
                if (!attrToTreasures[treasure.attr]) {
                    attrToTreasures[treasure.attr] = [];
                }
                attrToTreasures[treasure.attr].push(treasure.id);
            });
        });

        // 绑定到羁绊
        this.synergies.forEach(synergy => {
            const attrs = synergyAttrMap[synergy.id] || [];
            synergy.treasureIds = [];
            attrs.forEach(attr => {
                if (attrToTreasures[attr]) {
                    synergy.treasureIds.push(...attrToTreasures[attr]);
                }
            });
        });
    }

    // ============ 基础查询方法 ============

    getTotalCount() {
        return Object.values(this.library).flat().length;
    }

    getCollectedCount() {
        return Object.values(this.playerData).filter(p => p.level > 0).length;
    }

    getTabItems(tabName) {
        return this.library[tabName] || [];
    }

    getFilteredByRank(tabName, rank) {
        return (this.library[tabName] || []).filter(i => i.rank === rank);
    }

    isUnlocked(id) {
        return this.playerData[id]?.level > 0;
    }

    hasShards(id) {
        return this.playerData[id]?.shards > 0;
    }

    getTreasureData(id) {
        for (const tab of Object.values(this.library)) {
            const item = tab.find(i => i.id === id);
            if (item) return item;
        }
        return null;
    }

    getPlayerData(id) {
        return this.playerData[id] || { shards: 0, level: 0, tier: 1 };
    }

    getTotalLevel(id) {
        const data = this.playerData[id];
        if (!data || data.level === 0) return 0;
        return (data.tier - 1) * 10 + data.level;
    }

    // ============ 计算方法 ============

    /**
     * 计算单个古宝的当前倍率
     */
    calculateSinglePower(id) {
        const item = this.getTreasureData(id);
        const level = this.getTotalLevel(id);
        if (!item || level === 0) return 1;
        return Math.pow(item.baseValue, level);
    }

    /**
     * 计算所有古宝的总倍率（按属性分类）
     */
    getTotalBonuses() {
        const bonuses = {
            allStatMult: 1,
            attackMult: 1,
            hpMult: 1,
            towerDrop: 1,
            pillEfficiency: 1,
            equipLevel: 0,
            treasureLevel: 0,
            allExpBonus: 0,
            lifeEssence: 1
        };

        Object.keys(this.playerData).forEach(id => {
            const item = this.getTreasureData(parseInt(id));
            const power = this.calculateSinglePower(parseInt(id));
            if (!item || power === 1) return;

            switch (item.attr) {
                case 'ALL_STAT_MULT':
                    bonuses.allStatMult *= power;
                    break;
                case 'ATTACK_MULT':
                    bonuses.attackMult *= power;
                    break;
                case 'HP_MULT':
                    bonuses.hpMult *= power;
                    break;
                case 'TOWER_DROP':
                    bonuses.towerDrop *= power;
                    break;
                case 'PILL_EFFICIENCY':
                    bonuses.pillEfficiency *= power;
                    break;
                case 'EQUIP_LEVEL':
                    bonuses.equipLevel += (power - 1) * 10; // 转换为等级
                    break;
                case 'TREASURE_LEVEL':
                    bonuses.treasureLevel += (power - 1) * 10;
                    break;
                case 'ALL_EXP_BONUS':
                    bonuses.allExpBonus += (power - 1);
                    break;
                case 'LIFE_ESSENCE':
                    bonuses.lifeEssence *= power;
                    break;
            }
        });

        // 应用羁绊加成
        const synergyBonuses = this.getAllSynergyBonuses();
        bonuses.allStatMult *= (synergyBonuses.allStatMult || 1);
        bonuses.attackMult *= (synergyBonuses.attackMult || 1);
        bonuses.hpMult *= (synergyBonuses.hpMult || 1);
        bonuses.towerDrop *= (synergyBonuses.towerDrop || 1);
        bonuses.pillEfficiency *= (synergyBonuses.pillEfficiency || 1);
        bonuses.equipLevel += (synergyBonuses.equipLevel || 0);
        bonuses.treasureLevel += (synergyBonuses.treasureLevel || 0);
        bonuses.allExpBonus += (synergyBonuses.allExpBonus || 0);
        bonuses.lifeEssence *= (synergyBonuses.lifeEssence || 1);

        return bonuses;
    }

    /**
     * 获取羁绊加成
     */
    getAllSynergyBonuses() {
        const bonuses = {
            allStatMult: 1, attackMult: 1, hpMult: 1,
            towerDrop: 1, pillEfficiency: 1,
            equipLevel: 0, treasureLevel: 0,
            allExpBonus: 0, lifeEssence: 1
        };

        this.synergies.forEach(synergy => {
            const level = this.getSynergyLevel(synergy.id);
            for (let i = 0; i < level; i++) {
                const effect = synergy.levels[i]?.effect || {};
                Object.keys(effect).forEach(key => {
                    if (typeof effect[key] === 'number') {
                        if (key === 'equipLevel' || key === 'treasureLevel' || key === 'allExpBonus') {
                            bonuses[key] = (bonuses[key] || 0) + effect[key];
                        } else {
                            bonuses[key] = (bonuses[key] || 1) * effect[key];
                        }
                    }
                });
            }
        });

        return bonuses;
    }

    /**
     * 获取总战力倍率（兼容旧版接口）
     * 返回全属性倍率的 BigNum
     */
    getTotalPowerMultiplier() {
        const bonuses = this.getTotalBonuses();
        const mult = bonuses.allStatMult * bonuses.attackMult * bonuses.hpMult;
        return new BigNum(mult);
    }

    /**
     * 获取羁绊激活等级
     */
    getSynergyLevel(synergyId) {
        const synergy = this.synergies.find(s => s.id === synergyId);
        if (!synergy) return 0;

        const activeCount = synergy.treasureIds.filter(id => this.isUnlocked(id)).length;

        let level = 0;
        for (const lvl of synergy.levels) {
            if (activeCount >= lvl.require) level++;
            else break;
        }
        return level;
    }

    /**
     * 检查界域完成
     */
    isRealmCompleted(realmName) {
        const items = this.library[realmName];
        if (!items) return false;
        return items.every(item => this.isUnlocked(item.id));
    }

    getCompletedRealmCount() {
        return Object.keys(this.library).filter(r => this.isRealmCompleted(r)).length;
    }

    // ============ 升级方法 ============

    getUpgradeCost(id) {
        const item = this.getTreasureData(id);
        if (!item) return 999;

        const data = this.playerData[id];
        if (!data || data.level === 0) return 1;

        const costs = this.upgradeCosts[item.rank];
        if (!costs) return 1;

        const levelIndex = Math.min(data.level - 1, 9);
        let cost = costs[levelIndex] || 1;

        // 每升一重，消耗×1.5
        const tierMultiplier = Math.pow(1.5, data.tier - 1);
        cost = Math.max(1, Math.floor(cost * tierMultiplier));

        return cost;
    }

    upgrade(id) {
        const data = this.playerData[id];
        if (!data) return false;

        const cost = this.getUpgradeCost(id);
        if (data.shards < cost) return false;

        const item = this.getTreasureData(id);
        data.shards -= cost;
        data.level += 1;

        if (data.level > 10) {
            data.level = 1;
            data.tier += 1;
            this.showToast(`${item.name} 突破至第${data.tier}重！`);
        } else {
            this.showToast(`${item.name} 升级成功！`);
        }

        if (data.level === 1 && data.tier === 1) {
            this.showToast(`激活古宝：${item.name}`);
            this.checkMilestones();
        }

        this.applyBonusesToGame();
        return true;
    }

    upgradeAll() {
        let upgradedCount = 0;
        let breakthroughCount = 0;

        Object.keys(this.playerData).forEach(id => {
            const data = this.playerData[id];
            const item = this.getTreasureData(parseInt(id));
            if (!item) return;

            const prevTier = data.tier;
            while (data.shards >= this.getUpgradeCost(parseInt(id))) {
                const cost = this.getUpgradeCost(parseInt(id));
                data.shards -= cost;
                data.level += 1;
                if (data.level > 10) {
                    data.level = 1;
                    data.tier += 1;
                }
                upgradedCount++;
            }
            if (data.tier > prevTier) breakthroughCount++;
        });

        if (upgradedCount > 0) {
            let msg = `一键升级完成：${upgradedCount}次`;
            if (breakthroughCount > 0) msg += `，${breakthroughCount}件突破`;
            this.showToast(msg);
            this.applyBonusesToGame();
        }
        return upgradedCount;
    }

    // ============ 寻宝方法 ============

    draw(count) {
        if (this.isDrawing) return;

        const tabItems = this.library[this.activeTab];
        if (!tabItems || tabItems.length === 0) return;

        this.isDrawing = true;
        this.drawResults = [];

        setTimeout(() => {
            for (let i = 0; i < count; i++) {
                this.pityCount++;

                let selected;
                if (this.pityCount >= this.pityThreshold) {
                    const urItems = tabItems.filter(item => item.rank === 'UR');
                    selected = urItems[Math.floor(Math.random() * urItems.length)];
                    this.pityCount = 0;
                } else {
                    const rand = Math.random();
                    let rank;
                    if (rand < this.drawRates.UR) rank = 'UR';
                    else if (rand < this.drawRates.UR + this.drawRates.SSR) rank = 'SSR';
                    else if (rand < this.drawRates.UR + this.drawRates.SSR + this.drawRates.SR) rank = 'SR';
                    else rank = 'R';

                    const rankItems = tabItems.filter(item => item.rank === rank);
                    selected = rankItems[Math.floor(Math.random() * rankItems.length)];
                }

                if (!this.playerData[selected.id]) {
                    this.playerData[selected.id] = { shards: 1, level: 0, tier: 1 };
                } else {
                    this.playerData[selected.id].shards += 1;
                }

                this.drawResults.push(selected);
            }

            this.isDrawing = false;
            this.showResult = true;
            this.applyBonusesToGame();
            this.renderDrawResult();

            const modal = document.getElementById('treasure-draw-result-modal');
            if (modal) modal.style.display = 'flex';
        }, 500);
    }

    // ============ 辅助方法 ============

    showToast(msg) {
        this.toastMsg = msg;
        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => this.toastMsg = '', 2000);
    }

    checkMilestones() {
        Object.keys(this.library).forEach(realm => {
            if (!this.completedRealms.has(realm) && this.isRealmCompleted(realm)) {
                this.completedRealms.add(realm);
                this.showToast(`🎉 ${realm}收集完成！获得里程碑奖励！`);
            }
        });
    }

    applyBonusesToGame() {
        const bonuses = this.getTotalBonuses();
        this.game.ancientTreasureBonuses = bonuses;

        // 触发游戏更新
        if (this.game.updateStatsUI) {
            this.game.updateStatsUI();
        }
    }

    renderDrawResult() {
        const container = document.getElementById('treasure-draw-result');
        if (!container) return;

        let html = '<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; max-width: 500px; margin: 0 auto;">';

        this.drawResults.forEach(item => {
            const rankColor = this.rankColors[item.rank];
            html += `
                <div style="text-align: center;">
                    <div style="
                        width: 60px; height: 60px; margin: 0 auto;
                        background: ${rankColor.bg};
                        border-radius: 8px;
                        display: flex; align-items: center; justify-content: center;
                        font-size: 24px;
                        box-shadow: ${rankColor.shadow};
                    ">${item.icon}</div>
                    <p style="font-size: 10px; margin-top: 5px; color: ${rankColor.text};">${item.name}</p>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    // ============ 序列化 ============

    serialize() {
        return {
            playerData: this.playerData,
            pityCount: this.pityCount,
            activeTab: this.activeTab,
            completedRealms: Array.from(this.completedRealms)
        };
    }

    load(data) {
        if (data.playerData) this.playerData = data.playerData;
        if (data.pityCount !== undefined) this.pityCount = data.pityCount;
        if (data.activeTab) this.activeTab = data.activeTab;
        if (data.completedRealms) this.completedRealms = new Set(data.completedRealms);
        this.applyBonusesToGame();
    }

    addShards(id, count) {
        if (!this.playerData[id]) {
            this.playerData[id] = { shards: count, level: 0, tier: 1 };
        } else {
            this.playerData[id].shards += count;
        }
    }

    // ============ Game.js 兼容方法 ============

    /**
     * 里程碑加成（每完成一个界域+50%）
     */
    get milestoneBonus() {
        return 0.5;
    }

    /**
     * 格式化对数数值（旧版兼容）
     */
    formatLog10(logValue) {
        if (typeof logValue !== 'number') return '1.00';
        return (Math.pow(10, logValue % 1) || 1).toFixed(2) + 'e' + Math.floor(logValue);
    }

    /**
     * 格式化数字（旧版兼容）
     */
    formatNumber(num) {
        if (num instanceof BigNum) {
            return num.toString();
        }
        if (typeof num === 'number') {
            if (num >= 1000000) {
                return num.toExponential(2);
            }
            return num.toFixed(2);
        }
        return '1.00';
    }

    /**
     * 获取总战力对数（旧版兼容）
     */
    getTotalPowerLog() {
        const bonuses = this.getTotalBonuses();
        const totalMult = bonuses.allStatMult * bonuses.attackMult * bonuses.hpMult;
        return Math.log10(totalMult);
    }

    /**
     * 获取羁绊激活数量
     */
    getSynergyActiveCount(synergyId) {
        const synergy = this.synergies.find(s => s.id === synergyId);
        if (!synergy) return 0;

        const attrType = synergy.attrType;
        let count = 0;

        Object.keys(this.playerData).forEach(id => {
            const item = this.getTreasureData(parseInt(id));
            if (item && item.attr === attrType && this.isUnlocked(parseInt(id))) {
                count++;
            }
        });

        return count;
    }

    /**
     * 获取标签页战力对数
     */
    getTabPowerLog(tabName) {
        const items = this.library[tabName];
        if (!items) return 0;

        let totalPower = 1;
        items.forEach(item => {
            if (this.isUnlocked(item.id)) {
                totalPower *= this.calculateSinglePower(item.id);
            }
        });

        return Math.log10(totalPower);
    }

    /**
     * 检查古宝是否解锁
     */
    isUnlocked(id) {
        const data = this.playerData[id];
        return data && data.level > 0;
    }

    /**
     * 检查是否有碎片
     */
    hasShards(id) {
        const data = this.playerData[id];
        return data && data.shards > 0;
    }

    /**
     * 获取古宝总等级（重数×10 + 等级）
     */
    getTotalLevel(id) {
        const data = this.playerData[id];
        if (!data) return 0;
        return (data.tier - 1) * 10 + data.level;
    }

    /**
     * 获取觉醒效果（新版暂不支持，返回兼容格式）
     */
    getAwakeningEffect(id) {
        const data = this.playerData[id];
        if (!data || data.level === 0) {
            return { active: false, tier: 0, name: '未觉醒', desc: '', bonuses: {} };
        }
        return {
            active: true,
            tier: data.tier,
            name: '觉醒',
            desc: '古宝已激活',
            bonuses: {}
        };
    }
}

// Export
try {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { AncientTreasure };
    }
} catch (e) {}
