/**
 * Core Config - Game constants and configurations
 */

// Scaling Constants
const SCALE_ENEMY = 2.155;
const SCALE_EQUIP = 1.2;
const SCALE_PILL = 1.3;
const SCALE_TOWER_STR = 10.0;
const SCALE_TOWER_DROP = 2.0;

// Equipment Slots Configuration
const SLOTS_CONFIG = {
    'weapon': { name: '武器', weight: 10, hasCrit: true },
    'offhand': { name: '副武', weight: 10, hasCrit: true },
    'helm': { name: '头部', weight: 10, hasCrit: false },
    'boots': { name: '鞋履', weight: 10, hasCrit: false },
    'legs': { name: '护腿', weight: 10, hasCrit: false },
    'armor': { name: '衣服', weight: 10, hasCrit: true },
    'bracers': { name: '护腕', weight: 10, hasCrit: true },
    'belt': { name: '腰带', weight: 10, hasCrit: false },
    'necklace': { name: '项链', weight: 10, hasCrit: true },
    'orb': { name: '宝珠', weight: 10, hasCrit: false },
    'ring': { name: '戒指', weight: 10, hasCrit: false },
    'secret': { name: '秘宝', weight: 10, hasCrit: true }
};
const SLOT_KEYS = Object.keys(SLOTS_CONFIG);

// Treasure System Configuration
const TREASURE_SLOTS = ['天', '地', '玄', '黄', '宇', '宙'];
const TREASURE_QUALITIES = {
    'N': { val: 0.65, color: 'var(--t-n)', weight: 10 },
    'R': { val: 0.75, color: 'var(--t-r)', weight: 10 },
    'SR': { val: 0.9, color: 'var(--t-sr)', weight: 10 },
    'SSR': { val: 1.1, color: 'var(--t-ssr)', weight: 10 },
    'UR': { val: 1.5, color: 'var(--t-ur)', weight: 10 }
};
const TREASURE_ATTRS = [
    { name: '全属性加成', short: '全属', type: 'all_stat', weight: 10 },
    { name: '爬塔真意掉率', short: '塔掉', type: 'tower_drop', weight: 10 },
    { name: '刷丹倍率', short: '丹倍', type: 'pill_mult', weight: 10 }
];

// Equipment Quality Configuration
const QUALITIES = {
    1: { name: '绿', color: 'var(--q-green)', mult: 1, weight: 25, crit: 1 },
    2: { name: '蓝', color: 'var(--q-blue)', mult: 1.5, weight: 25, crit: 2 },
    3: { name: '紫', color: 'var(--q-purple)', mult: 3, weight: 25, crit: 3 },
    4: { name: '金', color: 'var(--q-gold)', mult: 6, weight: 15, crit: 4 },
    5: { name: '红', color: 'var(--q-red)', mult: 12, weight: 10, crit: 5 }
};

// Enemy Types
const ENEMY_TYPES = [
    { name: '小怪', baseAtk: 5, baseHp: 50, isBoss: false },
    { name: 'BOSS', baseAtk: 30, baseHp: 1000, isBoss: true }
];

// Tower Types
const TOWER_TYPES = [
    { name: '塔灵', baseAtk: 150, baseHp: 750, isBoss: false },
    { name: '塔主', baseAtk: 1500, baseHp: 7500, isBoss: true }
];

// Dungeon Scaling Constants
const DUNGEON_TYPES = [
    { name: '魔物', baseAtk: 0.04, baseHp: 1, type: 'mob' },
    { name: '精英', baseAtk: 0.15, baseHp: 8, type: 'elite' },
    { name: '深渊领主', baseAtk: 1.2, baseHp: 80, type: 'boss' }
];
const DUNGEON_N1_MULT = 33;
const DUNGEON_ATK_INC = 100;
const DUNGEON_HP_INC = 100;

// Dungeon Unlock Requirements
function getDungeonUnlockRequirement(tier) {
    if (tier <= 0) return 0;
    if (tier === 1) return 100;
    return 300 * (tier - 1);
}

const MAX_DUNGEON_TIER = 999999;

// Realm Breakthrough Configuration
const REALM_TABLE = [
    ['凡人-武者', 1], ['练气-初期', 4], ['练气-中期', 6], ['练气-后期', 12],
    ['练气-圆满', 22], ['筑基-初期', 36], ['筑基-中期', 54], ['筑基-后期', 75],
    ['筑基-圆满', 101], ['结丹-初期', 131], ['结丹-中期', 165], ['结丹-后期', 202],
    ['结丹-圆满', 244], ['元婴-初期', 290], ['元婴-中期', 339], ['元婴-后期', 393],
    ['元婴-圆满', 450], ['化神-初期', 512], ['化神-中期', 577], ['化神-后期', 646],
    ['化神-圆满', 720], ['洞虚-初期', 797], ['洞虚-中期', 878], ['洞虚-后期', 964],
    ['洞虚-圆满', 1053], ['合体-初期', 1146], ['合体-中期', 1243], ['合体-后期', 1344],
    ['合体-圆满', 1450], ['渡劫-初期', 1559], ['渡劫-中期', 1672], ['渡劫-后期', 1789],
    ['渡劫-圆满', 1910], ['大乘-初期', 2035], ['大乘-中期', 2163], ['大乘-后期', 2296],
    ['大乘-圆满', 2433], ['地仙-初期', 2574], ['地仙-中期', 2719], ['地仙-后期', 2867],
    ['地仙-圆满', 3020], ['真仙-初期', 3177], ['真仙-中期', 3337], ['真仙-后期', 3502],
    ['真仙-圆满', 3670], ['金仙-初期', 3843], ['金仙-中期', 4019], ['金仙-后期', 4200],
    ['金仙-圆满', 4384], ['太乙玄仙-初期', 4573], ['太乙玄仙-中期', 4765],
    ['太乙玄仙-后期', 4961], ['太乙玄仙-圆满', 5162], ['大罗金仙-初期', 5366],
    ['大罗金仙-中期', 5574], ['大罗金仙-后期', 5786], ['大罗金仙-圆满', 6002],
    ['道祖-初期', 6223], ['道祖-中期', 6447], ['道祖-后期', 6675], ['道祖-圆满', 6907],
    ['至尊道祖-初期', 7143], ['至尊道祖-中期', 7383], ['至尊道祖-后期', 7626],
    ['至尊道祖-圆满', 7874], ['半神-初期', 8126], ['半神-中期', 8382],
    ['半神-后期', 8642], ['半神-圆满', 8905], ['真神-初期', 9173],
    ['真神-中期', 9445], ['真神-后期', 9720], ['真神-圆满', 10000],
    ['界神-初期', 10284], ['界神-中期', 10571], ['界神-后期', 10863],
    ['界神-圆满', 11158], ['寰宇神尊-初期', 11457], ['寰宇神尊-中期', 11761],
    ['寰宇神尊-后期', 12068], ['寰宇神尊-圆满', 12380], ['永恒真神-初期', 12695],
    ['永恒真神-中期', 13014], ['永恒真神-后期', 13337], ['永恒真神-圆满', 13665],
    ['混沌主宰-初期', 13996], ['混沌主宰-中期', 14331], ['混沌主宰-后期', 14670],
    ['混沌主宰-圆满', 15013], ['神王-初期', 15360], ['神王-中期', 15711],
    ['神王-后期', 16066], ['神王-圆满', 16425], ['神帝-初期', 16788],
    ['神帝-中期', 17155], ['神帝-后期', 17525], ['神帝-圆满', 17900],
    ['无上至尊——1境', 18279]
];

