# 《点击英雄》(Clicker Heroes) 技术架构方案

## 目录
1. [技术栈选择](#1-技术栈选择)
2. [核心架构设计](#2-核心架构设计)
3. [游戏循环设计](#3-游戏循环设计)
4. [数据持久化](#4-数据持久化)
5. [性能优化](#5-性能优化)
6. [事件系统](#6-事件系统)

---

## 1. 技术栈选择

### 1.1 渲染方案对比：Canvas vs DOM

| 特性 | Canvas | DOM |
|------|--------|-----|
| 性能 | 高（直接GPU渲染） | 中等（DOM操作开销） |
| 动画效果 | 灵活，适合粒子效果 | CSS动画，简单高效 |
| 交互事件 | 需手动计算坐标 | 原生支持 |
| 开发复杂度 | 较高 | 较低 |
| 可访问性 | 差 | 好 |

### 1.2 推荐方案：混合渲染

```
┌─────────────────────────────────────────────────────────┐
│                    游戏界面层                            │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   DOM层     │  │  Canvas层   │  │   CSS动画层     │ │
│  │ - UI面板    │  │ - 怪物渲染  │  │ - 按钮效果      │ │
│  │ - 按钮      │  │ - 伤害数字  │  │ - 过渡动画      │ │
│  │ - 文字信息  │  │ - 粒子效果  │  │ - 浮动提示      │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**决策理由：**
- **DOM**：用于静态UI、按钮、面板（利用CSS布局和事件）
- **Canvas**：用于怪物渲染、伤害数字飘字、粒子特效
- **CSS动画**：用于按钮点击反馈、过渡效果

### 1.3 状态管理方案

采用 **中心化状态管理 + 观察者模式**：

```javascript
// 状态管理架构
┌─────────────────┐
│   GameState     │  ← 单一数据源
│  (Observable)   │
└────────┬────────┘
         │ notify()
    ┌────┴────┬────────┬────────┐
    ▼         ▼        ▼        ▼
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
│  UI   │ │Canvas │ │Audio  │ │Save   │
│Module │ │Module │ │Module │ │Module │
└───────┘ └───────┘ └───────┘ └───────┘
```

---

## 2. 核心架构设计

### 2.1 项目文件结构

```
clicker-heroes/
├── index.html
├── css/
│   ├── main.css          # 主样式
│   ├── ui-components.css # UI组件样式
│   └── animations.css    # 动画定义
├── js/
│   ├── core/
│   │   ├── Game.js           # 游戏主控制器
│   │   ├── GameState.js      # 状态管理
│   │   ├── GameLoop.js       # 游戏循环
│   │   └── EventBus.js       # 事件总线
│   ├── entities/
│   │   ├── Player.js         # 玩家数据
│   │   ├── Monster.js        # 怪物系统
│   │   ├── Hero.js           # 英雄系统
│   │   └── Zone.js           # 区域/关卡
│   ├── systems/
│   │   ├── CombatSystem.js   # 战斗系统
│   │   ├── ProgressSystem.js # 进度系统
│   │   ├── UpgradeSystem.js  # 升级系统
│   │   └── AchievementSystem.js # 成就系统
│   ├── rendering/
│   │   ├── CanvasRenderer.js # Canvas渲染器
│   │   ├── DamageNumber.js   # 伤害数字
│   │   ├── ParticleSystem.js # 粒子系统
│   │   └── MonsterRenderer.js # 怪物渲染
│   ├── utils/
│   │   ├── SaveManager.js    # 存档管理
│   │   ├── NumberFormatter.js # 大数字格式化
│   │   ├── IdGenerator.js    # ID生成器
│   │   └── OfflineCalculator.js # 离线计算
│   ├── data/
│   │   ├── heroes.js         # 英雄配置
│   │   ├── monsters.js       # 怪物配置
│   │   ├── upgrades.js       # 升级配置
│   │   └── zones.js          # 区域配置
│   └── main.js               # 入口文件
└── assets/
    ├── images/               # 图片资源
    ├── audio/                # 音频资源
    └── fonts/                # 字体资源
```

### 2.2 核心类设计

#### 2.2.1 Game 类 - 游戏主控制器

```javascript
/**
 * Game - 游戏主控制器
 * 职责：初始化、协调各系统、管理游戏生命周期
 */
class Game {
    constructor() {
        // 核心系统
        this.state = new GameState();
        this.loop = new GameLoop(this);
        this.eventBus = new EventBus();
        
        // 游戏系统
        this.systems = {
            combat: new CombatSystem(this),
            progress: new ProgressSystem(this),
            upgrade: new UpgradeSystem(this),
            achievement: new AchievementSystem(this)
        };
        
        // 渲染系统
        this.renderer = new CanvasRenderer('game-canvas');
        this.particleSystem = new ParticleSystem();
        this.damageNumbers = new DamageNumberManager();
        
        // 数据管理
        this.saveManager = new SaveManager();
        
        // 游戏实体
        this.player = null;
        this.currentZone = null;
        this.currentMonster = null;
        
        this.isRunning = false;
        this.lastSaveTime = 0;
    }

    /**
     * 初始化游戏
     */
    async init() {
        // 加载存档或创建新游戏
        const saveData = await this.saveManager.load();
        
        if (saveData) {
            this.loadGame(saveData);
        } else {
            this.newGame();
        }
        
        // 初始化渲染
        this.renderer.init();
        
        // 绑定事件
        this.bindEvents();
        
        // 启动游戏循环
        this.start();
        
        console.log('Game initialized successfully');
    }

    /**
     * 创建新游戏
     */
    newGame() {
        this.player = new Player();
        this.currentZone = new Zone(1);
        this.currentMonster = this.currentZone.spawnMonster();
        
        this.state.set('gameStartTime', Date.now());
        this.state.set('totalClicks', 0);
    }

    /**
     * 加载游戏
     */
    loadGame(saveData) {
        this.player = Player.deserialize(saveData.player);
        this.currentZone = Zone.deserialize(saveData.currentZone);
        this.currentMonster = Monster.deserialize(saveData.currentMonster);
        
        // 计算离线进度
        if (saveData.lastSaveTime) {
            const offlineTime = Date.now() - saveData.lastSaveTime;
            this.calculateOfflineProgress(offlineTime);
        }
    }

    /**
     * 计算离线进度
     */
    calculateOfflineProgress(offlineTime) {
        const calculator = new OfflineCalculator(this);
        const result = calculator.calculate(offlineTime);
        
        // 应用离线收益
        this.player.gold = this.player.gold.add(result.goldEarned);
        this.player.totalKills += result.monstersKilled;
        
        // 触发离线收益事件
        this.eventBus.emit('offlineProgress', result);
    }

    /**
     * 启动游戏
     */
    start() {
        this.isRunning = true;
        this.loop.start();
        this.autoSave();
    }

    /**
     * 暂停游戏
     */
    pause() {
        this.isRunning = false;
        this.loop.stop();
    }

    /**
     * 自动保存
     */
    autoSave() {
        setInterval(() => {
            this.saveManager.save(this.serialize());
        }, 30000); // 30秒自动保存
    }

    /**
     * 序列化游戏状态
     */
    serialize() {
        return {
            player: this.player.serialize(),
            currentZone: this.currentZone.serialize(),
            currentMonster: this.currentMonster.serialize(),
            lastSaveTime: Date.now(),
            gameVersion: '1.0.0'
        };
    }

    /**
     * 处理点击怪物
     */
    clickMonster(x, y) {
        if (!this.currentMonster || this.currentMonster.isDead) return;
        
        const damage = this.player.getClickDamage();
        this.systems.combat.dealDamage(this.currentMonster, damage, 'click', x, y);
        
        this.state.increment('totalClicks');
        this.eventBus.emit('monsterClicked', { damage, position: { x, y } });
    }

    /**
     * 绑定全局事件
     */
    bindEvents() {
        // 怪物死亡事件
        this.eventBus.on('monsterDied', (data) => {
            this.onMonsterKilled(data.monster);
        });
        
        // 区域完成事件
        this.eventBus.on('zoneCompleted', () => {
            this.advanceZone();
        });
    }

    /**
     * 怪物被击杀处理
     */
    onMonsterKilled(monster) {
        // 发放奖励
        const goldReward = monster.getGoldReward();
        this.player.gold = this.player.gold.add(goldReward);
        this.player.totalKills++;
        
        // 生成新怪物
        this.currentMonster = this.currentZone.spawnMonster();
        
        // 检查区域是否完成
        if (this.currentZone.isCompleted()) {
            this.eventBus.emit('zoneCompleted');
        }
    }

    /**
     * 进入下一区域
     */
    advanceZone() {
        const nextZoneNumber = this.currentZone.number + 1;
        this.currentZone = new Zone(nextZoneNumber);
        this.currentMonster = this.currentZone.spawnMonster();
        this.player.highestZone = Math.max(this.player.highestZone, nextZoneNumber);
    }
}
```

#### 2.2.2 GameState 类 - 状态管理

```javascript
/**
 * GameState - 游戏状态管理器
 * 使用观察者模式实现响应式状态
 */
class GameState {
    constructor() {
        this.data = new Map();
        this.listeners = new Map();
        this.computedCache = new Map();
    }

    /**
     * 设置状态值
     */
    set(key, value) {
        const oldValue = this.data.get(key);
        this.data.set(key, value);
        
        // 通知监听器
        this.notify(key, value, oldValue);
    }

    /**
     * 获取状态值
     */
    get(key, defaultValue = null) {
        return this.data.has(key) ? this.data.get(key) : defaultValue;
    }

    /**
     * 递增数值
     */
    increment(key, amount = 1) {
        const current = this.get(key, 0);
        this.set(key, current + amount);
    }

    /**
     * 订阅状态变化
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);
        
        // 返回取消订阅函数
        return () => {
            this.listeners.get(key).delete(callback);
        };
    }

    /**
     * 通知监听器
     */
    notify(key, newValue, oldValue) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => {
                callback(newValue, oldValue, key);
            });
        }
    }

    /**
     * 批量更新（减少通知次数）
     */
    batchUpdate(updates) {
        const changed = [];
        
        for (const [key, value] of Object.entries(updates)) {
            const oldValue = this.data.get(key);
            this.data.set(key, value);
            changed.push({ key, value, oldValue });
        }
        
        // 批量通知
        changed.forEach(({ key, value, oldValue }) => {
            this.notify(key, value, oldValue);
        });
    }

    /**
     * 创建计算属性
     */
    computed(dependencies, computeFn) {
        const cacheKey = dependencies.join(',');
        
        // 监听依赖变化
        dependencies.forEach(dep => {
            this.subscribe(dep, () => {
                this.computedCache.delete(cacheKey);
            });
        });
        
        return () => {
            if (!this.computedCache.has(cacheKey)) {
                const values = dependencies.map(dep => this.get(dep));
                this.computedCache.set(cacheKey, computeFn(...values));
            }
            return this.computedCache.get(cacheKey);
        };
    }
}
```

#### 2.2.3 Player 类 - 玩家数据

```javascript
/**
 * Player - 玩家数据类
 * 管理所有玩家相关的数据和计算
 */
class Player {
    constructor() {
        // 基础资源
        this.gold = new BigNumber(0);
        this.rubies = 0;
        this.souls = new BigNumber(0); // 转生后的魂
        
        // 统计
        this.totalClicks = 0;
        this.totalKills = 0;
        this.totalGold = new BigNumber(0);
        this.highestZone = 1;
        this.totalPlayTime = 0; // 秒
        
        // 点击伤害
        this.baseClickDamage = new BigNumber(1);
        this.clickDamageMultiplier = 1;
        
        // 英雄列表
        this.heroes = new Map();
        
        // 解锁的英雄
        this.unlockedHeroes = new Set();
        
        // 升级
        this.upgrades = new Set();
        
        // 技能
        this.skills = {
            clickStorm: { unlocked: false, level: 0 },
            powersurge: { unlocked: false, level: 0 },
            luckyStrikes: { unlocked: false, level: 0 },
            metalDetector: { unlocked: false, level: 0 },
            goldenClicks: { unlocked: false, level: 0 },
            theDarkRitual: { unlocked: false, level: 0 },
            superClicks: { unlocked: false, level: 0 },
            energize: { unlocked: false, level: 0 },
            reload: { unlocked: false, level: 0 }
        };
        
        // 激活的技能效果
        this.activeEffects = new Map();
        
        // 古物（转生后获得）
        this.ancients = new Map();
        
        // 初始化基础英雄
        this.initHeroes();
    }

    /**
     * 初始化英雄
     */
    initHeroes() {
        const heroData = HeroData.getAll();
        heroData.forEach(data => {
            this.heroes.set(data.id, new Hero(data));
        });
    }

    /**
     * 获取点击伤害
     */
    getClickDamage() {
        let damage = this.baseClickDamage;
        
        // 应用所有加成
        damage = damage.mul(this.clickDamageMultiplier);
        
        // 技能加成
        if (this.activeEffects.has('powersurge')) {
            damage = damage.mul(2);
        }
        
        // 古物加成
        this.ancients.forEach((level, ancientId) => {
            const ancient = AncientData.get(ancientId);
            if (ancient && ancient.effectType === 'clickDamage') {
                damage = damage.mul(1 + ancient.effectValue * level);
            }
        });
        
        return damage;
    }

    /**
     * 获取DPS（每秒伤害）
     */
    getDPS() {
        let dps = new BigNumber(0);
        
        // 计算所有英雄的DPS
        this.heroes.forEach(hero => {
            if (hero.level > 0) {
                dps = dps.add(hero.getDPS());
            }
        });
        
        // 应用全局加成
        // ...
        
        return dps;
    }

    /**
     * 获取每秒金币收益（估算）
     */
    getEstimatedGPS(monsterHP, monsterGold) {
        const dps = this.getDPS();
        const timeToKill = monsterHP.div(dps).toNumber();
        return monsterGold.div(Math.max(timeToKill, 0.1));
    }

    /**
     * 购买英雄
     */
    buyHero(heroId, amount = 1) {
        const hero = this.heroes.get(heroId);
        if (!hero) return false;
        
        const cost = hero.getCost(amount);
        
        if (this.gold.gte(cost)) {
            this.gold = this.gold.sub(cost);
            hero.levelUp(amount);
            this.unlockedHeroes.add(heroId);
            return true;
        }
        
        return false;
    }

    /**
     * 购买升级
     */
    buyUpgrade(upgradeId) {
        const upgrade = UpgradeData.get(upgradeId);
        if (!upgrade || this.upgrades.has(upgradeId)) return false;
        
        if (this.gold.gte(upgrade.cost)) {
            this.gold = this.gold.sub(upgrade.cost);
            this.upgrades.add(upgradeId);
            this.applyUpgrade(upgrade);
            return true;
        }
        
        return false;
    }

    /**
     * 应用升级效果
     */
    applyUpgrade(upgrade) {
        switch (upgrade.effectType) {
            case 'clickDamageMultiplier':
                this.clickDamageMultiplier *= upgrade.effectValue;
                break;
            case 'globalDPSMultiplier':
                // 应用到所有英雄
                this.heroes.forEach(hero => {
                    hero.dpsMultiplier *= upgrade.effectValue;
                });
                break;
            case 'goldMultiplier':
                // 金币加成
                break;
            // ... 其他效果类型
        }
    }

    /**
     * 激活技能
     */
    activateSkill(skillId) {
        const skill = this.skills[skillId];
        if (!skill || !skill.unlocked) return false;
        
        const skillData = SkillData.get(skillId);
        
        // 设置技能效果
        this.activeEffects.set(skillId, {
            startTime: Date.now(),
            duration: skillData.duration,
            cooldown: skillData.cooldown
        });
        
        return true;
    }

    /**
     * 更新技能状态
     */
    updateSkills(deltaTime) {
        const now = Date.now();
        
        this.activeEffects.forEach((effect, skillId) => {
            if (now - effect.startTime > effect.duration * 1000) {
                this.activeEffects.delete(skillId);
            }
        });
    }

    /**
     * 序列化
     */
    serialize() {
        return {
            gold: this.gold.toString(),
            rubies: this.rubies,
            souls: this.souls.toString(),
            totalClicks: this.totalClicks,
            totalKills: this.totalKills,
            totalGold: this.totalGold.toString(),
            highestZone: this.highestZone,
            totalPlayTime: this.totalPlayTime,
            baseClickDamage: this.baseClickDamage.toString(),
            clickDamageMultiplier: this.clickDamageMultiplier,
            heroes: Array.from(this.heroes.entries()).map(([id, hero]) => ({
                id,
                ...hero.serialize()
            })),
            unlockedHeroes: Array.from(this.unlockedHeroes),
            upgrades: Array.from(this.upgrades),
            skills: this.skills,
            ancients: Array.from(this.ancients.entries())
        };
    }

    /**
     * 反序列化
     */
    static deserialize(data) {
        const player = new Player();
        
        player.gold = new BigNumber(data.gold);
        player.rubies = data.rubies || 0;
        player.souls = new BigNumber(data.souls || 0);
        player.totalClicks = data.totalClicks || 0;
        player.totalKills = data.totalKills || 0;
        player.totalGold = new BigNumber(data.totalGold || 0);
        player.highestZone = data.highestZone || 1;
        player.totalPlayTime = data.totalPlayTime || 0;
        player.baseClickDamage = new BigNumber(data.baseClickDamage || 1);
        player.clickDamageMultiplier = data.clickDamageMultiplier || 1;
        
        // 恢复英雄
        if (data.heroes) {
            data.heroes.forEach(heroData => {
                const hero = player.heroes.get(heroData.id);
                if (hero) {
                    hero.level = heroData.level || 0;
                    hero.purchasedUpgrades = new Set(heroData.purchasedUpgrades || []);
                }
            });
        }
        
        player.unlockedHeroes = new Set(data.unlockedHeroes || []);
        player.upgrades = new Set(data.upgrades || []);
        player.skills = { ...player.skills, ...data.skills };
        player.ancients = new Map(data.ancients || []);
        
        return player;
    }
}
```

#### 2.2.4 Monster 类 - 怪物系统

```javascript
/**
 * Monster - 怪物类
 * 管理怪物的属性、状态和行为
 */
class Monster {
    constructor(data, zoneNumber) {
        this.id = data.id;
        this.name = data.name;
        this.type = data.type || 'normal'; // normal, boss, treasure
        this.zoneNumber = zoneNumber;
        
        // 外观
        this.sprite = data.sprite;
        this.scale = data.scale || 1;
        
        // 计算属性（基于区域）
        this.maxHP = this.calculateHP(data.baseHP, zoneNumber);
        this.currentHP = this.maxHP.clone();
        
        // 奖励
        this.baseGold = data.baseGold;
        this.goldMultiplier = data.goldMultiplier || 1;
        
        // 状态
        this.isDead = false;
        this.spawnTime = Date.now();
        
        // 动画
        this.hitAnimation = 0;
        this.deathAnimation = 0;
    }

    /**
     * 计算怪物血量
     */
    calculateHP(baseHP, zoneNumber) {
        // 点击英雄的血量增长公式
        // HP = baseHP * (1.6 ^ zoneNumber) * (1.15 ^ (zoneNumber % 5))
        const zoneMultiplier = Math.pow(1.6, Math.min(zoneNumber, 140));
        const bossMultiplier = this.type === 'boss' ? Math.pow(1.15, Math.floor(zoneNumber / 5)) : 1;
        
        return new BigNumber(baseHP).mul(zoneMultiplier).mul(bossMultiplier).floor();
    }

    /**
     * 计算金币奖励
     */
    getGoldReward() {
        // Gold = baseGold * (1.15 ^ zoneNumber)
        const zoneMultiplier = Math.pow(1.15, this.zoneNumber);
        return new BigNumber(this.baseGold).mul(zoneMultiplier).mul(this.goldMultiplier).floor();
    }

    /**
     * 受到伤害
     */
    takeDamage(damage) {
        if (this.isDead) return { killed: false, overkill: new BigNumber(0) };
        
        const beforeHP = this.currentHP.clone();
        this.currentHP = this.currentHP.sub(damage);
        
        // 触发受击动画
        this.hitAnimation = 1;
        
        // 检查死亡
        if (this.currentHP.lte(0)) {
            const overkill = this.currentHP.abs();
            this.die();
            return { killed: true, overkill };
        }
        
        return { killed: false, overkill: new BigNumber(0) };
    }

    /**
     * 死亡处理
     */
    die() {
        this.isDead = true;
        this.deathAnimation = 1;
        this.currentHP = new BigNumber(0);
    }

    /**
     * 更新动画
     */
    update(deltaTime) {
        // 受击动画衰减
        if (this.hitAnimation > 0) {
            this.hitAnimation = Math.max(0, this.hitAnimation - deltaTime * 5);
        }
        
        // 死亡动画
        if (this.isDead && this.deathAnimation > 0) {
            this.deathAnimation = Math.max(0, this.deathAnimation - deltaTime * 2);
        }
    }

    /**
     * 获取血量百分比
     */
    getHealthPercent() {
        if (this.maxHP.eq(0)) return 0;
        return this.currentHP.div(this.maxHP).toNumber();
    }

    /**
     * 序列化
     */
    serialize() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            zoneNumber: this.zoneNumber,
            maxHP: this.maxHP.toString(),
            currentHP: this.currentHP.toString(),
            baseGold: this.baseGold,
            goldMultiplier: this.goldMultiplier,
            isDead: this.isDead,
            spawnTime: this.spawnTime
        };
    }

    /**
     * 反序列化
     */
    static deserialize(data) {
        const monsterData = MonsterData.get(data.id);
        const monster = new Monster(monsterData, data.zoneNumber);
        
        monster.currentHP = new BigNumber(data.currentHP);
        monster.isDead = data.isDead;
        monster.spawnTime = data.spawnTime;
        
        return monster;
    }
}
```

#### 2.2.5 Hero 类 - 英雄系统

```javascript
/**
 * Hero - 英雄类
 * 管理英雄的属性、升级和DPS计算
 */
class Hero {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        
        // 基础DPS
        this.baseDPS = new BigNumber(data.baseDPS);
        this.dpsMultiplier = 1;
        
        // 等级
        this.level = 0;
        
        // 成本增长系数
        this.costGrowthRate = data.costGrowthRate || 1.07;
        
        // 基础成本
        this.baseCost = new BigNumber(data.baseCost);
        
        // 解锁等级
        this.unlockLevel = data.unlockLevel || 0;
        
        // 升级
        this.upgrades = data.upgrades || [];
        this.purchasedUpgrades = new Set();
        
        // 外观
        this.portrait = data.portrait;
        
        // 特殊能力
        this.abilities = data.abilities || [];
    }

    /**
     * 获取当前成本
     */
    getCost(amount = 1) {
        // 成本公式：cost = baseCost * (growthRate ^ level) * (1 - growthRate^amount) / (1 - growthRate)
        const base = this.baseCost.mul(Math.pow(this.costGrowthRate, this.level));
        
        if (amount === 1) {
            return base.floor();
        }
        
        // 批量购买成本
        const sum = (1 - Math.pow(this.costGrowthRate, amount)) / (1 - this.costGrowthRate);
        return base.mul(sum).floor();
    }

    /**
     * 获取当前DPS
     */
    getDPS() {
        if (this.level === 0) return new BigNumber(0);
        
        let dps = this.baseDPS.mul(this.level);
        
        // 应用升级加成
        this.upgrades.forEach(upgrade => {
            if (this.purchasedUpgrades.has(upgrade.id)) {
                dps = this.applyUpgradeEffect(dps, upgrade);
            }
        });
        
        // 应用全局倍数
        dps = dps.mul(this.dpsMultiplier);
        
        return dps;
    }

    /**
     * 应用升级效果
     */
    applyUpgradeEffect(dps, upgrade) {
        switch (upgrade.effectType) {
            case 'dpsMultiplier':
                return dps.mul(upgrade.effectValue);
            case 'dpsAdd':
                return dps.add(upgrade.effectValue);
            case 'globalDPSMultiplier':
                // 全局DPS倍数在Player中处理
                return dps;
            default:
                return dps;
        }
    }

    /**
     * 升级英雄
     */
    levelUp(amount = 1) {
        this.level += amount;
        
        // 检查自动解锁的升级
        this.checkAutoUpgrades();
    }

    /**
     * 检查自动解锁的升级
     */
    checkAutoUpgrades() {
        this.upgrades.forEach(upgrade => {
            if (upgrade.unlockLevel && this.level >= upgrade.unlockLevel) {
                this.purchasedUpgrades.add(upgrade.id);
            }
        });
    }

    /**
     * 购买升级
     */
    buyUpgrade(upgradeId) {
        const upgrade = this.upgrades.find(u => u.id === upgradeId);
        if (!upgrade || this.purchasedUpgrades.has(upgradeId)) return false;
        
        // 检查解锁条件
        if (upgrade.unlockLevel && this.level < upgrade.unlockLevel) {
            return false;
        }
        
        this.purchasedUpgrades.add(upgradeId);
        return true;
    }

    /**
     * 获取下一个升级
     */
    getNextUpgrade() {
        return this.upgrades.find(upgrade => 
            !this.purchasedUpgrades.has(upgrade.id) &&
            (!upgrade.unlockLevel || this.level >= upgrade.unlockLevel)
        );
    }

    /**
     * 是否已解锁
     */
    isUnlocked() {
        return this.level > 0 || this.unlockLevel === 0;
    }

    /**
     * 序列化
     */
    serialize() {
        return {
            level: this.level,
            purchasedUpgrades: Array.from(this.purchasedUpgrades)
        };
    }
}
```

#### 2.2.6 Zone 类 - 区域/关卡

```javascript
/**
 * Zone - 区域/关卡类
 * 管理区域内的怪物生成和进度
 */
