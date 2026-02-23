/**
 * 英雄数据配置文件
 * 包含游戏中所有可雇佣英雄的基础数据
 * @file js/data/heroes.js
 */

/**
 * 英雄数据数组
 * 每个英雄包含以下属性：
 * - id: 唯一标识符
 * - name: 中文名称
 * - nameEn: 英文名称
 * - baseDPS: 基础每秒伤害值（0表示不增加DPS，如希德增加点击伤害）
 * - baseCost: 基础雇佣成本（金币）
 * - desc: 英雄描述（可选）
 */
const HEROES_DATA = [
    {
        id: 'cid',
        name: '热心冒险者希德',
        nameEn: 'Cid',
        baseDPS: 0,
        baseCost: 5,
        desc: '增强你的点击伤害'
    },
    {
        id: 'treebeast',
        name: '树兽',
        nameEn: 'Treebeast',
        baseDPS: 5,
        baseCost: 50,
        desc: '古老森林的守护者'
    },
    {
        id: 'ivan',
        name: '醉拳伊万',
        nameEn: 'Ivan',
        baseDPS: 22,
        baseCost: 250,
        desc: '醉拳大师，拳法独特'
    },
    {
        id: 'brittany',
        name: '海滩公主',
        nameEn: 'Brittany',
        baseDPS: 74,
        baseCost: 1000,
        desc: '来自热带岛屿的战士'
    },
    {
        id: 'fisherman',
        name: '流浪渔夫',
        nameEn: 'Fisherman',
        baseDPS: 245,
        baseCost: 4000,
        desc: '用鱼叉战斗的渔夫'
    },
    {
        id: 'betty',
        name: '贝蒂点击者',
        nameEn: 'Betty',
        baseDPS: 976,
        baseCost: 20000,
        desc: '点击速度极快的战士'
    },
    {
        id: 'samurai',
        name: '蒙面武士',
        nameEn: 'Samurai',
        baseDPS: 3725,
        baseCost: 100000,
        desc: '来自东方的神秘武士'
    },
    {
        id: 'leon',
        name: '里昂',
        nameEn: 'Leon',
        baseDPS: 10859,
        baseCost: 400000,
        desc: '传说中的黄金骑士'
    },
    {
        id: 'seer',
        name: '大森林先知',
        nameEn: 'Seer',
        baseDPS: 47143,
        baseCost: 2000000,
        desc: '能够预见未来的智者'
    },
    {
        id: 'alexa',
        name: '刺客艾莉克莎',
        nameEn: 'Alexa',
        baseDPS: 186871,
        baseCost: 10000000,
        desc: '暗影中的致命杀手'
    }
];

/**
 * 英雄升级成本增长系数
 * 每次购买英雄后，成本会乘以这个系数
 */
const HERO_COST_MULTIPLIER = 1.07;

/**
 * 获取英雄数据
 * @param {string} heroId - 英雄ID
 * @returns {Object|null} 英雄数据对象，找不到则返回null
 */
function getHeroData(heroId) {
    return HEROES_DATA.find(hero => hero.id === heroId) || null;
}

/**
 * 计算英雄购买成本
 * @param {Object} heroData - 英雄基础数据
 * @param {number} ownedCount - 已拥有的数量
 * @returns {number} 下一次购买的成本
 */
function calculateHeroCost(heroData, ownedCount) {
    return Math.floor(heroData.baseCost * Math.pow(HERO_COST_MULTIPLIER, ownedCount));
}

/**
 * 计算英雄总DPS贡献
 * @param {Object} heroData - 英雄基础数据
 * @param {number} ownedCount - 已拥有的数量
 * @returns {number} 总DPS贡献
 */
function calculateHeroDPS(heroData, ownedCount) {
    return heroData.baseDPS * ownedCount;
}

// 导出模块（如果在模块环境中使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        HEROES_DATA,
        HERO_COST_MULTIPLIER,
        getHeroData,
        calculateHeroCost,
        calculateHeroDPS
    };
}