function getRealmInfo(index) {
    if (index < REALM_TABLE.length) {
        return { name: REALM_TABLE[index][0], requiredDifficulty: REALM_TABLE[index][1] };
    }
    const tier = index - 97 + 1;
    return {
        name: `无上至尊——${tier}境`,
        requiredDifficulty: 18279 + (tier - 1) * 10000
    };
}

/**
 * 计算单次境界突破的倍率（基于跨度）
 * 公式：1.1 ^ (当前境界所需N - 上一境界所需N)
 * @param {number} realmIndex - 目标境界索引
 * @returns {BigNum} 单次突破倍率
 */
function getRealmBreakthroughMultiplier(realmIndex) {
    if (realmIndex <= 0) return new BigNum(1);

    const currentRealm = getRealmInfo(realmIndex);
    const prevRealm = getRealmInfo(realmIndex - 1);

    const span = currentRealm.requiredDifficulty - prevRealm.requiredDifficulty;
    return new BigNum(1.1).pow(span);
}

/**
 * 计算累计境界加成（所有突破倍率连乘）
 * @param {number} realmIndex - 当前境界索引
 * @returns {BigNum} 总境界倍率
 */
function getRealmBonus(realmIndex) {
    if (realmIndex <= 0) return new BigNum(1);

    let total = new BigNum(1);
    for (let i = 1; i <= realmIndex; i++) {
        total = total.mul(getRealmBreakthroughMultiplier(i));
    }
    return total;
}

// Realm Boss Constants
const REALM_BOSS_ATK_BASE = 50;
const REALM_BOSS_HP_BASE = 2000;
const REALM_BOSS_EMOJI = '🐉';
const REALM_BOSS_MULT = 2.5;
const REALM_BONUS_BASE = 1.1;
const REALM_BONUS_EXPONENT = 1.05;

// Spirit Garden Configuration
const GARDEN_CONFIG = {
    maxLands: 16,
    initialLands: 4,
    unlockCostBase: 200,
    unlockCostGrowth: 2.5,
    puppetUnlockLevel: 2,
    alchemyUnlockLevel: 10,
    alchemyBonus: 1.2,
    expToLawRate: 0.1,
    turnNames: ['凡阶', '1转', '2转', '3转', '4转', '5转', '6转', '7转', '8转', '9转'],
    baseCrops: [
        { id: 1, name: '凝气草', quality: 0, icon: '🌿', time: 3, cost: 10, income: 15, exp: 5, reqLevel: 1 },
        { id: 2, name: '血菩提', quality: 1, icon: '🍒', time: 10, cost: 100, income: 250, exp: 25, reqLevel: 3 },
        { id: 3, name: '玄冰花', quality: 2, icon: '❄️', time: 30, cost: 800, income: 2400, exp: 120, reqLevel: 10 },
        { id: 4, name: '紫金藤', quality: 3, icon: '🎋', time: 60, cost: 3000, income: 10000, exp: 400, reqLevel: 25 },
        { id: 5, name: '龙鳞果', quality: 4, icon: '🐲', time: 120, cost: 15000, income: 60000, exp: 1500, reqLevel: 45 },
        { id: 6, name: '悟道茶', quality: 5, icon: '🍵', time: 300, cost: 80000, income: 400000, exp: 6000, reqLevel: 65 },
        { id: 7, name: '混沌莲', quality: 5, icon: '🪷', time: 600, cost: 500000, income: 3000000, exp: 20000, reqLevel: 80 }
    ]
};

const CROP_QUALITY_COLORS = [
    '#9ca3af', '#4ade80', '#60a5fa', '#c084fc', '#facc15', '#ef4444'
];

// ==================== 深渊遗宝系统配置 ====================

const ABYSS_BOSSES = [
    { id: 'dragon_lord', name: '深渊魔龙', emoji: '🐉', level: 1, unlockDifficulty: 50, reviveTime: 60, color: '#ff4444', description: '深渊入口的守护者', targetKillTime: 40, targetSurviveTime: 50, dpsMultiplier: 1.0 },
    { id: 'demon_king', name: '深渊魔王', emoji: '👹', level: 2, unlockDifficulty: 150, reviveTime: 90, color: '#ff6600', description: '掌控深渊魔气', targetKillTime: 45, targetSurviveTime: 55, dpsMultiplier: 1.0 },
    { id: 'void_beast', name: '虚空巨兽', emoji: '👾', level: 3, unlockDifficulty: 300, reviveTime: 120, color: '#9c27b0', description: '来自虚空维度', targetKillTime: 50, targetSurviveTime: 60, dpsMultiplier: 1.0 },
    { id: 'ancient_god', name: '远古邪神', emoji: '👿', level: 4, unlockDifficulty: 500, reviveTime: 180, color: '#ffd700', description: '被封印的远古神明', targetKillTime: 55, targetSurviveTime: 65, dpsMultiplier: 1.0 },
    { id: 'chaos_overlord', name: '混沌主宰', emoji: '🌑', level: 5, unlockDifficulty: 800, reviveTime: 300, color: '#ff1744', description: '深渊之主', targetKillTime: 60, targetSurviveTime: 70, dpsMultiplier: 1.0 }
];

const RELIC_QUALITIES = {
    'N': { name: 'N', color: '#9ca3af', weight: 400, border: '2px solid #9ca3af', multiplier: 0.5, maxLevel: 100, overflowPoints: 10, exchangeCost: 100 },
    'R': { name: 'R', color: '#60a5fa', weight: 320, border: '2px solid #60a5fa', multiplier: 1, maxLevel: 80, overflowPoints: 20, exchangeCost: 200 },
    'SR': { name: 'SR', color: '#c084fc', weight: 200, border: '2px solid #c084fc', multiplier: 2.5, maxLevel: 50, overflowPoints: 50, exchangeCost: 500 },
    'SSR': { name: 'SSR', color: '#facc15', weight: 120, border: '2px solid #facc15', multiplier: 6, maxLevel: 30, overflowPoints: 100, exchangeCost: 1000 },
    'UR': { name: 'UR', color: '#ef4444', weight: 30, border: '2px solid #ef4444', multiplier: 15, maxLevel: 10, overflowPoints: 300, exchangeCost: 3000 }
};