class Zone {
    constructor(number) {
        this.number = number;
        this.monstersKilled = 0;
        this.totalMonsters = this.isBossZone() ? 1 : 10;
        this.currentMonsterIndex = 0;
        
        // 区域属性
        this.isTreasureZone = this.checkTreasureZone();
    }

    /**
     * 是否是Boss区域（每5层）
     */
    isBossZone() {
        return this.number % 5 === 0;
    }

    /**
     * 检查是否是宝箱区域（随机1%概率）
     */
    checkTreasureZone() {
        return Math.random() < 0.01;
    }

    /**
     * 生成怪物
     */
    spawnMonster() {
        let monsterData;
        
        if (this.isBossZone()) {
            // Boss怪物
            monsterData = MonsterData.getRandomBoss();
        } else if (this.isTreasureZone) {
            // 宝箱怪物
            monsterData = MonsterData.getTreasure();
        } else {
            // 普通怪物
            monsterData = MonsterData.getRandomNormal();
        }
        
        return new Monster(monsterData, this.number);
    }

    /**
     * 击杀怪物
     */
    onMonsterKilled() {
        this.monstersKilled++;
        this.currentMonsterIndex++;
    }

    /**
     * 区域是否完成
     */
    isCompleted() {
        return this.monstersKilled >= this.totalMonsters;
    }

