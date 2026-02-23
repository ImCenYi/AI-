/**
 * Game.js
 * 游戏主控制器 - 点击英雄核心系统
 * 
 * 功能：
 * - 整合所有核心系统（状态管理、事件总线、游戏循环）
 * - 管理游戏生命周期（初始化、新游戏、加载、保存）
 * - 协调玩家、区域、怪物等游戏对象
 * - 处理核心游戏逻辑（点击伤害、自动攻击、金币获取等）
 * 
 * 数值公式：
 * - 怪物HP = 10 × (1.6 ^ (zone - 1))
 * - 金币掉落 = 1 × (1.15 ^ (zone - 1))
 * - 英雄升级成本 = baseCost × (1.07 ^ (level - 1))
 * 
 * @author Clicker Heroes Team
 * @version 1.0.0
 */

/**
 * 游戏主控制器类
 * 负责协调所有游戏系统和组件
 */
class Game {
    /**
     * 构造函数
     * 初始化所有核心系统和游戏状态
     */
    constructor() {
        console.log('[Game] 初始化游戏主控制器...');
        
        // ========== 核心系统 ==========
        
        // 状态管理系统（观察者模式）
        this.state = new GameState();
        
        // 事件总线系统（发布/订阅模式）
        this.eventBus = new EventBus();
        
        // 游戏循环系统
        this.loop = new GameLoop(this, {
            targetFPS: 60,
            useFixedTimeStep: true,
            autoPauseOnHidden: true
        });
        
        // ========== 游戏对象 ==========
        
        // 玩家数据
        this.player = null;
        
        // 当前区域
        this.currentZone = 1;
        
        // 当前怪物
        this.currentMonster = null;
        
        // 英雄列表
        this.heroes = [];
        
        // 升级/技能管理器
        this.upgradeManager = null;
        
        // 成就系统
        this.achievementManager = null;

        // UI管理器
        this.uiManager = null;

        // Canvas渲染器
        this.canvasRenderer = null;

        // ========== 游戏状态 ==========
        
        // 游戏是否已初始化
        this.isInitialized = false;
        
        // 游戏是否进行中
        this.isPlaying = false;
        
        // 游戏开始时间
        this.startTime = 0;
        
        // 总游戏时间（毫秒）
        this.totalPlayTime = 0;
        
        // 上次保存时间
        this.lastSaveTime = 0;
        
        // 自动保存间隔（毫秒）
        this.autoSaveInterval = 60000; // 1分钟
        
        // ========== 配置常量 ==========
        
        // 怪物HP计算公式：HP = MONSTER_BASE_HP × (MONSTER_HP_GROWTH ^ (zone - 1))
        this.MONSTER_BASE_HP = 10;
        this.MONSTER_HP_GROWTH = 1.6;
        
        // 金币掉落计算公式：Gold = GOLD_BASE × (GOLD_GROWTH ^ (zone - 1))
        this.GOLD_BASE = 1;
        this.GOLD_GROWTH = 1.15;
        
        // 英雄升级成本公式：Cost = baseCost × (HERO_COST_GROWTH ^ (level - 1))
        this.HERO_COST_GROWTH = 1.07;
        
        // 区域怪物数量
        this.MONSTERS_PER_ZONE = 10;
        
        // Boss区域间隔
        this.BOSS_ZONE_INTERVAL = 5;
        
        // Boss计时器（秒）
        this.BOSS_TIME_LIMIT = 30;
        
        // ========== 初始化 ==========
        
        // 设置状态监听
        this._setupStateListeners();
        
        // 设置事件监听
        this._setupEventListeners();
        
        // 设置循环回调
        this._setupLoopCallbacks();
        
        console.log('[Game] 游戏主控制器初始化完成');
    }

    // ========== 生命周期方法 ==========

