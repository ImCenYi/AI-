# 灵兽羁绊系统 (Spirit Beast Bond)

## 📋 系统概述

**系统名称**：灵兽山 (Spirit Mountain)  
**核心目的**：引入"灵兽收集+羁绊组合"的RPG要素，提供策略性的build搭配空间  
**系统定位**：中期解锁的横向收集系统，丰富build多样性

---

## 🎮 核心玩法

### 1. 灵兽遭遇与收服

```
荒野战斗 → 概率遭遇灵兽 → 击败后选择：
    ├── 斩杀：获得灵兽材料（炼丹/炼器用）
    └── 收服：获得灵兽入驻灵兽山
```

**遭遇机制**：
- 基础遭遇率：1% / 每场荒野战斗
- 境界加成：`+0.1% × 境界等级`（练气期+0.1%，结丹期+0.4%）
- 每日首次遭遇保底：50场战斗内必出

### 2. 灵兽属性

每只灵兽拥有：

| 属性 | 说明 | 数值范围 |
|-----|------|---------|
| 种族 | 青龙/白虎/朱雀/玄武/麒麟/凤凰... | 12种族 |
| 品质 | 普通/稀有/史诗/传说/神话 | 影响成长上限 |
| 等级 | 1-100级 | 消耗灵材升级 |
| 主属性 | 攻击/生命/暴击/法则掉落/塔掉落 | 5种类型 |
| 羁绊标签 | 四象/五行/祥瑞/凶兽/洪荒 | 用于触发羁绊 |

### 3. 羁绊系统

**羁绊触发规则**：
```javascript
// 同时入驻灵兽山的灵兽满足条件时触发
const BONDS = {
    '四象之力': {
        require: ['青龙', '白虎', '朱雀', '玄武'],
        effect: { allStat: 1.5 }  // 全属性+50%
    },
    '五行相生': {
        require: ['金', '木', '水', '火', '土'], // 属性标签
        effect: { realmBonus: 1.3 }  // 境界加成+30%
    },
    '龙凤呈祥': {
        require: ['青龙', '凤凰'],
        effect: { dropRate: 2.0 }  // 掉落翻倍
    },
    '洪荒遗种': {
        require: ['种族:洪荒'], // 3只及以上
        minCount: 3,
        effect: { exponentialBoost: 0.05 }  // 指数+5%
    }
};
```

---

## 📊 数值循环设计

### 灵兽成长公式

```javascript
// 单只灵兽提供的加成
function getBeastBonus(beast) {
    const qualityMult = { 
        '普通': 1.0, 
        '稀有': 1.3, 
        '史诗': 1.8, 
        '传说': 2.5, 
        '神话': 4.0 
    }[beast.quality];
    
    // 基础加成 × 品质倍率 × 等级成长
    const levelMult = Math.pow(1.02, beast.level);
    
    return {
        type: beast.mainAttr,
        value: new BigNum(1.05).mul(qualityMult).pow(beast.level)
    };
}

// 羁绊加成（连乘）
function getBondBonus(activeBonds) {
    let mult = new BigNum(1);
    activeBonds.forEach(bond => {
        mult = mult.mul(bond.effect);
    });
    return mult;
}
```

### 升级成本

| 等级区间 | 每级消耗灵材 | 累计消耗 |
|---------|-------------|---------|
| 1-20 | 10 × 2^level | ~10万 |
| 21-50 | 50 × 2^level | ~1亿 |
| 51-80 | 200 × 2^level | ~1万亿 |
| 81-100 | 1000 × 2^level | ~10^20 |

**BigNum处理**：所有加成以乘数形式作用于最终属性，与境界、秘宝加成连乘

---

## 💰 商业化设计

### 付费点1：灵兽契约书（抽卡）

```
道具名称：远古召唤令
功能：立即召唤一只随机灵兽（保底史诗品质）
定价：6元/张，十连抽50元（保底1传说）

概率设计：
- 神话：0.5%（保底200抽）
- 传说：5%
- 史诗：20%
- 稀有：44.5%
- 普通：30%
```

### 付费点2：灵兽成长加速

```
道具名称：灵兽丹
功能：灵兽获得经验+100%（持续24小时）
定价：12元/个

道具名称：资质洗炼石
功能：重置灵兽品质（保留等级）
定价：30元/个
```

### 付费点3：灵兽栏位扩展

```
基础栏位：3只
扩展价格：第4栏位30元，第5栏位68元，第6栏位128元
满栏位：6只（触发3个羁绊）
```