    /**
     * 获取进度百分比
     */
    getProgressPercent() {
        return (this.monstersKilled / this.totalMonsters) * 100;
    }

    /**
     * 序列化
     */
    serialize() {
        return {
            number: this.number,
            monstersKilled: this.monstersKilled,
            totalMonsters: this.totalMonsters,
            currentMonsterIndex: this.currentMonsterIndex,
            isTreasureZone: this.isTreasureZone
        };
    }

    /**
     * 反序列化
     */
    static deserialize(data) {
        const zone = new Zone(data.number);
        zone.monstersKilled = data.monstersKilled;
        zone.currentMonsterIndex = data.currentMonsterIndex;
        zone.isTreasureZone = data.isTreasureZone;
        return zone;
    }
}
```

### 2.3 模块依赖关系图

```
                    ┌─────────────┐
                    │    Game     │
                    │  (主控制器)  │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  GameState    │  │  GameLoop     │  │  EventBus     │
│  (状态管理)    │  │  (游戏循环)    │  │  (事件总线)    │
└───────┬───────┘  └───────────────┘  └───────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────┐
│                      游戏实体层                         │
├─────────────┬─────────────┬─────────────┬─────────────┤
│   Player    │   Monster   │    Hero     │    Zone     │
│   (玩家)     │   (怪物)     │   (英雄)     │   (区域)     │
└─────────────┴─────────────┴─────────────┴─────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│CombatSystem   │  │ProgressSystem │  │UpgradeSystem  │
│(战斗系统)      │  │(进度系统)      │  │(升级系统)      │
└───────────────┘  └───────────────┘  └───────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│CanvasRenderer │  │DamageNumber   │  │ParticleSystem │
│(Canvas渲染)    │  │(伤害数字)      │  │(粒子系统)      │
└───────────────┘  └───────────────┘  └───────────────┘
```

---

## 3. 游戏循环设计

### 3.1 GameLoop 类实现

```javascript
/**
 * GameLoop - 游戏循环
 * 使用 requestAnimationFrame 实现平滑的游戏循环
 * 采用固定时间步长确保游戏逻辑一致性
 */
