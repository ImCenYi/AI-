# 轮回转世系统 (Reincarnation)

## 📋 系统概述

**系统名称**：九世轮回 (Ninefold Reincarnation)  
**解锁条件**：境界72+（真神-圆满）  
**核心目的**：引入prestige/转生机制，解决指数游戏的"软上限"问题，提供元进度维度  
**系统定位**：终局内容，为顶级玩家提供无限成长路径

---

## 🎮 核心玩法

### 1. 转世条件与流程

```
达到真神-圆满（境界72）
    │
    ├── 确认转世
    │   ├── 显示转世收益预览
    │   └── 确认保留/重置内容
    │
    └── 执行转世
        ├── 重置内容清空
        ├── 保留内容继承
        ├── 发放轮回印记
        └── 第二世开始（+20%成长速度）
```

**转世重置内容**：
| 类型 | 处理方式 |
|-----|---------|
| 难度 | 重置为1 |
| 装备 | 清空 |
| 秘宝 | 清空（保留图鉴） |
| 法则 | 重置为初始倍率 |
| 灵兽 | 清空（保留已解锁种类） |
| 宗门 | 退出，保留职位记忆 |

**转世保留内容**：
| 类型 | 说明 |
|-----|------|
| 境界等级 | 72级，继续往上突破 |
| 永恒天赋 | 跨轮回保留 |
| 轮回印记 | 元货币累积 |
| 灵兽图鉴 | 已遇到的种类记录 |
| 宗门贡献 | 历史贡献累积 |

### 2. 轮回加速机制

每多一世，获得永久性成长加速：

```javascript
const REINCARNATION_BONUS = {
    expGain: 1 + (count * 0.2),      // 经验获取 +20%/世
    dropRate: 1 + (count * 0.1),     // 掉落率 +10%/世
    offlineSpeed: 1 + (count * 0.15) // 离线收益 +15%/世
};

// 第二世：1.2倍速，第三世：1.4倍速...
```

**设计理念**：让玩家快速回到转世前的进度，减少重复感

### 3. 永恒天赋树

```javascript
const ETERNAL_TALENTS = {
    // 第一行：基础属性
    '轮回之体': {
        maxLevel: 10,
        cost: level => 100 * Math.pow(2, level),
        effect: level => ({ hpMult: Math.pow(1.1, level) })
    },
    '轮回之刃': {
        maxLevel: 10,
        cost: level => 100 * Math.pow(2, level),
        effect: level => ({ atkMult: Math.pow(1.1, level) })
    },
    '轮回之眼': {
        maxLevel: 10,
        cost: level => 100 * Math.pow(2, level),
        effect: level => ({ critBonus: level * 2 })  // +2%暴击/级
    },
    
    // 第二行：系统加成（需前置天赋5级）
    '法则亲和': {
        require: { '轮回之体': 5 },
        maxLevel: 10,
        cost: level => 200 * Math.pow(2, level),
        effect: level => ({ lawEfficiency: Math.pow(1.15, level) })
    },
    '寻宝直觉': {
        require: { '轮回之刃': 5 },
        maxLevel: 10,
        cost: level => 200 * Math.pow(2, level),
        effect: level => ({ treasureLuck: Math.pow(1.2, level) })
    },
    
    // 第三行：指数加成（终极天赋）
    '大道本源': {
        require: { '法则亲和': 10, '寻宝直觉': 10 },
        maxLevel: 5,
        cost: level => 1000 * Math.pow(5, level),
        effect: level => ({ 
            // 这是关键：指数部分加成！
            exponentBoost: level * 0.05  // 每级+5%指数加成
        })
    }
};
```

### 4. 轮回印记产出

```javascript
// 转世时计算
function calculateReincarnationMarks(game) {
    // 基于历史最高战力的对数
    const powerLog = game.historicalMaxPower.log10();
    const baseMarks = Math.floor(powerLog * 10);
    
    // 轮回次数加成（越往后越难，但收益越高）
    const reincarnationBonus = Math.pow(1.5, game.reincarnationCount);
    
    // 境界加成
    const realmBonus = 1 + (game.realmIndex * 0.01);
    
    return Math.floor(baseMarks * reincarnationBonus * realmBonus);
}

// 示例：
// 第一世，战力1e100 → 1000印记
// 第二世，战力1e150 → 2250印记（+50%战力，+50%轮回加成）
// 第三世，战力1e200 → 4500印记
```

