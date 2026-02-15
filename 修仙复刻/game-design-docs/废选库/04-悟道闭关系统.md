# 悟道闭关系统 (Enlightenment Retreat)

## 📋 系统概述

**系统名称**：悟道洞天 (Enlightenment Sanctuary)  
**解锁条件**：练气期（境界1+）  
**核心目的**：强化"放置"核心体验，提供有意义的离线进度和定时收获机制  
**系统定位**：贯穿全程的基础放置系统，体现"修仙即闭关"的主题

---

## 🎮 核心玩法

### 1. 闭关状态

```
正常游戏状态
    │
    ├── 点击"进入闭关"按钮
    │   ├── 选择闭关时长（1/4/8/12/24小时）
    │   ├── 设置自动出关条件（可选）
    │   └── 确认进入闭关
    │
    └── 闭关期间
        ├── 无法战斗（荒野/塔/副本锁定）
        ├── 自动产出悟道点
        ├── 可被其他玩家"论道"（切磋）
        └── 可随时选择出关
```

**闭关规则**：

| 闭关时长 | 产出倍率 | 被论道概率 | 适合场景 |
|---------|---------|-----------|---------|
| 1小时 | 1.0x | 10% | 短暂离开 |
| 4小时 | 1.2x | 15% | 午睡/用餐 |
| 8小时 | 1.5x | 20% | 工作/学习 |
| 12小时 | 1.8x | 25% | 外出 |
| 24小时 | 2.0x | 30% | 睡眠 |

### 2. 悟道点产出

```javascript
// 悟道点产出公式
function calculateEnlightenmentGain(game, hours) {
    // 基础产出：境界等级 × 洞府灵气 × 时间
    const baseGain = game.realmIndex * game.retreatFacility.spiritLevel * hours;
    
    // 时间倍率
    const timeMult = {1: 1.0, 4: 1.2, 8: 1.5, 12: 1.8, 24: 2.0}[hours];
    
    // 设施加成
    const facilityMult = Math.pow(1.1, game.retreatFacility.timeFlow);
    
    // 离线累积加成（如果离线超过1小时开始闭关）
    const offlineBonus = game.wasOffline ? 1.5 : 1.0;
    
    return baseGain * timeMult * facilityMult * offlineBonus;
}
```

### 3. 功法推演

悟道点用于推演功法，获得限时强力buff：

```javascript
const TECHNIQUES = {
    '金刚不坏': {
        cost: 100,           // 悟道点消耗
        duration: 3600,      // 持续时间（秒）
        effect: { hpMult: 2.0 },  // 生命翻倍
        description: '1小时内生命值翻倍'
    },
    '破釜沉舟': {
        cost: 150,
        duration: 1800,
        effect: { atkMult: 3.0, hpMult: 0.5 },  // 攻击3倍，生命减半
        description: '30分钟内攻击翻倍，但生命减半'
    },
    '悟道通明': {
        cost: 200,
        duration: 7200,
        effect: { lawGain: 2.0 },  // 法则真意获取翻倍
        description: '2小时内法则真意获取翻倍'
    },
    '聚宝盆': {
        cost: 250,
        duration: 3600,
        effect: { dropRate: 2.0 },  // 掉落率翻倍
        description: '1小时内装备/丹药掉落率翻倍'
    },
    '时间加速': {
        cost: 500,
        duration: 600,
        effect: { timeScale: 2.0 },  // 战斗速度翻倍（实际时间流逝更快）
        description: '10分钟内战斗速度翻倍'
    },
    '天人感应': {
        cost: 1000,
        duration: 1800,
        effect: { realmBonus: 1.5 },  // 境界加成提升50%
        description: '30分钟内境界加成提升50%'
    }
};
```

**功法使用策略**：
- 冲关前使用"破釜沉舟"速杀BOSS
- 爬塔前使用"悟道通明"最大化真意收益
- 装备较差时使用"聚宝盆"快速换装

### 4. 洞府设施

消耗资源升级洞府，提升闭关效率：