class GameLoop {
    constructor(game) {
        this.game = game;
        
        // 时间控制
        this.lastTime = 0;
        this.accumulator = 0;
        this.fixedTimeStep = 1000 / 60; // 60 FPS
        
        // 运行状态
        this.isRunning = false;
        this.animationId = null;
        
        // 性能统计
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        
        // 慢速检测
        this.slowFrames = 0;
    }

    /**
     * 启动游戏循环
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        this.tick();
    }

    /**
     * 停止游戏循环
     */
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * 游戏循环主函数
     */
    tick = () => {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // 防止长时间暂停后的超大delta
        const clampedDelta = Math.min(deltaTime, 1000);
        
        // 累加时间
        this.accumulator += clampedDelta;
        
        // 固定时间步长更新
        while (this.accumulator >= this.fixedTimeStep) {
            this.update(this.fixedTimeStep / 1000);
            this.accumulator -= this.fixedTimeStep;
        }
        
        // 渲染（使用插值）
        const alpha = this.accumulator / this.fixedTimeStep;
        this.render(alpha);
        
        // 更新FPS
        this.updateFPS(currentTime);
        
        // 下一帧
        this.animationId = requestAnimationFrame(this.tick);
    }

    /**
     * 游戏逻辑更新
     */
    update(dt) {
        const { game } = this;
        
        // 更新玩家游戏时间
        game.player.totalPlayTime += dt;
        
        // 更新技能
        game.player.updateSkills(dt);
        
        // 更新当前怪物
        if (game.currentMonster) {
            game.currentMonster.update(dt);
        }
        
        // DPS自动伤害
        this.applyDPSDamage(dt);
        
        // 更新粒子系统
        game.particleSystem.update(dt);
        
        // 更新伤害数字
        game.damageNumbers.update(dt);
        
        // 更新所有系统
        Object.values(game.systems).forEach(system => {
            if (system.update) {
                system.update(dt);
            }
        });
        
        // 触发更新事件
        game.eventBus.emit('gameUpdate', dt);
    }

    /**
     * 应用DPS伤害
     */
    applyDPSDamage(dt) {
        const { game } = this;
        
        if (!game.currentMonster || game.currentMonster.isDead) return;
        
        const dps = game.player.getDPS();
        const damage = dps.mul(dt);
        
        if (damage.gt(0)) {
            game.systems.combat.dealDamage(
                game.currentMonster, 
                damage, 
                'dps',
                null, // 无点击位置
                false // 不显示每个伤害数字
            );
        }
    }

    /**
     * 渲染
     */
    render(alpha) {
        const { game } = this;
        
        // 清空画布
        game.renderer.clear();
        
        // 渲染怪物
        if (game.currentMonster) {
            game.renderer.renderMonster(game.currentMonster, alpha);
        }
        
        // 渲染粒子效果
        game.particleSystem.render(game.renderer.ctx);
        
        // 渲染伤害数字
        game.damageNumbers.render(game.renderer.ctx);
        
        // 触发渲染事件
        game.eventBus.emit('gameRender', { renderer: game.renderer, alpha });
    }

    /**
     * 更新FPS统计
     */
    updateFPS(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.lastFpsUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
            
            // 检测性能问题
            if (this.fps < 30) {
                this.slowFrames++;
                if (this.slowFrames > 5) {
                    console.warn('Performance warning: Low FPS detected');
                    this.game.eventBus.emit('performanceWarning', { fps: this.fps });
                }
            } else {
                this.slowFrames = 0;
            }
        }
    }

    /**
     * 获取当前FPS
     */
    getFPS() {
        return this.fps;
    }
}
```

### 3.2 离线进度计算

```javascript
/**
 * OfflineCalculator - 离线进度计算器
 * 计算玩家离线期间的游戏进度
 */
class OfflineCalculator {
    constructor(game) {
        this.game = game;
        
        // 最大离线时间（24小时）
        this.maxOfflineTime = 24 * 60 * 60 * 1000;
        
        // 最小计算间隔
        this.minCalculationInterval = 100; // 100ms
    }

    /**
     * 计算离线进度
     */
    calculate(offlineTime) {
        // 限制最大离线时间
        const actualOfflineTime = Math.min(offlineTime, this.maxOfflineTime);
        
        // 如果离线时间太短，跳过计算
        if (actualOfflineTime < 5000) {
            return {
                goldEarned: new BigNumber(0),
                monstersKilled: 0,
                zonesAdvanced: 0,
                timeSimulated: 0
            };
        }

        const player = this.game.player;
        const currentZone = this.game.currentZone;
        const currentMonster = this.game.currentMonster;
        
        // 获取当前状态
        const dps = player.getDPS();
        const clickDamage = player.getClickDamage();
        
        // 估算平均怪物属性
        const avgMonsterHP = this.estimateMonsterHP(currentZone.number);
        const avgMonsterGold = this.estimateMonsterGold(currentZone.number);
        
        // 计算击杀速度
        const timeToKill = avgMonsterHP.div(dps).toNumber();
        const killsPerSecond = 1 / Math.max(timeToKill, 0.5);
        
        // 模拟游戏进度
        return this.simulateProgress({
            offlineTime: actualOfflineTime,
            dps,
            clickDamage,
            avgMonsterHP,
            avgMonsterGold,
            killsPerSecond,
            currentZone: currentZone.number,
            monstersRemaining: currentZone.totalMonsters - currentZone.monstersKilled,
            monsterHP: currentMonster ? currentMonster.currentHP : avgMonsterHP
        });
    }

    /**
     * 估算怪物血量
     */
    estimateMonsterHP(zoneNumber) {
        const baseHP = new BigNumber(10);
        const zoneMultiplier = Math.pow(1.6, Math.min(zoneNumber, 140));
        return baseHP.mul(zoneMultiplier);
    }

    /**
     * 估算怪物金币
     */
    estimateMonsterGold(zoneNumber) {
        const baseGold = new BigNumber(1);
        const zoneMultiplier = Math.pow(1.15, zoneNumber);
        return baseGold.mul(zoneMultiplier);
    }

    /**
     * 模拟游戏进度
     */
    simulateProgress(params) {
        const {
            offlineTime,
            dps,
            avgMonsterGold,
            killsPerSecond,
            currentZone,
            monstersRemaining
        } = params;

        let remainingTime = offlineTime / 1000; // 转换为秒
        let totalGold = new BigNumber(0);
        let totalKills = 0;
        let zoneNumber = currentZone;
        let monstersLeft = monstersRemaining;

        // 简化模拟：假设玩家保持在当前区域
        // 实际游戏中可能需要更复杂的区域推进逻辑
        
        // 计算可击杀的怪物数
        const maxPossibleKills = Math.floor(remainingTime * killsPerSecond);
        
        // 考虑区域边界
        let killsInCurrentZone = Math.min(maxPossibleKills, monstersLeft);
        
        // 计算当前区域收益
        const goldFromCurrentZone = avgMonsterGold.mul(killsInCurrentZone);
        totalGold = totalGold.add(goldFromCurrentZone);
        totalKills += killsInCurrentZone;
        monstersLeft -= killsInCurrentZone;
        
        // 如果区域完成，估算推进进度
        let zonesAdvanced = 0;
        if (monstersLeft <= 0 && maxPossibleKills > killsInCurrentZone) {
            const remainingKills = maxPossibleKills - killsInCurrentZone;
            zonesAdvanced = Math.floor(remainingKills / 10);
            
            // 估算后续区域收益（简化计算）
            // 实际应该考虑区域难度递增
            const avgGoldPerZone = avgMonsterGold.mul(10).mul(Math.pow(1.15, zonesAdvanced / 2));
            totalGold = totalGold.add(avgGoldPerZone.mul(zonesAdvanced));
            totalKills += zonesAdvanced * 10;
        }

        // 应用离线收益上限（可选）
        // 例如：离线收益最多为在线收益的80%
        const offlineEfficiency = 0.8;
        totalGold = totalGold.mul(offlineEfficiency);

        return {
            goldEarned: totalGold.floor(),
            monstersKilled: totalKills,
            zonesAdvanced,
            timeSimulated: offlineTime,
            efficiency: offlineEfficiency
        };
    }