const RELIC_ATTR_TYPES = [
    { id: 'all_stat_mult', name: '全属性倍率', suffix: '', desc: '攻击和生命指数加成，遗宝之间相乘', calcType: 'multiplicative', baseValue: 0.02 },
    { id: 'tower_drop_rate', name: '爬塔掉率', suffix: '', desc: '通天塔法则真意掉落数量指数级提升，遗宝相乘', calcType: 'multiplicative', baseValue: 0.03 },
    { id: 'pill_effect_mult', name: '刷丹倍率', suffix: '', desc: '主线丹药使用效果指数级倍增，遗宝相乘', calcType: 'multiplicative', baseValue: 0.04 },
    { id: 'equip_level_boost', name: '装备等级', suffix: '', desc: '主线装备等级线性提升，遗宝相加', calcType: 'additive', baseValue: 0.006 },
    { id: 'treasure_level_boost', name: '秘宝等级', suffix: '', desc: '秘宝副本掉落等级线性提升，遗宝相加', calcType: 'additive', baseValue: 0.006 }
];

const RELIC_BASE_VALUES = {
    'all_stat_mult': 0.02,
    'tower_drop_rate': 0.03,
    'pill_effect_mult': 0.04,
    'equip_level_boost': 0.006,
    'treasure_level_boost': 0.006
};

