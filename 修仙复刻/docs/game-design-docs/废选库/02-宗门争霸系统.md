# 宗门争霸系统 (Sect War)

## 📋 系统概述

**系统名称**：万宗之战 (Sect Warfare)  
**解锁条件**：筑基期（境界5+）  
**核心目的**：引入异步PvP+宗门建设的社交/竞争元素，提供横向比较和长期目标  
**系统定位**：社交驱动的异步竞争系统，提供周期性目标和集体荣誉感

---

## 🎮 核心玩法

### 1. 宗门体系

```
玩家达到筑基期
    │
    ├── 加入宗门（申请加入现有宗门）
    │   ├── 查看宗门排名、活跃度
    │   └── 发送入宗申请
    │
    └── 创建宗门（消耗资源）
        ├── 命名宗门
        ├── 设置宗门宣言
        └── 邀请好友加入
```

**宗门等级与人数**：

| 宗门等级 | 人数上限 | 升级消耗 | 解锁功能 |
|---------|---------|---------|---------|
| 1级-初创 | 10人 | - | 基础产出 |
| 2级-兴盛 | 20人 | 10万贡献点 | 护山大阵 |
| 3级-大派 | 30人 | 100万贡献点 | 宗门战开启 |
| 4级-名门 | 50人 | 1000万贡献点 | 跨服匹配 |
| 5级-圣地 | 80人 | 1亿贡献点 | 专属副本 |

### 2. 宗门建筑系统

每座建筑提供全员加成：

```javascript
const SECT_BUILDINGS = {
    '灵脉': {
        effect: 'wildIncome',      // 荒野战斗收益
        perLevel: 1.02,            // 每级+2%
        maxLevel: 100
    },
    '藏经阁': {
        effect: 'lawCultivation',  // 法则修炼效率
        perLevel: 1.03,
        maxLevel: 100
    },
    '炼丹房': {
        effect: 'pillEffect',      // 丹药效果
        perLevel: 1.05,
        maxLevel: 50
    },
    '炼器室': {
        effect: 'equipmentScore',  // 装备评分
        perLevel: 1.04,
        maxLevel: 50
    },
    '护山大阵': {
        effect: 'defense',         // 宗门战防御
        perLevel: 1.10,
        maxLevel: 30,
        unlockAt: 2              // 2级宗门解锁
    }
};
```

### 3. 贡献点产出

```javascript
// 每小时自动产出
function calculateSectIncome(sect) {
    // 对数压缩：避免大号垄断
    const totalPower = sect.members.reduce((sum, m) => {
        return sum.add(m.power.log10());
    }, new BigNum(0));
    
    // 基础产出 × 建筑加成 × 在线人数加成
    const baseIncome = totalPower.mul(10);
    const buildingMult = Math.pow(1.02, sect.buildings['灵脉']);
    const onlineBonus = 1 + (sect.onlineCount / sect.memberCount) * 0.5;
    
    return baseIncome.mul(buildingMult).mul(onlineBonus);
}
```

### 4. 宗门战（异步PvP）

**进攻流程**：
1. 选择目标宗门（匹配相近战力）
2. 派遣"先锋"（自己的战力快照）攻打对方护山大阵
3. 战斗自动进行，结果通过邮件通知
4. 胜利掠夺对方10%当日贡献点储备

**防守机制**：
- 护山大阵等级决定防御倍率
- 宗门成员可设置"防守阵容"（战力快照）
- 被攻击时自动使用防守阵容应战

**战斗公式**：
```javascript
// 进攻方战力 vs 防守方战力 × 护阵倍率
const attackPower = attacker.power;
const defensePower = defender.power.mul(defender.sect.formationMult);

const winRate = attackPower.div(attackPower.add(defensePower));
// 胜率50%时势均力敌，>70%大概率获胜
```

### 5. 宗门大比（周赛）

**周期**：每周日20:00结算  
**积分规则**：
- 宗门战胜利：+100分
- 宗门成员活跃度：+1分/人/日
- 宗门总战力增长：+10分/万亿战力

**奖励**：
| 排名 | 奖励 |
|-----|------|
| 1-3名 | 道韵×1000 + 专属称号 + 宗门皮肤 |
| 4-10名 | 道韵×500 + 称号 |
| 11-50名 | 道韵×200 |
| 参与奖 | 道韵×50 |