    /**
     * 生成离线报告
     */
    generateReport(result) {
        const hours = Math.floor(result.timeSimulated / 3600000);
        const minutes = Math.floor((result.timeSimulated % 3600000) / 60000);
        
        return {
            title: '离线进度',
            message: `你离线了 ${hours}小时${minutes}分钟`,
            details: [
                `获得金币: ${NumberFormatter.format(result.goldEarned)}`,
                `击杀怪物: ${result.monstersKilled}`,
                `推进区域: ${result.zonesAdvanced}`
            ],
            raw: result
        };
    }
}
```

---

## 4. 数据持久化

### 4.1 SaveManager 类 - 存档管理

```javascript
/**
 * SaveManager - 存档管理器
 * 处理游戏数据的保存、加载和备份
 */
class SaveManager {
    constructor() {
        this.storageKey = 'clicker_heroes_save';
        this.backupKey = 'clicker_heroes_backup';
        this.maxBackups = 5;
        
        // 压缩设置
        this.useCompression = true;
        
        // 加密设置（可选）
        this.useEncryption = false;
    }

    /**
     * 保存游戏
     */
    async save(gameData) {
        try {
            // 添加时间戳
            const saveData = {
                ...gameData,
                saveTime: Date.now(),
                version: '1.0.0'
            };
            
            // 序列化
            let serialized = JSON.stringify(saveData);
            
            // 压缩
            if (this.useCompression) {
                serialized = await this.compress(serialized);
            }
            
            // 加密（可选）
            if (this.useEncryption) {
                serialized = await this.encrypt(serialized);
            }
            
            // 保存到本地存储
            localStorage.setItem(this.storageKey, serialized);
            
            // 创建备份
            await this.createBackup(serialized);
            
            console.log('Game saved successfully');
            return true;
        } catch (error) {
            console.error('Save failed:', error);
            return false;
        }
    }

    /**
     * 加载游戏
     */
    async load() {
        try {
            let serialized = localStorage.getItem(this.storageKey);
            
            if (!serialized) {
                console.log('No save data found');
                return null;
            }
            
            // 解密（可选）
            if (this.useEncryption) {
                serialized = await this.decrypt(serialized);
            }
            
            // 解压
            if (this.useCompression) {
                serialized = await this.decompress(serialized);
            }
            
            // 解析
            const saveData = JSON.parse(serialized);
            
            // 版本检查
            if (!this.checkVersion(saveData.version)) {
                console.warn('Save version mismatch, attempting migration');
                return this.migrateSave(saveData);
            }
            
            console.log('Game loaded successfully');
            return saveData;
        } catch (error) {
            console.error('Load failed:', error);
            
            // 尝试从备份恢复
            return this.restoreFromBackup();
        }
    }

    /**
     * 压缩数据
     */
    async compress(data) {
        // 使用 LZ-String 压缩
        if (typeof LZString !== 'undefined') {
            return LZString.compressToUTF16(data);
        }
        return data;
    }

    /**
     * 解压数据
     */
    async decompress(data) {
        if (typeof LZString !== 'undefined') {
            return LZString.decompressFromUTF16(data);
        }
        return data;
    }

    /**
     * 加密数据（简单XOR加密示例）
     */
    async encrypt(data) {
        // 实际项目中应使用更安全的加密方式
        const key = 'your-secret-key';
        let result = '';
        for (let i = 0; i < data.length; i++) {
            result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return btoa(result);
    }

    /**
     * 解密数据
     */
    async decrypt(data) {
        const key = 'your-secret-key';
        const decoded = atob(data);
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
            result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    }

    /**
     * 创建备份
     */
    async createBackup(saveData) {
        try {
            // 获取现有备份
            const backups = JSON.parse(localStorage.getItem(this.backupKey) || '[]');
            
            // 添加新备份
            backups.unshift({
                time: Date.now(),
                data: saveData
            });
            
            // 限制备份数量
            while (backups.length > this.maxBackups) {
                backups.pop();
            }
            
            // 保存备份
            localStorage.setItem(this.backupKey, JSON.stringify(backups));
        } catch (error) {
            console.error('Backup creation failed:', error);
        }
    }

    /**
     * 从备份恢复
     */
    async restoreFromBackup() {
        try {
            const backups = JSON.parse(localStorage.getItem(this.backupKey) || '[]');
            
            if (backups.length === 0) {
                console.log('No backups available');
                return null;
            }
            
            // 使用最新的备份
            const latestBackup = backups[0];
            let data = latestBackup.data;
            
            // 解压/解密
            if (this.useCompression) {
                data = await this.decompress(data);
            }
            if (this.useEncryption) {
                data = await this.decrypt(data);
            }
            
            console.log('Restored from backup');
            return JSON.parse(data);
        } catch (error) {
            console.error('Backup restore failed:', error);
            return null;
        }
    }

    /**
     * 导出存档（为玩家提供导出功能）
     */
    exportSave() {
        const saveData = localStorage.getItem(this.storageKey);
        if (!saveData) return null;
        
        // 转换为Base64便于复制
        return btoa(saveData);
    }

    /**
     * 导入存档
     */
    importSave(base64Data) {
        try {
            const saveData = atob(base64Data);
            
            // 验证数据格式
            const parsed = JSON.parse(saveData);
            if (!parsed.player || !parsed.gameVersion) {
                throw new Error('Invalid save data format');
            }
            
            // 保存
            localStorage.setItem(this.storageKey, saveData);
            
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    }

    /**
     * 删除存档
     */
    deleteSave() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.backupKey);
    }

    /**
     * 检查版本兼容性
     */
    checkVersion(saveVersion) {
        const currentVersion = '1.0.0';
        return saveVersion === currentVersion;
    }

    /**
     * 存档迁移
     */
    migrateSave(oldSaveData) {
        // 实现版本间的数据迁移逻辑
        // 例如：添加新字段、重命名字段等
        return oldSaveData;
    }

    /**
     * 获取存档信息
     */
    getSaveInfo() {
        const saveData = localStorage.getItem(this.storageKey);
        if (!saveData) return null;
        
        try {
            const parsed = JSON.parse(saveData);
            return {
                exists: true,
                saveTime: parsed.lastSaveTime,
                version: parsed.gameVersion,
                highestZone: parsed.player?.highestZone,
                totalPlayTime: parsed.player?.totalPlayTime
            };
        } catch {
            return { exists: true, corrupted: true };
        }
    }
}
```

### 4.2 存档数据结构

```javascript
/**
 * 存档数据结构示例
 */
const saveDataExample = {
    // 元数据
    gameVersion: '1.0.0',
    lastSaveTime: 1699999999999,
    saveTime: 1699999999999,
    
    // 玩家数据
    player: {
        // 资源
        gold: '1.5e25',
        rubies: 50,
        souls: '1.2e10',
        
        // 统计
        totalClicks: 15000,
        totalKills: 50000,
        totalGold: '1.5e30',
        highestZone: 145,
        totalPlayTime: 86400, // 秒
        
        // 伤害
        baseClickDamage: '1',
        clickDamageMultiplier: 150,
        
        // 英雄数据
        heroes: [
            {
                id: 'cid',
                level: 1000,
                purchasedUpgrades: ['cid_upgrade_1', 'cid_upgrade_2']
            },
            {
                id: 'treebeast',
                level: 500,
                purchasedUpgrades: ['treebeast_upgrade_1']
            }
            // ... 更多英雄
        ],
        
        // 已解锁英雄
        unlockedHeroes: ['cid', 'treebeast', 'ivan', 'brittany'],
        
        // 已购买升级
        upgrades: ['click_upgrade_1', 'global_dps_1'],
        
        // 技能
        skills: {
            clickStorm: { unlocked: true, level: 3 },
            powersurge: { unlocked: true, level: 2 },
            luckyStrikes: { unlocked: false, level: 0 }
            // ...
        },
        
        // 古物（转生后）
        ancients: [
            ['siyalatas', 10],
            ['libertas', 8]
        ]
    },
    
    // 当前区域
    currentZone: {
        number: 145,
        monstersKilled: 7,
        totalMonsters: 10,
        currentMonsterIndex: 7,
        isTreasureZone: false
    },
    
    // 当前怪物
    currentMonster: {
        id: 'forest_goblin',
        name: 'Forest Goblin',
        type: 'normal',
        zoneNumber: 145,
        maxHP: '1.2e35',
        currentHP: '8.5e34',
        baseGold: '1',
        goldMultiplier: 1,
        isDead: false,
        spawnTime: 1699999900000
    },
    
    // 设置
    settings: {
        soundVolume: 0.8,
        musicVolume: 0.5,
        showDamageNumbers: true,
        scientificNotation: false,
        autoSaveInterval: 30,
        fpsLimit: 60
    },
    
    // 成就
    achievements: {
        unlocked: ['first_click', 'first_kill', 'zone_10', 'zone_100'],
        progress: {
            'click_10000': 15000,
            'kill_100000': 50000
        }
    },
    
    // 统计数据
    statistics: {
        bestDPS: '1.5e20',
        bestZoneTime: 120,
        totalAscensions: 5,
        transcendencePoints: 0
    }
};
```

---

## 5. 性能优化

### 5.1 伤害数字优化

```javascript
/**
 * DamageNumberManager - 伤害数字管理器
 * 优化大量伤害数字的渲染性能
 */