    /**
     * 初始化游戏
     * 加载配置、初始化系统、准备游戏环境
     * @returns {boolean} 是否成功初始化
     */
    init() {
        if (this.isInitialized) {
            console.warn('[Game] 游戏已经初始化');
            return false;
        }
        
        console.log('[Game] 开始初始化游戏...');
        
        // 初始化游戏状态
        this._initializeState();

        // 尝试加载存档
        this._loadGame();

        // 初始化英雄系统
        this._initializeHeroes();

        // 初始化UI系统
        this._initializeUI();
        
        // 初始化完成
        this.isInitialized = true;
        
        // 触发初始化完成事件
        this.eventBus.emit('game:initialized', { timestamp: Date.now() });
        
        console.log('[Game] 游戏初始化完成');
        return true;
    }

    // ========== Getter方法（供UIManager使用） ==========

    /**
     * 获取当前金币
     * @returns {number} 金币数量
     */
    get gold() {
        return this.state.get('player.gold', 0);
    }

    /**
     * 设置金币
     * @param {number} value - 金币值
     */
    set gold(value) {
        this.state.set('player.gold', value);
    }

    /**
     * 获取当前区域
     * @returns {number} 区域编号
     */
    get zone() {
        return this.currentZone;
    }

    /**
     * 获取总DPS
     * @returns {number} DPS值
     */
    get dps() {
        return this._getTotalDPS();
    }

    /**
     * 获取点击伤害
     * @returns {number} 点击伤害值
     */
    get clickDamage() {
        return this._getClickDamage();
    }

    /**
     * 开始新游戏
     * 重置所有数据，从头开始
     * @returns {boolean} 是否成功开始
     */
    newGame() {
        console.log('[Game] 开始新游戏...');
        
        // 停止当前游戏
        if (this.isPlaying) {
            this.stop();
        }
        
        // 重置所有状态
        this.state.clear();
        this._initializeState();
        
        // 重置游戏对象
        this.player = this._createNewPlayer();
        this.currentZone = 1;
        this.currentMonster = null;
        this.totalPlayTime = 0;

        // 初始化英雄
        this._initializeHeroes();

        // 生成第一个怪物
        this._spawnMonster();
        
        // 设置游戏状态
        this.isPlaying = true;
        this.startTime = Date.now();
        this.lastSaveTime = Date.now();
        
        // 启动游戏循环
        this.loop.start();
        
        // 触发新游戏事件
        this.eventBus.emit('game:new', { player: this.player });

        // 更新UI
        if (this.uiManager) {
            this.uiManager.updateAll();
        }

        console.log('[Game] 新游戏开始');
        return true;
    }

    /**
     * 继续游戏
     * 从存档继续
     * @returns {boolean} 是否成功继续
     */
    continueGame() {
        if (this.isPlaying) {
            console.warn('[Game] 游戏已经在进行中');
            return false;
        }
        
        console.log('[Game] 继续游戏...');
        
        // 如果没有玩家数据，开始新游戏
        if (!this.player) {
            return this.newGame();
        }
        
        // 设置游戏状态
        this.isPlaying = true;
        this.startTime = Date.now();
        this.lastSaveTime = Date.now();
        
        // 如果没有当前怪物，生成一个
        if (!this.currentMonster) {
            this._spawnMonster();
        }
        
        // 启动游戏循环
        this.loop.start();
        
        // 触发继续游戏事件
        this.eventBus.emit('game:continue', { player: this.player });

        // 更新UI
        if (this.uiManager) {
            this.uiManager.updateAll();
        }

        console.log('[Game] 游戏继续');
        return true;
    }

    /**
     * 停止游戏
     * @returns {boolean} 是否成功停止
     */
    stop() {
        if (!this.isPlaying) {
            return false;
        }
        
        console.log('[Game] 停止游戏...');
        
        // 停止游戏循环
        this.loop.stop();
        
        // 更新总游戏时间
        this.totalPlayTime += Date.now() - this.startTime;
        
        // 保存游戏
        this._saveGame();
        
        // 设置游戏状态
        this.isPlaying = false;
        
        // 触发停止事件
        this.eventBus.emit('game:stopped', { totalPlayTime: this.totalPlayTime });
        
        console.log('[Game] 游戏已停止');
        return true;
    }

    /**
     * 暂停游戏
     * @returns {boolean} 是否成功暂停
     */
    pause() {
        if (!this.isPlaying) {
            return false;
        }
        
        const result = this.loop.pause();
        if (result) {
            this.eventBus.emit('game:paused');
        }
        return result;
    }