---

## 📊 数值循环设计

### 资源流动图

```
成员战力 ──┬──→ 宗门贡献点 ──→ 建筑升级 ──→ 全员加成 ──→ 战力提升
           │
           └──→ 宗门排名 ──→ 大比奖励 ──→ 道韵 ──→ 专属资源
           │
           └──→ 宗门战 ──→ 掠夺/被掠夺 ──→ 竞争刺激
```

### 离线产出机制

```javascript
// 玩家离线期间仍正常贡献
updateOfflineContribution(member) {
    const offlineHours = (Date.now() - member.lastOnline) / 3600000;
    const contribution = member.hourlyIncome.mul(offlineHours);
    
    // 上限：最多累积72小时
    const cappedHours = Math.min(offlineHours, 72);
    
    return contribution.mul(cappedHours / offlineHours);
}
```

---

## 💰 商业化设计

### 付费点1：建宗令

```
道具名称：开山立派令
功能：创建自己的宗门
定价：68元
说明：一次性消费，满足玩家领袖欲望
```

### 付费点2：贡献令

```
道具名称：宗门供奉令
功能：立即获得10000贡献点（每日限购10个）
定价：6元/个，50元/十连
用途：加速建筑升级，追赶大部队
```

### 付费点3：战书

```
道具名称：至尊战书
功能：宗门战次数+3（每日基础3次，购买后6次）
定价：12元/日卡，30元/周卡
用途：增加掠夺机会，快速提升排名
```

### 付费点4：保护符

```
道具名称：护宗神符
功能：24小时内不会被其他宗门攻击
定价：18元/个
用途：保护期集中发展，或离线前使用
```

### 付费点5：宗门皮肤

```
皮肤名称：
- 昆仑仙境（30元）
- 蓬莱仙岛（68元）
- 紫霄天宫（128元）
功能：改变宗门外观，轻微属性加成（+1%贡献产出）
```

### 付费点6：职位特权

```
道具名称：长老任命书
功能：提升宗门职位（成员→精英→长老→副宗主）
定价：30元/级
特权：
- 精英：宗门加成+5%
- 长老：宗门加成+10%，可审核新成员
- 副宗主：宗门加成+15%，可发起宗门战
```

### 赛季通行证

```
宗门大比赛季通行证：68元
奖励梯度（共30级）：
- 每级：贡献点×1000
- 5级：专属头像框
- 10级：宗门战皮肤
- 15级：道韵×500
- 20级：传说级宗门徽章
- 25级：专属称号"宗门柱石"
- 30级：神话级宗门法阵（永久+5%全属性）
```

---

## 🔧 技术实现

### 新增文件

```
js/
├── classes/
│   └── Sect.js              # 宗门类
├── config/
│   └── sect-config.js       # 宗门配置
└── game/
    └── SectSystem.js        # 宗门系统管理
```

### 数据结构

```javascript
// 宗门数据结构
class Sect {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.level = data.level || 1;
        this.members = data.members || [];  // {id, name, power, position, lastOnline}
        this.buildings = data.buildings || {
            '灵脉': 0,
            '藏经阁': 0,
            '炼丹房': 0,
            '炼器室': 0,
            '护山大阵': 0
        };
        this.contributionPool = data.contributionPool || new BigNum(0);  // 贡献点储备
        this.formationDefense = data.formationDefense || [];  // 防守阵容
        this.warHistory = data.warHistory || [];  // 战斗记录
        this.weeklyScore = data.weeklyScore || 0;
    }
    
    // 计算建筑总加成
    getBuildingBonus(buildingType) {
        const level = this.buildings[buildingType];
        const config = SECT_BUILDINGS[buildingType];
        return Math.pow(config.perLevel, level);
    }
}
```

### Game.js 集成

