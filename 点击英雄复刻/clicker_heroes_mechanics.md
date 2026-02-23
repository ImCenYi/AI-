# 《点击英雄》(Clicker Heroes) 核心机制设计文档

## 目录
1. [核心游戏循环设计](#1-核心游戏循环设计)
2. [数值系统设计](#2-数值系统设计)
3. [DPS和点击伤害系统](#3-dps和点击伤害系统)
4. [转生/升华系统](#4-转生升华系统)
5. [技能系统](#5-技能系统)
6. [代码实现示例](#6-代码实现示例)

---

## 1. 核心游戏循环设计

### 1.1 基本游戏循环

```
┌─────────────────────────────────────────────────────────────────┐
│                     核心游戏循环流程图                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│   │ 点击攻击  │───▶│ 造成伤害  │───▶│ 怪物死亡  │───▶│ 获得金币  │  │
│   └──────────┘    └──────────┘    └──────────┘    └────┬─────┘  │
│        ▲                                               │        │
│        │                                               ▼        │
│        │                                          ┌──────────┐  │
│        │                                          │ 升级英雄  │  │
│        │                                          └────┬─────┘  │
│        │                                               │        │
│        │    ┌──────────┐    ┌──────────┐              │        │
│        └───┤ 遭遇Boss  │◀───│ 推进区域  │◀─────────────┘        │
│             └──────────┘    └──────────┘                        │
│                  │                                              │
│                  ▼                                              │
│             ┌──────────┐                                        │
│             │ Boss战斗 │───失败──▶ 继续 farming                  │
│             └────┬─────┘                                        │
│                  │                                              │
│                  └───胜利──▶ 解锁新区域                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 区域推进机制 (Zone Progression)

#### 区域基本规则

| 属性 | 数值/说明 |
|------|----------|
| 每个区域的怪物数量 | 10个普通怪物 + 1个Boss（第5区域起） |
| 怪物刷新时间 | 即时（0秒） |
| 区域难度增长 | 每区域怪物HP ×1.6 |
| 最大区域 | 无上限（理论上无限） |

#### 区域类型

```typescript
enum ZoneType {
    NORMAL = 'normal',      // 普通区域
    BOSS = 'boss',          // Boss区域（每5区域）
    TREASURE = 'treasure'   // 宝藏区域（随机出现，金币×10）
}
```

#### 区域推进条件

```
推进条件 = {
    普通区域: "击杀全部10个怪物",
    Boss区域: "在30秒内击败Boss",
    失败惩罚: "需要重新挑战该Boss"
}
```

### 1.3 Boss战设计

#### Boss触发机制

```
触发条件:
├── 每5个区域出现Boss（Zone 5, 10, 15, 20...）
├── 第10个怪物被替换为Boss
└── Boss拥有特殊外观和名称

Boss属性:
├── HP = 普通怪物HP × 10
├── 金币奖励 = 普通怪物 × 10
└── 时间限制 = 30秒
```

#### Boss难度曲线

```javascript
// Boss HP 计算公式
function calculateBossHP(zone) {
    const baseHP = 10;
    const hpMultiplier = 1.6;
    return baseHP * Math.pow(hpMultiplier, zone - 1) * 10; // ×10 for Boss
}

// Boss金币奖励
function calculateBossGold(zone) {
    const baseGold = 1;
    const goldMultiplier = 1.15;
    return baseGold * Math.pow(goldMultiplier, zone - 1) * 10;
}
```

---

## 2. 数值系统设计

### 2.1 怪物HP计算公式

#### 核心公式

```
怪物HP = 基础HP × (HP增长系数 ^ (区域 - 1))

参数:
- 基础HP (baseHP) = 10
- HP增长系数 (hpMultiplier) = 1.6
- 区域 (zone) = 当前所在区域编号
```

#### JavaScript实现

```typescript
class MonsterSystem {
    private readonly BASE_HP = 10;
    private readonly HP_MULTIPLIER = 1.6;
    
    /**
     * 计算指定区域的怪物HP
     * @param zone 区域编号（从1开始）
     * @param isBoss 是否为Boss
     * @returns 怪物HP
     */
    calculateMonsterHP(zone: number, isBoss: boolean = false): number {
        const zoneHP = this.BASE_HP * Math.pow(this.HP_MULTIPLIER, zone - 1);
        return isBoss ? zoneHP * 10 : zoneHP;
    }
    
    /**
     * 计算指定区域的怪物金币掉落
     * @param zone 区域编号
     * @param isBoss 是否为Boss
     * @param goldBonus 金币加成系数
     * @returns 金币数量
     */
    calculateGoldDrop(zone: number, isBoss: boolean = false, goldBonus: number = 1): number {
        const baseGold = 1;
        const goldMultiplier = 1.15;
        
        let gold = baseGold * Math.pow(goldMultiplier, zone - 1);
        
        if (isBoss) {
            gold *= 10;
        }
        
        // 应用金币加成
        gold *= goldBonus;
        
        // 添加随机波动 (±10%)
        const variance = 0.9 + Math.random() * 0.2;
        
        return Math.floor(gold * variance);
    }
}
```

#### HP增长曲线示例

| 区域 | 普通怪物HP | Boss HP |
|------|-----------|---------|
| 1 | 10 | 100 |
| 5 | 66 | 656 |
| 10 | 687 | 6,872 |
| 20 | 73,517 | 735,171 |
| 50 | 2.1×10¹¹ | 2.1×10¹² |
| 100 | 4.7×10²¹ | 4.7×10²² |
| 200 | 2.3×10⁴³ | 2.3×10⁴⁴ |

### 2.2 金币掉落公式

```
金币掉落 = 基础金币 × (金币增长系数 ^ (区域 - 1)) × Boss倍数 × 金币加成 × 随机波动

参数:
- 基础金币 (baseGold) = 1
- 金币增长系数 (goldMultiplier) = 1.15
- Boss倍数 = 10 (仅Boss有效)
- 金币加成 = 来自英雄、神器等的加成
- 随机波动 = 0.9 ~ 1.1 (±10%)
```

### 2.3 英雄伤害计算公式

#### 基础DPS公式

```
英雄DPS = 基础DPS × (1 + 等级 - 1) × 升级加成 × 全局DPS加成

简化:
英雄DPS = 基础DPS × 等级 × 升级加成 × 全局DPS加成
```

#### 英雄升级成本曲线

```
升级成本 = 基础成本 × (成本增长系数 ^ (当前等级 - 1))

参数:
- 基础成本 (baseCost) = 根据英雄不同
- 成本增长系数 (costMultiplier) = 1.07
```

#### 英雄数据表

| 英雄 | 基础DPS | 基础成本 | 解锁区域 | 特殊能力 |
|------|---------|---------|---------|---------|
| Cid | 0 (点击辅助) | 5 | 1 | 增加点击伤害 |
| Treebeast | 5 | 50 | 1 | 无 |
| Ivan | 22 | 250 | 1 | 无 |
| Brittany | 74 | 1,000 | 1 | 无 |
| The Wandering Fisherman | 245 | 4,000 | 1 | 无 |
| Betty Clicker | 976 | 20,000 | 1 | 增加所有英雄DPS +0.5% |
| The Masked Samurai | 3,725 | 100,000 | 1 | 无 |
| Leon | 10,859 | 400,000 | 1 | 无 |
| The Great Forest Seer | 47,143 | 2,500,000 | 1 | 无 |
| Alexa | 186,871 | 15,000,000 | 1 | 无 |
| Natalia | 782,871 | 100,000,000 | 1 | 无 |
| Mercedes | 3,721,871 | 800,000,000 | 1 | 无 |
| Bobby | 17,221,871 | 6,500,000,000 | 1 | 无 |
| Broyle Lindeoven | 52,521,871 | 50,000,000,000 | 1 | 无 |
| Sir George II | 460,771,871 | 450,000,000,000 | 1 | 无 |
| King Midas | 1,517,271,871 | 4,000,000,000,000 | 1 | 无 |
| Referi Jerator | 10,017,271,871 | 36,000,000,000,000 | 1 | 无 |
| Abaddon | 31,017,271,871 | 300,000,000,000,000 | 1 | 无 |
| Ma Zhu | 922,017,271,871 | 2,500,000,000,000,000 | 1 | 无 |
| Amenhotep | 1,857,017,271,871 | 20,000,000,000,000,000 | 1 | 无 |
| Beastlord | 9,357,017,271,871 | 200,000,000,000,000,000 | 1 | 无 |
| Athena | 108,357,017,271,871 | 1.5×10²¹ | 1 | 无 |
| Aphrodite | 917,357,017,271,871 | 1×10²² | 1 | 无 |
| Shinatobe | 1,801,357,017,271,871 | 8×10²² | 1 | 无 |
| Grant | 9,101,357,017,271,871 | 6×10²³ | 1 | 无 |
| Frostleaf | 7.469×10²² | 3.6×10²⁵ | 1 | 无 |
| Dread Knight | 1.469×10²⁵ | 1×10⁴⁰ | 1 | 无 |
| Atlas | 9.469×10²⁷ | 1×10⁵⁵ | 1 | 无 |
| Terra | 7.469×10³⁰ | 1×10⁷⁰ | 1 | 无 |
| Phthalo | 5.469×10³³ | 1×10⁸⁵ | 1 | 无 |
| Orntchya | 3.469×10³⁶ | 1×10¹⁰⁰ | 1 | 无 |
| Lilin | 1.469×10³⁹ | 1×10¹¹⁵ | 1 | 无 |
| Cadmia | 9.469×10⁴¹ | 1×10¹³⁰ | 1 | 无 |
| Alabaster | 7.469×10⁴⁴ | 1×10¹⁴⁵ | 1 | 无 |
| Astraea | 5.469×10⁴⁷ | 1×10¹⁶⁰ | 1 | 无 |

### 2.4 升级成本曲线

```typescript
class HeroSystem {
    private readonly COST_MULTIPLIER = 1.07;
    
    /**
     * 计算英雄升级成本
     * @param baseCost 英雄基础成本
     * @param currentLevel 当前等级
     * @param levelsToBuy 要购买的等级数
     * @returns 总成本
     */
    calculateUpgradeCost(
        baseCost: number, 
        currentLevel: number, 
        levelsToBuy: number = 1
    ): number {
        // 单个等级成本公式
        const singleLevelCost = (level: number): number => {
            return baseCost * Math.pow(this.COST_MULTIPLIER, level - 1);
        };
        
        // 计算多个等级的总成本
        let totalCost = 0;
        for (let i = 0; i < levelsToBuy; i++) {
            totalCost += singleLevelCost(currentLevel + i);
        }
        
        return Math.floor(totalCost);
    }
    
    /**
     * 计算可购买的最大等级数
     * @param baseCost 英雄基础成本
     * @param currentLevel 当前等级
     * @param availableGold 可用金币
     * @returns 可购买的等级数
     */
    calculateMaxLevels(
        baseCost: number,
        currentLevel: number,
        availableGold: number
    ): number {
        let levels = 0;
        let remainingGold = availableGold;
        let level = currentLevel;
        
        while (true) {
            const cost = baseCost * Math.pow(this.COST_MULTIPLIER, level - 1);
            if (remainingGold >= cost) {
                remainingGold -= cost;
                levels++;
                level++;
            } else {
                break;
            }
        }
        
        return levels;
    }
}
```

#### 升级成本示例 (Treebeast)

| 等级 | 升级成本 | 累计成本 | DPS |
|------|---------|---------|-----|
| 1 | 50 | 50 | 5 |
| 10 | 98 | 689 | 50 |
| 25 | 271 | 3,240 | 125 |
| 50 | 1,467 | 20,374 | 250 |
| 100 | 43,177 | 243,337 | 500 |
| 200 | 37,275,371 | 102,368,421 | 1,000 |

---

## 3. DPS和点击伤害系统

### 3.1 自动DPS计算

#### 总DPS公式

```
总DPS = Σ(每个英雄的DPS) × 全局DPS加成 × 技能加成 × 神器加成

其中:
- 单个英雄DPS = 基础DPS × 等级 × 升级加成
- 全局DPS加成 = 来自技能、神器、成就等的加成
```

#### TypeScript实现

```typescript
interface Hero {
    id: string;
    name: string;
    baseDPS: number;
    baseCost: number;
    level: number;
    upgrades: Upgrade[];
}

interface Upgrade {
    id: string;
    name: string;
    cost: number;
    effect: UpgradeEffect;
    purchased: boolean;
}

type UpgradeEffect = 
    | { type: 'multiply_dps'; multiplier: number }
    | { type: 'multiply_click'; multiplier: number }
    | { type: 'add_global_dps'; percent: number }
    | { type: 'add_gold'; percent: number };

class DPSSystem {
    private heroes: Map<string, Hero> = new Map();
    private globalDPSMultiplier: number = 1;
    private skillMultiplier: number = 1;
    private artifactMultiplier: number = 1;
    
    /**
     * 计算单个英雄的DPS
     */
    calculateHeroDPS(hero: Hero): number {
        let dps = hero.baseDPS * hero.level;
        
        // 应用英雄升级加成
        for (const upgrade of hero.upgrades) {
            if (upgrade.purchased && upgrade.effect.type === 'multiply_dps') {
                dps *= upgrade.effect.multiplier;
            }
        }
        
        return dps;
    }
    
    /**
     * 计算总DPS
     */
    calculateTotalDPS(): number {
        let totalDPS = 0;
        
        for (const hero of this.heroes.values()) {
            totalDPS += this.calculateHeroDPS(hero);
        }
        
        // 应用全局加成
        totalDPS *= this.globalDPSMultiplier;
        totalDPS *= this.skillMultiplier;
        totalDPS *= this.artifactMultiplier;
        
        return totalDPS;
    }
    
    /**
     * 获取每秒伤害（用于自动攻击）
     */
    getDamagePerSecond(): number {
        return this.calculateTotalDPS();
    }
    
    /**
     * 获取每秒伤害（考虑帧率）
     * @param deltaTime 帧间隔时间（秒）
     */
    getDamageForFrame(deltaTime: number): number {
        return this.calculateTotalDPS() * deltaTime;
    }
}
```

### 3.2 点击伤害系统

#### 点击伤害公式

```
点击伤害 = 基础点击伤害 + (总DPS × 点击伤害系数) + 英雄点击加成

参数:
- 基础点击伤害 (baseClickDamage) = 1
- 点击伤害系数 (clickDPSRatio) = 0.01 (默认1% DPS)
- 英雄点击加成 = 来自Cid等英雄的加成
```

#### 实现代码

```typescript
class ClickSystem {
    private baseClickDamage: number = 1;
    private clickDPSRatio: number = 0.01; // 1% of DPS
    private clickMultiplier: number = 1;
    private criticalChance: number = 0; // 0% base
    private criticalMultiplier: number = 2; // 2x damage
    
    constructor(private dpsSystem: DPSSystem) {}
    
    /**
     * 计算点击伤害
     */
    calculateClickDamage(): number {
        const totalDPS = this.dpsSystem.calculateTotalDPS();
        
        let damage = this.baseClickDamage;
        damage += totalDPS * this.clickDPSRatio;
        damage *= this.clickMultiplier;
        
        // 检查暴击
        if (Math.random() < this.criticalChance) {
            damage *= this.criticalMultiplier;
        }
        
        return Math.floor(damage);
    }
    
    /**
     * 执行点击
     * @returns 造成的伤害
     */
    click(): number {
        return this.calculateClickDamage();
    }
    
    /**
     * 设置点击伤害加成
     */
    setClickMultiplier(multiplier: number): void {
        this.clickMultiplier = multiplier;
    }
    
    /**
     * 设置暴击率
     */
    setCriticalChance(chance: number): void {
        this.criticalChance = Math.min(chance, 1); // Max 100%
    }
}
```

### 3.3 暴击系统（可选）

```typescript
interface CriticalSystem {
    // 基础暴击率
    baseChance: number;
    
    // 暴击伤害倍数
    damageMultiplier: number;
    
    // 计算是否暴击
    rollCritical(): boolean;
    
    // 获取暴击伤害
    getCriticalDamage(baseDamage: number): number;
}

class CriticalHitSystem implements CriticalSystem {
    baseChance: number = 0;
    damageMultiplier: number = 2;
    
    rollCritical(): boolean {
        return Math.random() < this.baseChance;
    }
    
    getCriticalDamage(baseDamage: number): number {
        return baseDamage * this.damageMultiplier;
    }
    
    // 增加暴击率
    addCriticalChance(amount: number): void {
        this.baseChance = Math.min(this.baseChance + amount, 1);
    }
}
```

---

## 4. 转生/升华系统

### 4.1 系统概述

转生（Ascension）是放置类游戏的核心机制，允许玩家重置进度以获得永久性加成。

```
转生机制:
├── 触发条件: 达到Zone 100+ 或击败Boss获得英雄灵魂
├── 获得资源: 英雄灵魂 (Hero Souls)
├── 灵魂用途: 购买远古神器 (Ancient)
└── 转世加成: 每个灵魂 +10% DPS
```

### 4.2 英雄灵魂获取公式

#### 基础公式

```
获得英雄灵魂 = ⌊(总英雄等级 / 2000) ^ 0.5⌋ + 区域奖励 + Boss奖励

详细计算:
1. 等级奖励 = floor(sqrt(totalHeroLevels / 2000))
2. 区域奖励 = floor(currentZone / 100 - 1) [首次达到]
3. Boss奖励 = 击败Zone 100+ 的Boss有几率掉落
```

#### TypeScript实现

```typescript
class AscensionSystem {
    private heroSouls: number = 0;
    private totalHeroSoulsEarned: number = 0;
    private ancients: Map<string, Ancient> = new Map();
    
    /**
     * 计算可获得的英雄灵魂数量
     * @param totalHeroLevels 所有英雄等级总和
     * @param currentZone 当前区域
     * @param primalsKilled 击败的原始Boss数量
     * @returns 可获得的英雄灵魂数
     */
    calculateHeroSouls(
        totalHeroLevels: number,
        currentZone: number,
        primalsKilled: number = 0
    ): number {
        // 等级奖励
        const levelReward = Math.floor(Math.sqrt(totalHeroLevels / 2000));
        
        // 区域奖励（首次达到每100区域）
        const zoneReward = Math.max(0, Math.floor(currentZone / 100) - 1);
        
        // Boss奖励（每个原始Boss给1个灵魂）
        const bossReward = primalsKilled;
        
        return levelReward + zoneReward + bossReward;
    }
    
    /**
     * 执行转生
     */
    ascend(
        totalHeroLevels: number,
        currentZone: number,
        primalsKilled: number
    ): AscensionResult {
        const soulsGained = this.calculateHeroSouls(
            totalHeroLevels, 
            currentZone, 
            primalsKilled
        );
        
        this.heroSouls += soulsGained;
        this.totalHeroSoulsEarned += soulsGained;
        
        return {
            soulsGained,
            totalSouls: this.heroSouls,
            dpsMultiplier: this.getDPSMultiplier()
        };
    }
    
    /**
     * 获取DPS加成倍数
     * 每个英雄灵魂提供 +10% DPS
     */
    getDPSMultiplier(): number {
        return 1 + (this.heroSouls * 0.1);
    }
    
    /**
     * 花费英雄灵魂购买远古
     */
    spendSouls(amount: number): boolean {
        if (this.heroSouls >= amount) {
            this.heroSouls -= amount;
            return true;
        }
        return false;
    }
}

interface AscensionResult {
    soulsGained: number;
    totalSouls: number;
    dpsMultiplier: number;
}

interface Ancient {
    id: string;
    name: string;
    level: number;
    baseCost: number;
    costMultiplier: number;
    effect: AncientEffect;
}

type AncientEffect =
    | { type: 'dps_per_soul'; value: number }
    | { type: 'gold_bonus'; percent: number }
    | { type: 'click_damage'; multiplier: number }
    | { type: 'critical_chance'; percent: number }
    | { type: 'boss_timer'; seconds: number }
    | { type: 'treasure_chance'; percent: number };
```

### 4.3 远古神器系统

#### 远古列表

| 远古 | 效果 | 基础成本 |
|------|------|---------|
| Solomon | +5% 英雄灵魂获取 | 1 |
| Libertas | +25% 离线金币 | 1 |
| Siyalatas | +25% 闲置DPS（不点击） | 1 |
| Khrysos | 开始游戏时获得金币 | 1 |
| Thusia | +100% 宝藏怪物HP | 1 |
| Mammon | +5% 金币获取 | 1 |
| Mimzee | +50% 宝箱金币 | 1 |
| Pluto | +30% 点击金币 | 1 |
| Dogcog | -2% 英雄成本 | 1 |
| Fortuna | +0.25% 10倍金币几率 | 1 |
| Atman | +1% 原始Boss几率 | 1 |
| Dora | +20% 宝箱几率 | 1 |
| Bhaal | +15% 暴击伤害 | 1 |
| Morgulis | +11% DPS（每级） | 1 |
| Chronos | +5秒 Boss时间 | 1 |
| Bubos | -1% Boss HP | 1 |
| Kumawakamaru | -1% 怪物数量 | 1 |
| Chawedo | +2秒 点击风暴 | 1 |
| Hecatoncheir | +2秒 超级点击 | 1 |
| Berserker | +2秒 力量涌动 | 1 |
| Sniperino | +2秒 幸运打击 | 1 |
| Kleptos | +2秒 黄金点击 | 1 |
| Energon | +2秒 金属探测 | 1 |
| Argaiv | +2% 远古效果 | 1 |
| Juggernaut | +0.01% DPS/点击连击 | 1 |
| Iris | 开始区域 +1 | 1 |
| Revolc | +1% 双红宝石几率 | 1 |

### 4.4 远古升级成本

```typescript
class AncientSystem {
    /**
     * 计算远古升级成本
     * @param ancient 远古对象
     * @returns 升级成本
     */
    calculateAncientUpgradeCost(ancient: Ancient): number {
        if (ancient.level === 0) {
            return ancient.baseCost;
        }
        return Math.floor(ancient.baseCost * Math.pow(ancient.costMultiplier, ancient.level));
    }
    
    /**
     * 获取远古效果值
     */
    getAncientEffect(ancient: Ancient): number {
        switch (ancient.effect.type) {
            case 'dps_per_soul':
                return ancient.effect.value * ancient.level;
            case 'gold_bonus':
                return ancient.effect.percent * ancient.level;
            case 'click_damage':
                return ancient.effect.multiplier * ancient.level;
            default:
                return 0;
        }
    }
}
```

---

## 5. 技能系统

### 5.1 技能概述

```
技能系统:
├── 7个主动技能
├── 技能通过升级特定英雄解锁
├── 技能有冷却时间和持续时间
└── 技能可以组合使用产生协同效果
```

### 5.2 技能列表

| 技能 | 解锁英雄 | 效果 | 持续时间 | 冷却时间 |
|------|---------|------|---------|---------|
| Clickstorm | Cid (Level 25) | 自动点击10次/秒 | 30s | 600s |
| Powersurge | Treebeast (Level 75) | +100% DPS | 30s | 600s |
| Lucky Strikes | Ivan (Level 100) | +50% 暴击率 | 30s | 900s |
| Metal Detector | Brittany (Level 100) | +100% 金币 | 30s | 900s |
| Golden Clicks | The Wandering Fisherman (Level 100) | 点击获得金币 | 30s | 900s |
| The Dark Ritual | Amenhotep (Level 75) | +5% DPS (永久) | 即时 | 3600s |
| Super Clicks | The Great Forest Seer (Level 100) | +200% 点击伤害 | 30s | 900s |
| Energize | Referi Jerator (Level 100) | 下一个技能效果×2 | 即时 | 3600s |
| Reload | Abaddon (Level 75) | 减少技能冷却 | 即时 | 3600s |

### 5.3 技能系统实现

```typescript
enum SkillType {
    CLICKSTORM = 'clickstorm',
    POWERSURGE = 'powersurge',
    LUCKY_STRIKES = 'lucky_strikes',
    METAL_DETECTOR = 'metal_detector',
    GOLDEN_CLICKS = 'golden_clicks',
    DARK_RITUAL = 'dark_ritual',
    SUPER_CLICKS = 'super_clicks',
    ENERGIZE = 'energize',
    RELOAD = 'reload'
}

interface Skill {
    type: SkillType;
    name: string;
    description: string;
    unlockHero: string;
    unlockLevel: number;
    duration: number; // 秒
    cooldown: number; // 秒
    isActive: boolean;
    remainingDuration: number;
    remainingCooldown: number;
    effect: SkillEffect;
}

type SkillEffect =
    | { type: 'auto_click'; clicksPerSecond: number }
    | { type: 'dps_multiplier'; multiplier: number }
    | { type: 'critical_chance'; chance: number }
    | { type: 'gold_multiplier'; multiplier: number }
    | { type: 'click_gold'; multiplier: number }
    | { type: 'permanent_dps'; percent: number }
    | { type: 'click_damage_multiplier'; multiplier: number }
    | { type: 'energize'; multiplier: number }
    | { type: 'reload'; cooldownReduction: number };

class SkillSystem {
    private skills: Map<SkillType, Skill> = new Map();
    private energized: boolean = false;
    private autoClickInterval: number | null = null;
    
    constructor(
        private gameState: GameState,
        private clickSystem: ClickSystem,
        private dpsSystem: DPSSystem
    ) {
        this.initializeSkills();
    }
    
    private initializeSkills(): void {
        this.skills.set(SkillType.CLICKSTORM, {
            type: SkillType.CLICKSTORM,
            name: 'Clickstorm',
            description: 'Automatically clicks 10 times per second',
            unlockHero: 'Cid',
            unlockLevel: 25,
            duration: 30,
            cooldown: 600,
            isActive: false,
            remainingDuration: 0,
            remainingCooldown: 0,
            effect: { type: 'auto_click', clicksPerSecond: 10 }
        });
        
        this.skills.set(SkillType.POWERSURGE, {
            type: SkillType.POWERSURGE,
            name: 'Powersurge',
            description: '+100% DPS',
            unlockHero: 'Treebeast',
            unlockLevel: 75,
            duration: 30,
            cooldown: 600,
            isActive: false,
            remainingDuration: 0,
            remainingCooldown: 0,
            effect: { type: 'dps_multiplier', multiplier: 2 }
        });
        
        this.skills.set(SkillType.LUCKY_STRIKES, {
            type: SkillType.LUCKY_STRIKES,
            name: 'Lucky Strikes',
            description: '+50% critical click chance',
            unlockHero: 'Ivan',
            unlockLevel: 100,
            duration: 30,
            cooldown: 900,
            isActive: false,
            remainingDuration: 0,
            remainingCooldown: 0,
            effect: { type: 'critical_chance', chance: 0.5 }
        });
        
        this.skills.set(SkillType.METAL_DETECTOR, {
            type: SkillType.METAL_DETECTOR,
            name: 'Metal Detector',
            description: '+100% gold from monsters',
            unlockHero: 'Brittany',
            unlockLevel: 100,
            duration: 30,
            cooldown: 900,
            isActive: false,
            remainingDuration: 0,
            remainingCooldown: 0,
            effect: { type: 'gold_multiplier', multiplier: 2 }
        });
        
        this.skills.set(SkillType.GOLDEN_CLICKS, {
            type: SkillType.GOLDEN_CLICKS,
            name: 'Golden Clicks',
            description: 'Gain gold per click',
            unlockHero: 'The Wandering Fisherman',
            unlockLevel: 100,
            duration: 30,
            cooldown: 900,
            isActive: false,
            remainingDuration: 0,
            remainingCooldown: 0,
            effect: { type: 'click_gold', multiplier: 1 }
        });
        
        this.skills.set(SkillType.DARK_RITUAL, {
            type: SkillType.DARK_RITUAL,
            name: 'The Dark Ritual',
            description: '+5% DPS (permanent)',
            unlockHero: 'Amenhotep',
            unlockLevel: 75,
            duration: 0,
            cooldown: 3600,
            isActive: false,
            remainingDuration: 0,
            remainingCooldown: 0,
            effect: { type: 'permanent_dps', percent: 0.05 }
        });
        
        this.skills.set(SkillType.SUPER_CLICKS, {
            type: SkillType.SUPER_CLICKS,
            name: 'Super Clicks',
            description: '+200% click damage',
            unlockHero: 'The Great Forest Seer',
            unlockLevel: 100,
            duration: 30,
            cooldown: 900,
            isActive: false,
            remainingDuration: 0,
            remainingCooldown: 0,
            effect: { type: 'click_damage_multiplier', multiplier: 3 }
        });
        
        this.skills.set(SkillType.ENERGIZE, {
            type: SkillType.ENERGIZE,
            name: 'Energize',
            description: 'Next skill effect ×2',
            unlockHero: 'Referi Jerator',
            unlockLevel: 100,
            duration: 0,
            cooldown: 3600,
            isActive: false,
            remainingDuration: 0,
            remainingCooldown: 0,
            effect: { type: 'energize', multiplier: 2 }
        });
        
        this.skills.set(SkillType.RELOAD, {
            type: SkillType.RELOAD,
            name: 'Reload',
            description: 'Reduce skill cooldowns',
            unlockHero: 'Abaddon',
            unlockLevel: 75,
            duration: 0,
            cooldown: 3600,
            isActive: false,
            remainingDuration: 0,
            remainingCooldown: 0,
            effect: { type: 'reload', cooldownReduction: 0.5 }
        });
    }
    
    /**
     * 激活技能
     */
    activateSkill(type: SkillType): boolean {
        const skill = this.skills.get(type);
        
        if (!skill) return false;
        if (skill.remainingCooldown > 0) return false;
        if (skill.isActive && skill.duration > 0) return false;
        
        // 处理Energize
        let effectMultiplier = 1;
        if (this.energized) {
            effectMultiplier = 2;
            this.energized = false;
        }
        
        // 应用技能效果
        this.applySkillEffect(skill, effectMultiplier);
        
        // 设置技能状态
        if (skill.duration > 0) {
            skill.isActive = true;
            skill.remainingDuration = skill.duration * effectMultiplier;
        }
        
        skill.remainingCooldown = skill.cooldown;
        
        return true;
    }
    
    /**
     * 应用技能效果
     */
    private applySkillEffect(skill: Skill, multiplier: number): void {
        switch (skill.effect.type) {
            case 'auto_click':
                this.startAutoClick(skill.effect.clicksPerSecond);
                break;
            case 'dps_multiplier':
                this.dpsSystem.setSkillMultiplier(skill.effect.multiplier * multiplier);
                break;
            case 'critical_chance':
                this.clickSystem.setCriticalChance(skill.effect.chance * multiplier);
                break;
            case 'gold_multiplier':
                this.gameState.setGoldMultiplier(skill.effect.multiplier * multiplier);
                break;
            case 'click_damage_multiplier':
                this.clickSystem.setClickMultiplier(skill.effect.multiplier * multiplier);
                break;
            case 'permanent_dps':
                this.gameState.addPermanentDPSBonus(skill.effect.percent);
                break;
            case 'energize':
                this.energized = true;
                break;
            case 'reload':
                this.reduceAllCooldowns(skill.effect.cooldownReduction * multiplier);
                break;
        }
    }
    
    /**
     * 开始自动点击
     */
    private startAutoClick(clicksPerSecond: number): void {
        const interval = 1000 / clicksPerSecond;
        this.autoClickInterval = window.setInterval(() => {
            this.clickSystem.click();
        }, interval);
    }
    
    /**
     * 停止自动点击
     */
    private stopAutoClick(): void {
        if (this.autoClickInterval) {
            clearInterval(this.autoClickInterval);
            this.autoClickInterval = null;
        }
    }
    
    /**
     * 减少所有技能冷却
     */
    private reduceAllCooldowns(reduction: number): void {
        for (const skill of this.skills.values()) {
            skill.remainingCooldown *= (1 - reduction);
        }
    }
    
    /**
     * 更新技能状态（每帧调用）
     */
    update(deltaTime: number): void {
        for (const skill of this.skills.values()) {
            // 更新持续时间
            if (skill.isActive && skill.remainingDuration > 0) {
                skill.remainingDuration -= deltaTime;
                
                if (skill.remainingDuration <= 0) {
                    skill.isActive = false;
                    skill.remainingDuration = 0;
                    this.deactivateSkill(skill);
                }
            }
            
            // 更新冷却时间
            if (skill.remainingCooldown > 0) {
                skill.remainingCooldown -= deltaTime;
                if (skill.remainingCooldown < 0) {
                    skill.remainingCooldown = 0;
                }
            }
        }
    }
    
    /**
     * 技能结束时重置效果
     */
    private deactivateSkill(skill: Skill): void {
        switch (skill.effect.type) {
            case 'auto_click':
                this.stopAutoClick();
                break;
            case 'dps_multiplier':
                this.dpsSystem.setSkillMultiplier(1);
                break;
            case 'critical_chance':
                this.clickSystem.setCriticalChance(0);
                break;
            case 'gold_multiplier':
                this.gameState.setGoldMultiplier(1);
                break;
            case 'click_damage_multiplier':
                this.clickSystem.setClickMultiplier(1);
                break;
        }
    }
    
    /**
     * 获取技能状态
     */
    getSkillStatus(type: SkillType): Skill | undefined {
        return this.skills.get(type);
    }
}

interface GameState {
    goldMultiplier: number;
    permanentDPSBonus: number;
    setGoldMultiplier(multiplier: number): void;
    addPermanentDPSBonus(percent: number): void;
}
```

### 5.4 技能组合策略

```
推荐技能组合:

1. 爆发DPS组合:
   Energize → Powersurge → Lucky Strikes → Super Clicks
   效果: 4倍DPS + 100%暴击率 + 6倍点击伤害

2. 金币 farming 组合:
   Energize → Metal Detector → Golden Clicks
   效果: 4倍金币 + 点击获得金币

3. 极限伤害组合:
   Energize → Reload → Dark Ritual
   (减少Dark Ritual冷却，更快获得永久DPS)
```

---

## 6. 代码实现示例

### 6.1 完整游戏状态管理

```typescript
// types.ts
export interface GameState {
    // 基础状态
    gold: BigNumber;
    totalGoldEarned: BigNumber;
    currentZone: number;
    highestZone: number;
    
    // 战斗状态
    currentMonsterHP: BigNumber;
    maxMonsterHP: BigNumber;
    monstersKilledInZone: number;
    
    // 英雄状态
    heroes: Map<string, HeroState>;
    totalHeroLevels: number;
    
    // 转生状态
    heroSouls: number;
    totalHeroSoulsEarned: number;
    ancients: Map<string, AncientState>;
    
    // 技能状态
    skills: Map<SkillType, SkillState>;
    
    // 统计
    totalClicks: number;
    totalMonstersKilled: number;
    totalBossesKilled: number;
    startTime: number;
}

export interface HeroState {
    id: string;
    level: number;
    upgradesPurchased: Set<string>;
}

export interface AncientState {
    id: string;
    level: number;
}

export interface SkillState {
    type: SkillType;
    unlocked: boolean;
    isActive: boolean;
    remainingDuration: number;
    remainingCooldown: number;
}

// BigNumber类用于处理大数运算
export class BigNumber {
    private mantissa: number;
    private exponent: number;
    
    constructor(value: number | string | BigNumber) {
        if (value instanceof BigNumber) {
            this.mantissa = value.mantissa;
            this.exponent = value.exponent;
        } else if (typeof value === 'string') {
            this.fromString(value);
        } else {
            this.fromNumber(value);
        }
    }
    
    private fromNumber(num: number): void {
        if (num === 0) {
            this.mantissa = 0;
            this.exponent = 0;
            return;
        }
        
        const exp = Math.floor(Math.log10(Math.abs(num)));
        this.mantissa = num / Math.pow(10, exp);
        this.exponent = exp;
        this.normalize();
    }
    
    private fromString(str: string): void {
        const parts = str.split('e');
        if (parts.length === 2) {
            this.mantissa = parseFloat(parts[0]);
            this.exponent = parseInt(parts[1]);
        } else {
            this.fromNumber(parseFloat(str));
        }
        this.normalize();
    }
    
    private normalize(): void {
        if (this.mantissa >= 10) {
            const exp = Math.floor(Math.log10(this.mantissa));
            this.mantissa /= Math.pow(10, exp);
            this.exponent += exp;
        } else if (this.mantissa > 0 && this.mantissa < 1) {
            const exp = Math.floor(Math.log10(this.mantissa));
            this.mantissa /= Math.pow(10, exp);
            this.exponent += exp;
        }
    }
    
    add(other: BigNumber): BigNumber {
        const maxExp = Math.max(this.exponent, other.exponent);
        const m1 = this.mantissa * Math.pow(10, this.exponent - maxExp);
        const m2 = other.mantissa * Math.pow(10, other.exponent - maxExp);
        return new BigNumber((m1 + m2) * Math.pow(10, maxExp));
    }
    
    multiply(other: BigNumber): BigNumber {
        return new BigNumber({
            mantissa: this.mantissa * other.mantissa,
            exponent: this.exponent + other.exponent
        } as BigNumber);
    }
    
    divide(other: BigNumber): BigNumber {
        return new BigNumber({
            mantissa: this.mantissa / other.mantissa,
            exponent: this.exponent - other.exponent
        } as BigNumber);
    }
    
    pow(n: number): BigNumber {
        return new BigNumber({
            mantissa: Math.pow(this.mantissa, n),
            exponent: this.exponent * n
        } as BigNumber);
    }
    
    toString(): string {
        if (this.exponent < 6) {
            return (this.mantissa * Math.pow(10, this.exponent)).toFixed(2);
        }
        return `${this.mantissa.toFixed(2)}e${this.exponent}`;
    }
    
    toNumber(): number {
        return this.mantissa * Math.pow(10, this.exponent);
    }
    
    greaterThan(other: BigNumber): boolean {
        if (this.exponent !== other.exponent) {
            return this.exponent > other.exponent;
        }
        return this.mantissa > other.mantissa;
    }
    
    lessThanOrEqual(other: BigNumber): boolean {
        return !this.greaterThan(other);
    }
}
```

### 6.2 主游戏循环

```typescript
// game.ts
export class ClickerHeroesGame {
    private state: GameState;
    private monsterSystem: MonsterSystem;
    private heroSystem: HeroSystem;
    private dpsSystem: DPSSystem;
    private clickSystem: ClickSystem;
    private skillSystem: SkillSystem;
    private ascensionSystem: AscensionSystem;
    
    private lastUpdateTime: number = 0;
    private isRunning: boolean = false;
    
    constructor() {
        this.initializeState();
        this.initializeSystems();
    }
    
    private initializeState(): void {
        this.state = {
            gold: new BigNumber(0),
            totalGoldEarned: new BigNumber(0),
            currentZone: 1,
            highestZone: 1,
            currentMonsterHP: new BigNumber(10),
            maxMonsterHP: new BigNumber(10),
            monstersKilledInZone: 0,
            heroes: new Map(),
            totalHeroLevels: 0,
            heroSouls: 0,
            totalHeroSoulsEarned: 0,
            ancients: new Map(),
            skills: new Map(),
            totalClicks: 0,
            totalMonstersKilled: 0,
            totalBossesKilled: 0,
            startTime: Date.now()
        };
    }
    
    private initializeSystems(): void {
        this.monsterSystem = new MonsterSystem();
        this.heroSystem = new HeroSystem();
        this.dpsSystem = new DPSSystem();
        this.clickSystem = new ClickSystem(this.dpsSystem);
        this.skillSystem = new SkillSystem(
            this.getGameStateInterface(),
            this.clickSystem,
            this.dpsSystem
        );
        this.ascensionSystem = new AscensionSystem();
    }
    
    private getGameStateInterface(): GameState {
        return this.state;
    }
    
    /**
     * 开始游戏循环
     */
    start(): void {
        this.isRunning = true;
        this.lastUpdateTime = performance.now();
        this.gameLoop();
    }
    
    /**
     * 停止游戏循环
     */
    stop(): void {
        this.isRunning = false;
    }
    
    /**
     * 游戏主循环
     */
    private gameLoop = (): void => {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // 转换为秒
        this.lastUpdateTime = currentTime;
        
        this.update(deltaTime);
        
        requestAnimationFrame(this.gameLoop);
    };
    
    /**
     * 更新游戏状态
     */
    private update(deltaTime: number): void {
        // 应用DPS伤害
        this.applyDPSDamage(deltaTime);
        
        // 更新技能
        this.skillSystem.update(deltaTime);
        
        // 检查怪物死亡
        if (this.state.currentMonsterHP.lessThanOrEqual(new BigNumber(0))) {
            this.onMonsterDeath();
        }
    }
    
    /**
     * 应用DPS伤害
     */
    private applyDPSDamage(deltaTime: number): void {
        const dps = this.dpsSystem.calculateTotalDPS();
        const damage = dps * deltaTime;
        
        if (damage > 0) {
            this.state.currentMonsterHP = this.state.currentMonsterHP.subtract(
                new BigNumber(damage)
            );
        }
    }
    
    /**
     * 处理点击
     */
    click(): void {
        this.state.totalClicks++;
        
        const damage = this.clickSystem.calculateClickDamage();
        this.state.currentMonsterHP = this.state.currentMonsterHP.subtract(
            new BigNumber(damage)
        );
        
        // 检查怪物死亡
        if (this.state.currentMonsterHP.lessThanOrEqual(new BigNumber(0))) {
            this.onMonsterDeath();
        }
    }
    
    /**
     * 怪物死亡处理
     */
    private onMonsterDeath(): void {
        const isBoss = this.isBossZone() && 
                       this.state.monstersKilledInZone === 9;
        
        // 获得金币
        const goldDrop = this.monsterSystem.calculateGoldDrop(
            this.state.currentZone,
            isBoss,
            this.getGoldBonus()
        );
        
        this.state.gold = this.state.gold.add(new BigNumber(goldDrop));
        this.state.totalGoldEarned = this.state.totalGoldEarned.add(
            new BigNumber(goldDrop)
        );
        
        // 更新统计
        this.state.totalMonstersKilled++;
        this.state.monstersKilledInZone++;
        
        if (isBoss) {
            this.state.totalBossesKilled++;
        }
        
        // 检查区域完成
        if (this.state.monstersKilledInZone >= 10) {
            this.advanceZone();
        } else {
            this.spawnMonster();
        }
    }
    
    /**
     * 推进到下一区域
     */
    private advanceZone(): void {
        this.state.currentZone++;
        
        if (this.state.currentZone > this.state.highestZone) {
            this.state.highestZone = this.state.currentZone;
        }
        
        this.state.monstersKilledInZone = 0;
        this.spawnMonster();
    }
    
    /**
     * 生成新怪物
     */
    private spawnMonster(): void {
        const isBoss = this.isBossZone() && 
                       this.state.monstersKilledInZone === 9;
        
        const hp = this.monsterSystem.calculateMonsterHP(
            this.state.currentZone,
            isBoss
        );
        
        this.state.maxMonsterHP = new BigNumber(hp);
        this.state.currentMonsterHP = new BigNumber(hp);
    }
    
    /**
     * 检查是否为Boss区域
     */
    private isBossZone(): boolean {
        return this.state.currentZone % 5 === 0 && 
               this.state.currentZone >= 5;
    }
    
    /**
     * 获取金币加成
     */
    private getGoldBonus(): number {
        let bonus = 1;
        
        // 应用远古加成
        // TODO: 实现远古金币加成
        
        // 应用技能加成
        // TODO: 实现技能金币加成
        
        return bonus;
    }
    
    /**
     * 购买英雄等级
     */
    buyHeroLevels(heroId: string, levels: number): boolean {
        const hero = this.heroSystem.getHero(heroId);
        const currentLevel = this.state.heroes.get(heroId)?.level || 0;
        
        const cost = this.heroSystem.calculateUpgradeCost(
            hero.baseCost,
            currentLevel,
            levels
        );
        
        if (this.state.gold.greaterThan(new BigNumber(cost))) {
            this.state.gold = this.state.gold.subtract(new BigNumber(cost));
            
            const heroState = this.state.heroes.get(heroId) || {
                id: heroId,
                level: 0,
                upgradesPurchased: new Set()
            };
            
            heroState.level += levels;
            this.state.heroes.set(heroId, heroState);
            
            this.state.totalHeroLevels += levels;
            
            // 更新DPS系统
            this.dpsSystem.updateHero(heroId, heroState.level);
            
            return true;
        }
        
        return false;
    }
    
    /**
     * 购买英雄升级
     */
    buyHeroUpgrade(heroId: string, upgradeId: string): boolean {
        const hero = this.heroSystem.getHero(heroId);
        const upgrade = hero.upgrades.find(u => u.id === upgradeId);
        
        if (!upgrade) return false;
        
        const heroState = this.state.heroes.get(heroId);
        if (!heroState || heroState.level < upgrade.requiredLevel) {
            return false;
        }
        
        if (heroState.upgradesPurchased.has(upgradeId)) {
            return false;
        }
        
        if (this.state.gold.greaterThan(new BigNumber(upgrade.cost))) {
            this.state.gold = this.state.gold.subtract(
                new BigNumber(upgrade.cost)
            );
            
            heroState.upgradesPurchased.add(upgradeId);
            
            // 应用升级效果
            this.applyUpgradeEffect(upgrade.effect);
            
            return true;
        }
        
        return false;
    }
    
    /**
     * 应用升级效果
     */
    private applyUpgradeEffect(effect: UpgradeEffect): void {
        // TODO: 实现升级效果应用
    }
    
    /**
     * 执行转生
     */
    ascend(): AscensionResult {
        const result = this.ascensionSystem.ascend(
            this.state.totalHeroLevels,
            this.state.currentZone,
            0 // primalsKilled
        );
        
        // 重置游戏状态
        this.resetGame();
        
        return result;
    }
    
    /**
     * 重置游戏（转生后）
     */
    private resetGame(): void {
        this.state.gold = new BigNumber(0);
        this.state.currentZone = 1;
        this.state.monstersKilledInZone = 0;
        this.state.heroes.clear();
        this.state.totalHeroLevels = 0;
        
        this.spawnMonster();
    }
    
    /**
     * 获取游戏状态（用于UI显示）
     */
    getState(): GameState {
        return { ...this.state };
    }
}
```

### 6.3 配置常量

```typescript
// config.ts
export const GAME_CONFIG = {
    // 怪物系统
    MONSTER: {
        BASE_HP: 10,
        HP_MULTIPLIER: 1.6,
        BASE_GOLD: 1,
        GOLD_MULTIPLIER: 1.15,
        MONSTERS_PER_ZONE: 10,
        BOSS_ZONE_INTERVAL: 5,
        BOSS_HP_MULTIPLIER: 10,
        BOSS_GOLD_MULTIPLIER: 10,
        BOSS_TIME_LIMIT: 30, // 秒
    },
    
    // 英雄系统
    HERO: {
        COST_MULTIPLIER: 1.07,
        DPS_MULTIPLIER_PER_25_LEVELS: 4,
    },
    
    // 点击系统
    CLICK: {
        BASE_DAMAGE: 1,
        DPS_RATIO: 0.01, // 1% of DPS
    },
    
    // 转生系统
    ASCENSION: {
        MIN_ZONE: 100,
        SOULS_PER_2000_LEVELS: 1, // sqrt(totalLevels / 2000)
        SOULS_ZONE_BONUS: 1, // per 100 zones
        DPS_PER_SOUL: 0.10, // 10%
    },
    
    // 技能系统
    SKILL: {
        CLICKSTORM_CLICKS_PER_SECOND: 10,
        POWERSURGE_MULTIPLIER: 2,
        LUCKY_STRIKES_CHANCE: 0.5,
        METAL_DETECTOR_MULTIPLIER: 2,
        SUPER_CLICKS_MULTIPLIER: 3,
        DARK_RITUAL_BONUS: 0.05,
    },
    
    // 离线进度
    OFFLINE: {
        MAX_OFFLINE_TIME: 86400, // 24小时（秒）
        OFFLINE_DPS_PERCENTAGE: 0.5, // 50% DPS
    },
};

// 英雄数据
export const HERO_DATA: HeroData[] = [
    {
        id: 'cid',
        name: 'Cid, the Helpful Adventurer',
        baseDPS: 0,
        baseCost: 5,
        description: 'Increases click damage',
        upgrades: [
            { id: 'cid_1', name: 'Big Clicks', cost: 100, requiredLevel: 10, effect: { type: 'click_damage', value: 2 } },
            { id: 'cid_2', name: 'Huge Clicks', cost: 500, requiredLevel: 25, effect: { type: 'click_damage', value: 2 } },
        ]
    },
    {
        id: 'treebeast',
        name: 'Treebeast',
        baseDPS: 5,
        baseCost: 50,
        description: 'A fierce forest creature',
        upgrades: [
            { id: 'treebeast_1', name: 'Sharp Teeth', cost: 500, requiredLevel: 10, effect: { type: 'multiply_dps', multiplier: 2 } },
            { id: 'treebeast_2', name: 'Powersurge', cost: 1250, requiredLevel: 25, effect: { type: 'unlock_skill', skill: 'powersurge' } },
        ]
    },
    // ... 更多英雄
];
```

---

## 7. 数值平衡建议

### 7.1 进度节奏设计

| 阶段 | 区域范围 | 主要活动 | 预计时间 |
|------|---------|---------|---------|
| 初期 | 1-50 | 解锁英雄，熟悉机制 | 30分钟 |
| 早期 | 50-140 | 购买高级英雄，解锁技能 | 2-4小时 |
| 中期 | 140-300 | 第一次转生，购买远古 | 1-2天 |
| 后期 | 300-1000 | 优化远古配置，farm灵魂 | 1-2周 |
| 末期 | 1000+ | 深度优化，追求极限 | 持续 |

### 7.2 关键数值检查点

```
检查点1: Zone 50
- 应该能够轻松击败Boss
- 拥有至少5个英雄
- 总DPS > 1000

检查点2: Zone 100
- 准备第一次转生
- 英雄总等级 > 2000
- 可以获得至少1个英雄灵魂

检查点3: Zone 140
- 解锁所有技能
- 拥有Siyalatas或Libertas远古
- DPS加成 > 2x

检查点4: Zone 300
- 拥有多个远古
- 每次转生获得100+灵魂
- 能够到达Zone 300 in < 1小时
```

### 7.3 平衡调整公式

```typescript
class BalanceSystem {
    /**
     * 计算最优区域推进速度
     * 目标: 每秒推进0.1-0.5个区域
     */
    calculateZoneProgressionRate(dps: number, zone: number): number {
        const monsterHP = 10 * Math.pow(1.6, zone - 1);
        const timeToKill = monsterHP / dps;
        const monstersPerZone = 10;
        const timePerZone = timeToKill * monstersPerZone;
        
        return 1 / timePerZone; // 区域/秒
    }
    
    /**
     * 检查平衡性
     */
    checkBalance(dps: number, zone: number): BalanceStatus {
        const rate = this.calculateZoneProgressionRate(dps, zone);
        
        if (rate < 0.05) {
            return { status: 'too_slow', message: '进度太慢，需要提升DPS' };
        } else if (rate > 1) {
            return { status: 'too_fast', message: '进度太快，需要增加难度' };
        } else {
            return { status: 'balanced', message: '进度平衡' };
        }
    }
}

interface BalanceStatus {
    status: 'too_slow' | 'balanced' | 'too_fast';
    message: string;
}
```

---

## 8. 总结

本文档详细描述了《点击英雄》游戏的核心机制设计，包括：

1. **核心游戏循环**: 点击攻击 → 获得金币 → 升级英雄 → 推进区域 → 挑战Boss
2. **数值系统**: 指数增长的HP和金币曲线，确保长期游戏性
3. **DPS和点击系统**: 自动DPS和手动点击的平衡设计
4. **转生系统**: 通过英雄灵魂获得永久加成，提供长期目标
5. **技能系统**: 9个主动技能提供策略深度

### 关键设计原则

1. **指数增长**: 所有数值采用指数增长，确保游戏可以无限进行
2. **大数处理**: 使用科学计数法处理超大数值
3. **离线进度**: 支持离线收益，符合放置游戏特性
4. **转生循环**: 核心进度循环，提供重置和成长的快感
5. **策略深度**: 通过远古和技能系统提供策略选择

### 技术要点

1. 使用BigNumber类处理大数运算
2. 基于时间的游戏循环（deltaTime）
3. 模块化的系统设计（SRP原则）
4. 可配置的游戏参数
5. 完整的类型定义（TypeScript）

---

*文档版本: 1.0*
*最后更新: 2024年*
