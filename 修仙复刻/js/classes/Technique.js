/**
 * Technique System - 功法修炼系统 (重构版)
 *
 * 7个功法，每个功法独立修炼，提供不同属性加成
 * 神通系统: 每个功法达到5/10/15级时解锁可选神通
 */

class Technique {
    constructor(game) {
        this.game = game;

        // 初始化各功法
        this.gongfas = {};
        const configs = TECHNIQUE_CONFIG.techniques;

        for (const [key, config] of Object.entries(configs)) {
            this.gongfas[key] = {
                id: key,
                name: config.name,
                icon: config.icon,
                desc: config.desc,
                color: config.color,
                baseCost: config.baseCost,
                costScale: config.costScale,
                effectScale: config.effectScale,
                maxLayer: config.maxLayer,
                bonusType: config.bonusType,
                unlocked: config.unlocked,
                unlockRequirement: config.unlockRequirement,
                layer: 0,
                totalSpent: new BigNum(0),
                // 已购买的神通
                divineAbilitiesPurchased: []
            };
        }

        // 神通配置引用
        this.divineAbilitiesConfig = TECHNIQUE_CONFIG.divineAbilities;
    }

    /**
     * 计算升到指定等级的成本
     * 公式: BaseCost × (Scale^targetLayer - Scale^currentLayer) / (Scale - 1)
     * 简化: 从0到target = BaseCost × (Scale^target - 1) / (Scale - 1)
     */
    calculateUpgradeCost(gongfaId, targetLayer) {
        const gongfa = this.gongfas[gongfaId];
        if (!gongfa || targetLayer <= gongfa.layer) return new BigNum(0);

        const base = gongfa.baseCost;
        const scale = gongfa.costScale;
        const current = gongfa.layer;

        // 等比数列求和: S = a × (r^n - 1) / (r - 1)
        // 从0到target的总成本
        const totalToTarget = base * (Math.pow(scale, targetLayer) - 1) / (scale - 1);
        // 从0到current的总成本
        const totalToCurrent = base * (Math.pow(scale, current) - 1) / (scale - 1);

        return new BigNum(totalToTarget - totalToCurrent);
    }

    /**
     * 计算下一级成本 (显示用)
     */
    getNextLayerCost(gongfaId) {
        const gongfa = this.gongfas[gongfaId];
        if (!gongfa) return new BigNum(0);

        // 单级成本 = BaseCost × Scale^Layer
        const cost = gongfa.baseCost * Math.pow(gongfa.costScale, gongfa.layer);
        return new BigNum(cost);
    }

    /**
     * 计算BuyMax能升到的等级
     */
    calculateBuyMaxLayer(gongfaId) {
        const gongfa = this.gongfas[gongfaId];
        if (!gongfa || !gongfa.unlocked) return gongfa.layer;

        const currentStones = this.game.stones.toNumber();
        if (currentStones <= 0) return gongfa.layer;

        const base = gongfa.baseCost;
        const scale = gongfa.costScale;
        const current = gongfa.layer;
        const max = gongfa.maxLayer;

        // 已有成本 = base × (scale^current - 1) / (scale - 1)
        const spent = base * (Math.pow(scale, current) - 1) / (scale - 1);
        // 可用资源 = currentStones + spent
        const available = currentStones + spent;

        // 求最大n: base × (scale^n - 1) / (scale - 1) <= available
        // scale^n <= available × (scale - 1) / base + 1
        // n <= log(available × (scale - 1) / base + 1) / log(scale)
        const maxLayer = Math.floor(
            Math.log(available * (scale - 1) / base + 1) / Math.log(scale)
        );

        return Math.min(maxLayer, max);
    }