const ABYSS_RELIC_POOLS = {
    'dragon_lord': [
        { id: 'relic_dl_01', name: '深渊龙核', quality: 'UR', icon: '💎', attrType: 'all_stat_mult' },
        { id: 'relic_dl_02', name: '龙神之赐', quality: 'UR', icon: '👑', attrType: 'pill_effect_mult' },
        { id: 'relic_dl_03', name: '魔龙宝藏', quality: 'UR', icon: '🏆', attrType: 'equip_level_boost' },
        { id: 'relic_dl_04', name: '龙鳞甲片', quality: 'SSR', icon: '🛡️', attrType: 'all_stat_mult' },
        { id: 'relic_dl_05', name: '龙血精华', quality: 'SSR', icon: '🩸', attrType: 'pill_effect_mult' },
        { id: 'relic_dl_06', name: '龙眼宝珠', quality: 'SSR', icon: '👁️', attrType: 'tower_drop_rate' },
        { id: 'relic_dl_07', name: '龙爪锐刃', quality: 'SSR', icon: '⚔️', attrType: 'equip_level_boost' },
        { id: 'relic_dl_08', name: '龙骨', quality: 'SR', icon: '🦴', attrType: 'all_stat_mult' },
        { id: 'relic_dl_09', name: '龙牙', quality: 'SR', icon: '🦷', attrType: 'pill_effect_mult' },
        { id: 'relic_dl_10', name: '龙皮', quality: 'SR', icon: '🐉', attrType: 'tower_drop_rate' },
        { id: 'relic_dl_11', name: '龙翼', quality: 'SR', icon: '🪶', attrType: 'equip_level_boost' },
        { id: 'relic_dl_12', name: '龙尾', quality: 'SR', icon: '🐲', attrType: 'treasure_level_boost' },
        { id: 'relic_dl_13', name: '龙鳞碎片', quality: 'R', icon: '🔷', attrType: 'all_stat_mult' },
        { id: 'relic_dl_14', name: '龙血残滴', quality: 'R', icon: '💧', attrType: 'pill_effect_mult' },
        { id: 'relic_dl_15', name: '龙息结晶', quality: 'R', icon: '🔥', attrType: 'tower_drop_rate' },
        { id: 'relic_dl_16', name: '龙骨粉末', quality: 'R', icon: '⚪', attrType: 'equip_level_boost' },
        { id: 'relic_dl_17', name: '龙筋', quality: 'R', icon: '🧵', attrType: 'treasure_level_boost' },
        { id: 'relic_dl_18', name: '龙鳞碎屑', quality: 'N', icon: '⚪', attrType: 'all_stat_mult' },
        { id: 'relic_dl_19', name: '龙血微尘', quality: 'N', icon: '✨', attrType: 'pill_effect_mult' },
        { id: 'relic_dl_20', name: '龙息余热', quality: 'N', icon: '🔥', attrType: 'tower_drop_rate' },
        { id: 'relic_dl_21', name: '龙骨残渣', quality: 'N', icon: '🦴', attrType: 'equip_level_boost' },
        { id: 'relic_dl_22', name: '龙筋细丝', quality: 'N', icon: '🧶', attrType: 'treasure_level_boost' }
    ],
    'demon_king': [
        { id: 'relic_dk_01', name: '魔王之心', quality: 'UR', icon: '🖤', attrType: 'all_stat_mult' },
        { id: 'relic_dk_02', name: '魔王权杖', quality: 'UR', icon: '👑', attrType: 'tower_drop_rate' },
        { id: 'relic_dk_03', name: '魔王宝库', quality: 'UR', icon: '🏆', attrType: 'treasure_level_boost' },
        { id: 'relic_dk_04', name: '魔角', quality: 'SSR', icon: '👿', attrType: 'all_stat_mult' },
        { id: 'relic_dk_05', name: '魔翼', quality: 'SSR', icon: '🦇', attrType: 'tower_drop_rate' },
        { id: 'relic_dk_06', name: '魔爪', quality: 'SSR', icon: '🔥', attrType: 'pill_effect_mult' },
        { id: 'relic_dk_07', name: '魔甲', quality: 'SSR', icon: '🛡️', attrType: 'treasure_level_boost' },
        { id: 'relic_dk_08', name: '魔眼', quality: 'SR', icon: '👁️', attrType: 'all_stat_mult' },
        { id: 'relic_dk_09', name: '魔牙', quality: 'SR', icon: '🦷', attrType: 'tower_drop_rate' },
        { id: 'relic_dk_10', name: '魔血', quality: 'SR', icon: '🩸', attrType: 'pill_effect_mult' },
        { id: 'relic_dk_11', name: '魔鳞', quality: 'SR', icon: '🔷', attrType: 'equip_level_boost' },
        { id: 'relic_dk_12', name: '魔尾', quality: 'SR', icon: '🐲', attrType: 'treasure_level_boost' },
        { id: 'relic_dk_13', name: '魔角碎片', quality: 'R', icon: '⚪', attrType: 'all_stat_mult' },
        { id: 'relic_dk_14', name: '魔翼残片', quality: 'R', icon: '🪶', attrType: 'tower_drop_rate' },
        { id: 'relic_dk_15', name: '魔爪断刃', quality: 'R', icon: '⚔️', attrType: 'pill_effect_mult' },
        { id: 'relic_dk_16', name: '魔甲碎片', quality: 'R', icon: '🛡️', attrType: 'equip_level_boost' },
        { id: 'relic_dk_17', name: '魔眼碎片', quality: 'R', icon: '🔮', attrType: 'treasure_level_boost' },
        { id: 'relic_dk_18', name: '魔角微尘', quality: 'N', icon: '✨', attrType: 'all_stat_mult' },
        { id: 'relic_dk_19', name: '魔翼粉尘', quality: 'N', icon: '🌫️', attrType: 'tower_drop_rate' },
        { id: 'relic_dk_20', name: '魔爪碎屑', quality: 'N', icon: '🔥', attrType: 'pill_effect_mult' },
        { id: 'relic_dk_21', name: '魔甲粉末', quality: 'N', icon: '⚪', attrType: 'equip_level_boost' },
        { id: 'relic_dk_22', name: '魔眼残渣', quality: 'N', icon: '👁️', attrType: 'treasure_level_boost' }
    ],
    'void_beast': [
        { id: 'relic_vb_01', name: '虚空核心', quality: 'UR', icon: '🌌', attrType: 'all_stat_mult' },
        { id: 'relic_vb_02', name: '虚空之眼', quality: 'UR', icon: '👁️', attrType: 'pill_effect_mult' },
        { id: 'relic_vb_03', name: '虚空宝藏', quality: 'UR', icon: '💎', attrType: 'equip_level_boost' },
        { id: 'relic_vb_04', name: '虚空触须', quality: 'SSR', icon: '🦑', attrType: 'all_stat_mult' },
        { id: 'relic_vb_05', name: '虚空鳞片', quality: 'SSR', icon: '🔷', attrType: 'pill_effect_mult' },
        { id: 'relic_vb_06', name: '虚空之牙', quality: 'SSR', icon: '🦷', attrType: 'tower_drop_rate' },
        { id: 'relic_vb_07', name: '虚空之翼', quality: 'SSR', icon: '🪶', attrType: 'equip_level_boost' },
        { id: 'relic_vb_08', name: '虚空血液', quality: 'SR', icon: '🩸', attrType: 'all_stat_mult' },
        { id: 'relic_vb_09', name: '虚空骨骼', quality: 'SR', icon: '🦴', attrType: 'pill_effect_mult' },
        { id: 'relic_vb_10', name: '虚空精华', quality: 'SR', icon: '✨', attrType: 'tower_drop_rate' },
        { id: 'relic_vb_11', name: '虚空皮肤', quality: 'SR', icon: '🐉', attrType: 'equip_level_boost' },
        { id: 'relic_vb_12', name: '虚空心脏', quality: 'SR', icon: '💖', attrType: 'treasure_level_boost' },
        { id: 'relic_vb_13', name: '虚空触须残段', quality: 'R', icon: '🧵', attrType: 'all_stat_mult' },
        { id: 'relic_vb_14', name: '虚空鳞片碎片', quality: 'R', icon: '🔹', attrType: 'pill_effect_mult' },
        { id: 'relic_vb_15', name: '虚空之牙断片', quality: 'R', icon: '🦴', attrType: 'tower_drop_rate' },
        { id: 'relic_vb_16', name: '虚空之翼残羽', quality: 'R', icon: '🪶', attrType: 'equip_level_boost' },
        { id: 'relic_vb_17', name: '虚空血液滴', quality: 'R', icon: '💧', attrType: 'treasure_level_boost' },
        { id: 'relic_vb_18', name: '虚空触须微尘', quality: 'N', icon: '✨', attrType: 'all_stat_mult' },
        { id: 'relic_vb_19', name: '虚空鳞片粉末', quality: 'N', icon: '⚪', attrType: 'pill_effect_mult' },
        { id: 'relic_vb_20', name: '虚空之牙碎屑', quality: 'N', icon: '🦷', attrType: 'tower_drop_rate' },
        { id: 'relic_vb_21', name: '虚空之翼粉尘', quality: 'N', icon: '🌫️', attrType: 'equip_level_boost' },
        { id: 'relic_vb_22', name: '虚空血液残渍', quality: 'N', icon: '🩸', attrType: 'treasure_level_boost' }
    ],
    'ancient_god': [
        { id: 'relic_ag_01', name: '邪神之眼', quality: 'UR', icon: '👁️', attrType: 'all_stat_mult' },
        { id: 'relic_ag_02', name: '邪神之触', quality: 'UR', icon: '🦑', attrType: 'tower_drop_rate' },
        { id: 'relic_ag_03', name: '邪神宝藏', quality: 'UR', icon: '🏆', attrType: 'treasure_level_boost' },
        { id: 'relic_ag_04', name: '邪神之角', quality: 'SSR', icon: '👿', attrType: 'all_stat_mult' },
        { id: 'relic_ag_05', name: '邪神之翼', quality: 'SSR', icon: '🦇', attrType: 'tower_drop_rate' },
        { id: 'relic_ag_06', name: '邪神之牙', quality: 'SSR', icon: '🦷', attrType: 'pill_effect_mult' },
        { id: 'relic_ag_07', name: '邪神之甲', quality: 'SSR', icon: '🛡️', attrType: 'treasure_level_boost' },
        { id: 'relic_ag_08', name: '邪神之血', quality: 'SR', icon: '🩸', attrType: 'all_stat_mult' },
        { id: 'relic_ag_09', name: '邪神之骨', quality: 'SR', icon: '🦴', attrType: 'tower_drop_rate' },
        { id: 'relic_ag_10', name: '邪神之鳞', quality: 'SR', icon: '🔷', attrType: 'pill_effect_mult' },
        { id: 'relic_ag_11', name: '邪神之尾', quality: 'SR', icon: '🐲', attrType: 'equip_level_boost' },
        { id: 'relic_ag_12', name: '邪神之爪', quality: 'SR', icon: '⚔️', attrType: 'treasure_level_boost' },
        { id: 'relic_ag_13', name: '邪神之角碎片', quality: 'R', icon: '⚪', attrType: 'all_stat_mult' },
        { id: 'relic_ag_14', name: '邪神之翼残片', quality: 'R', icon: '🪶', attrType: 'tower_drop_rate' },
        { id: 'relic_ag_15', name: '邪神之牙断片', quality: 'R', icon: '🦷', attrType: 'pill_effect_mult' },
        { id: 'relic_ag_16', name: '邪神之甲碎片', quality: 'R', icon: '🛡️', attrType: 'equip_level_boost' },
        { id: 'relic_ag_17', name: '邪神之尾残段', quality: 'R', icon: '🧶', attrType: 'treasure_level_boost' },
        { id: 'relic_ag_18', name: '邪神之角微尘', quality: 'N', icon: '✨', attrType: 'all_stat_mult' },
        { id: 'relic_ag_19', name: '邪神之翼粉尘', quality: 'N', icon: '🌫️', attrType: 'tower_drop_rate' },
        { id: 'relic_ag_20', name: '邪神之牙碎屑', quality: 'N', icon: '🔥', attrType: 'pill_effect_mult' },
        { id: 'relic_ag_21', name: '邪神之甲粉末', quality: 'N', icon: '⚪', attrType: 'equip_level_boost' },
        { id: 'relic_ag_22', name: '邪神之尾细丝', quality: 'N', icon: '🧵', attrType: 'treasure_level_boost' }
    ],
    'chaos_overlord': [
        { id: 'relic_co_01', name: '混沌核心', quality: 'UR', icon: '🌑', attrType: 'all_stat_mult' },
        { id: 'relic_co_02', name: '混沌之环', quality: 'UR', icon: '💫', attrType: 'pill_effect_mult' },
        { id: 'relic_co_03', name: '混沌王座', quality: 'UR', icon: '👑', attrType: 'equip_level_boost' },
        { id: 'relic_co_04', name: '混沌之眼', quality: 'SSR', icon: '👁️', attrType: 'all_stat_mult' },
        { id: 'relic_co_05', name: '混沌之翼', quality: 'SSR', icon: '🦇', attrType: 'pill_effect_mult' },
        { id: 'relic_co_06', name: '混沌之爪', quality: 'SSR', icon: '🔥', attrType: 'tower_drop_rate' },
        { id: 'relic_co_07', name: '混沌之甲', quality: 'SSR', icon: '🛡️', attrType: 'equip_level_boost' },
        { id: 'relic_co_08', name: '混沌之血', quality: 'SR', icon: '🩸', attrType: 'all_stat_mult' },
        { id: 'relic_co_09', name: '混沌之骨', quality: 'SR', icon: '🦴', attrType: 'pill_effect_mult' },
        { id: 'relic_co_10', name: '混沌之鳞', quality: 'SR', icon: '🔷', attrType: 'tower_drop_rate' },
        { id: 'relic_co_11', name: '混沌之尾', quality: 'SR', icon: '🐲', attrType: 'equip_level_boost' },
        { id: 'relic_co_12', name: '混沌之心', quality: 'SR', icon: '🖤', attrType: 'treasure_level_boost' },
        { id: 'relic_co_13', name: '混沌之眼碎片', quality: 'R', icon: '🔮', attrType: 'all_stat_mult' },
        { id: 'relic_co_14', name: '混沌之翼残片', quality: 'R', icon: '🪶', attrType: 'pill_effect_mult' },
        { id: 'relic_co_15', name: '混沌之爪断刃', quality: 'R', icon: '⚔️', attrType: 'tower_drop_rate' },
        { id: 'relic_co_16', name: '混沌之甲碎片', quality: 'R', icon: '🛡️', attrType: 'equip_level_boost' },
        { id: 'relic_co_17', name: '混沌之血滴', quality: 'R', icon: '💧', attrType: 'treasure_level_boost' },
        { id: 'relic_co_18', name: '混沌之眼微尘', quality: 'N', icon: '✨', attrType: 'all_stat_mult' },
        { id: 'relic_co_19', name: '混沌之翼粉尘', quality: 'N', icon: '🌫️', attrType: 'pill_effect_mult' },
        { id: 'relic_co_20', name: '混沌之爪碎屑', quality: 'N', icon: '🔥', attrType: 'tower_drop_rate' },
        { id: 'relic_co_21', name: '混沌之甲粉末', quality: 'N', icon: '⚪', attrType: 'equip_level_boost' },
        { id: 'relic_co_22', name: '混沌之血残渍', quality: 'N', icon: '🩸', attrType: 'treasure_level_boost' }
    ]
};