    /**
     * 恢复游戏
     * @returns {boolean} 是否成功恢复
     */
    resume() {
        if (!this.isPlaying) {
            return false;
        }
        
        const result = this.loop.resume();
        if (result) {
            this.eventBus.emit('game:resumed');
        }
        return result;
    }

    // ========== 核心更新方法 ==========

    /**
     * 游戏更新（由GameLoop每帧调用）
     * @param {number} deltaTime - 时间差（毫秒）
     */
    update(deltaTime) {
        if (!this.isPlaying) {
            return;
        }
        
        // 转换为秒
        const dt = deltaTime / 1000;
        
        // 更新自动攻击（DPS）
        this._updateAutoAttack(dt);
        
        // 更新Boss计时器
        if (this.currentMonster && this.currentMonster.isBoss) {
            this._updateBossTimer(dt);
        }
        
        // 检查自动保存
        this._checkAutoSave();
        
        // 触发更新事件
        this.eventBus.emit('game:update', { deltaTime: dt });
    }

    // ========== 游戏逻辑方法 ==========

    /**
     * 点击怪物（玩家手动攻击）
     * @returns {Object} 攻击结果
     */
    clickMonster() {
        if (!this.currentMonster || !this.isPlaying) {
            return null;
        }
        
        // 获取点击伤害
        const clickDamage = this._getClickDamage();
        
        // 对怪物造成伤害
        const result = this._damageMonster(clickDamage, 'click');
        
        // 更新统计
        this.player.stats.totalClicks++;
        this.player.stats.totalClickDamage += clickDamage;
        
        // 触发点击事件
        this.eventBus.emit('player:click', {
            damage: clickDamage,
            monster: this.currentMonster,
            result: result
        });
        
        return result;
    }

    /**
     * 处理怪物点击（供UIManager调用）
     * @returns {number} 造成的伤害
     */
    onMonsterClick() {
        const result = this.clickMonster();
        return result ? result.damage : 0;
    }

    /**
     * 切换到下一区域
     * @returns {boolean} 是否成功切换
     */
    nextZone() {
        console.log(`[Game] nextZone() 被调用，当前区域: ${this.currentZone}`);
        // 检查是否可以切换（必须击败所有怪物）
        const monstersKilled = this.state.get(`zone.${this.currentZone}.monstersKilled`, 0);
        console.log(`[Game] 当前区域击杀数: ${monstersKilled}/${this.MONSTERS_PER_ZONE}`);
        if (monstersKilled < this.MONSTERS_PER_ZONE) {
            console.warn('[Game] 必须先击败当前区域所有怪物');
            return false;
        }

        // 切换到下一区域
        this.currentZone++;
        console.log(`[Game] 区域增加到: ${this.currentZone}`);
        
        // 重置区域击杀计数
        this.state.set(`zone.${this.currentZone}.monstersKilled`, 0);
        
        // 生成新怪物
        this._spawnMonster();
        
        // 更新最高区域
        const highestZone = this.state.get('player.highestZone', 1);
        if (this.currentZone > highestZone) {
            this.state.set('player.highestZone', this.currentZone);
        }
        
        // 触发区域切换事件
        this.eventBus.emit('zone:changed', {
            zone: this.currentZone,
            isBossZone: this._isBossZone(this.currentZone)
        });
        
        console.log(`[Game] 进入区域 ${this.currentZone}, BOSS区域: ${this._isBossZone(this.currentZone)}`);
        return true;
    }

    /**
     * 切换到上一区域
     * @returns {boolean} 是否成功切换
     */
    prevZone() {
        if (this.currentZone <= 1) {
            return false;
        }
        
        this.currentZone--;
        this._spawnMonster();
        
        // 触发区域切换事件
        this.eventBus.emit('zone:changed', {
            zone: this.currentZone,
            isBossZone: this._isBossZone(this.currentZone)
        });
        
        return true;
    }

