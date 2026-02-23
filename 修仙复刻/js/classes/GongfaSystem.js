/**
 * ============================================================================
 * 功法系统 (Gongfa System) - 完全仿照 Clicker Heroes 英雄系统
 * ============================================================================
 *
 * 换皮映射 (Reskin Mapping):
 * Hero (英雄) -> Gongfa (功法)
 * Level (等级) -> Layer (层数)
 * DPS (秒伤) -> Power (战力/产出)
 * Gold (金币) -> Reiki (灵气)
 * Hero Upgrades (英雄升级) -> Secret Arts (功法秘术)
 * x4 Damage every 25 levels -> Breakthrough (大境界突破)
 */

/**
 * 功法秘术 (Secret Art) - 对应 Clicker Heroes 的英雄升级
 */
class SecretArt {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.description = config.description;
        this.unlockLayer = config.unlockLayer;      // 解锁层数
        this.cost = config.cost;                    // 消耗灵气 (BigNum)
        this.type = config.type;                    // 'self' | 'global'
        this.multiplier = config.multiplier || 2;   // 默认2倍 (100%提升)
        this.purchased = false;
    }

    /**
     * 购买秘术
     */
    purchase() {
        this.purchased = true;
    }

    /**
     * 获取秘术效果描述
     */
    getEffectDesc() {
        if (this.type === 'self') {
            return `本功法战力 ×${this.multiplier}`;
        } else if (this.type === 'global') {
            return `全功法战力 +${(this.multiplier * 100 - 100).toFixed(0)}%`;
        }
        return '';
    }
}

/**
 * 功法 (Gongfa) - 对应 Clicker Heroes 的英雄
 */
class Gongfa {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.description = config.description || '';
        this.icon = config.icon || '📜';

        // 基础数值
        this.baseCost = config.baseCost;            // 基础消耗灵气
        this.basePower = config.basePower;          // 基础战力
        this.costScale = config.costScale || 1.07;  // 消耗增长系数 (默认1.07)

        // 当前状态
        this.layer = 0;                             // 当前层数 (对应Level)
        this.totalSpent = new BigNum(0);            // 累计消耗

        // 秘术系统
        this.secretArts = [];                       // 秘术列表
        this.initSecretArts(config.secretArts || []);