// ==================== 大千宝录古宝系统配置 ====================

// 古宝属性类型定义（9种）
const ANCIENT_TREASURE_ATTR_TYPES = {
    // 1. 全属性加成 - 攻击+生命同时加成
    ALL_STAT_MULT: {
        id: 'all_stat_mult',
        name: '全属性加成',
        desc: '攻击力和生命值倍率提升',
        icon: '☯️',
        // 成长率配置：每级提升的倍率
        growthRate: {
            'UR': 1.15,      // +15%
            'SSR': 1.10,     // +10%
            'SR': 1.06,      // +6%
            'R': 1.03        // +3%
        }
    },

    // 2. 攻击力加成
    ATTACK_MULT: {
        id: 'attack_mult',
        name: '攻击力加成',
        desc: '攻击力倍率提升',
        icon: '⚔️',
        growthRate: {
            'UR': 1.20,      // +20%
            'SSR': 1.15,     // +15%
            'SR': 1.08,      // +8%
            'R': 1.05        // +5%
        }
    },

    // 3. 生命值加成
    HP_MULT: {
        id: 'hp_mult',
        name: '生命值加成',
        desc: '生命值倍率提升',
        icon: '🛡️',
        growthRate: {
            'UR': 1.20,      // +20%
            'SSR': 1.15,     // +15%
            'SR': 1.08,      // +8%
            'R': 1.05        // +5%
        }
    },

    // 4. 爬塔真意掉落加成
    TOWER_DROP: {
        id: 'tower_drop',
        name: '爬塔真意掉落',
        desc: '通天塔法则真意掉落数量提升',
        icon: '🏰',
        growthRate: {
            'UR': 1.25,      // +25%
            'SSR': 1.18,     // +18%
            'SR': 1.10,      // +10%
            'R': 1.05        // +5%
        }
    },

    // 5. 刷丹效率加成（主线丹药）
    PILL_EFFICIENCY: {
        id: 'pill_efficiency',
        name: '刷丹效率',
        desc: '主线刷丹获得的属性倍率提升',
        icon: '💊',
        growthRate: {
            'UR': 1.20,      // +20%
            'SSR': 1.15,     // +15%
            'SR': 1.08,      // +8%
            'R': 1.04        // +4%
        }
    },

    // 6. 主线装备等级加成
    EQUIP_LEVEL: {
        id: 'equip_level',
        name: '装备等级',
        desc: '主线战斗掉落的装备等级提升',
        icon: '⚒️',
        // 这个是线性加算，不是乘算
        growthRate: {
            'UR': 3,         // +3级
            'SSR': 2,        // +2级
            'SR': 1,         // +1级
            'R': 0.5         // +0.5级（2件凑1级）
        },
        isAdditive: true
    },

    // 7. 神器掉落等级加成（秘宝）
    TREASURE_LEVEL: {
        id: 'treasure_level',
        name: '神器等级',
        desc: '副本掉落的秘宝等级提升',
        icon: '🔮',
        growthRate: {
            'UR': 3,
            'SSR': 2,
            'SR': 1,
            'R': 0.5
        },
        isAdditive: true
    },

    // 8. 全属性指数加成（极稀有）
    ALL_EXP_BONUS: {
        id: 'all_exp_bonus',
        name: '全属性指数',
        desc: '攻击力和生命值的指数部分百分比提升（极稀有属性）',
        icon: '✨',
        // 指数加成是百分比，比如+0.5%表示1e100变成1e100.5
        growthRate: {
            'UR': 0.005,     // +0.5%指数
            'SSR': 0.003,    // +0.3%指数
            'SR': 0.001,     // +0.1%指数
            'R': 0.0005      // +0.05%指数
        },
        isExpBonus: true
    },

    // 9. 生灵精华掉落加成（种田系统）
    LIFE_ESSENCE: {
        id: 'life_essence',
        name: '生灵精华',
        desc: '百草灵园收获时获得的生灵精华数量提升',
        icon: '🌿',
        growthRate: {
            'UR': 1.30,      // +30%
            'SSR': 1.20,     // +20%
            'SR': 1.12,      // +12%
            'R': 1.06        // +6%
        }
    }
};

// 古宝升级消耗配置
const ANCIENT_TREASURE_UPGRADE_COST = {
    'UR':   [3, 3, 4, 4, 5, 5, 6, 6, 7, 10],   // 升重总计: 53碎片
    'SSR':  [2, 2, 2, 3, 3, 4, 4, 5, 5, 6],   // 升重总计: 36碎片
    'SR':   [1, 1, 2, 2, 2, 3, 3, 3, 4, 4],   // 升重总计: 25碎片
    'R':    [1, 1, 1, 1, 2, 2, 2, 2, 2, 3],   // 升重总计: 17碎片
};