    /**
     * 购买英雄
     * @param {string} heroId - 英雄ID
     * @returns {Object} 购买结果
     */
    buyHero(heroId) {
        const hero = this.heroes.find(h => h.id === heroId);
        if (!hero) {
            return { success: false, error: '英雄不存在' };
        }
        
        // 计算购买成本
        const cost = this._calculateHeroCost(hero);
        
        // 检查金币是否足够
        const gold = this.state.get('player.gold', 0);
        if (gold < cost) {
            return { success: false, error: '金币不足' };
        }
        
        // 扣除金币
        this.state.set('player.gold', gold - cost);
        
        // 增加英雄等级
        hero.level++;
        
        // 如果是首次购买，解锁英雄
        if (hero.level === 1) {
            hero.unlocked = true;
        }
        
        // 更新DPS
        this._updateTotalDPS();
        
        // 触发购买事件
        this.eventBus.emit('hero:purchased', {
            hero: hero,
            cost: cost,
            level: hero.level
        });

        // 刷新英雄列表UI
        if (this.uiManager) {
            this.uiManager.updateHeroList(this.heroes);
        }

        return {
            success: true,
            hero: hero,
            cost: cost,
            newLevel: hero.level
        };
    }

    /**
     * 升级点击伤害
     * @returns {Object} 升级结果
     */
    upgradeClickDamage() {
        const upgradeLevel = this.state.get('player.clickUpgradeLevel', 0);
        const cost = this._calculateClickUpgradeCost(upgradeLevel);
        
        const gold = this.state.get('player.gold', 0);
        if (gold < cost) {
            return { success: false, error: '金币不足' };
        }
        
        // 扣除金币
        this.state.set('player.gold', gold - cost);
        
        // 增加升级等级
        this.state.set('player.clickUpgradeLevel', upgradeLevel + 1);
        
        // 触发升级事件
        this.eventBus.emit('player:clickUpgraded', {
            level: upgradeLevel + 1,
            cost: cost,
            newDamage: this._getClickDamage()
        });
        
        return {
            success: true,
            level: upgradeLevel + 1,
            cost: cost
        };
    }

    // ========== 私有辅助方法 ==========

    /**
     * 初始化游戏状态
     * @private
     */
    _initializeState() {
        // 玩家基础状态
        this.state.set('player.gold', 0);
        this.state.set('player.highestZone', 1);
        this.state.set('player.clickUpgradeLevel', 0);
        
        // 统计状态
        this.state.set('stats.totalClicks', 0);
        this.state.set('stats.totalClickDamage', 0);
        this.state.set('stats.totalDPSDamage', 0);
        this.state.set('stats.monstersKilled', 0);
        this.state.set('stats.bossesKilled', 0);
        this.state.set('stats.totalGoldEarned', 0);
        
        // 当前区域状态
        this.state.set(`zone.${this.currentZone}.monstersKilled`, 0);
    }

    /**
     * 初始化英雄系统
     * @private
     */
    _initializeHeroes() {
        // 如果已经有英雄数据，不重复初始化
        if (this.heroes && this.heroes.length > 0) {
            return;
        }

        // 从 HEROES_DATA 创建英雄实例
        if (typeof HEROES_DATA !== 'undefined') {
            this.heroes = HEROES_DATA.map(data => {
                const hero = new Hero({
                    id: data.id,
                    name: data.name,
                    baseDPS: data.baseDPS,
                    baseCost: data.baseCost,
                    desc: data.desc
                });
                // 添加 UIManager 需要的属性
                Object.defineProperty(hero, 'cost', {
                    get: function() { return this.getUpgradeCost(); },
                    enumerable: true
                });
                Object.defineProperty(hero, 'currentDPS', {
                    get: function() { return this.getCurrentDPS(); },
                    enumerable: true
                });
                return hero;
            });
        } else {
            this.heroes = [];
        }

        console.log(`[Game] 初始化了 ${this.heroes.length} 个英雄`);
    }