```javascript
const RETREAT_FACILITIES = {
    '灵气浓度': {
        description: '提升悟道点基础产出',
        baseCost: 1000,           // 灵石
        costGrowth: 1.5,          // 每次升级成本×1.5
        effectPerLevel: 0.1,      // 每级+10%产出
        maxLevel: 50
    },
    '时间流速': {
        description: '提升闭关效率',
        baseCost: 5000,
        costGrowth: 1.6,
        effectPerLevel: 0.1,      // 每级+10%效率
        maxLevel: 30
    },
    '护阵等级': {
        description: '降低被论道概率，提升防御',
        baseCost: 2000,
        costGrowth: 1.4,
        effectPerLevel: 0.02,     // 每级-2%被论道概率，+5%防御
        maxLevel: 20
    },
    '悟道碑': {
        description: '解锁高级功法',
        baseCost: 10000,
        costGrowth: 2.0,
        unlockTechnique: level => {
            const unlocks = {
                1: '金刚不坏',
                3: '破釜沉舟',
                5: '悟道通明',
                7: '聚宝盆',
                10: '时间加速',
                15: '天人感应'
            };
            return unlocks[level];
        },
        maxLevel: 15
    }
};
```

### 5. 论道系统（轻PvP）

其他玩家可以对你发起"论道"（切磋）：

```javascript
// 论道机制
function initiateDiscussion(attacker, defender) {
    // 检查条件
    if (!defender.isInRetreat) return '对方不在闭关中';
    if (Math.random() > defender.retreatFacility.defenseRate) return '突破护阵失败';
    
    // 战斗模拟（基于战力快照）
    const attackPower = attacker.power;
    const defensePower = defender.power.mul(defender.retreatFacility.defenseMult);
    
    const winRate = attackPower.div(attackPower.add(defensePower));
    const attackerWins = Math.random() < winRate;
    
    if (attackerWins) {
        // 掠夺悟道点
        const stolenPoints = defender.enlightenmentPoints.mul(0.1);  // 掠夺10%
        attacker.enlightenmentPoints = attacker.enlightenmentPoints.add(stolenPoints);
        defender.enlightenmentPoints = defender.enlightenmentPoints.sub(stolenPoints);
        
        // 强制出关
        defender.forceExitRetreat();
        
        return `论道胜利！掠夺${formatNum(stolenPoints)}悟道点，对方被迫出关`;
    } else {
        return '论道失败，对方护阵坚固';
    }
}
```

**论道限制**：
- 每日最多论道3次
- 不能论道同一人多次
- 境界差距超过10级不能论道

---

## 📊 数值循环设计

### 闭关vs推图权衡

```
闭关状态：
- 收益稳定但无法主动推进
- 适合离线/挂机
- 有被论道风险

推图状态：
- 可主动突破难度
- 有掉落装备/丹药
- 无风险但需在线

最优策略：闭关积累悟道点 → 出关使用buff → 快速推图 → 再次闭关
```

### 悟道点经济

| 来源 | 产出 | 消耗 | 净收益 |
|-----|------|------|--------|
| 闭关产出 | 1000/小时 | - | +1000 |
| 功法使用 | - | 100-1000 | 可变 |
| 被掠夺 | -10% | - | -100 |
| 论道胜利 | +10%对方 | - | +100 |

**设计理念**：鼓励积极参与（论道），但惩罚不至于太严重

---

## 💰 商业化设计

### 付费点1：闭关令

```
道具名称：静心符
功能：立即完成当前闭关，获得全部收益
定价：
- 1小时：3元
- 4小时：10元
- 8小时：18元
- 12小时：25元
- 24小时：45元

策略：服务"即时满足"需求，愿意付费跳过的玩家
```

### 付费点2：防护罩

```
道具名称：九天玄罩
功能：24小时内免疫论道（不会被其他玩家切磋）
定价：12元/个，68元/周卡（无限使用）

策略：保护型消费，适合高价值/忙碌玩家
```

### 付费点3：洞府速成

```
道具名称：洞天福地令
功能：立即完成洞府升级（无需等待）
定价：根据升级等级动态
- 1-10级：5元
- 11-20级：10元
- 21-30级：20元
- 31+级：50元
```

