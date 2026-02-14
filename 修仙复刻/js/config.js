/**
 * Core Config - Game constants and configurations
 */

// Scaling Constants
const SCALE_ENEMY = 2.155; 
const SCALE_EQUIP = 1.2;    
const SCALE_PILL  = 1.3;
const SCALE_TOWER_STR = 10.0;
const SCALE_TOWER_DROP = 2.0;

// Equipment Slots Configuration
const SLOTS_CONFIG = {
    'weapon':   { name: '武器', weight: 10, hasCrit: true },
    'offhand':  { name: '副武', weight: 10, hasCrit: true },
    'helm':     { name: '头部', weight: 10, hasCrit: false },
    'boots':    { name: '鞋履', weight: 10, hasCrit: false },
    'legs':     { name: '护腿', weight: 10, hasCrit: false },
    'armor':    { name: '衣服', weight: 10, hasCrit: true },
    'bracers':  { name: '护腕', weight: 10, hasCrit: true },
    'belt':     { name: '腰带', weight: 10, hasCrit: false },
    'necklace': { name: '项链', weight: 10, hasCrit: true },
    'orb':      { name: '宝珠', weight: 10, hasCrit: false },
    'ring':     { name: '戒指', weight: 10, hasCrit: false },
    'secret':   { name: '秘宝', weight: 10, hasCrit: true }
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
// T1: N100, T2: N300, T3: N600, T4: N900... TX: N300*(X-1) for X>=2
// 支持无限层数，无上限
function getDungeonUnlockRequirement(tier) {
    if (tier <= 0) return 0;
    if (tier === 1) return 100;
    return 300 * (tier - 1);
}

const MAX_DUNGEON_TIER = 999999; // 理论上支持无限层数

// Realm Breakthrough Configuration (境界突破)
const REALM_TABLE = [
    ['凡人-武者', 1],
    ['练气-初期', 4],
    ['练气-中期', 6],
    ['练气-后期', 12],
    ['练气-圆满', 22],
    ['筑基-初期', 36],
    ['筑基-中期', 54],
    ['筑基-后期', 75],
    ['筑基-圆满', 101],
    ['结丹-初期', 131],
    ['结丹-中期', 165],
    ['结丹-后期', 202],
    ['结丹-圆满', 244],
    ['元婴-初期', 290],
    ['元婴-中期', 339],
    ['元婴-后期', 393],
    ['元婴-圆满', 450],
    ['化神-初期', 512],
    ['化神-中期', 577],
    ['化神-后期', 646],
    ['化神-圆满', 720],
    ['洞虚-初期', 797],
    ['洞虚-中期', 878],
    ['洞虚-后期', 964],
    ['洞虚-圆满', 1053],
    ['合体-初期', 1146],
    ['合体-中期', 1243],
    ['合体-后期', 1344],
    ['合体-圆满', 1450],
    ['渡劫-初期', 1559],
    ['渡劫-中期', 1672],
    ['渡劫-后期', 1789],
    ['渡劫-圆满', 1910],
    ['大乘-初期', 2035],
    ['大乘-中期', 2163],
    ['大乘-后期', 2296],
    ['大乘-圆满', 2433],
    ['地仙-初期', 2574],
    ['地仙-中期', 2719],
    ['地仙-后期', 2867],
    ['地仙-圆满', 3020],
    ['真仙-初期', 3177],
    ['真仙-中期', 3337],
    ['真仙-后期', 3502],
    ['真仙-圆满', 3670],
    ['金仙-初期', 3843],
    ['金仙-中期', 4019],
    ['金仙-后期', 4200],
    ['金仙-圆满', 4384],
    ['太乙玄仙-初期', 4573],
    ['太乙玄仙-中期', 4765],
    ['太乙玄仙-后期', 4961],
    ['太乙玄仙-圆满', 5162],
    ['大罗金仙-初期', 5366],
    ['大罗金仙-中期', 5574],
    ['大罗金仙-后期', 5786],
    ['大罗金仙-圆满', 6002],
    ['道祖-初期', 6223],
    ['道祖-中期', 6447],
    ['道祖-后期', 6675],
    ['道祖-圆满', 6907],
    ['至尊道祖-初期', 7143],
    ['至尊道祖-中期', 7383],
    ['至尊道祖-后期', 7626],
    ['至尊道祖-圆满', 7874],
    ['半神-初期', 8126],
    ['半神-中期', 8382],
    ['半神-后期', 8642],
    ['半神-圆满', 8905],
    ['真神-初期', 9173],
    ['真神-中期', 9445],
    ['真神-后期', 9720],
    ['真神-圆满', 10000],
    ['界神-初期', 10284],
    ['界神-中期', 10571],
    ['界神-后期', 10863],
    ['界神-圆满', 11158],
    ['寰宇神尊-初期', 11457],
    ['寰宇神尊-中期', 11761],
    ['寰宇神尊-后期', 12068],
    ['寰宇神尊-圆满', 12380],
    ['永恒真神-初期', 12695],
    ['永恒真神-中期', 13014],
    ['永恒真神-后期', 13337],
    ['永恒真神-圆满', 13665],
    ['混沌主宰-初期', 13996],
    ['混沌主宰-中期', 14331],
    ['混沌主宰-后期', 14670],
    ['混沌主宰-圆满', 15013],
    ['神王-初期', 15360],
    ['神王-中期', 15711],
    ['神王-后期', 16066],
    ['神王-圆满', 16425],
    ['神帝-初期', 16788],
    ['神帝-中期', 17155],
    ['神帝-后期', 17525],
    ['神帝-圆满', 17900],
    ['无上至尊——1境', 18279]
];

function getRealmInfo(index) {
    if (index < REALM_TABLE.length) {
        return { name: REALM_TABLE[index][0], requiredDifficulty: REALM_TABLE[index][1] };
    }
    // Dynamic 无上至尊 tiers beyond index 97
    const tier = index - 97 + 1; // index 98 = 2境, index 99 = 3境, ...
    return {
        name: `无上至尊——${tier}境`,
        requiredDifficulty: 18279 + (tier - 1) * 10000
    };
}

function getRealmBonus(realmIndex) {
    if (realmIndex <= 0) return new BigNum(1);
    return new BigNum(1.05).pow(realmIndex);
}

// Realm Boss Constants
const REALM_BOSS_ATK_BASE = 50;
const REALM_BOSS_HP_BASE = 2000;
const REALM_BOSS_EMOJI = '🐉';

// Realm Boss Strength Multiplier (compared to normal boss at same difficulty)
const REALM_BOSS_MULT = 2.5;

// Realm Bonus Growth
const REALM_BONUS_BASE = 1.1;  // 10% per realm level
const REALM_BONUS_EXPONENT = 1.05; // exponential growth

// Spirit Garden (百草灵园) Configuration
const GARDEN_CONFIG = {
    maxLands: 16,
    initialLands: 4,
    unlockCostBase: 200,
    unlockCostGrowth: 2.5,
    puppetUnlockLevel: 2,
    alchemyUnlockLevel: 10,
    alchemyBonus: 1.2,  // +20% income
    expToLawRate: 0.1,  // 10% garden exp converts to law fragments
    
    // Turn names
    turnNames: ['凡阶', '1转', '2转', '3转', '4转', '5转', '6转', '7转', '8转', '9转'],
    
    // Base crops (7 types × 10 turns = 70 crops)
    baseCrops: [
        { id: 1, name: '凝气草', quality: 0, icon: '🌿', time: 3,    cost: 10,     income: 15,      exp: 5,       reqLevel: 1 },
        { id: 2, name: '血菩提', quality: 1, icon: '🍒', time: 10,   cost: 100,    income: 250,     exp: 25,      reqLevel: 3 },
        { id: 3, name: '玄冰花', quality: 2, icon: '❄️', time: 30,   cost: 800,    income: 2400,    exp: 120,     reqLevel: 10 },
        { id: 4, name: '紫金藤', quality: 3, icon: '🎋', time: 60,   cost: 3000,   income: 10000,   exp: 400,     reqLevel: 25 },
        { id: 5, name: '龙鳞果', quality: 4, icon: '🐲', time: 120,  cost: 15000,  income: 60000,   exp: 1500,    reqLevel: 45 },
        { id: 6, name: '悟道茶', quality: 5, icon: '🍵', time: 300,  cost: 80000,  income: 400000,  exp: 6000,    reqLevel: 65 },
        { id: 7, name: '混沌莲', quality: 5, icon: '🪷', time: 600,  cost: 500000, income: 3000000, exp: 20000,   reqLevel: 80 },
    ]
};

// Quality colors for garden crops
const CROP_QUALITY_COLORS = [
    '#9ca3af',  // 0 - gray
    '#4ade80',  // 1 - green
    '#60a5fa',  // 2 - blue
    '#c084fc',  // 3 - purple
    '#facc15',  // 4 - yellow
    '#ef4444'   // 5 - red
];

// Export for module systems if needed
try {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            SCALE_ENEMY, SCALE_EQUIP, SCALE_PILL, SCALE_TOWER_STR, SCALE_TOWER_DROP,
            SLOTS_CONFIG, SLOT_KEYS,
            TREASURE_SLOTS, TREASURE_QUALITIES, TREASURE_ATTRS,
            QUALITIES, ENEMY_TYPES, TOWER_TYPES,
            DUNGEON_TYPES, DUNGEON_N1_MULT, DUNGEON_ATK_INC, DUNGEON_HP_INC
        };
    }
} catch (e) {}