    /**
     * 初始化UI系统
     * @private
     */
    _initializeUI() {
        // 创建UI管理器
        this.uiManager = new UIManager(this);

        // 创建Canvas渲染器
        this.canvasRenderer = new CanvasRenderer('monster-canvas');
        this.canvasRenderer.init();

        // 将渲染器设置给UI管理器
        this.uiManager.setCanvasRenderer(this.canvasRenderer);

        // 启动渲染循环
        this._startRenderLoop();
    }

    /**
     * 启动渲染循环
     * @private
     */
    _startRenderLoop() {
        const render = () => {
            if (this.canvasRenderer) {
                this.canvasRenderer.render(this);
            }
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    }

    /**
     * 设置状态监听器
     * @private
     */
    _setupStateListeners() {
        // 监听金币变化
        this.state.subscribe('player.gold', (newValue, oldValue) => {
            if (newValue > oldValue) {
                const earned = newValue - oldValue;
                const total = this.state.get('stats.totalGoldEarned', 0) + earned;
                this.state.set('stats.totalGoldEarned', total, true);
            }
            // 更新UI显示
            if (this.uiManager) {
                this.uiManager.updateGold(newValue);
            }
        });

        // 监听区域变化
        this.state.subscribe('player.highestZone', (newValue) => {
            if (this.uiManager) {
                this.uiManager.updateZone(this.currentZone);
            }
        });
    }

    /**
     * 设置事件监听器
     * @private
     */
    _setupEventListeners() {
        // 怪物死亡事件
        this.eventBus.on('monster:died', (data) => {
            this._onMonsterKilled(data);
        });
        
        // Boss逃跑事件
        this.eventBus.on('boss:escaped', () => {
            this._onBossEscaped();
        });
    }

    /**
     * 设置游戏循环回调
     * @private
     */
    _setupLoopCallbacks() {
        // 暂停回调
        this.loop.setPauseCallback(() => {
            this.eventBus.emit('game:paused');
        });
        
        // 恢复回调
        this.loop.setResumeCallback(() => {
            this.eventBus.emit('game:resumed');
        });
    }

    /**
     * 创建新玩家
     * @private
     * @returns {Object} 玩家对象
     */
    _createNewPlayer() {
        return {
            id: 'player',
            name: '勇者',
            gold: 0,
            highestZone: 1,
            clickUpgradeLevel: 0,
            stats: {
                totalClicks: 0,
                totalClickDamage: 0,
                totalDPSDamage: 0,
                monstersKilled: 0,
                bossesKilled: 0,
                totalGoldEarned: 0
            }
        };
    }

    /**
     * 生成怪物
     * @private
     */
    _spawnMonster() {
        const isBoss = this._isBossZone(this.currentZone);
        const monsterNumber = this.state.get(`zone.${this.currentZone}.monstersKilled`, 0) + 1;
        
        // 计算怪物属性
        const hp = this._calculateMonsterHP(this.currentZone, isBoss);
        const gold = this._calculateGoldReward(this.currentZone, isBoss);
        
        this.currentMonster = {
            id: `zone${this.currentZone}_monster${monsterNumber}`,
            name: isBoss ? this._getBossName(this.currentZone) : this._getMonsterName(),
            zone: this.currentZone,
            maxHP: hp,
            currentHP: hp,
            goldReward: gold,
            isBoss: isBoss,
            timeLimit: isBoss ? this.BOSS_TIME_LIMIT : null,
            timeRemaining: isBoss ? this.BOSS_TIME_LIMIT : null
        };
        
        // 触发怪物生成事件
        this.eventBus.emit('monster:spawned', {
            monster: this.currentMonster
        });
        
        console.log(`[Game] 生成怪物: ${this.currentMonster.name}, HP: ${hp}, 区域: ${this.currentZone}`);

        // 更新UI怪物信息
        if (this.uiManager) {
            this.uiManager.updateMonsterInfo(this.currentMonster);
        }
    }

    /**
     * 对怪物造成伤害
     * @private
     * @param {number} damage - 伤害值
     * @param {string} source - 伤害来源（'click' 或 'dps'）
     * @returns {Object} 伤害结果
     */
    _damageMonster(damage, source) {
        if (!this.currentMonster || this.currentMonster.isDead) {
            return { killed: false };
        }

        // 应用伤害
        this.currentMonster.currentHP -= damage;

        // 检查是否死亡
        const killed = this.currentMonster.currentHP <= 0;

        if (killed) {
            // 标记怪物已死亡，防止重复触发
            this.currentMonster.isDead = true;
            this.currentMonster.currentHP = 0;

            // 触发死亡事件
            this.eventBus.emit('monster:died', {
                monster: this.currentMonster,
                source: source
            });
        }

        return {
            damage: damage,
            currentHP: this.currentMonster.currentHP,
            maxHP: this.currentMonster.maxHP,
            killed: killed,
            source: source
        };
    }

    /**
     * 怪物被击杀处理
     * @private
     * @param {Object} data - 事件数据
     */
    _onMonsterKilled(data) {
        const monster = data.monster;

        // 给予金币奖励
        const gold = this.state.get('player.gold', 0);
        this.state.set('player.gold', gold + monster.goldReward);

        // 更新统计
        this.player.stats.monstersKilled++;
        if (monster.isBoss) {
            this.player.stats.bossesKilled++;
        }

        // 更新区域击杀数
        const monstersKilled = this.state.get(`zone.${this.currentZone}.monstersKilled`, 0);
        const newMonstersKilled = monstersKilled + 1;
        this.state.set(`zone.${this.currentZone}.monstersKilled`, newMonstersKilled);

        console.log(`[Game] 怪物被击杀，获得金币: ${monster.goldReward}，进度: ${newMonstersKilled}/${this.MONSTERS_PER_ZONE}`);

        // 检查是否完成当前区域
        console.log(`[Game] 检查区域完成: ${newMonstersKilled}/${this.MONSTERS_PER_ZONE}`);
        if (newMonstersKilled >= this.MONSTERS_PER_ZONE) {
            console.log(`[Game] 区域 ${this.currentZone} 完成!`);
            // 区域完成，触发事件
            this.eventBus.emit('zone:completed', {
                zone: this.currentZone,
                isBossZone: monster.isBoss
            });

            // 如果是BOSS区域，自动进入下一区域（或者显示提示）
            if (monster.isBoss) {
                console.log('[Game] BOSS被击败，准备进入下一区域');
                // 延迟自动进入下一区域
                setTimeout(() => {
                    if (this.isPlaying) {
                        console.log('[Game] 调用nextZone()');
                        this.nextZone();
                    }
                }, 1500);
            } else {
                // 普通区域，继续生成怪物（自动进入下一区域）
                console.log('[Game] 普通区域完成，准备进入下一区域');
                setTimeout(() => {
                    if (this.isPlaying) {
                        console.log('[Game] 调用nextZone()');
                        this.nextZone();
                    }
                }, 800);
            }
        } else {
            // 区域未完成，继续生成下一个怪物
            setTimeout(() => {
                if (this.isPlaying) {
                    this._spawnMonster();
                }
            }, 500);
        }
    }

    /**
     * Boss逃跑处理
     * @private
     */
    _onBossEscaped() {
        // Boss逃跑，重置区域
        this.state.set(`zone.${this.currentZone}.monstersKilled`, 0);
        
        // 生成新怪物
        this._spawnMonster();
        
        console.log('[Game] Boss逃跑，区域重置');
    }

    /**
     * 更新自动攻击（DPS）
     * @private
     * @param {number} dt - 时间差（秒）
     */
    _updateAutoAttack(dt) {
        const dps = this._getTotalDPS();
        if (dps <= 0 || !this.currentMonster) {
            return;
        }
        
        // 计算这段时间的伤害
        const damage = dps * dt;
        
        // 应用伤害
        this._damageMonster(damage, 'dps');
        
        // 更新统计
        this.player.stats.totalDPSDamage += damage;
    }

    /**
     * 更新Boss计时器
     * @private
     * @param {number} dt - 时间差（秒）
     */
    _updateBossTimer(dt) {
        if (!this.currentMonster || !this.currentMonster.isBoss) {
            return;
        }
        
        this.currentMonster.timeRemaining -= dt;
        
        // 触发计时器更新事件
        this.eventBus.emit('boss:timerUpdate', {
            timeRemaining: this.currentMonster.timeRemaining,
            timeLimit: this.currentMonster.timeLimit
        });
        
        // 检查是否超时
        if (this.currentMonster.timeRemaining <= 0) {
            this.eventBus.emit('boss:escaped', {
                monster: this.currentMonster
            });
        }
    }

    /**
     * 检查自动保存
     * @private
     */
    _checkAutoSave() {
        const now = Date.now();
        if (now - this.lastSaveTime >= this.autoSaveInterval) {
            this._saveGame();
            this.lastSaveTime = now;
        }
    }

    /**
     * 保存游戏
     * @private
     */
    _saveGame() {
        try {
            const saveData = {
                player: this.player,
                heroes: this.heroes,
                currentZone: this.currentZone,
                totalPlayTime: this.totalPlayTime + (Date.now() - this.startTime),
                timestamp: Date.now(),
                version: '1.0.0'
            };
            
            // 使用localStorage保存（浏览器环境）
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('clickerHeroes_save', JSON.stringify(saveData));
            }
            
            this.eventBus.emit('game:saved', { timestamp: saveData.timestamp });
            console.log('[Game] 游戏已保存');
        } catch (error) {
            console.error('[Game] 保存游戏失败:', error);
        }
    }