// 古宝羁绊配置
const ANCIENT_TREASURE_SYNERGIES = [
    {
        id: 'warrior_path',
        name: '战狂之道',
        icon: '⚔️',
        desc: '追求极致攻击的修行之路',
        // 攻击类古宝组合
        treasureIds: [], // 由代码动态填充
        levels: [
            { require: 3, effect: { attackMult: 1.20 }, desc: '攻击力 ×1.20' },
            { require: 6, effect: { attackMult: 1.35 }, desc: '攻击力 ×1.35' },
            { require: 9, effect: { attackMult: 1.50 }, desc: '攻击力 ×1.50' }
        ]
    },
    {
        id: 'immortal_body',
        name: '不朽之身',
        icon: '🛡️',
        desc: '肉身成圣，万劫不磨',
        // 生命类古宝组合
        treasureIds: [],
        levels: [
            { require: 3, effect: { hpMult: 1.20 }, desc: '生命值 ×1.20' },
            { require: 6, effect: { hpMult: 1.35 }, desc: '生命值 ×1.35' },
            { require: 9, effect: { hpMult: 1.50 }, desc: '生命值 ×1.50' }
        ]
    },
    {
        id: 'master_of_all',
        name: '万法皆通',
        icon: '☯️',
        desc: '全属性均衡发展',
        // 全属性类古宝组合
        treasureIds: [],
        levels: [
            { require: 3, effect: { allStatMult: 1.12 }, desc: '全属性 ×1.12' },
            { require: 6, effect: { allStatMult: 1.25 }, desc: '全属性 ×1.25' },
            { require: 9, effect: { allStatMult: 1.40 }, desc: '全属性 ×1.40' }
        ]
    },
    {
        id: 'tower_master',
        name: '通天塔主',
        icon: '🏰',
        desc: '爬塔真意获取专精',
        // 爬塔类古宝组合
        treasureIds: [],
        levels: [
            { require: 3, effect: { towerDrop: 1.30 }, desc: '爬塔掉落 ×1.30' },
            { require: 5, effect: { towerDrop: 1.60 }, desc: '爬塔掉落 ×1.60' }
        ]
    },
    {
        id: 'pill_master',
        name: '丹道宗师',
        icon: '💊',
        desc: '刷丹效率专精',
        // 刷丹类古宝组合
        treasureIds: [],
        levels: [
            { require: 3, effect: { pillEfficiency: 1.25 }, desc: '刷丹效率 ×1.25' },
            { require: 5, effect: { pillEfficiency: 1.50 }, desc: '刷丹效率 ×1.50' }
        ]
    },
    {
        id: 'equipment_master',
        name: '神匠',
        icon: '⚒️',
        desc: '装备等级提升专精',
        // 装备类古宝组合
        treasureIds: [],
        levels: [
            { require: 3, effect: { equipLevel: 5 }, desc: '装备等级 +5' },
            { require: 5, effect: { equipLevel: 12 }, desc: '装备等级 +12' }
        ]
    },
    {
        id: 'treasure_master',
        name: '寻宝者',
        icon: '🔮',
        desc: '秘宝等级提升专精',
        // 秘宝类古宝组合
        treasureIds: [],
        levels: [
            { require: 3, effect: { treasureLevel: 5 }, desc: '秘宝等级 +5' },
            { require: 5, effect: { treasureLevel: 12 }, desc: '秘宝等级 +12' }
        ]
    },
    {
        id: 'life_master',
        name: '灵植师',
        icon: '🌿',
        desc: '生灵精华获取专精',
        // 种田类古宝组合
        treasureIds: [],
        levels: [
            { require: 3, effect: { lifeEssence: 1.30 }, desc: '精华掉落 ×1.30' },
            { require: 5, effect: { lifeEssence: 1.70 }, desc: '精华掉落 ×1.70' }
        ]
    },
    {
        id: 'transcendent',
        name: '超脱者',
        icon: '✨',
        desc: '全属性指数加成（极稀有）',
        // 指数类古宝组合
        treasureIds: [],
        levels: [
            { require: 2, effect: { allExpBonus: 0.01 }, desc: '全属性指数 +1%' },
            { require: 4, effect: { allExpBonus: 0.025 }, desc: '全属性指数 +2.5%' }
        ]
    }
];

// 寻宝概率配置
const ANCIENT_TREASURE_DRAW_RATES = {
    'UR': 0.03,      // 3%
    'SSR': 0.10,     // 10%
    'SR': 0.25,      // 25%
    'R': 0.62        // 62%
};

// UR保底次数
const ANCIENT_TREASURE_PITY = 35;

// ==================== 周天星窍系统配置 ====================

const ZHOUTIAN_SECTORS = [
    { id: 'qinglong', name: '东方青龙', attr: 'attack', color: '#22c55e', icon: '🐉', desc: '攻击力加成' },
    { id: 'zhuque', name: '南方朱雀', attr: 'health', color: '#ef4444', icon: '🦅', desc: '生命值加成' },
    { id: 'baihu', name: '西方白虎', attr: 'equipLevel', color: '#f59e0b', icon: '🐅', desc: '装备等级加成' },
    { id: 'xuanwu', name: '北方玄武', attr: 'lifeEssence', color: '#3b82f6', icon: '🐢', desc: '生灵精华加成' },
    { id: 'qilin', name: '中央麒麟', attr: 'allStats', color: '#a855f7', icon: '🦌', desc: '全属性加成' }
];

// 单个星窍的基础加成值（每提升一个品质等级增加的数值）
const ZHOUTIAN_BASE_BONUSES = {
    attack: { type: 'multiply', value: 1.2, suffix: '×', desc: '攻击力' },      // 每个窍×1.2
    health: { type: 'multiply', value: 1.2, suffix: '×', desc: '生命值' },      // 每个窍×1.2
    equipLevel: { type: 'add', value: 2, suffix: '', desc: '装备等级' },        // 每个窍+2级
    lifeEssence: { type: 'multiply', value: 1.15, suffix: '×', desc: '精华获取' }, // 每个窍×1.15
    allStats: { type: 'multiply', value: 1.1, suffix: '×', desc: '全属性' }     // 每个窍×1.1
};

const ZHOUTIAN_QUALITIES = [
    { level: 1, name: '凡', color: '#9ca3af', bg: '#374151', multiplier: 1 },
    { level: 2, name: '灵', color: '#4ade80', bg: '#14532d', multiplier: 2 },
    { level: 3, name: '玄', color: '#60a5fa', bg: '#1e3a8a', multiplier: 4 },
    { level: 4, name: '地', color: '#c084fc', bg: '#581c87', multiplier: 8 },
    { level: 5, name: '天', color: '#fbbf24', bg: '#92400e', multiplier: 16 }
];

const ZHOUTIAN_WASH_COSTS = [50, 100, 150, 200, 250];

// ==================== 星空巨兽副本配置 ====================
// 7个难度，数值压缩逻辑，产出星髓
// 数值压缩：玩家有效攻击 = (log10(ATK))^2，玩家指数约等于N难度*2
// 巨兽HP设计：让玩家在10-30回合内击败