        // 解锁状态
        this.unlocked = config.unlocked || false;   // 是否已解锁
        this.unlockCost = config.unlockCost;        // 解锁消耗 (部分功法需要购买解锁)
    }

    /**
     * 初始化秘术配置
     */
    initSecretArts(artsConfig) {
        for (const config of artsConfig) {
            // 计算秘术价格: 通常是升到该层数所需总花费的10倍
            const layerCost = this.calculateCostToLayer(config.unlockLayer);
            const artCost = layerCost.mul(10);

            this.secretArts.push(new SecretArt({
                id: `${this.id}_art_${config.unlockLayer}`,
                name: config.name,
                description: config.description,
                unlockLayer: config.unlockLayer,
                cost: artCost,
                type: config.type || 'self',
                multiplier: config.multiplier || 2
            }));
        }
    }

    /**
     * 计算升到指定层数的总消耗 (等比数列求和)
     *
     * 数学推导:
     * 每层消耗: Cost_n = BaseCost × (1.07)^n
     * 从0层升到L层的总消耗:
     * Total = BaseCost × [(1.07)^0 + (1.07)^1 + ... + (1.07)^(L-1)]
     *
     * 等比数列求和公式: S_n = a_1 × (r^n - 1) / (r - 1)
     * 其中 a_1 = 1 (因为(1.07)^0 = 1), r = 1.07, n = L
     *
     * 因此: Total = BaseCost × [(1.07)^L - 1] / (1.07 - 1)
     *             = BaseCost × [(1.07)^L - 1] / 0.07
     */
    calculateCostToLayer(targetLayer) {
        if (targetLayer <= 0) return new BigNum(0);
        if (targetLayer <= this.layer) return new BigNum(0);

        // 计算从0层到targetLayer的总消耗
        const scalePow = Math.pow(this.costScale, targetLayer);
        const totalCost = this.baseCost * (scalePow - 1) / (this.costScale - 1);

        return new BigNum(totalCost);
    }

    /**
     * 计算从当前层升到目标层的消耗
     */
    calculateCostFromCurrent(targetLayer) {
        if (targetLayer <= this.layer) return new BigNum(0);

        // 计算当前层数对应的等比数列和
        const currentTotal = this.calculateCostToLayer(this.layer);
        // 计算目标层数对应的等比数列和
        const targetTotal = this.calculateCostToLayer(targetLayer);

        return targetTotal.sub(currentTotal);
    }

    /**
     * 计算单层的消耗 (用于显示下一层成本)
     */
    getNextLayerCost() {
        // Cost = BaseCost × (1.07)^Layer
        const cost = this.baseCost * Math.pow(this.costScale, this.layer);
        return new BigNum(cost);
    }

    /**
     * 计算突破倍率 (Milestone Multiplier)
     *
     * 规则 (完全仿照 Clicker Heroes):
     * - 10层: x4
     * - 25层: x4
     * - 50层: x4
     * - 75层: x4
     * - 100层: x10
     * - 之后每25层: x4
     * - 每1000层: x10 (替代x4)
     */
    getBreakthroughMultiplier() {
        let multiplier = 1;
        const L = this.layer;

        if (L >= 10) {
            // 10层 x4
            multiplier *= 4;
        }
        if (L >= 25) {
            // 25层 x4
            multiplier *= 4;
        }
        if (L >= 50) {
            // 50层 x4
            multiplier *= 4;
        }
        if (L >= 75) {
            // 75层 x4
            multiplier *= 4;
        }

        // 100层及以上
        if (L >= 100) {
            // 计算100层以上的突破
            // 每100层一个周期: 125(x4), 150(x4), 175(x4), 200(x10), ...
            const above100 = L - 100;
            const hundreds = Math.floor(above100 / 100);
            const remainder = above100 % 100;

            // 每完整100层的周期贡献: 3个x4 + 1个x10 = 64x per 100 layers
            // 但100层本身已经是x10了，所以从125开始算

            // 先处理100层的x10
            multiplier *= 10;

            // 处理125, 150, 175 (每个周期)
            for (let i = 0; i < hundreds; i++) {
                // 125 + i*100
                if (100 + 25 + i * 100 <= L) multiplier *= 4;  // 125
                if (100 + 50 + i * 100 <= L) multiplier *= 4;  // 150
                if (100 + 75 + i * 100 <= L) multiplier *= 4;  // 175
                if (100 + 100 + i * 100 <= L) multiplier *= 10; // 200, 300, etc
            }

            // 处理剩余部分
            const startOfCurrentCycle = 100 + hundreds * 100;
            if (startOfCurrentCycle + 25 <= L) multiplier *= 4;  // +25
            if (startOfCurrentCycle + 50 <= L) multiplier *= 4;  // +50
            if (startOfCurrentCycle + 75 <= L) multiplier *= 4;  // +75
        }

        // 每1000层额外x10
        const thousandMultipliers = Math.floor(L / 1000);
        for (let i = 0; i < thousandMultipliers; i++) {
            multiplier *= 10;
        }

        return multiplier;
    }

    /**
     * 获取秘术提供的自身倍率
     */
    getSecretArtMultiplier() {
        let multiplier = 1;
        for (const art of this.secretArts) {
            if (art.purchased && art.type === 'self') {
                multiplier *= art.multiplier;
            }
        }
        return multiplier;
    }

    /**
     * 获取当前战力
     *
     * 公式: BasePower × Layer × BreakthroughMultiplier × SecretArtMultiplier
     */
    getPower() {
        if (this.layer <= 0) return new BigNum(0);

        let power = this.basePower * this.layer;
        power *= this.getBreakthroughMultiplier();
        power *= this.getSecretArtMultiplier();

        return new BigNum(power);
    }

    /**
     * 升级功法 - 升指定层数
     * @param {number} layers - 要升的层数
     * @param {BigNum} currentReiki - 当前拥有的灵气
     * @returns {object} { success: boolean, spent: BigNum, newLayer: number }
     */
    upgrade(layers, currentReiki) {
        if (layers <= 0) return { success: false, spent: new BigNum(0), newLayer: this.layer };

        const targetLayer = this.layer + layers;
        const cost = this.calculateCostFromCurrent(targetLayer);

        if (currentReiki.lt(cost)) {
            return { success: false, spent: new BigNum(0), newLayer: this.layer };
        }

        this.layer = targetLayer;
        this.totalSpent = this.totalSpent.add(cost);

        return { success: true, spent: cost, newLayer: this.layer };
    }

    /**
     * 买最大层数 (Buy Max) - 核心算法
     *
     * 【数学推导 - 等比数列求和反推】
     *
     * 已知:
     * - 当前层数: L0
     * - 当前灵气: R
     * - 升级公式: Cost_n = BaseCost × (1.07)^n
     *
     * 设可以升到第 L 层，则从 L0 升到 L 的总消耗为:
     * Cost = BaseCost × [(1.07)^L0 + (1.07)^(L0+1) + ... + (1.07)^(L-1)]
     *
     * 等比数列求和:
     * Cost = BaseCost × (1.07)^L0 × [(1.07)^(L-L0) - 1] / (1.07 - 1)
     *      = BaseCost × (1.07)^L0 × [(1.07)^(L-L0) - 1] / 0.07
     *
     * 令 x = (1.07)^(L-L0)，则:
     * R = BaseCost × (1.07)^L0 × (x - 1) / 0.07
     *
     * 解方程求 x:
     * x - 1 = R × 0.07 / (BaseCost × (1.07)^L0)
     * x = 1 + R × 0.07 / (BaseCost × (1.07)^L0)
     *
     * 再求 L:
     * (1.07)^(L-L0) = x
     * L - L0 = log(x) / log(1.07)
     * L = L0 + log(x) / log(1.07)
     *
     * 最后向下取整即可!
     */
    buyMax(currentReiki) {
        if (currentReiki.lte(0)) {
            return { success: false, spent: new BigNum(0), layers: 0, newLayer: this.layer };
        }

        // 特殊情况: 当前0层
        if (this.layer === 0) {
            // 直接用总消耗公式反推
            // R = BaseCost × [(1.07)^L - 1] / 0.07
            // (1.07)^L = 1 + R × 0.07 / BaseCost
            // L = log(1 + R × 0.07 / BaseCost) / log(1.07)

            const r = currentReiki.toNumber();
            const numerator = 1 + r * 0.07 / this.baseCost;
            const maxLayer = Math.floor(Math.log(numerator) / Math.log(this.costScale));

            if (maxLayer <= 0) {
                return { success: false, spent: new BigNum(0), layers: 0, newLayer: 0 };
            }

            const cost = this.calculateCostToLayer(maxLayer);
            this.layer = maxLayer;
            this.totalSpent = this.totalSpent.add(cost);

            return { success: true, spent: cost, layers: maxLayer, newLayer: maxLayer };
        }

        // 一般情况: 从 L0 层开始升级
        const L0 = this.layer;
        const r = currentReiki.toNumber();

        // 计算当前层对应的系数
        const currentScale = Math.pow(this.costScale, L0);

        // x = 1 + R × 0.07 / (BaseCost × (1.07)^L0)
        const x = 1 + r * (this.costScale - 1) / (this.baseCost * currentScale);

        if (x <= 1) {
            return { success: false, spent: new BigNum(0), layers: 0, newLayer: L0 };
        }

        // 可升层数 = log(x) / log(1.07)
        const addLayers = Math.floor(Math.log(x) / Math.log(this.costScale));

        if (addLayers <= 0) {
            return { success: false, spent: new BigNum(0), layers: 0, newLayer: L0 };
        }

        const targetLayer = L0 + addLayers;
        const cost = this.calculateCostFromCurrent(targetLayer);

        this.layer = targetLayer;
        this.totalSpent = this.totalSpent.add(cost);

        return { success: true, spent: cost, layers: addLayers, newLayer: targetLayer };
    }

    /**
     * 购买秘术
     */
    purchaseSecretArt(artId, currentReiki) {
        const art = this.secretArts.find(a => a.id === artId);
        if (!art) return { success: false, reason: '秘术不存在' };
        if (art.purchased) return { success: false, reason: '已购买' };
        if (this.layer < art.unlockLayer) return { success: false, reason: '层数不足' };
        if (currentReiki.lt(art.cost)) return { success: false, reason: '灵气不足' };

        art.purchase();
        return { success: true, spent: art.cost };
    }

    /**
     * 获取所有可购买的秘术
     */
    getAvailableSecretArts() {
        return this.secretArts.filter(art =>
            !art.purchased && this.layer >= art.unlockLayer
        );
    }

    /**
     * 序列化
     */
    serialize() {
        return {
            id: this.id,
            layer: this.layer,
            totalSpent: this.totalSpent.toString(),
            secretArts: this.secretArts.map(art => ({
                id: art.id,
                purchased: art.purchased
            })),
            unlocked: this.unlocked
        };
    }

    /**
     * 反序列化
     */
    load(data) {
        if (data.layer !== undefined) this.layer = data.layer;
        if (data.totalSpent) this.totalSpent = new BigNum(data.totalSpent);
        if (data.unlocked !== undefined) this.unlocked = data.unlocked;

        if (data.secretArts) {
            for (const artData of data.secretArts) {
                const art = this.secretArts.find(a => a.id === artData.id);
                if (art) art.purchased = artData.purchased;
            }
        }
    }
}