    /**
     * 加载游戏
     * @private
     */
    _loadGame() {
        try {
            if (typeof localStorage !== 'undefined') {
                const saveData = localStorage.getItem('clickerHeroes_save');
                if (saveData) {
                    const data = JSON.parse(saveData);
                    
                    // 恢复玩家数据
                    this.player = data.player || this._createNewPlayer();
                    this.heroes = data.heroes || [];
                    this.currentZone = data.currentZone || 1;
                    this.totalPlayTime = data.totalPlayTime || 0;
                    
                    // 恢复状态
                    this.state.set('player.gold', this.player.gold || 0);
                    this.state.set('player.highestZone', this.player.highestZone || 1);
                    
                    console.log('[Game] 游戏存档已加载');
                    this.eventBus.emit('game:loaded', { timestamp: data.timestamp });
                    return true;
                }
            }
        } catch (error) {
            console.error('[Game] 加载游戏失败:', error);
        }
        return false;
    }

    // ========== 数值计算方法 ==========

    /**
     * 计算怪物HP
     * @private
     * @param {number} zone - 区域编号
     * @param {boolean} isBoss - 是否是Boss
     * @returns {number} 怪物HP
     */
    _calculateMonsterHP(zone, isBoss = false) {
        // HP = 10 × (1.6 ^ (zone - 1))
        let hp = this.MONSTER_BASE_HP * Math.pow(this.MONSTER_HP_GROWTH, zone - 1);
        
        // Boss有10倍HP
        if (isBoss) {
            hp *= 10;
        }
        
        return Math.floor(hp);
    }