    /**
     * 升级功法 (指定层数)
     */
    upgrade(gongfaId, layers = 1) {
        const gongfa = this.gongfas[gongfaId];
        if (!gongfa || !gongfa.unlocked) {
            return { success: false, reason: '功法未解锁' };
        }

        // 判定是否触发修炼暴击
        const critConfig = TECHNIQUE_CONFIG.critConfig;
        let isCrit = false;
        let actualLayers = layers;

        // 只有单级升级时可能触发暴击，且未达到最大等级时
        if (layers === 1 && gongfa.layer < gongfa.maxLayer) {
            if (Math.random() < critConfig.chance) {
                isCrit = true;
                actualLayers = 1 + critConfig.bonusLayers; // 1 + 2 = 3级
            }
        }

        const oldLayer = gongfa.layer;
        const targetLayer = Math.min(gongfa.layer + actualLayers, gongfa.maxLayer);

        // 计算成本：暴击时只扣正常升级的成本（1级），非暴击按实际升级层数
        let costLayers = isCrit ? layers : actualLayers;
        const costTargetLayer = Math.min(oldLayer + costLayers, gongfa.maxLayer);
        const cost = this.calculateUpgradeCost(gongfaId, costTargetLayer);

        if (this.game.stones.lt(cost)) {
            return { success: false, reason: '灵石不足' };
        }

        this.game.stones = this.game.stones.sub(cost);
        gongfa.layer = targetLayer;
        gongfa.totalSpent = gongfa.totalSpent.add(cost);

        return {
            success: true,
            layers: targetLayer - oldLayer,
            newLayer: targetLayer,
            spent: cost,
            isCrit: isCrit
        };
    }

    /**
     * Buy Max - 买最大层数
     */
    buyMax(gongfaId) {
        const gongfa = this.gongfas[gongfaId];
        if (!gongfa || !gongfa.unlocked) {
            return { success: false, reason: '功法未解锁' };
        }

        const maxLayer = this.calculateBuyMaxLayer(gongfaId);
        if (maxLayer <= gongfa.layer) {
            return { success: false, reason: '灵石不足以升级' };
        }

        const cost = this.calculateUpgradeCost(gongfaId, maxLayer);
        this.game.stones = this.game.stones.sub(cost);

        const oldLayer = gongfa.layer;
        gongfa.layer = maxLayer;
        gongfa.totalSpent = gongfa.totalSpent.add(cost);

        return {
            success: true,
            layers: maxLayer - oldLayer,
            newLayer: maxLayer,
            spent: cost
        };
    }

    /**
     * 解锁功法
     */
    unlockGongfa(gongfaId) {
        const gongfa = this.gongfas[gongfaId];
        if (!gongfa) return { success: false, reason: '功法不存在' };
        if (gongfa.unlocked) return { success: false, reason: '已解锁' };

        // 检查解锁条件
        if (gongfa.unlockRequirement) {
            const req = gongfa.unlockRequirement;
            const reqGongfa = this.gongfas[req.technique];
            if (!reqGongfa || reqGongfa.layer < req.layer) {
                return {
                    success: false,
                    reason: `需要先解锁${reqGongfa?.name || req.technique}并升到${req.layer}层`
                };
            }
        }

        gongfa.unlocked = true;
        return { success: true };
    }

    /**
     * 检查并解锁符合条件的功法
     */
    checkUnlocks() {
        for (const [key, gongfa] of Object.entries(this.gongfas)) {
            if (!gongfa.unlocked && gongfa.unlockRequirement) {
                const req = gongfa.unlockRequirement;
                const reqGongfa = this.gongfas[req.technique];
                if (reqGongfa && reqGongfa.layer >= req.layer) {
                    this.unlockGongfa(key);
                }
            }
        }
    }

    /**
     * 获取功法当前倍率
     */
    getGongfaMultiplier(gongfaId) {
        const gongfa = this.gongfas[gongfaId];
        if (!gongfa || !gongfa.unlocked || gongfa.layer <= 0) {
            return 1;
        }

        // 基础倍率 = effectScale^layer
        let mult = Math.pow(gongfa.effectScale, gongfa.layer);

        // 神通加成
        const abilities = this.divineAbilitiesConfig[gongfaId] || [];
        for (const ability of abilities) {
            if (gongfa.divineAbilitiesPurchased.includes(ability.name)) {
                mult *= ability.effect.value;
            }
        }

        return mult;
    }