---

## 📊 数值循环设计

### 转世收益分析

假设玩家每世推到战力 `1e(100 + 50n)`（指数增长）：

| 世数 | 目标战力 | 获得印记 | 累积印记 | 天赋提升 |
|-----|---------|---------|---------|---------|
| 1 | 1e100 | 1000 | 1000 | 轮回之体+3 |
| 2 | 1e150 | 2250 | 3250 | 轮回之体+7，轮回之刃+3 |
| 3 | 1e200 | 4500 | 7750 | 解锁法则亲和+5 |
| 4 | 1e250 | 8750 | 16500 | 大道本源+1（+5%指数）|
| 5 | 1e300 | 16500 | 33000 | 大道本源+2（+10%指数）|

**关键洞察**：第4世解锁"大道本源"后，指数加成开始发挥作用，形成新的增长维度

### 指数加成机制详解

```javascript
// 传统BigNum表示：{m: 尾数, e: 指数}
// 指数加成效果：指数部分额外增加

function applyExponentBoost(baseValue, boostPercent) {
    // 例如：baseValue = 1e100，boost = 5%
    // 结果 = 1e(100 × 1.05) = 1e105
    
    const originalExp = baseValue.e;
    const boostedExp = originalExp * (1 + boostPercent);
    
    return new BigNum({
        m: baseValue.m,
        e: boostedExp
    });
}

// 在属性计算中的应用
getTotalStats() {
    let stats = /* 基础计算 */;
    
    // 应用永恒天赋
    const talents = this.eternalTalents;
    stats.atk = stats.atk.mul(talents.atkMult || 1);
    stats.hp = stats.hp.mul(talents.hpMult || 1);
    
    // 应用指数加成（最关键！）
    if (talents.exponentBoost > 0) {
        stats.atk = applyExponentBoost(stats.atk, talents.exponentBoost);
        stats.hp = applyExponentBoost(stats.hp, talents.exponentBoost);
    }
    
    return stats;
}
```

**为什么指数加成如此强大？**
- 1e100 → 1e105 不是增加5%，而是增加了 `10^5 = 100,000` 倍！
- 这是指数游戏特有的"元增长"机制

---

## 💰 商业化设计

### 付费点1：轮回保留令

```
道具名称：往生记忆
功能：转世时可额外选择1项原本会重置的内容保留
定价：98元/个

可选保留项：
- 当前最高等级装备1件
- 当前品质最高的秘宝1个
- 等级最高的灵兽1只
- 宗门职位（不退出宗门）

策略：降低转世"损失感"，鼓励玩家更频繁地转世
```

### 付费点2：天赋重置

```
道具名称：大道重塑丹
功能：重置永恒天赋，返还80%轮回印记
定价：30元/个
用途：允许玩家调整build，尝试不同流派
```

### 付费点3：印记礼包

```
轮回印记补给包：
- 小包（30元）：500印记
- 中包（68元）：1200印记 + 赠送50
- 大包（128元）：2500印记 + 赠送200
- 超值包（328元）：7000印记 + 赠送1000

限制：每月每档限购5次
```

### 付费点4：轮回特权卡

```
月卡类型：轮回尊享卡
价格：68元/月
特权：
- 每日领取轮回印记×50
- 转世时额外获得10%印记
- 永恒天赋升级消耗-20%
- 专属聊天标识
```

### 付费点5：转世冲刺

```
功能：花费钻石立即完成当前进度回到转世前水平
定价：根据进度动态计算
- 每1e10战力差距 = 1元
- 例如：转世前1e100，现在1e50，差距1e50 → 约5元

策略：服务"付费追赶"需求，让忙碌玩家快速回归
```

### 付费点6：九世至尊礼包

```
限时礼包（仅在前9世可购买）：
价格：648元
内容：
- 轮回印记×10000
- 往生记忆×3
- 专属称号"九世轮回者"
- 专属外观"轮回光环"
- 立即解锁大道本源（无需前置天赋）

策略：针对高价值用户的"一步到位"选择
```

---

## 🔧 技术实现

### 新增文件