class DamageNumberManager {
    constructor() {
        this.numbers = [];
        this.pool = []; // 对象池
        this.maxVisible = 50; // 最大同时显示数量
        
        // 合并小伤害
        this.mergeThreshold = 100; // ms
        this.mergeRadius = 50; // 像素
        
        // 批处理渲染
        this.batchRender = true;
    }

    /**
     * 创建伤害数字
     */
    spawn(damage, x, y, type = 'normal') {
        // 检查是否需要合并
        const merged = this.tryMerge(damage, x, y);
        if (merged) return;
        
        // 限制数量
        if (this.numbers.length >= this.maxVisible) {
            // 移除最旧的
            const old = this.numbers.shift();
            this.recycle(old);
        }
        
        // 从对象池获取或创建新对象
        const number = this.getFromPool();
        number.value = damage;
        number.x = x + (Math.random() - 0.5) * 30;
        number.y = y;
        number.type = type;
        number.life = 1;
        number.maxLife = 1;
        number.velocityX = (Math.random() - 0.5) * 50;
        number.velocityY = -80 - Math.random() * 40;
        number.spawnTime = Date.now();
        
        // 样式
        number.color = this.getColorByType(type);
        number.fontSize = this.getFontSize(damage);
        number.critical = type === 'critical';
        
        this.numbers.push(number);
    }

    /**
     * 尝试合并相近的伤害数字
     */
    tryMerge(damage, x, y) {
        const now = Date.now();
        
        for (const num of this.numbers) {
            const timeDiff = now - num.spawnTime;
            const distX = Math.abs(num.x - x);
            const distY = Math.abs(num.y - y);
            
            if (timeDiff < this.mergeThreshold && 
                distX < this.mergeRadius && 
                distY < this.mergeRadius &&
                num.type === 'normal') {
                // 合并
                num.value = num.value.add(damage);
                num.x = (num.x + x) / 2;
                num.y = (num.y + y) / 2;
                num.fontSize = this.getFontSize(num.value);
                return true;
            }
        }
        
        return false;
    }

    /**
     * 更新所有伤害数字
     */
    update(dt) {
        for (let i = this.numbers.length - 1; i >= 0; i--) {
            const num = this.numbers[i];
            
            // 更新位置
            num.x += num.velocityX * dt;
            num.y += num.velocityY * dt;
            
            // 重力效果
            num.velocityY += 100 * dt;
            
            // 更新生命周期
            num.life -= dt * 1.5;
            
            // 移除死亡的
            if (num.life <= 0) {
                const dead = this.numbers.splice(i, 1)[0];
                this.recycle(dead);
            }
        }
    }

    /**
     * 渲染伤害数字
     */
    render(ctx) {
        if (this.numbers.length === 0) return;
        
        ctx.save();
        
        // 批处理：按样式分组渲染
        const batches = this.groupByStyle();
        
        for (const batch of batches) {
            ctx.font = `bold ${batch.fontSize}px Arial`;
            ctx.fillStyle = batch.color;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            
            for (const num of batch.numbers) {
                const alpha = num.life;
                ctx.globalAlpha = alpha;
                
                const text = NumberFormatter.format(num.value);
                
                // 绘制描边
                ctx.strokeText(text, num.x, num.y);
                // 绘制填充
                ctx.fillText(text, num.x, num.y);
            }
        }
        
        ctx.restore();
    }

    /**
     * 按样式分组
     */
    groupByStyle() {
        const groups = new Map();
        
        for (const num of this.numbers) {
            const key = `${num.fontSize}-${num.color}`;
            if (!groups.has(key)) {
                groups.set(key, {
                    fontSize: num.fontSize,
                    color: num.color,
                    numbers: []
                });
            }
            groups.get(key).numbers.push(num);
        }
        
        return Array.from(groups.values());
    }

    /**
     * 从对象池获取
     */
    getFromPool() {
        return this.pool.pop() || {};
    }

    /**
     * 回收对象
     */
    recycle(obj) {
        // 清理引用
        obj.value = null;
        this.pool.push(obj);
    }

    /**
     * 根据类型获取颜色
     */
    getColorByType(type) {
        const colors = {
            normal: '#ffffff',
            critical: '#ff6600',
            click: '#ffff00',
            dps: '#00ff00',
            boss: '#ff0000'
        };
        return colors[type] || colors.normal;
    }

    /**
     * 根据伤害值获取字体大小
     */
    getFontSize(damage) {
        const magnitude = damage.toExponential(0).split('e')[1];
        return Math.min(16 + Math.max(0, magnitude) * 2, 48);
    }
}
```

### 5.2 UI更新优化

```javascript
/**
 * UIManager - UI管理器
 * 优化频繁更新的UI元素
 */
class UIManager {
    constructor(game) {
        this.game = game;
        
        // 更新节流
        this.updateThrottles = new Map();
        this.updateIntervals = {
            gold: 100,      // 金币每100ms更新
            dps: 500,       // DPS每500ms更新
            health: 50,     // 血量每50ms更新
            heroList: 1000, // 英雄列表每秒更新
        };
        
        // 脏检查
        this.dirtyFlags = new Set();
        this.lastValues = new Map();
        
        // RAF批处理
        this.pendingUpdates = new Set();
        this.rafScheduled = false;
    }

    /**
     * 标记需要更新
     */
    markDirty(key) {
        this.dirtyFlags.add(key);
        this.scheduleUpdate();
    }

    /**
     * 调度更新
     */
    scheduleUpdate() {
        if (this.rafScheduled) return;
        
        this.rafScheduled = true;
        requestAnimationFrame(() => {
            this.processUpdates();
            this.rafScheduled = false;
        });
    }

    /**
     * 处理更新
     */
    processUpdates() {
        this.dirtyFlags.forEach(key => {
            this.updateElement(key);
        });
        this.dirtyFlags.clear();
    }

    /**
     * 更新UI元素
     */
    updateElement(key) {
        const element = document.getElementById(`ui-${key}`);
        if (!element) return;
        
        const newValue = this.getValue(key);
        const lastValue = this.lastValues.get(key);
        
        // 值未变化，跳过
        if (newValue === lastValue) return;
        
        // 更新DOM
        element.textContent = this.formatValue(key, newValue);
        this.lastValues.set(key, newValue);
    }

    /**
     * 获取值
     */
    getValue(key) {
        const { player, currentMonster } = this.game;
        
        switch (key) {
            case 'gold':
                return player.gold.toString();
            case 'dps':
                return player.getDPS().toString();
            case 'clickDamage':
                return player.getClickDamage().toString();
            case 'monsterHP':
                return currentMonster ? currentMonster.currentHP.toString() : '0';
            case 'monsterMaxHP':
                return currentMonster ? currentMonster.maxHP.toString() : '0';
            case 'zone':
                return this.game.currentZone.number;
            default:
                return null;
        }
    }

    /**
     * 格式化值
     */
    formatValue(key, value) {
        if (value instanceof BigNumber || /\d+e[+-]?\d+/i.test(value)) {
            return NumberFormatter.format(new BigNumber(value));
        }
        return value;
    }

    /**
     * 批量更新（用于游戏循环）
     */
    batchUpdate(dt) {
        const now = Date.now();
        
        // 检查每个UI元素的更新间隔
        for (const [key, interval] of Object.entries(this.updateIntervals)) {
            const lastUpdate = this.updateThrottles.get(key) || 0;
            
            if (now - lastUpdate >= interval) {
                this.markDirty(key);
                this.updateThrottles.set(key, now);
            }
        }
    }

    /**
     * 虚拟列表（用于大量英雄）
     */
    createVirtualList(container, items, itemHeight, renderFn) {
        const visibleCount = Math.ceil(container.clientHeight / itemHeight);
        const buffer = 2; // 上下缓冲
        
        const state = {
            scrollTop: 0,
            startIndex: 0,
            endIndex: visibleCount + buffer * 2
        };
        
        // 创建可见元素
        const visibleItems = [];
        for (let i = 0; i < visibleCount + buffer * 2; i++) {
            const el = document.createElement('div');
            el.style.position = 'absolute';
            el.style.height = `${itemHeight}px`;
            container.appendChild(el);
            visibleItems.push(el);
        }
        
        // 监听滚动
        container.addEventListener('scroll', () => {
            state.scrollTop = container.scrollTop;
            this.updateVirtualList(state, items, itemHeight, visibleItems, renderFn);
        });
        
        // 初始渲染
        this.updateVirtualList(state, items, itemHeight, visibleItems, renderFn);
        
        return state;
    }

    /**
     * 更新虚拟列表
     */
    updateVirtualList(state, items, itemHeight, visibleItems, renderFn) {
        const newStartIndex = Math.floor(state.scrollTop / itemHeight) - 2;
        const newEndIndex = newStartIndex + visibleItems.length;
        
        state.startIndex = Math.max(0, newStartIndex);
        state.endIndex = Math.min(items.length, newEndIndex);
        
        visibleItems.forEach((el, i) => {
            const itemIndex = state.startIndex + i;
            
            if (itemIndex < items.length) {
                el.style.display = 'block';
                el.style.top = `${itemIndex * itemHeight}px`;
                renderFn(el, items[itemIndex], itemIndex);
            } else {
                el.style.display = 'none';
            }
        });
    }
}
```

### 5.3 内存管理

```javascript
/**
 * MemoryManager - 内存管理器
 * 防止内存泄漏和过度分配
 */