    /**
     * 获取可购买的神通列表
     */
    getAvailableDivineAbilities(gongfaId) {
        const gongfa = this.gongfas[gongfaId];
        if (!gongfa || !gongfa.unlocked) return [];

        const abilities = this.divineAbilitiesConfig[gongfaId] || [];
        return abilities.filter(ability => {
            // 已购买的不显示
            if (gongfa.divineAbilitiesPurchased.includes(ability.name)) return false;
            // 达到等级要求
            return gongfa.layer >= ability.layer;
        });
    }

    /**
     * 购买神通
     */
    buyDivineAbility(gongfaId, abilityName) {
        const gongfa = this.gongfas[gongfaId];
        if (!gongfa || !gongfa.unlocked) {
            return { success: false, reason: '功法未解锁' };
        }

        const abilities = this.divineAbilitiesConfig[gongfaId] || [];
        const ability = abilities.find(a => a.name === abilityName);
        if (!ability) return { success: false, reason: '神通不存在' };

        // 检查是否已购买
        if (gongfa.divineAbilitiesPurchased.includes(abilityName)) {
            return { success: false, reason: '已购买此神通' };
        }

        // 检查等级要求
        if (gongfa.layer < ability.layer) {
            return { success: false, reason: `需要${ability.layer}层` };
        }

        // 计算神通成本 = 功法基础成本 × costMult
        const cost = new BigNum(gongfa.baseCost * ability.costMult);

        if (this.game.stones.lt(cost)) {
            return { success: false, reason: '灵石不足' };
        }

        this.game.stones = this.game.stones.sub(cost);
        gongfa.divineAbilitiesPurchased.push(abilityName);

        return { success: true, spent: cost };
    }

    /**
     * 获取所有功法加成汇总
     */
    getAllBonuses() {
        const bonuses = {
            atkMult: 1,      // 攻击倍率
            hpMult: 1,       // 生命倍率
            pillCount: 1,    // 丹药掉落数量
            pillMult: 1,     // 丹药效果倍率
            essenceDrop: 1,  // 真意掉率倍率
            stoneDrop: 1     // 灵石掉率倍率
        };

        for (const [key, gongfa] of Object.entries(this.gongfas)) {
            if (!gongfa.unlocked || gongfa.layer <= 0) continue;

            const mult = this.getGongfaMultiplier(key);

            switch (gongfa.bonusType) {
                case 'atkMult':
                    bonuses.atkMult *= mult;
                    break;
                case 'hpMult':
                    bonuses.hpMult *= mult;
                    break;
                case 'pillCount':
                    bonuses.pillCount *= mult;
                    break;
                case 'pillMult':
                    bonuses.pillMult *= mult;
                    break;
                case 'essenceDrop':
                    bonuses.essenceDrop *= mult;
                    break;
                case 'stoneDrop':
                    bonuses.stoneDrop *= mult;
                    break;
            }
        }

        return bonuses;
    }

    /**
     * 更新UI
     */
    updateUI() {
        // 检查解锁
        this.checkUnlocks();

        // 更新功法列表
        const container = document.getElementById('technique-list');
        if (container) {
            container.innerHTML = this.renderTechniqueList();
        }

        // 更新灵石显示
        this.updateStoneDisplay();

        // 更新总加成显示
        this.updateBonusDisplay();
    }

    /**
     * 渲染功法列表
     */
    renderTechniqueList() {
        let html = '';

        for (const [key, gongfa] of Object.entries(this.gongfas)) {
            html += this.renderTechniqueCard(key, gongfa);
        }

        return html;
    }