```
js/
├── classes/
│   └── EternalTalent.js     # 永恒天赋类
├── config/
│   └── reincarnation.js     # 转世配置
└── game/
    └── ReincarnationSystem.js
```

### 数据结构

```javascript
class Game {
    constructor() {
        // ... existing code ...
        
        // 轮回系统
        this.reincarnationCount = 0;
        this.eternalTalents = {
            '轮回之体': 0,
            '轮回之刃': 0,
            '轮回之眼': 0,
            '法则亲和': 0,
            '寻宝直觉': 0,
            '大道本源': 0
        };
        this.reincarnationMarks = new BigNum(0);
        this.historicalMaxPower = new BigNum(0);  // 历史最高战力
        this.reincarnationSpeed = 1;  // 转世加速倍率
    }
    
    // 检查转世条件
    canReincarnate() {
        return this.realmIndex >= 72;  // 真神-圆满
    }
    
    // 执行转世
    reincarnate() {
        if (!this.canReincarnate()) return;
        
        // 计算并发放印记
        const marks = calculateReincarnationMarks(this);
        this.reincarnationMarks = this.reincarnationMarks.add(marks);
        
        // 更新历史最高战力
        const currentPower = this.getTotalStats().atk;
        if (currentPower.gt(this.historicalMaxPower)) {
            this.historicalMaxPower = currentPower;
        }
        
        // 重置游戏进度
        this.resetForReincarnation();
        
        // 增加轮回计数
        this.reincarnationCount++;
        this.reincarnationSpeed = 1 + (this.reincarnationCount * 0.2);
        
        // 记录转世日志
        this.log('GAIN', `🌀 第${this.reincarnationCount}世轮回完成！获得${formatNum(marks)}轮回印记`);
        
        // 更新UI
        this.updateReincarnationUI();
    }
    
    resetForReincarnation() {
        // 重置难度
        this.difficulty = 1;
        this.maxDifficulty = 1;
        
        // 重置装备
        this.equipment = {};
        
        // 重置秘宝（保留图鉴）
        this.treasureBag.forEach(t => {
            if (!this.treasureCodex) this.treasureCodex = [];
            this.treasureCodex.push(t.id);
        });
        this.treasureBag = [];
        this.equippedTreasures = {};
        
        // 重置法则
        this.lawMultipliers = { atk: new BigNum(1), hp: new BigNum(1) };
        this.cultRound = 0;
        this.cultStep = 0;
        
        // 重置灵兽
        this.beastMountain = [];
        
        // 保留境界等级（继续往上突破）
        // 保留永恒天赋
        // 保留轮回印记
    }
    
    // 升级永恒天赋
    upgradeEternalTalent(talentId) {
        const talent = ETERNAL_TALENTS[talentId];
        const currentLevel = this.eternalTalents[talentId];
        
        if (currentLevel >= talent.maxLevel) return;
        
        // 检查前置条件
        if (talent.require) {
            for (let [reqId, reqLevel] of Object.entries(talent.require)) {
                if (this.eternalTalents[reqId] < reqLevel) return;
            }
        }
        
        const cost = talent.cost(currentLevel);
        if (this.reincarnationMarks.gte(cost)) {
            this.reincarnationMarks = this.reincarnationMarks.sub(cost);
            this.eternalTalents[talentId]++;
            this.updateReincarnationUI();
            this.log('GAIN', `永恒天赋 ${talentId} 升至${currentLevel + 1}级`);
        }
    }
    
    // 修改属性计算（加入永恒天赋）
    getTotalStats() {
        let stats = /* 基础计算 */;
        
        // 应用永恒天赋加成
        const talents = this.eternalTalents;
        
        // 乘法加成
        if (talents['轮回之体'] > 0) {
            const mult = Math.pow(1.1, talents['轮回之体']);
            stats.hp = stats.hp.mul(mult);
        }
        if (talents['轮回之刃'] > 0) {
            const mult = Math.pow(1.1, talents['轮回之刃']);
            stats.atk = stats.atk.mul(mult);
        }
        
        // 指数加成（核心！）
        if (talents['大道本源'] > 0) {
            const boost = talents['大道本源'] * 0.05;
            stats.atk = this.applyExponentBoost(stats.atk, boost);
            stats.hp = this.applyExponentBoost(stats.hp, boost);
        }
        
        return stats;
    }
    
    applyExponentBoost(value, boostPercent) {
        // BigNum的指数加成
        const newExp = value.e * (1 + boostPercent);
        return new BigNum({ m: value.m, e: newExp });
    }
}
```