### 付费点4：羁绊锁定

```
道具名称：羁绊符印
功能：锁定一个羁绊，即使灵兽下场也保持激活（持续7天）
定价：18元/个
用途：灵活调整阵容而不损失核心羁绊
```

---

## 🔧 技术实现

### 新增文件

```
js/
├── classes/
│   └── SpiritBeast.js      # 灵兽类定义
├── config/
│   └── beasts.js           # 灵兽配置表
└── game/
    └── BeastSystem.js      # 灵兽系统管理（可选）
```

### Game.js 修改点

```javascript
class Game {
    constructor() {
        // ... existing code ...
        
        // 灵兽系统
        this.beastMountain = [];        // 已收服灵兽
        this.beastMaterials = {};       // 灵兽材料
        this.beastSlots = 3;            // 当前栏位数
        this.activeBonds = [];          // 当前激活羁绊
    }
    
    // 荒野遭遇判定
    checkBeastEncounter() {
        if (this.mode !== 'wild') return;
        
        const baseRate = 0.01;
        const realmBonus = this.realmIndex * 0.001;
        const encounterRate = baseRate + realmBonus;
        
        if (Math.random() < encounterRate) {
            this.spawnWildBeast();
        }
    }
    
    // 修改属性计算
    getTotalStats() {
        // ... existing calculations ...
        
        // 灵兽加成
        let beastMult = new BigNum(1);
        this.beastMountain.forEach(beast => {
            if (beast.active) {
                const bonus = this.calculateBeastBonus(beast);
                beastMult = beastMult.mul(bonus);
            }
        });
        
        // 羁绊加成
        const bondMult = this.calculateBondBonus();
        
        stats.atk = stats.atk.mul(beastMult).mul(bondMult);
        maxHp = maxHp.mul(beastMult).mul(bondMult);
        
        return { ...stats, maxHp };
    }
    
    updateBeastUI() { /* 更新灵兽山界面 */ }
}
```

### UI 结构

```html
<!-- 新增标签页按钮 -->
<button class="tab-btn" onclick="game.switchTab('beast')">🐉 灵兽山</button>

<!-- 灵兽山标签页 -->
<div id="tab-beast" class="tab-content">
    <div class="beast-mountain">
        <!-- 已入驻灵兽 -->
        <div class="beast-slots">
            <div class="beast-slot" data-index="0"></div>
            <div class="beast-slot" data-index="1"></div>
            <div class="beast-slot" data-index="2"></div>
            <!-- 扩展栏位 -->
        </div>
        
        <!-- 羁绊显示 -->
        <div class="active-bonds">
            <div class="bond-badge">四象之力 x1.5</div>
        </div>
        
        <!-- 灵兽背包 -->
        <div class="beast-bag"></div>
    </div>
</div>
```

---

## 🎯 留存设计

### 每日循环
- 检查灵兽山羁绊是否最优
- 收服新灵兽补充图鉴
- 喂养灵兽提升等级

### 每周目标
- 收集特定羁绊组合（周常任务）
- 灵兽等级突破里程碑

### 长期追求
- **图鉴收集**：收集全部36种灵兽
- **羁绊大师**：同时激活5个羁绊
- **神兽驯养师**：拥有3只神话品质灵兽

---

## 📈 迭代扩展

### Phase 2：灵兽进化
- 同种族3只灵兽可进化为更高阶形态
- 进化后羁绊效果翻倍

### Phase 3：灵兽技能
- 灵兽拥有主动技能（战斗中概率释放）
- 技能可通过"灵兽悟道"升级

### Phase 4：灵兽装备
- 为灵兽装备"灵珠"提升特定属性
- 灵珠副本专门产出

---

## ⚠️ 风险与应对

| 风险 | 应对方案 |
|-----|---------|
| 羁绊太强破坏平衡 | 羁绊加成与境界加成加算而非连乘 |
| 灵兽收集太肝 | 提供"灵兽诱饵"道具提升遭遇率 |
| UI过于复杂 | 默认只显示激活的灵兽，其他折叠 |

---

## ✅ 验收标准

- [ ] 荒野战斗有1%概率遭遇灵兽
- [ ] 收服/斩杀选择逻辑正常
- [ ] 灵兽入驻后属性正确加成
- [ ] 羁绊满足条件时自动激活
- [ ] 灵兽升级消耗正确计算
- [ ] UI显示羁绊状态
- [ ] 商业化道具功能正常