    /**
     * 渲染单个功法卡片 - 仿Clicker Heroes风格
     */
    renderTechniqueCard(key, gongfa) {
        const isLocked = !gongfa.unlocked;
        const nextCost = this.getNextLayerCost(key);
        const canAfford = this.game.stones.gte(nextCost);
        const mult = this.getGongfaMultiplier(key);

        // 解锁条件提示
        let lockReason = '';
        if (isLocked && gongfa.unlockRequirement) {
            const req = gongfa.unlockRequirement;
            const reqGongfa = this.gongfas[req.technique];
            lockReason = `需${reqGongfa?.name || req.technique}${req.layer}层`;
        }

        // 可购买的神通
        const availableAbilities = this.getAvailableDivineAbilities(key);

        // 格式化倍率显示
        const multText = this.formatMultiplier(mult);

        // 属性类别描述 - 明确显示每次升级效果
        const bonusTypeDesc = this.getBonusTypeDesc(gongfa);

        // 计算下一级的加成预览
        const nextLevelBonus = Math.pow(gongfa.effectScale, gongfa.layer + 1);
        const currentBonus = Math.pow(gongfa.effectScale, gongfa.layer);
        const bonusIncrease = nextLevelBonus / currentBonus;

        let html = `
            <div class="technique-card ${isLocked ? 'locked' : ''}" style="
                background: linear-gradient(135deg, ${gongfa.color}15, ${gongfa.color}05);
                border: 1px solid ${isLocked ? '#444' : gongfa.color}50;
                border-radius: 10px;
                padding: 12px 14px;
                margin-bottom: 12px;
            ">
                <!-- 主体: 左侧大图标 + 中间信息 + 右侧购买区 -->
                <div style="display: flex; align-items: center; gap: 12px;">
                    <!-- 左侧: 大图标 -->
                    <div style="
                        width: 60px;
                        height: 60px;
                        background: linear-gradient(135deg, ${gongfa.color}30, ${gongfa.color}10);
                        border: 2px solid ${isLocked ? '#555' : gongfa.color}80;
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 2rem;
                        flex-shrink: 0;
                    ">${gongfa.icon}</div>

                    <!-- 中间: 功法信息 -->
                    <div style="flex: 1; min-width: 0;">
                        <!-- 名称和等级 -->
                        <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px;">
                            <span style="font-weight: bold; color: ${isLocked ? '#666' : '#fff'}; font-size: 1.1rem;">
                                ${gongfa.name}
                            </span>
                            ${!isLocked ? `
                                <span style="color: ${gongfa.color}; font-weight: bold; font-size: 0.95rem;">
                                    Lv.${gongfa.layer}
                                </span>
                            ` : ''}
                        </div>

                        ${!isLocked ? `
                            <!-- 当前加成 -->
                            <div style="font-size: 0.85rem; color: ${gongfa.color}; margin-bottom: 2px;">
                                ${bonusTypeDesc} ×${multText}
                            </div>
                            <!-- 下次升级效果 -->
                            <div style="font-size: 0.75rem; color: #888;">
                                升级: ${this.formatMultiplier(bonusIncrease)}倍 ${bonusTypeDesc.split(' ')[0]}
                            </div>
                        ` : `
                            <div style="font-size: 0.8rem; color: #666;">
                                🔒 ${lockReason}
                            </div>
                        `}
                    </div>

                    <!-- 右侧: 购买按钮 -->
                    <div style="flex-shrink: 0;">
                        ${!isLocked ? `
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <!-- Buy按钮 -->
                                <button onclick="const r = game.technique.upgrade('${key}', 1); if(r.success) { if(r.isCrit) game.log('GAIN', '🎆 修炼暴击！${gongfa.name} +' + r.layers + '级！'); game.technique.updateUI(); }"
                                        style="
                                            padding: 8px 16px;
                                            background: ${canAfford ? `linear-gradient(to bottom, ${gongfa.color}, ${this.darkenColor(gongfa.color)})` : '#444'};
                                            border: 2px solid ${canAfford ? gongfa.color : '#555'};
                                            border-radius: 6px;
                                            color: white;
                                            font-size: 0.9rem;
                                            font-weight: bold;
                                            cursor: ${canAfford ? 'pointer' : 'not-allowed'};
                                            opacity: ${canAfford ? 1 : 0.6};
                                            min-width: 80px;
                                        "
                                        ${!canAfford ? 'disabled' : ''}>
                                    ${canAfford ? '修炼' : '💎不足'}
                                </button>
                                <!-- 成本显示 -->
                                <div style="text-align: center; font-size: 0.75rem; color: ${canAfford ? '#fbbf24' : '#666'};">
                                    💎 ${formatNum(nextCost)}
                                </div>
                            </div>
                        ` : `
                            <button onclick="const r = game.technique.unlockGongfa('${key}'); if(r.success) { game.log('GAIN', '解锁${gongfa.name}'); game.technique.updateUI(); }"
                                    style="
                                        padding: 8px 14px;
                                        background: #444;
                                        border: 1px solid #666;
                                        border-radius: 6px;
                                        color: #aaa;
                                        font-size: 0.8rem;
                                        cursor: pointer;
                                    ">
                                解锁
                            </button>
                        `}
                    </div>
                </div>

                <!-- MAX按钮单独一行 -->
                ${!isLocked ? `
                    <div style="display: flex; gap: 8px; margin-top: 10px;">
                        <button onclick="const r = game.technique.buyMax('${key}'); if(r.success) { game.log('GAIN', '${gongfa.name} +' + r.layers + '层'); game.technique.updateUI(); }"
                                style="
                                    flex: 1;
                                    padding: 6px;
                                    background: linear-gradient(to right, #f59e0b, #d97706);
                                    border: none;
                                    border-radius: 6px;
                                    color: white;
                                    font-size: 0.8rem;
                                    font-weight: bold;
                                    cursor: pointer;
                                ">
                            一键突破 (MAX)
                        </button>
                        ${TECHNIQUE_CONFIG.critConfig.chance > 0 ? `
                            <div style="
                                padding: 6px 10px;
                                background: rgba(251,191,36,0.15);
                                border: 1px solid rgba(251,191,36,0.4);
                                border-radius: 6px;
                                color: #fbbf24;
                                font-size: 0.75rem;
                                display: flex;
                                align-items: center;
                            ">
                                ⚡暴击 ${(TECHNIQUE_CONFIG.critConfig.chance * 100).toFixed(0)}%
                            </div>
                        ` : ''}
                    </div>
                ` : ''}

                <!-- 神通区域 -->
                ${!isLocked && availableAbilities.length > 0 ? `
                    <div style="
                        margin-top: 10px;
                        padding-top: 10px;
                        border-top: 1px dashed ${gongfa.color}30;
                    ">
                        <div style="font-size: 0.75rem; color: #888; margin-bottom: 6px;">可修炼神通:</div>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            ${availableAbilities.map(ability => `
                                <button onclick="const r = game.technique.buyDivineAbility('${key}', '${ability.name}'); if(r.success) game.technique.updateUI();"
                                        style="
                                            padding: 8px 12px;
                                            background: linear-gradient(90deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05));
                                            border: 1px solid rgba(251,191,36,0.5);
                                            border-radius: 6px;
                                            color: #fbbf24;
                                            font-size: 0.8rem;
                                            text-align: left;
                                            cursor: pointer;
                                            display: flex;
                                            justify-content: space-between;
                                            align-items: center;
                                        ">
                                    <span>
                                        <span style="color: #fff; font-weight: bold;">${ability.name}</span>
                                        <span style="color: #aaa; margin-left: 8px;">${ability.desc}</span>
                                    </span>
                                    <span style="color: #fbbf24; font-weight: bold;">💎 ${formatNum(new BigNum(gongfa.baseCost * ability.costMult))}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- 已购买的神通 -->
                ${!isLocked && gongfa.divineAbilitiesPurchased.length > 0 ? `
                    <div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px;">
                        ${gongfa.divineAbilitiesPurchased.map(abilityName => {
                            const ability = this.divineAbilitiesConfig[key]?.find(a => a.name === abilityName);
                            return ability ? `
                                <span style="
                                    background: rgba(251,191,36,0.25);
                                    color: #fbbf24;
                                    padding: 4px 10px;
                                    border-radius: 4px;
                                    font-size: 0.75rem;
                                    font-weight: bold;
                                ">✦ ${ability.name}</span>
                            ` : '';
                        }).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        return html;
    }

    /**
     * 获取功法加成类型的描述
     */
    getBonusTypeDesc(gongfa) {
        const effectScale = gongfa.effectScale;
        const scaleText = effectScale >= 10 ? `×${effectScale}` : `×${effectScale.toFixed(1)}`;

        switch (gongfa.bonusType) {
            case 'atkMult':
                return `攻击力${scaleText}`;
            case 'hpMult':
                return `生命值${scaleText}`;
            case 'pillCount':
                return `丹药掉落${scaleText}`;
            case 'pillMult':
                return `丹药效果${scaleText}`;
            case 'essenceDrop':
                return `真意掉率${scaleText}`;
            case 'stoneDrop':
                return `灵石掉落${scaleText}`;
            default:
                return `效果${scaleText}`;
        }
    }

    /**
     * 颜色加深辅助函数
     */
    darkenColor(hexColor) {
        // 简单的颜色加深，将hex转换为rgb后乘以0.7
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        const newR = Math.floor(r * 0.7);
        const newG = Math.floor(g * 0.7);
        const newB = Math.floor(b * 0.7);

        return `rgb(${newR}, ${newG}, ${newB})`;
    }

    /**
     * 格式化倍率显示
     */
    formatMultiplier(mult) {
        if (mult >= 1000000) {
            return mult.toExponential(2);
        }
        if (mult >= 1000) {
            return (mult / 1000).toFixed(1) + 'k';
        }
        if (mult >= 1) {
            return mult.toFixed(mult >= 10 ? 1 : 2);
        }
        return mult.toFixed(2);
    }

    /**
     * 更新灵石显示
     */
    updateStoneDisplay() {
        const el = document.getElementById('res-stones');
        if (el) {
            el.textContent = formatNum(this.game.stones);
        }
    }

    /**
     * 更新加成显示
     */
    updateBonusDisplay() {
        const container = document.getElementById('technique-total-bonus');
        if (!container) return;

        const bonuses = this.getAllBonuses();

        let html = '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">';

        html += this.renderBonusItem('⚔️ 攻击', bonuses.atkMult, '#ef4444');
        html += this.renderBonusItem('🛡️ 生命', bonuses.hpMult, '#3b82f6');
        html += this.renderBonusItem('💎 灵石', bonuses.stoneDrop, '#10b981');
        html += this.renderBonusItem('🌿 丹数', bonuses.pillCount, '#22c55e');
        html += this.renderBonusItem('🔥 丹效', bonuses.pillMult, '#f97316');
        html += this.renderBonusItem('☯️ 真意', bonuses.essenceDrop, '#a855f7');

        html += '</div>';

        container.innerHTML = html;
    }

    renderBonusItem(label, value, color) {
        return `
            <div style="
                background: ${color}15;
                border: 1px solid ${color}40;
                border-radius: 4px;
                padding: 6px 10px;
                text-align: center;
            ">
                <div style="font-size: 0.7rem; color: #888;">${label}</div>
                <div style="font-size: 0.9rem; color: ${color}; font-weight: bold;">×${this.formatMultiplier(value)}</div>
            </div>
        `;
    }

    /**
     * 序列化
     */
    serialize() {
        const data = {};
        for (const [key, gongfa] of Object.entries(this.gongfas)) {
            data[key] = {
                layer: gongfa.layer,
                unlocked: gongfa.unlocked,
                divineAbilitiesPurchased: gongfa.divineAbilitiesPurchased,
                totalSpent: gongfa.totalSpent.toString()
            };
        }
        return data;
    }

    /**
     * 反序列化
     */
    load(data) {
        if (!data) return;

        for (const [key, gongfaData] of Object.entries(data)) {
            if (this.gongfas[key]) {
                const g = this.gongfas[key];
                g.layer = gongfaData.layer || 0;
                g.unlocked = gongfaData.unlocked || false;
                g.divineAbilitiesPurchased = gongfaData.divineAbilitiesPurchased || [];
                g.totalSpent = new BigNum(gongfaData.totalSpent || 0);
            }
        }

        this.updateUI();
    }
}