const STAR_BEAST_DIFFICULTIES = [
    // 难度1：N1解锁，对应玩家指数~2，有效攻击~4，巨兽HP=50（约12回合）
    { level: 1, rank: '先锋', name: '星辉幼兽', icon: '🦌', unlockDifficulty: 1,  hpBase: 50,    atkBase: 5,    marrowBase: 100,  marrowBonus: 20, description: '初入星空的幼年巨兽' },

    // 难度2：N5解锁，对应玩家指数~10，有效攻击~100，巨兽HP=500（约5回合）
    { level: 2, rank: '统领', name: '虚空掠食者', icon: '🦅', unlockDifficulty: 5,  hpBase: 500,   atkBase: 30,   marrowBase: 300,  marrowBonus: 60, description: '游荡于虚空之间的猎手' },

    // 难度3：N15解锁，对应玩家指数~30，有效攻击~900，巨兽HP=2000（约2回合）
    { level: 3, rank: '首领', name: '星辰战将', icon: '🦁', unlockDifficulty: 15,  hpBase: 2000,  atkBase: 100,  marrowBase: 800,  marrowBonus: 160, description: '统领星兽军团的首领' },

    // 难度4：N30解锁，对应玩家指数~60，有效攻击~3600，巨兽HP=6000（约2回合）
    { level: 4, rank: '领主', name: '银河暴君', icon: '🐉', unlockDifficulty: 30,  hpBase: 6000,  atkBase: 250,  marrowBase: 2000, marrowBonus: 400, description: '统治一片星域的霸主' },

    // 难度5：N50解锁，对应玩家指数~100，有效攻击~10000，巨兽HP=15000（约1.5回合）
    { level: 5, rank: '王者', name: '吞噬星王', icon: '🦈', unlockDifficulty: 50, hpBase: 15000, atkBase: 600,  marrowBase: 5000, marrowBonus: 1000, description: '吞噬星辰的无上王者' },

    // 难度6：N80解锁，对应玩家指数~160，有效攻击~25600，巨兽HP=35000（约1.4回合）
    { level: 6, rank: '霸主', name: '虚空主宰', icon: '🐙', unlockDifficulty: 80, hpBase: 35000, atkBase: 1400, marrowBase: 12000, marrowBonus: 2400, description: '操控虚空之力的古老存在' },

    // 难度7：N120解锁，对应玩家指数~240，有效攻击~57600，巨兽HP=75000（约1.3回合）
    { level: 7, rank: '帝君', name: '星空帝尊', icon: '👑', unlockDifficulty: 120, hpBase: 75000, atkBase: 3000, marrowBase: 25000, marrowBonus: 5000, description: '统御星空的至高帝尊' }
];

// 星空巨兽属性系数（数值压缩后的有效值）
const STAR_BEAST_STATS = {
    // 生命值：直接取自配置
    hpMult: (difficultyLevel) => {
        const config = STAR_BEAST_DIFFICULTIES.find(d => d.level === difficultyLevel);
        return config ? config.hpBase : 1000;
    },
    // 攻击力：直接取自配置
    atkMult: (difficultyLevel) => {
        const config = STAR_BEAST_DIFFICULTIES.find(d => d.level === difficultyLevel);
        return config ? config.atkBase : 100;
    },
    // 奖励系数：击败后获得
    rewardMult: (difficultyLevel) => difficultyLevel
};

// ==================== 功法系统配置 (重构版) ====================

