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

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SCALE_ENEMY, SCALE_EQUIP, SCALE_PILL, SCALE_TOWER_STR, SCALE_TOWER_DROP,
        SLOTS_CONFIG, SLOT_KEYS,
        TREASURE_SLOTS, TREASURE_QUALITIES, TREASURE_ATTRS,
        QUALITIES, ENEMY_TYPES, TOWER_TYPES,
        DUNGEON_TYPES, DUNGEON_N1_MULT, DUNGEON_ATK_INC, DUNGEON_HP_INC
    };
}