class MemoryManager {
    constructor() {
        this.pools = new Map();
        this.gcThreshold = 100; // 对象池最大大小
        this.lastGCTime = 0;
        this.gcInterval = 60000; // 每分钟检查一次
    }

    /**
     * 创建对象池
     */
    createPool(name, factory, resetFn) {
        this.pools.set(name, {
            available: [],
            inUse: new Set(),
            factory,
            resetFn,
            totalCreated: 0
        });
    }

    /**
     * 获取对象
     */
    acquire(name) {
        const pool = this.pools.get(name);
        if (!pool) return null;
        
        let obj;
        if (pool.available.length > 0) {
            obj = pool.available.pop();
        } else {
            obj = pool.factory();
            pool.totalCreated++;
        }
        
        pool.inUse.add(obj);
        return obj;
    }

    /**
     * 释放对象
     */
    release(name, obj) {
        const pool = this.pools.get(name);
        if (!pool) return;
        
        pool.inUse.delete(obj);
        
        // 重置对象状态
        if (pool.resetFn) {
            pool.resetFn(obj);
        }
        
        // 限制池大小
        if (pool.available.length < this.gcThreshold) {
            pool.available.push(obj);
        }
    }

    /**
     * 定期垃圾回收
     */
    update() {
        const now = Date.now();
        if (now - this.lastGCTime < this.gcInterval) return;
        
        this.lastGCTime = now;
        
        this.pools.forEach((pool, name) => {
            // 如果池过大，清理部分对象
            if (pool.available.length > this.gcThreshold) {
                const toRemove = pool.available.length - this.gcThreshold;
                pool.available.splice(0, toRemove);
                console.log(`MemoryManager: Cleaned ${toRemove} objects from ${name} pool`);
            }
        });
    }

    /**
     * 获取内存统计
     */
    getStats() {
        const stats = {};
        this.pools.forEach((pool, name) => {
            stats[name] = {
                available: pool.available.length,
                inUse: pool.inUse.size,
                totalCreated: pool.totalCreated
            };
        });
        return stats;
    }
}

// 使用示例
const memoryManager = new MemoryManager();

// 创建粒子对象池
memoryManager.createPool(
    'particles',
    () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, color: '' }),
    (obj) => { obj.x = obj.y = obj.vx = obj.vy = obj.life = 0; }
);
```

---

## 6. 事件系统

### 6.1 EventBus 类 - 事件总线

```javascript
/**
 * EventBus - 事件总线
 * 实现发布-订阅模式的事件系统
 */
class EventBus {
    constructor() {
        this.listeners = new Map();
        this.onceListeners = new Map();
        this.middlewares = [];
        
        // 性能监控
        this.eventStats = new Map();
    }

    /**
     * 订阅事件
     */
    on(event, callback, priority = 0) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        
        const listeners = this.listeners.get(event);
        listeners.push({ callback, priority });
        
        // 按优先级排序
        listeners.sort((a, b) => b.priority - a.priority);
        
        // 返回取消订阅函数
        return () => this.off(event, callback);
    }

    /**
     * 订阅一次性事件
     */
    once(event, callback, priority = 0) {
        const wrapper = (data) => {
            this.off(event, wrapper);
            callback(data);
        };
        
        return this.on(event, wrapper, priority);
    }

    /**
     * 取消订阅
     */
    off(event, callback) {
        if (!this.listeners.has(event)) return;
        
        const listeners = this.listeners.get(event);
        const index = listeners.findIndex(l => l.callback === callback);
        
        if (index !== -1) {
            listeners.splice(index, 1);
        }
    }

    /**
     * 触发事件
     */
    emit(event, data = null) {
        // 记录统计
        this.recordEvent(event);
        
        // 执行中间件
        let processedData = data;
        for (const middleware of this.middlewares) {
            processedData = middleware(event, processedData);
            if (processedData === null) return; // 中间件取消事件
        }
        
        // 执行监听器
        if (this.listeners.has(event)) {
            const listeners = this.listeners.get(event);
            listeners.forEach(({ callback }) => {
                try {
                    callback(processedData);
                } catch (error) {
                    console.error(`Event handler error for ${event}:`, error);
                }
            });
        }
    }

    /**
     * 触发事件（异步）
     */
    async emitAsync(event, data = null) {
        this.recordEvent(event);
        
        if (!this.listeners.has(event)) return;
        
        const listeners = this.listeners.get(event);
        const promises = listeners.map(({ callback }) => {
            return Promise.resolve().then(() => callback(data));
        });
        
        await Promise.all(promises);
    }

    /**
     * 添加中间件
     */
    use(middleware) {
        this.middlewares.push(middleware);
    }

    /**
     * 记录事件统计
     */
    recordEvent(event) {
        if (!this.eventStats.has(event)) {
            this.eventStats.set(event, { count: 0, lastTime: 0 });
        }
        const stats = this.eventStats.get(event);
        stats.count++;
        stats.lastTime = Date.now();
    }

    /**
     * 获取事件统计
     */
    getStats() {
        return Object.fromEntries(this.eventStats);
    }

    /**
     * 清除所有监听器
     */
    clear() {
        this.listeners.clear();
        this.onceListeners.clear();
    }
}
```

### 6.2 点击事件处理

```javascript
/**
 * ClickHandler - 点击事件处理器
 * 处理怪物点击和相关的交互
 */