    /**
     * 计算金币奖励
     * @private
     * @param {number} zone - 区域编号
     * @param {boolean} isBoss - 是否是Boss
     * @returns {number} 金币奖励
     */
    _calculateGoldReward(zone, isBoss = false) {
        // Gold = 1 × (1.15 ^ (zone - 1))
        let gold = this.GOLD_BASE * Math.pow(this.GOLD_GROWTH, zone - 1);
        
        // Boss给10倍金币
        if (isBoss) {
            gold *= 10;
        }
        
        return Math.floor(gold);
    }

    /**
     * 计算英雄升级成本
     * @private
     * @param {Object} hero - 英雄对象
     * @returns {number} 升级成本
     */
    _calculateHeroCost(hero) {
        // Cost = baseCost × (1.07 ^ (level - 1))
        return Math.floor(hero.baseCost * Math.pow(this.HERO_COST_GROWTH, hero.level));
    }

    /**
     * 计算点击升级成本
     * @private
     * @param {number} level - 当前升级等级
     * @returns {number} 升级成本
     */
    _calculateClickUpgradeCost(level) {
        // 成本随等级指数增长
        return Math.floor(50 * Math.pow(1.1, level));
    }

    /**
     * 获取点击伤害
     * @private
     * @returns {number} 点击伤害
     */
    _getClickDamage() {
        const upgradeLevel = this.state.get('player.clickUpgradeLevel', 0);
        // 基础伤害1，每级+1
        let damage = 1 + upgradeLevel;

        // 希德（cid）特殊处理：每级提供额外点击伤害
        const cid = this.heroes.find(h => h.id === 'cid');
        if (cid && cid.level > 0) {
            // 希德每级提供0.5点击伤害
            damage += cid.level * 0.5;
        }

        return damage;
    }