### 付费点4：功法双倍

```
道具名称：悟道真解
功能：下次使用功法效果翻倍，持续时间翻倍
定价：15元/个

示例：金刚不坏正常是1小时生命2倍，使用后变为2小时生命4倍
```

### 付费点5：自动闭关月卡

```
功能：自动闭关尊享卡
价格：30元/月
特权：
- 离线超过30分钟自动进入8小时闭关
- 自动使用最优功法组合
- 被论道时自动使用防御功法
- 出关后自动领取离线收益

策略：极致的"放置"体验，全自动修仙
```

### 付费点6：悟道点礼包

```
礼包内容：
- 小包（18元）：1000悟道点
- 中包（45元）：3000悟道点 + 1张静心符
- 大包（88元）：7000悟道点 + 3张静心符 + 1张悟道真解
```

---

## 🔧 技术实现

### 新增文件

```
js/
├── classes/
│   └── RetreatFacility.js   # 洞府设施类
├── config/
│   └── retreat-config.js    # 闭关配置
└── game/
    └── RetreatSystem.js     # 闭关系统管理
```

### Game.js 集成

```javascript
class Game {
    constructor() {
        // ... existing code ...
        
        // 闭关系统
        this.isInRetreat = false;
        this.retreatStartTime = null;
        this.retreatDuration = 0;  // 计划闭关时长（小时）
        this.retreatFacility = {
            spiritLevel: 1,        // 灵气浓度
            timeFlow: 1,           // 时间流速
            defenseLevel: 1,       // 护阵等级
            monumentLevel: 1       // 悟道碑
        };
        this.enlightenmentPoints = 0;
        this.activeTechnique = null;  // 当前激活的功法
        this.techniqueEndTime = null;
    }
    
    // 进入闭关
    enterRetreat(hours) {
        if (this.isInRetreat) return;
        
        this.isInRetreat = true;
        this.retreatStartTime = Date.now();
        this.retreatDuration = hours;
        
        // 切换到闭关模式
        this.mode = 'retreat';
        this.log('SYS', `进入闭关状态，预计${hours}小时后出关`);
        
        this.updateRetreatUI();
    }
    
    // 出关
    exitRetreat() {
        if (!this.isInRetreat) return;
        
        // 计算实际闭关时长
        const actualHours = (Date.now() - this.retreatStartTime) / 3600000;
        const effectiveHours = Math.min(actualHours, this.retreatDuration);
        
        // 计算收益
        const gain = calculateEnlightenmentGain(this, effectiveHours);
        this.enlightenmentPoints += gain;
        
        this.log('GAIN', `出关！获得${gain}悟道点`);
        
        // 重置状态
        this.isInRetreat = false;
        this.retreatStartTime = null;
        this.mode = 'wild';
        
        this.updateRetreatUI();
    }
    
    // 使用功法
    useTechnique(techniqueId) {
        const tech = TECHNIQUES[techniqueId];
        
        if (this.enlightenmentPoints < tech.cost) {
            this.log('SYS', '悟道点不足');
            return;
        }
        
        this.enlightenmentPoints -= tech.cost;
        this.activeTechnique = tech;
        this.techniqueEndTime = Date.now() + tech.duration * 1000;
        
        this.log('GAIN', `推演功法${techniqueId}成功！效果持续${tech.duration/60}分钟`);
        this.updateRetreatUI();
    }
    
    // 修改属性计算（加入功法效果）
    getTotalStats() {
        let stats = /* 基础计算 */;
        
        // 应用功法效果
        if (this.activeTechnique && Date.now() < this.techniqueEndTime) {
            const effect = this.activeTechnique.effect;
            
            if (effect.hpMult) stats.hp = stats.hp.mul(effect.hpMult);
            if (effect.atkMult) stats.atk = stats.atk.mul(effect.atkMult);
            if (effect.critBonus) stats.crit += effect.critBonus;
            // ... 其他效果
        } else if (this.activeTechnique) {
            // 功法过期
            this.activeTechnique = null;
            this.log('SYS', '功法效果已结束');
        }
        
        return stats;
    }
    
    // 洞府升级
    upgradeFacility(facilityType) {
        const config = RETREAT_FACILITIES[facilityType];
        const currentLevel = this.retreatFacility[facilityType + 'Level'];
        
        if (currentLevel >= config.maxLevel) return;
        
        const cost = config.baseCost * Math.pow(config.costGrowth, currentLevel);
        
        if (this.spiritStones >= cost) {  // 假设有灵石资源
            this.spiritStones -= cost;
            this.retreatFacility[facilityType + 'Level']++;
            this.log('GAIN', `${facilityType}升级至${currentLevel + 1}级`);
            this.updateRetreatUI();
        }
    }
    
    updateRetreatUI() { /* 更新闭关界面 */ }
}
```