/**
 * 功法管理器 (GongfaManager)
 */
class GongfaManager {
    constructor() {
        this.gongfas = [];              // 所有功法
        this.globalMultipliers = [];    // 全局倍率 (来自秘术)
        this.unlockedCount = 0;         // 已解锁功法数
    }

    /**
     * 注册功法
     */
    registerGongfa(config) {
        const gongfa = new Gongfa(config);
        this.gongfas.push(gongfa);
        return gongfa;
    }

    /**
     * 获取功法
     */
    getGongfa(id) {
        return this.gongfas.find(g => g.id === id);
    }

    /**
     * 解锁功法
     */
    unlockGongfa(id, currentReiki) {
        const gongfa = this.getGongfa(id);
        if (!gongfa) return { success: false, reason: '功法不存在' };
        if (gongfa.unlocked) return { success: false, reason: '已解锁' };
        if (currentReiki.lt(gongfa.unlockCost)) return { success: false, reason: '灵气不足' };

        gongfa.unlocked = true;
        this.unlockedCount++;
        return { success: true, spent: gongfa.unlockCost };
    }

    /**
     * 获取全局秘术倍率
     */
    getGlobalMultiplier() {
        let multiplier = 1;
        for (const gongfa of this.gongfas) {
            if (!gongfa.unlocked) continue;
            for (const art of gongfa.secretArts) {
                if (art.purchased && art.type === 'global') {
                    multiplier *= art.multiplier;
                }
            }
        }
        return multiplier;
    }