// ==================== 深渊遗宝系统配置 ====================

// 深渊BOSS配置
const ABYSS_BOSSES = [
    {
        id: 'dragon_lord',
        name: '深渊魔龙',
        emoji: '🐉',
        level: 1,
        unlockDifficulty: 50,
        reviveTime: 60,
        color: '#ff4444',
        description: '深渊入口的守护者',
        targetKillTime: 40,
        targetSurviveTime: 50,
        dpsMultiplier: 1.0
    },
    {
        id: 'demon_king',
        name: '深渊魔王',
        emoji: '👹',
        level: 2,
        unlockDifficulty: 150,
        reviveTime: 90,
        color: '#ff6600',
        description: '掌控深渊魔气',
        targetKillTime: 45,
        targetSurviveTime: 55,
        dpsMultiplier: 1.0
    },
    {
        id: 'void_beast',
        name: '虚空巨兽',
        emoji: '👾',
        level: 3,
        unlockDifficulty: 300,
        reviveTime: 120,
        color: '#9c27b0',
        description: '来自虚空维度',
        targetKillTime: 50,
        targetSurviveTime: 60,
        dpsMultiplier: 1.0
    },
    {
        id: 'ancient_god',
        name: '远古邪神',
        emoji: '👿',
        level: 4,
        unlockDifficulty: 500,
        reviveTime: 180,
        color: '#ffd700',
        description: '被封印的远古神明',
        targetKillTime: 55,
        targetSurviveTime: 65,
        dpsMultiplier: 1.0
    },
    {
        id: 'chaos_overlord',
        name: '混沌主宰',
        emoji: '🌑',
        level: 5,
        unlockDifficulty: 800,
        reviveTime: 300,
        color: '#ff1744',
        description: '深渊之主',
        targetKillTime: 60,
        targetSurviveTime: 70,
        dpsMultiplier: 1.0
    }
];