```javascript
class Game {
    constructor() {
        // ... existing code ...
        
        // 宗门系统
        this.sect = null;  // 当前所属宗门
        this.sectContribution = new BigNum(0);  // 个人贡献点
        this.defenseFormation = null;  // 防守阵容快照
        this.warTickets = 3;  // 每日宗门战次数
    }
    
    // 修改属性计算（加入宗门加成）
    getTotalStats() {
        // ... existing calculations ...
        
        if (this.sect) {
            const wildBonus = this.sect.getBuildingBonus('灵脉');
            const lawBonus = this.sect.getBuildingBonus('藏经阁');
            
            // 荒野模式加成
            if (this.mode === 'wild') {
                stats.atk = stats.atk.mul(wildBonus);
                maxHp = maxHp.mul(wildBonus);
            }
            
            // 法则修炼加成（在cultivate()方法中应用）
            this.sectLawBonus = lawBonus;
        }
        
        return { ...stats, maxHp };
    }
    
    // 每小时更新宗门贡献
    updateSectContribution() {
        if (!this.sect) return;
        
        const now = Date.now();
        const hoursPassed = (now - this.lastSectUpdate) / 3600000;
        
        if (hoursPassed >= 1) {
            const income = this.calculateSectIncome();
            this.sect.contributionPool = this.sect.contributionPool.add(income);
            this.lastSectUpdate = now;
        }
    }
    
    // 发起宗门战
    initiateSectWar(targetSectId) {
        if (this.warTickets <= 0) {
            this.log('SYS', '今日宗门战次数已用完');
            return;
        }
        
        // 创建战力快照
        const attackSnapshot = {
            playerId: this.playerId,
            power: this.getTotalStats().atk,  // 使用攻击作为战力代表
            timestamp: Date.now()
        };
        
        // 异步计算战斗结果
        this.simulateSectWar(attackSnapshot, targetSectId);
        this.warTickets--;
    }
    
    updateSectUI() { /* 更新宗门界面 */ }
}
```

### UI 结构

```html
<!-- 宗门标签页 -->
<div id="tab-sect" class="tab-content">
    <!-- 未加入宗门 -->
    <div class="sect-join-view" style="display:none;">
        <button class="sys-btn" onclick="game.createSect()">🏛️ 创建宗门</button>
        <div class="sect-list">
            <!-- 推荐宗门列表 -->
        </div>
    </div>
    
    <!-- 已加入宗门 -->
    <div class="sect-home-view">
        <div class="sect-header">
            <h3 id="sect-name">xxx宗门</h3>
            <span id="sect-level">LV.3 大派</span>
        </div>
        
        <!-- 建筑列表 -->
        <div class="sect-buildings">
            <div class="building" data-type="灵脉">
                <span>灵脉 LV.<span class="level">5</span></span>
                <button onclick="game.upgradeBuilding('灵脉')">升级</button>
            </div>
            <!-- 其他建筑... -->
        </div>
        
        <!-- 贡献点显示 -->
        <div class="contribution-display">
            宗门储备: <span id="sect-pool">0</span>
            我的贡献: <span id="my-contribution">0</span>
        </div>
        
        <!-- 宗门战 -->
        <button class="sys-btn btn-war" onclick="game.openWarPanel()">
            ⚔️ 宗门战 (<span id="war-tickets">3</span>)
        </button>
        
        <!-- 大比排名 -->
        <div class="sect-ranking">
            <div>本周积分: <span id="weekly-score">0</span></div>
            <div>全服排名: <span id="sect-rank">--</span></div>
        </div>
    </div>
</div>
```

---

## 🎯 留存设计

### 每日循环
- 领取宗门贡献收益
- 参与宗门战（3次）
- 升级宗门建筑

### 每周循环
- 宗门大比结算（周日）
- 赛季通行证进度
- 宗门职位考核

### 社交驱动
- 宗门聊天频道
- 成员互助（借用灵兽、指导突破）
- 敌对宗门竞争

---

## 📈 迭代扩展

### Phase 2：宗门副本
- 只有宗门成员可参与的专属副本
- 掉落宗门专属材料
- 需要多人协作击败BOSS

### Phase 3：宗门联盟
- 多个宗门组成联盟
- 联盟vs联盟的跨服战
- 领地争夺玩法

### Phase 4：宗门传承
- 宗主可指定继承人
- 宗门传承技能（历代宗主积累）
- 宗门历史记录

---

## ✅ 验收标准

- [ ] 达到筑基期可创建/加入宗门
- [ ] 宗门成员战力正确转换为贡献点
- [ ] 建筑升级消耗正确，加成生效
- [ ] 宗门战异步计算结果正确
- [ ] 大比积分计算和排名正确
- [ ] 离线期间贡献点正常累积
- [ ] 商业化道具功能正常