### UI 结构

```html
<!-- 轮回转世标签页 -->
<div id="tab-reincarnation" class="tab-content">
    <!-- 转世前显示 -->
    <div class="reincarnation-ready" style="display:none;">
        <div class="res-display" style="border:none; color:#9c27b0;">🌀 轮回转世</div>
        <div class="reincarnation-preview">
            <div>预计获得印记: <span id="preview-marks">0</span></div>
            <div>转世后倍率: <span id="preview-speed">1.0</span>x</div>
        </div>
        <button class="sys-btn btn-reincarnate" onclick="game.reincarnate()">
            ⚠️ 确认转世
        </button>
    </div>
    
    <!-- 永恒天赋树 -->
    <div class="eternal-talents">
        <div class="res-display">轮回印记: <span id="marks-count">0</span></div>
        
        <!-- 天赋行1 -->
        <div class="talent-row">
            <div class="talent-node" data-id="轮回之体">
                <div class="talent-icon">🛡️</div>
                <div class="talent-name">轮回之体</div>
                <div class="talent-level">LV.<span>0</span>/10</div>
                <button onclick="game.upgradeEternalTalent('轮回之体')">升级</button>
            </div>
            <div class="talent-node" data-id="轮回之刃">
                <div class="talent-icon">⚔️</div>
                <div class="talent-name">轮回之刃</div>
                <div class="talent-level">LV.<span>0</span>/10</div>
            </div>
            <div class="talent-node" data-id="轮回之眼">
                <div class="talent-icon">👁️</div>
                <div class="talent-name">轮回之眼</div>
                <div class="talent-level">LV.<span>0</span>/10</div>
            </div>
        </div>
        
        <!-- 天赋行2（需前置） -->
        <div class="talent-row">
            <div class="talent-node locked" data-id="法则亲和">
                <div class="lock-text">需轮回之体5级</div>
            </div>
            <div class="talent-node locked" data-id="寻宝直觉">
                <div class="lock-text">需轮回之刃5级</div>
            </div>
        </div>
        
        <!-- 终极天赋 -->
        <div class="talent-row ultimate">
            <div class="talent-node locked ultimate" data-id="大道本源">
                <div class="talent-icon">☯️</div>
                <div class="talent-name">大道本源</div>
                <div class="talent-desc">指数加成 +5%/级</div>
            </div>
        </div>
    </div>
    
    <!-- 轮回统计 -->
    <div class="reincarnation-stats">
        <div>当前世数: <span id="reincarnation-count">1</span></div>
        <div>成长加速: <span id="reincarnation-speed">1.0</span>x</div>
        <div>历史最高战力: <span id="historical-power">0</span></div>
    </div>
</div>
```

---

## 🎯 留存设计

### 转世动机
- **新维度成长**：永恒天赋提供指数级加成
- **效率提升**：每世加速20%，越往后越轻松
- **成就收集**：多世专属称号、外观

### 长期目标
- **九世轮回**：9次转世获得"九世至尊"称号
- **天赋满级**：将所有永恒天赋升至满级
- **战力突破**：单世战力突破1e1000

---

## 📈 迭代扩展

### Phase 2：轮回专属副本
- 只有转世玩家可进入
- 掉落轮回专属材料
- 难度基于转世次数

### Phase 3：轮回羁绊
- 多次转世后解锁前世记忆
- 前世灵兽可召回
- 前世装备可觉醒

### Phase 4：万界飞升
- 9次轮回后可选择"飞升"
- 进入新的游戏维度
- 保留所有进度，开启新系统

---

## ✅ 验收标准

- [ ] 境界72+显示转世按钮
- [ ] 转世正确计算并发放印记
- [ ] 重置内容正确清空，保留内容正确继承
- [ ] 永恒天赋升级消耗正确
- [ ] 指数加成正确作用于属性
- [ ] 转世加速倍率正确应用
- [ ] UI显示当前世数和天赋状态