    /**
     * 获取总DPS
     * @private
     * @returns {number} 总DPS
     */
    _getTotalDPS() {
        return this.heroes.reduce((total, hero) => {
            if (hero.level > 0) {
                return total + (hero.baseDPS * hero.level);
            }
            return total;
        }, 0);
    }

    /**
     * 更新总DPS
     * @private
     */
    _updateTotalDPS() {
        const totalDPS = this._getTotalDPS();
        this.state.set('player.totalDPS', totalDPS);
    }

    /**
     * 检查是否是Boss区域
     * @private
     * @param {number} zone - 区域编号
     * @returns {boolean} 是否是Boss区域
     */
    _isBossZone(zone) {
        return zone % this.BOSS_ZONE_INTERVAL === 0;
    }

    /**
     * 获取怪物名称
     * @private
     * @returns {string} 怪物名称
     */
    _getMonsterName() {
        const names = ['史莱姆', '哥布林', '骷髅兵', '蝙蝠', '蜘蛛', '史莱姆王', '狼人', '僵尸', '幽灵', '小恶魔'];
        return names[Math.floor(Math.random() * names.length)];
    }

    /**
     * 获取Boss名称
     * @private
     * @param {number} zone - 区域编号
     * @returns {string} Boss名称
     */
    _getBossName(zone) {
        const bosses = ['巨魔', '龙', '恶魔领主', '死亡骑士', '黑暗法师', '远古巨兽', '混沌之王'];
        const index = (Math.floor(zone / this.BOSS_ZONE_INTERVAL) - 1) % bosses.length;
        return `${bosses[index]} Lv.${zone}`;
    }

    // ========== 公共查询方法 ==========

    /**
     * 获取当前游戏状态
     * @returns {Object} 游戏状态摘要
     */
    getGameStatus() {
        return {
            isInitialized: this.isInitialized,
            isPlaying: this.isPlaying,
            isPaused: this.loop.isPaused,
            currentZone: this.currentZone,
            isBossZone: this._isBossZone(this.currentZone),
            monster: this.currentMonster ? {
                name: this.currentMonster.name,
                currentHP: this.currentMonster.currentHP,
                maxHP: this.currentMonster.maxHP,
                isBoss: this.currentMonster.isBoss,
                timeRemaining: this.currentMonster.timeRemaining
            } : null,
            player: {
                gold: this.state.get('player.gold', 0),
                highestZone: this.state.get('player.highestZone', 1),
                clickDamage: this._getClickDamage(),
                totalDPS: this._getTotalDPS()
            },
            loopStats: this.loop.getStats()
        };
    }

    /**
     * 获取游戏统计
     * @returns {Object} 游戏统计信息
     */
    getStats() {
        return {
            totalPlayTime: this.totalPlayTime + (this.isPlaying ? (Date.now() - this.startTime) : 0),
            totalClicks: this.player?.stats?.totalClicks || 0,
            totalClickDamage: this.player?.stats?.totalClickDamage || 0,
            totalDPSDamage: this.player?.stats?.totalDPSDamage || 0,
            monstersKilled: this.player?.stats?.monstersKilled || 0,
            bossesKilled: this.player?.stats?.bossesKilled || 0,
            totalGoldEarned: this.state.get('stats.totalGoldEarned', 0)
        };
    }
}

// 创建全局游戏实例（单例模式）
Game.instance = null;

/**
 * 获取全局游戏实例
 * @returns {Game} 全局游戏实例
 */
Game.getInstance = function() {
    if (!Game.instance) {
        Game.instance = new Game();
    }
    return Game.instance;
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
}