// 遗宝品质配置
const RELIC_QUALITIES = {
    'N': { 
        name: 'N', 
        color: '#9ca3af', 
        weight: 400, 
        border: '2px solid #9ca3af', 
        multiplier: 0.5,
        maxLevel: 100,
        overflowPoints: 10,
        exchangeCost: 100
    },
    'R': { 
        name: 'R', 
        color: '#60a5fa', 
        weight: 320, 
        border: '2px solid #60a5fa', 
        multiplier: 1,
        maxLevel: 80,
        overflowPoints: 20,
        exchangeCost: 200
    },
    'SR': { 
        name: 'SR', 
        color: '#c084fc', 
        weight: 200, 
        border: '2px solid #c084fc', 
        multiplier: 2.5,
        maxLevel: 50,
        overflowPoints: 50,
        exchangeCost: 500
    },
    'SSR': { 
        name: 'SSR', 
        color: '#facc15', 
        weight: 120, 
        border: '2px solid #facc15', 
        multiplier: 6,
        maxLevel: 30,
        overflowPoints: 100,
        exchangeCost: 1000
    },
    'UR': { 
        name: 'UR', 
        color: '#ef4444', 
        weight: 30, 
        border: '2px solid #ef4444', 
        multiplier: 15,
        maxLevel: 10,
        overflowPoints: 300,
        exchangeCost: 3000
    }
};

// 遗宝属性类型配置
const RELIC_ATTR_TYPES = [
    { 
        id: 'all_stat_mult', 
        name: '全属性倍率', 
        suffix: '', 
        desc: '攻击和生命指数加成，遗宝之间相乘',
        calcType: 'multiplicative',
        baseValue: 0.02
    },
    { 
        id: 'tower_drop_rate', 
        name: '爬塔掉率', 
        suffix: '', 
        desc: '通天塔法则真意掉落数量指数级提升，遗宝相乘',
        calcType: 'multiplicative',
        baseValue: 0.03
    },
    { 
        id: 'pill_effect_mult', 
        name: '刷丹倍率', 
        suffix: '', 
        desc: '主线丹药使用效果指数级倍增，遗宝相乘',
        calcType: 'multiplicative',
        baseValue: 0.04
    },
    { 
        id: 'equip_level_boost', 
        name: '装备等级', 
        suffix: '', 
        desc: '主线装备等级线性提升，遗宝相加',
        calcType: 'additive',
        baseValue: 0.006
    },
    { 
        id: 'treasure_level_boost', 
        name: '秘宝等级', 
        suffix: '', 
        desc: '秘宝副本掉落等级线性提升，遗宝相加',
        calcType: 'additive',
        baseValue: 0.006
    }
];

// 遗宝基础数值
const RELIC_BASE_VALUES = {
    'all_stat_mult': 0.02,
    'tower_drop_rate': 0.03,
    'pill_effect_mult': 0.04,
    'equip_level_boost': 0.006,
    'treasure_level_boost': 0.006
};

// 遗宝池配置
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

// Update module exports
try {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            SCALE_ENEMY, SCALE_EQUIP, SCALE_PILL, SCALE_TOWER_STR, SCALE_TOWER_DROP,
            SLOTS_CONFIG, SLOT_KEYS,
            TREASURE_SLOTS, TREASURE_QUALITIES, TREASURE_ATTRS,
            QUALITIES, ENEMY_TYPES, TOWER_TYPES,
            DUNGEON_TYPES, DUNGEON_N1_MULT, DUNGEON_ATK_INC, DUNGEON_HP_INC,
            ABYSS_BOSSES, RELIC_QUALITIES, RELIC_ATTR_TYPES, RELIC_BASE_VALUES, ABYSS_RELIC_POOLS
        };
    }
} catch (e) {}
