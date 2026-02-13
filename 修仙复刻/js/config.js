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
function getDungeonUnlockRequirement(tier) {
    if (tier <= 0) return 0;
    if (tier === 1) return 100;
    return 300 * (tier - 1);
}

const MAX_DUNGEON_TIER = 5; // 最大副本层数 T1-T5

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