class ClickHandler {
    constructor(game) {
        this.game = game;
        this.canvas = game.renderer.canvas;
        
        // 点击节流
        this.lastClickTime = 0;
        this.clickCooldown = 50; // ms
        
        // 自动点击检测
        this.clickHistory = [];
        this.maxHistorySize = 20;
        
        // 暴击
        this.critChance = 0;
        this.critMultiplier = 2;
        
        this.bindEvents();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 鼠标点击
        this.canvas.addEventListener('mousedown', (e) => this.handleClick(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // 防止右键菜单
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * 处理鼠标点击
     */
    handleClick(e) {
        const now = Date.now();
        
        // 节流检查
        if (now - this.lastClickTime < this.clickCooldown) return;
        this.lastClickTime = now;
        
        // 获取点击位置
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 检查是否点击到怪物
        if (this.isClickOnMonster(x, y)) {
            this.processMonsterClick(x, y);
        }
        
        // 记录点击历史
        this.recordClick(now);
    }

    /**
     * 处理触摸事件
     */
    handleTouch(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        if (this.isClickOnMonster(x, y)) {
            this.processMonsterClick(x, y);
        }
    }

    /**
     * 检查点击是否在怪物上
     */
    isClickOnMonster(x, y) {
        const monster = this.game.currentMonster;
        if (!monster || monster.isDead) return false;
        
        const bounds = this.game.renderer.getMonsterBounds();
        
        return x >= bounds.x && 
               x <= bounds.x + bounds.width &&
               y >= bounds.y && 
               y <= bounds.y + bounds.height;
    }

    /**
     * 处理怪物点击
     */
    processMonsterClick(x, y) {
        const player = this.game.player;
        
        // 计算伤害
        let damage = player.getClickDamage();
        let isCritical = false;
        
        // 暴击检查
        if (Math.random() < this.critChance) {
            damage = damage.mul(this.critMultiplier);
            isCritical = true;
        }
        
        // 应用伤害
        this.game.systems.combat.dealDamage(
            this.game.currentMonster,
            damage,
            isCritical ? 'critical' : 'click',
            x,
            y
        );
        
        // 触发点击效果
        this.spawnClickEffects(x, y, isCritical);
        
        // 触发事件
        this.game.eventBus.emit('monsterClicked', {
            damage,
            isCritical,
            position: { x, y }
        });
    }

    /**
     * 生成点击效果
     */
    spawnClickEffects(x, y, isCritical) {
        // 粒子效果
        const particleCount = isCritical ? 15 : 5;
        for (let i = 0; i < particleCount; i++) {
            this.game.particleSystem.spawn({
                x: x + (Math.random() - 0.5) * 40,
                y: y + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 0.3 + Math.random() * 0.3,
                color: isCritical ? '#ff6600' : '#ffff00',
                size: isCritical ? 6 : 3
            });
        }
        
        // 屏幕震动效果
        if (isCritical) {
            this.game.renderer.shakeScreen(5, 200);
        }
    }

    /**
     * 处理键盘快捷键
     */
    handleKeydown(e) {
        // 技能快捷键
        const skillKeys = {
            '1': 'clickStorm',
            '2': 'powersurge',
            '3': 'luckyStrikes',
            '4': 'metalDetector',
            '5': 'goldenClicks',
            '6': 'theDarkRitual',
            '7': 'superClicks',
            '8': 'energize',
            '9': 'reload'
        };
        
        if (skillKeys[e.key]) {
            this.game.player.activateSkill(skillKeys[e.key]);
        }
        
        // 其他快捷键
        switch (e.key) {
            case ' ':
                // 空格键：快速推进到下一区域
                if (e.ctrlKey) {
                    this.game.advanceZone();
                }
                break;
            case 'a':
                // A键：购买所有可用升级
                if (e.ctrlKey) {
                    this.game.systems.upgrade.buyAllAvailable();
                }
                break;
        }
    }

    /**
     * 记录点击历史
     */
    recordClick(timestamp) {
        this.clickHistory.push(timestamp);
        
        // 限制历史大小
        if (this.clickHistory.length > this.maxHistorySize) {
            this.clickHistory.shift();
        }
        
        // 检测自动点击
        this.detectAutoClick();
    }

    /**
     * 检测自动点击
     */
    detectAutoClick() {
        if (this.clickHistory.length < 10) return;
        
        // 计算点击间隔的标准差
        const intervals = [];
        for (let i = 1; i < this.clickHistory.length; i++) {
            intervals.push(this.clickHistory[i] - this.clickHistory[i - 1]);
        }
        
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);
        
        // 如果标准差很小，可能是自动点击
        if (stdDev < 10 && avg < 100) {
            console.warn('Possible auto-click detected');
            this.game.eventBus.emit('suspiciousActivity', { type: 'autoClick' });
        }
    }
}
```

---

## 7. 工具类

### 7.1 大数字处理

```javascript
/**
 * BigNumber - 大数字处理类
 * 处理超过JavaScript安全整数范围的大数字
 */
class BigNumber {
    constructor(value) {
        if (value instanceof BigNumber) {
            this.mantissa = value.mantissa;
            this.exponent = value.exponent;
        } else if (typeof value === 'string') {
            this.fromString(value);
        } else if (typeof value === 'number') {
            this.fromNumber(value);
        } else {
            this.mantissa = 0;
            this.exponent = 0;
        }
        
        this.normalize();
    }

    /**
     * 从字符串解析
     */
    fromString(str) {
        // 支持科学计数法：1.5e25
        const match = str.toLowerCase().match(/^([\d.]+)e([+-]?\d+)$/);
        if (match) {
            this.mantissa = parseFloat(match[1]);
            this.exponent = parseInt(match[2]);
        } else {
            this.fromNumber(parseFloat(str));
        }
    }

    /**
     * 从数字解析
     */
    fromNumber(num) {
        if (num === 0) {
            this.mantissa = 0;
            this.exponent = 0;
            return;
        }
        
        const exp = Math.floor(Math.log10(Math.abs(num)));
        this.mantissa = num / Math.pow(10, exp);
        this.exponent = exp;
    }

    /**
     * 规范化
     */
    normalize() {
        if (this.mantissa === 0) {
            this.exponent = 0;
            return;
        }
        
        const exp = Math.floor(Math.log10(Math.abs(this.mantissa)));
        if (exp !== 0) {
            this.mantissa /= Math.pow(10, exp);
            this.exponent += exp;
        }
        
        // 处理负数指数
        while (this.mantissa < 1 && this.mantissa > 0) {
            this.mantissa *= 10;
            this.exponent--;
        }
    }

    /**
     * 加法
     */
    add(other) {
        other = new BigNumber(other);
        
        // 对齐指数
        const maxExp = Math.max(this.exponent, other.exponent);
        const m1 = this.mantissa * Math.pow(10, this.exponent - maxExp);
        const m2 = other.mantissa * Math.pow(10, other.exponent - maxExp);
        
        return new BigNumber((m1 + m2) * Math.pow(10, maxExp));
    }

    /**
     * 减法
     */
    sub(other) {
        other = new BigNumber(other);
        return this.add(new BigNumber(-other.mantissa).mul(Math.pow(10, other.exponent)));
    }

    /**
     * 乘法
     */
    mul(other) {
        other = new BigNumber(other);
        return new BigNumber({
            mantissa: this.mantissa * other.mantissa,
            exponent: this.exponent + other.exponent
        });
    }

    /**
     * 除法
     */
    div(other) {
        other = new BigNumber(other);
        return new BigNumber({
            mantissa: this.mantissa / other.mantissa,
            exponent: this.exponent - other.exponent
        });
    }

    /**
     * 比较
     */
    cmp(other) {
        other = new BigNumber(other);
        
        if (this.exponent !== other.exponent) {
            return this.exponent > other.exponent ? 1 : -1;
        }
        
        if (Math.abs(this.mantissa - other.mantissa) < 1e-10) {
            return 0;
        }
        
        return this.mantissa > other.mantissa ? 1 : -1;
    }

    gt(other) { return this.cmp(other) > 0; }
    gte(other) { return this.cmp(other) >= 0; }
    lt(other) { return this.cmp(other) < 0; }
    lte(other) { return this.cmp(other) <= 0; }
    eq(other) { return this.cmp(other) === 0; }

    /**
     * 取整
     */
    floor() {
        if (this.exponent >= 0) {
            return new BigNumber(this);
        }
        
        const factor = Math.pow(10, this.exponent);
        return new BigNumber(Math.floor(this.mantissa * factor));
    }

    /**
     * 绝对值
     */
    abs() {
        return new BigNumber({
            mantissa: Math.abs(this.mantissa),
            exponent: this.exponent
        });
    }

    /**
     * 转换为字符串
     */
    toString() {
        if (this.exponent < 6 && this.exponent > -6) {
            return (this.mantissa * Math.pow(10, this.exponent)).toString();
        }
        return `${this.mantissa.toFixed(2)}e${this.exponent}`;
    }

    /**
     * 转换为数字（可能丢失精度）
     */
    toNumber() {
        return this.mantissa * Math.pow(10, this.exponent);
    }

    /**
     * 科学计数法表示
     */
    toExponential(fractionDigits = 2) {
        return `${this.mantissa.toFixed(fractionDigits)}e${this.exponent}`;
    }
}

/**
 * NumberFormatter - 数字格式化器
 */
class NumberFormatter {
    static suffixes = [
        '', 'K', 'M', 'B', 'T', 'q', 'Q', 's', 'S', 'O', 'N',
        'D', 'UD', 'DD', 'TD', 'qD', 'QD', 'sD', 'SD', 'OD', 'ND',
        'V', 'UV', 'DV', 'TV', 'qV', 'QV', 'sV', 'SV', 'OV', 'NV',
        'T', 'UT', 'DT', 'TT', 'qT', 'QT', 'sT', 'ST', 'OT', 'NT'
    ];

    /**
     * 格式化大数字
     */
    static format(num, precision = 3) {
        const bn = num instanceof BigNumber ? num : new BigNumber(num);
        
        // 小数字直接显示
        if (bn.exponent < 3) {
            return bn.toNumber().toFixed(precision).replace(/\.?0+$/, '');
        }
        
        // 使用后缀
        const suffixIndex = Math.floor(bn.exponent / 3);
        const remainder = bn.exponent % 3;
        
        if (suffixIndex < this.suffixes.length) {
            const value = bn.mantissa * Math.pow(10, remainder);
            return `${value.toFixed(precision).replace(/\.?0+$/, '')}${this.suffixes[suffixIndex]}`;
        }
        
        // 超出后缀范围，使用科学计数法
        return bn.toExponential(2);
    }

    /**
     * 格式化时间
     */
    static formatTime(seconds) {
        if (seconds < 60) {
            return `${Math.floor(seconds)}秒`;
        } else if (seconds < 3600) {
            return `${Math.floor(seconds / 60)}分${Math.floor(seconds % 60)}秒`;
        } else if (seconds < 86400) {
            return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分`;
        } else {
            return `${Math.floor(seconds / 86400)}天${Math.floor((seconds % 86400) / 3600)}小时`;
        }
    }
}
```

---

## 8. 入口文件

```javascript
/**
 * main.js - 游戏入口
 */

// 等待DOM加载
document.addEventListener('DOMContentLoaded', async () => {
    // 初始化游戏
    const game = new Game();
    
    try {
        await game.init();
        
        // 暴露到全局（调试用）
        window.game = game;
        
        console.log('Clicker Heroes initialized!');
    } catch (error) {
        console.error('Failed to initialize game:', error);
        alert('游戏初始化失败，请刷新页面重试');
    }
});

// 页面可见性变化处理（处理后台运行）
document.addEventListener('visibilitychange', () => {
    if (window.game) {
        if (document.hidden) {
            window.game.pause();
        } else {
            window.game.start();
        }
    }
});

// 页面关闭前保存
window.addEventListener('beforeunload', () => {
    if (window.game) {
        window.game.saveManager.save(window.game.serialize());
    }
});
```

---

## 9. 总结

### 架构特点

1. **模块化设计**：各系统职责清晰，便于维护和扩展
2. **性能优化**：对象池、节流、虚拟列表等技术确保流畅运行
3. **数据安全**：压缩、加密、备份机制保护玩家存档
4. **可扩展性**：事件系统支持插件式功能扩展

### 技术选型理由

| 技术 | 理由 |
|------|------|
| 混合渲染 | DOM适合UI，Canvas适合特效，各取所长 |
| 中心化状态 | 单一数据源，便于调试和持久化 |
| 固定时间步长 | 确保游戏逻辑一致性，不受帧率影响 |
| 自定义大数字 | 游戏数值范围远超JavaScript安全整数 |

### 性能目标

- **FPS**：稳定60fps
- **内存**：控制对象池大小，定期GC
- **响应**：点击延迟<50ms
- **存档**：压缩后<100KB