### UI 结构

```html
<!-- 新增"闭关"按钮在主界面 -->
<div class="controls">
    <button class="sys-btn btn-retreat" onclick="game.openRetreatModal()">
        🧘 悟道闭关
    </button>
</div>

<!-- 闭关模态框 -->
<div id="retreat-modal" class="game-modal">
    <div class="modal-content">
        <h3>🧘 悟道洞天</h3>
        
        <!-- 当前状态 -->
        <div class="retreat-status">
            <div>当前悟道点: <span id="enlightenment-points">0</span></div>
            <div id="retreat-timer" style="display:none;">
                闭关中: <span>00:00:00</span> 剩余
            </div>
        </div>
        
        <!-- 选择闭关时长 -->
        <div class="retreat-options">
            <button onclick="game.enterRetreat(1)">1小时 (1.0x)</button>
            <button onclick="game.enterRetreat(4)">4小时 (1.2x)</button>
            <button onclick="game.enterRetreat(8)">8小时 (1.5x)</button>
            <button onclick="game.enterRetreat(12)">12小时 (1.8x)</button>
            <button onclick="game.enterRetreat(24)">24小时 (2.0x)</button>
        </div>
        
        <!-- 功法列表 -->
        <div class="technique-list">
            <h4>功法推演</h4>
            <div class="technique" data-id="金刚不坏">
                <span>金刚不坏</span>
                <span>100悟道点</span>
                <button onclick="game.useTechnique('金刚不坏')">推演</button>
            </div>
            <!-- 其他功法... -->
        </div>
        
        <!-- 洞府设施 -->
        <div class="facilities">
            <h4>洞府设施</h4>
            <div class="facility">
                <span>灵气浓度 LV.<span id="spirit-level">1</span></span>
                <button onclick="game.upgradeFacility('灵气浓度')">升级</button>
            </div>
            <!-- 其他设施... -->
        </div>
    </div>
</div>
```

---

## 🎯 留存设计

### 每日循环
- 上线收取闭关收益
- 使用功法推图
- 设置新的闭关

### 每周目标
- 洞府设施升级里程碑
- 累计闭关时长成就
- 论道胜利次数

### 策略深度
- 功法与玩法的搭配（爬塔用法则buff，冲关用攻击buff）
- 闭关时长与风险的权衡
- 洞府资源分配策略

---

## 📈 迭代扩展

### Phase 2：双修道侣
- 与特定NPC或其他玩家结为道侣
- 共同闭关收益加成
- 道侣专属合击功法

### Phase 3：洞天福地
- 解锁不同主题的洞府皮肤
- 特殊洞府有特殊加成（如火焰洞府+攻击）
- 洞府间的串门/论道

### Phase 4：天道感悟
- 长期闭关可能触发"顿悟"
- 顿悟直接提升境界或解锁特殊天赋
- 顿悟记录形成"悟道日志"

---

## ✅ 验收标准

- [ ] 可选择不同时长进入闭关
- [ ] 闭关期间正确产出悟道点
- [ ] 功法效果正确应用和过期
- [ ] 洞府升级消耗正确计算
- [ ] 论道机制正常工作
- [ ] 自动闭关月卡功能正常
- [ ] UI正确显示闭关状态和倒计时