    /**
     * 获取总战力
     */
    getTotalPower() {
        let totalPower = 0;

        for (const gongfa of this.gongfas) {
            if (!gongfa.unlocked) continue;
            const power = gongfa.getPower().toNumber();
            totalPower += power;
        }

        totalPower *= this.getGlobalMultiplier();

        return new BigNum(totalPower);
    }

    /**
     * 获取所有已解锁功法
     */
    getUnlockedGongfas() {
        return this.gongfas.filter(g => g.unlocked);
    }

    /**
     * 获取所有可解锁功法
     */
    getLockableGongfas() {
        return this.gongfas.filter(g => !g.unlocked);
    }

    /**
     * 序列化
     */
    serialize() {
        return {
            gongfas: this.gongfas.map(g => g.serialize()),
            unlockedCount: this.unlockedCount
        };
    }

    /**
     * 反序列化
     */
    load(data) {
        if (!data.gongfas) return;

        for (const gongfaData of data.gongfas) {
            const gongfa = this.getGongfa(gongfaData.id);
            if (gongfa) {
                gongfa.load(gongfaData);
            }
        }

        this.unlockedCount = data.unlockedCount || 0;
    }
}

// ============================================================================
// 运行示例
// ============================================================================

function runExample() {
    console.log('=== 功法系统运行示例 ===\n');

    // 创建功法管理器
    const manager = new GongfaManager();

    // 创建基础功法
    const basicGongfa = manager.registerGongfa({
        id: 'basic_qi_gathering',
        name: '基础吐纳术',
        description: '最基础的灵气吐纳法门',
        icon: '🌬️',
        baseCost: 10,           // 基础消耗10灵气
        basePower: 1,           // 基础战力1
        costScale: 1.07,        // 每次升级成本x1.07
        unlocked: true,         // 初始已解锁
        secretArts: [
            { name: '吐纳精通', unlockLayer: 10, type: 'self', multiplier: 2, description: '吐纳效率翻倍' },
            { name: '灵气共鸣', unlockLayer: 25, type: 'global', multiplier: 1.25, description: '全功法战力+25%' },
            { name: '周天运转', unlockLayer: 50, type: 'self', multiplier: 2, description: '周天运转，效率翻倍' },
            { name: '天地合一', unlockLayer: 100, type: 'global', multiplier: 1.5, description: '全功法战力+50%' }
        ]
    });

    // 显示初始状态
    console.log('初始状态:');
    console.log(`  功法: ${basicGongfa.name}`);
    console.log(`  当前层数: ${basicGongfa.layer}`);
    console.log(`  当前战力: ${basicGongfa.getPower().toString()}`);
    console.log(`  下一层消耗: ${basicGongfa.getNextLayerCost().toString()}`);
    console.log();

    // 模拟拥有 1e100 灵气
    const reiki = new BigNum(1, 100);  // 1e100
    console.log(`玩家拥有灵气: ${reiki.toString()}\n`);

    // 执行 buyMax
    console.log('执行 buyMax...');
    const result = basicGongfa.buyMax(reiki);

    console.log(`升级结果:`);
    console.log(`  成功: ${result.success}`);
    console.log(`  升级层数: ${result.layers}`);
    console.log(`  新的层数: ${result.newLayer}`);
    console.log(`  消耗灵气: ${result.spent.toString()}`);
    console.log();

    // 显示升级后状态
    console.log('升级后状态:');
    console.log(`  当前层数: ${basicGongfa.layer}`);
    console.log(`  当前战力: ${basicGongfa.getPower().toString()}`);
    console.log(`  突破倍率: x${basicGongfa.getBreakthroughMultiplier()}`);
    console.log(`  秘术倍率: x${basicGongfa.getSecretArtMultiplier()}`);
    console.log();

    // 计算理论最大层数验证
    const L0 = 0;
    const r = reiki.toNumber();
    const baseCost = basicGongfa.baseCost;
    const scale = basicGongfa.costScale;

    // 理论公式: L = log(1 + R × 0.07 / BaseCost) / log(1.07)
    const theoreticalMax = Math.log(1 + r * (scale - 1) / baseCost) / Math.log(scale);
    console.log(`理论验证:`);
    console.log(`  理论最大层数: ${Math.floor(theoreticalMax)}`);
    console.log(`  实际升级层数: ${result.newLayer}`);
    console.log(`  误差: ${Math.abs(theoreticalMax - result.newLayer) < 1 ? '可接受 (<1层)' : '需检查'}`);
    console.log();

    // 显示秘术解锁情况
    console.log('秘术解锁情况:');
    const availableArts = basicGongfa.getAvailableSecretArts();
    for (const art of availableArts) {
        console.log(`  [可购买] ${art.name} (需${art.unlockLayer}层) - ${art.getEffectDesc()} - 消耗: ${art.cost.toString()}`);
    }

    return { manager, basicGongfa, result };
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Gongfa, GongfaManager, SecretArt, runExample };
}