const TECHNIQUE_CONFIG = {
    // 灵石掉落配置
    stoneDrop: {
        // 基础掉落范围
        baseMin: 1,
        baseMax: 3,
        // 难度倍数: 每+1难度, x1.5
        difficultyMult: 1.5,
        // 灵石袋触发概率: 0.1% = 0.001
        bagChance: 0.001,
        // 灵石袋倍数: 100倍
        bagMult: 100
    },

    // 修炼暴击配置
    critConfig: {
        // 暴击概率: 5% = 0.05
        chance: 0.05,
        // 暴击效果: 连升3级
        bonusLayers: 3,
        // 暴击时消耗: 只扣1级成本 (normal) 或免费 (free)
        costMode: 'normal' // 'normal' = 扣1级成本, 'free' = 免费
    },

    // 功法配置 - 8个功法
    techniques: {
        // 功法1: 攻击力加成 (x1.1/次, 成本x2)
        atkBasic: {
            id: 'atkBasic',
            name: '金刚诀',
            icon: '⚔️',
            desc: '以气御剑，增强攻击力',
            color: '#ef4444',
            baseCost: 10,           // 基础消耗10灵石
            costScale: 2,           // 成本每次x2
            effectScale: 1.1,       // 效果每次x1.1
            maxLayer: 1000,
            bonusType: 'atkMult',   // 攻击倍率
            unlocked: true,         // 开局解锁
            unlockRequirement: null
        },
        // 功法2: 生命值加成 (x1.1/次, 成本x2)
        hpBasic: {
            id: 'hpBasic',
            name: '玄武心经',
            icon: '🛡️',
            desc: '龟息之法，强身健体',
            color: '#3b82f6',
            baseCost: 10,
            costScale: 2,
            effectScale: 1.1,
            maxLayer: 1000,
            bonusType: 'hpMult',    // 生命倍率
            unlocked: true,
            unlockRequirement: null
        },
        // 功法3: 丹药掉落数量 (x2/次, 成本x5)
        pillCount: {
            id: 'pillCount',
            name: '采药术',
            icon: '🌿',
            desc: '识百草，增丹产',
            color: '#22c55e',
            baseCost: 50,
            costScale: 5,           // 成本每次x5
            effectScale: 2,         // 效果每次x2
            maxLayer: 100,
            bonusType: 'pillCount', // 丹药数量
            unlocked: true,
            unlockRequirement: null
        },
        // 功法4: 丹药效果倍率 (x2/次, 成本x5)
        pillEffect: {
            id: 'pillEffect',
            name: '炼丹诀',
            icon: '🔥',
            desc: '火候精妙，丹效倍增',
            color: '#f97316',
            baseCost: 50,
            costScale: 5,
            effectScale: 2,
            maxLayer: 100,
            bonusType: 'pillMult',  // 丹药效果
            unlocked: true,
            unlockRequirement: null
        },
        // 功法5: 真意掉率 (x10/次, 成本x1000)
        essenceDrop: {
            id: 'essenceDrop',
            name: '悟道心法',
            icon: '☯️',
            desc: '感悟天道，真意自现',
            color: '#a855f7',
            baseCost: 1000,
            costScale: 1000,        // 成本每次x1000
            effectScale: 10,        // 效果每次x10
            maxLayer: 50,
            bonusType: 'essenceDrop', // 真意掉率
            unlocked: false,
            unlockRequirement: { layer: 10, technique: 'atkBasic' } // 金刚诀10层解锁
        },
        // 功法6: 攻击力加成 (x15/次, 成本x10)
        atkAdvanced: {
            id: 'atkAdvanced',
            name: '诛仙剑诀',
            icon: '🗡️',
            desc: '诛仙灭魔，攻击力暴涨',
            color: '#dc2626',
            baseCost: 1000,
            costScale: 10,          // 成本每次x10
            effectScale: 15,        // 效果每次x15
            maxLayer: 200,
            bonusType: 'atkMult',   // 攻击倍率
            unlocked: false,
            unlockRequirement: { layer: 20, technique: 'hpBasic' } // 玄武心经20层解锁
        },
        // 功法7: 生命值加成 (x15/次, 成本x10)
        hpAdvanced: {
            id: 'hpAdvanced',
            name: '不灭金身',
            icon: '✨',
            desc: '肉身成圣，不死不灭',
            color: '#f59e0b',
            baseCost: 1000,
            costScale: 10,
            effectScale: 15,
            maxLayer: 200,
            bonusType: 'hpMult',    // 生命倍率
            unlocked: false,
            unlockRequirement: { layer: 20, technique: 'pillCount' } // 采药术20层解锁
        },
        // 功法8: 灵石掉率 (x1.2/次, 成本x2)
        stoneDrop: {
            id: 'stoneDrop',
            name: '聚灵术',
            icon: '💎',
            desc: '引天地灵气，聚而为石',
            color: '#10b981',
            baseCost: 100,
            costScale: 2,           // 成本每次x2
            effectScale: 1.2,       // 效果每次x1.2
            maxLayer: 500,
            bonusType: 'stoneDrop', // 灵石掉率
            unlocked: true,         // 开局解锁
            unlockRequirement: null
        }
    },

    // 神通配置 - 每个功法5/10/15级解锁
    divineAbilities: {
        // 金刚诀神通
        atkBasic: [
            { layer: 5, name: '剑气初成', desc: '攻击力+50%', effect: { type: 'atkMult', value: 1.5 }, costMult: 5 },
            { layer: 10, name: '人剑合一', desc: '攻击力+100%', effect: { type: 'atkMult', value: 2 }, costMult: 10 },
            { layer: 15, name: '万剑归宗', desc: '攻击力+200%', effect: { type: 'atkMult', value: 3 }, costMult: 20 }
        ],
        // 玄武心经神通
        hpBasic: [
            { layer: 5, name: '铜皮铁骨', desc: '生命值+50%', effect: { type: 'hpMult', value: 1.5 }, costMult: 5 },
            { layer: 10, name: '生生不息', desc: '生命值+100%', effect: { type: 'hpMult', value: 2 }, costMult: 10 },
            { layer: 15, name: '滴血重生', desc: '生命值+200%', effect: { type: 'hpMult', value: 3 }, costMult: 20 }
        ],
        // 采药术神通
        pillCount: [
            { layer: 5, name: '识草术', desc: '丹药掉落+50%', effect: { type: 'pillCount', value: 1.5 }, costMult: 5 },
            { layer: 10, name: '灵草感应', desc: '丹药掉落+100%', effect: { type: 'pillCount', value: 2 }, costMult: 10 },
            { layer: 15, name: '百草之王', desc: '丹药掉落+200%', effect: { type: 'pillCount', value: 3 }, costMult: 20 }
        ],
        // 炼丹诀神通
        pillEffect: [
            { layer: 5, name: '火候精通', desc: '丹药效果+50%', effect: { type: 'pillMult', value: 1.5 }, costMult: 5 },
            { layer: 10, name: '丹纹天成', desc: '丹药效果+100%', effect: { type: 'pillMult', value: 2 }, costMult: 10 },
            { layer: 15, name: '九转金丹', desc: '丹药效果+200%', effect: { type: 'pillMult', value: 3 }, costMult: 20 }
        ],
        // 悟道心法神通
        essenceDrop: [
            { layer: 5, name: '初窥天道', desc: '真意掉率+50%', effect: { type: 'essenceDrop', value: 1.5 }, costMult: 5 },
            { layer: 10, name: '天人合一', desc: '真意掉率+100%', effect: { type: 'essenceDrop', value: 2 }, costMult: 10 },
            { layer: 15, name: '道法自然', desc: '真意掉率+200%', effect: { type: 'essenceDrop', value: 3 }, costMult: 20 }
        ],
        // 诛仙剑诀神通
        atkAdvanced: [
            { layer: 5, name: '剑意纵横', desc: '攻击力+100%', effect: { type: 'atkMult', value: 2 }, costMult: 5 },
            { layer: 10, name: '一剑破万法', desc: '攻击力+300%', effect: { type: 'atkMult', value: 4 }, costMult: 10 },
            { layer: 15, name: '诛仙剑阵', desc: '攻击力+500%', effect: { type: 'atkMult', value: 6 }, costMult: 20 }
        ],
        // 不灭金身神通
        hpAdvanced: [
            { layer: 5, name: '金刚不坏', desc: '生命值+100%', effect: { type: 'hpMult', value: 2 }, costMult: 5 },
            { layer: 10, name: '肉身成圣', desc: '生命值+300%', effect: { type: 'hpMult', value: 4 }, costMult: 10 },
            { layer: 15, name: '不死不灭', desc: '生命值+500%', effect: { type: 'hpMult', value: 6 }, costMult: 20 }
        ],
        // 聚灵术神通
        stoneDrop: [
            { layer: 5, name: '灵气感应', desc: '灵石掉率+50%', effect: { type: 'stoneDrop', value: 1.5 }, costMult: 5 },
            { layer: 10, name: '灵脉亲和', desc: '灵石掉率+100%', effect: { type: 'stoneDrop', value: 2 }, costMult: 10 },
            { layer: 15, name: '聚灵成海', desc: '灵石掉率+200%', effect: { type: 'stoneDrop', value: 3 }, costMult: 20 }
        ]
    }
};

// Export for module systems if needed
try {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            SCALE_ENEMY, SCALE_EQUIP, SCALE_PILL, SCALE_TOWER_STR, SCALE_TOWER_DROP,
            SLOTS_CONFIG, SLOT_KEYS,
            TREASURE_SLOTS, TREASURE_QUALITIES, TREASURE_ATTRS,
            QUALITIES, ENEMY_TYPES, TOWER_TYPES,
            DUNGEON_TYPES, DUNGEON_N1_MULT, DUNGEON_ATK_INC, DUNGEON_HP_INC,
            ABYSS_BOSSES, RELIC_QUALITIES, RELIC_ATTR_TYPES, RELIC_BASE_VALUES, ABYSS_RELIC_POOLS,
            ANCIENT_TREASURE_ATTR_TYPES, ANCIENT_TREASURE_UPGRADE_COST,
            ANCIENT_TREASURE_SYNERGIES, ANCIENT_TREASURE_DRAW_RATES, ANCIENT_TREASURE_PITY,
            ZHOUTIAN_SECTORS, ZHOUTIAN_QUALITIES, ZHOUTIAN_WASH_COSTS, ZHOUTIAN_BASE_BONUSES,
            STAR_BEAST_DIFFICULTIES, STAR_BEAST_STATS,
            TECHNIQUE_CONFIG
        };
    }
} catch (e) {}
