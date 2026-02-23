/**
 * ProgressSystem - 进度系统
 * 处理区域推进、Boss战、离线进度计算等游戏进度相关逻辑
 */
class ProgressSystem {
    /**
     * 构造函数
     * @param {Object} game - 游戏主对象
     */
    constructor(game) {
        this.game = game;
        
        // ===== 区域信息 =====
        this.currentZone = 1;                // 当前区域
        this.currentLevel = 1;               // 当前关卡（区域内的第几个怪物）
        this.monstersPerZone = 10;           // 每区域怪物数
        this.bossLevel = 5;                  // Boss关卡（第5个怪物）
        this.highestZone = 1;                // 到达的最高区域
        
        // ===== Boss战状态 =====
        this.isBossFight = false;            // 是否正在进行Boss战
        this.bossTimer = 0;                  // Boss计时器
        this.bossTimeLimit = 30000;          // Boss战时间限制（30秒）
        this.bossAttempts = 0;               // Boss挑战次数
        this.bossDefeated = false;           // 当前Boss是否被击败
        
        // ===== 区域属性 =====
        this.zoneDifficulty = 1;             // 区域难度系数
        this.monsterHealthMultiplier = 1.145; // 怪物血量增长系数
        this.goldMultiplier = 1.15;          // 金币增长系数
        
        // ===== 转生系统 =====
        this.ascensionLevel = 0;             // 转生等级
        this.heroSouls = 0;                  // 英雄之魂数量
        this.ascensionZone = 100;            // 可转生区域
        
        // ===== 世界系统 =====
        this.currentWorld = 1;               // 当前世界
        this.worlds = [];                    // 世界列表
        this.worldCompleted = false;         // 当前世界是否完成
        
        // ===== 成就追踪 =====
        this.zoneMilestones = [10, 25, 50, 100, 150, 200, 300, 500, 1000];
        this.achievedMilestones = [];        // 已完成的里程碑
        
        // ===== 离线进度 =====
        this.offlineProgressEnabled = true;  // 是否启用离线进度
        this.maxOfflineTime = 86400000;      // 最大离线时间（24小时）
        
        // 初始化世界
        this.initializeWorlds();
    }

    // ==================== 初始化 ====================

    /**
     * 初始化世界列表
     */
    initializeWorlds() {
        this.worlds = [
            { id: 1, name: '森林世界', unlockZone: 1, difficulty: 1 },
            { id: 2, name: '沙漠世界', unlockZone: 50, difficulty: 1.5 },
            { id: 3, name: '冰雪世界', unlockZone: 100, difficulty: 2 },
            { id: 4, name: '火山世界', unlockZone: 150, difficulty: 2.5 },
            { id: 5, name: '暗影世界', unlockZone: 200, difficulty: 3 },
            { id: 6, name: '天空世界', unlockZone: 300, difficulty: 4 },
            { id: 7, name: '深渊世界', unlockZone: 500, difficulty: 5 },
            { id: 8, name: '神域世界', unlockZone: 1000, difficulty: 10 }
        ];
    }

    // ==================== 区域推进 ====================

    /**
     * 推进到下一区域
     * @returns {Object} 推进结果
     */
    advanceZone() {
        // 检查是否可以推进
        if (this.currentLevel < this.monstersPerZone) {
            return { success: false, error: 'Not all monsters defeated' };
        }

        // 检查Boss是否被击败
        if (this.isBossFight && !this.bossDefeated) {
            return { success: false, error: 'Boss not defeated' };
        }

        // 增加区域
        this.currentZone++;
        this.currentLevel = 1;
        
        // 更新最高区域
        if (this.currentZone > this.highestZone) {
            this.highestZone = this.currentZone;
            this.checkMilestones();
        }

        // 重置Boss状态
        this.resetBossState();

        // 检查世界解锁
        this.checkWorldUnlock();

        // 计算新的难度
        this.calculateDifficulty();

        // 生成新怪物
        this.game.spawnMonster();

        // 触发区域推进事件
        this.onZoneAdvanced();

        return {
            success: true,
            newZone: this.currentZone,
            difficulty: this.zoneDifficulty
        };
    }

    /**
     * 推进到下一关卡
     * @returns {Object} 推进结果
     */
    advanceLevel() {
        this.currentLevel++;

        // 检查是否到达Boss关卡
        if (this.currentLevel >= this.monstersPerZone) {
            this.startBossFight();
            return { success: true, isBoss: true };
        }

        // 生成普通怪物
        this.game.spawnMonster();

        return { success: true, isBoss: false };
    }

    /**
     * 跳转到指定区域
     * @param {number} zone - 目标区域
     * @returns {Object} 跳转结果
     */
    jumpToZone(zone) {
        // 只能跳转到已到达过的区域
        if (zone > this.highestZone) {
            return { success: false, error: 'Zone not unlocked' };
        }

        if (zone < 1) {
            return { success: false, error: 'Invalid zone' };
        }

        this.currentZone = zone;
        this.currentLevel = 1;
        this.resetBossState();
        this.calculateDifficulty();
        this.game.spawnMonster();

        return { success: true, zone: this.currentZone };
    }

    // ==================== Boss战 ====================

    /**
     * 开始Boss战
     * @returns {Object} Boss战信息
     */
    startBossFight() {
        this.isBossFight = true;
        this.bossTimer = this.bossTimeLimit;
        this.bossAttempts++;
        this.bossDefeated = false;

        // 生成Boss怪物
        const boss = this.game.spawnBoss();

        // 触发Boss战开始效果
        if (this.game.uiManager) {
            this.game.uiManager.showBossWarning();
        }

        return {
            success: true,
            timeLimit: this.bossTimeLimit,
            boss: boss
        };
    }

    /**
     * 更新Boss计时器（每帧调用）
     * @param {number} deltaTime - 时间增量（毫秒）
     */
    updateBossTimer(deltaTime) {
        if (!this.isBossFight || this.bossDefeated) {
            return;
        }

        this.bossTimer -= deltaTime;

        // 检查时间是否耗尽
        if (this.bossTimer <= 0) {
            this.onBossFail();
        }

        // 更新UI
        if (this.game.uiManager) {
            this.game.uiManager.updateBossTimer(this.bossTimer, this.bossTimeLimit);
        }
    }

    /**
     * Boss战失败
     */
    onBossFail() {
        this.isBossFight = false;
        this.bossDefeated = false;
        this.currentLevel = this.monstersPerZone - 1; // 回到Boss前一级

        // 生成普通怪物
        this.game.spawnMonster();

        // 触发失败效果
        if (this.game.uiManager) {
            this.game.uiManager.showBossFailed();
        }

        // 触发游戏事件
        this.game.triggerEvent('bossFailed', {
            zone: this.currentZone,
            attempts: this.bossAttempts
        });
    }

    /**
     * Boss被击败
     */
    onBossDefeated() {
        if (!this.isBossFight) return;

        this.bossDefeated = true;
        this.isBossFight = false;
        this.bossTimer = 0;

        // 给予Boss奖励
        this.giveBossRewards();

        // 触发胜利效果
        if (this.game.uiManager) {
            this.game.uiManager.showBossDefeated();
        }

        // 触发游戏事件
        this.game.triggerEvent('bossDefeated', {
            zone: this.currentZone,
            attempts: this.bossAttempts
        });

        // 自动推进到下一区域
        setTimeout(() => {
            this.advanceZone();
        }, 1500);
    }

    /**
     * 重置Boss状态
     */
    resetBossState() {
        this.isBossFight = false;
        this.bossTimer = 0;
        this.bossDefeated = false;
    }

    /**
     * 给予Boss奖励
     */
    giveBossRewards() {
        // Boss金币奖励
        const baseGold = this.calculateMonsterGold() * 10;
        const bonusGold = baseGold * (1 + this.bossAttempts * 0.1); // 尝试次数越多，奖励越高
        this.game.addGold(Math.floor(bonusGold));

        // Boss经验奖励
        const expReward = this.currentZone * 10;
        this.game.addExperience(expReward);

        // 检查转生奖励
        if (this.currentZone >= this.ascensionZone && this.currentZone % 100 === 0) {
            this.giveAscensionReward();
        }
    }

    // ==================== 怪物属性计算 ====================

    /**
     * 计算当前怪物血量
     * @returns {number} 怪物血量
     */
    calculateMonsterHealth() {
        // 基础血量
        let baseHealth = 10;
        
        // 区域难度加成
        const zoneMultiplier = Math.pow(this.monsterHealthMultiplier, this.currentZone - 1);
        
        // 关卡加成
        const levelMultiplier = 1 + (this.currentLevel - 1) * 0.1;
        
        // Boss血量加成
        const bossMultiplier = this.isBossFight ? 10 : 1;

        // 世界难度加成
        const worldData = this.getCurrentWorldData();
        const worldMultiplier = worldData ? worldData.difficulty : 1;

        // 转生难度加成
        const ascensionMultiplier = 1 + this.ascensionLevel * 0.1;

        let health = baseHealth * zoneMultiplier * levelMultiplier * bossMultiplier * worldMultiplier * ascensionMultiplier;

        return Math.max(1, Math.floor(health));
    }

    /**
     * 计算当前怪物金币奖励
     * @returns {number} 金币奖励
     */
    calculateMonsterGold() {
        // 基础金币
        let baseGold = 1;
        
        // 区域金币加成
        const zoneMultiplier = Math.pow(this.goldMultiplier, this.currentZone - 1);
        
        // Boss金币加成
        const bossMultiplier = this.isBossFight ? 10 : 1;

        let gold = baseGold * zoneMultiplier * bossMultiplier;

        return Math.max(1, Math.floor(gold));
    }

    /**
     * 计算难度系数
     */
    calculateDifficulty() {
        // 难度随区域增长
        this.zoneDifficulty = 1 + (this.currentZone - 1) * 0.05;
    }

    // ==================== 转生系统 ====================

    /**
     * 检查是否可以转生
     * @returns {boolean} 是否可以转生
     */
    canAscend() {
        return this.currentZone >= this.ascensionZone;
    }

    /**
     * 执行转生
     * @returns {Object} 转生结果
     */
    ascend() {
        if (!this.canAscend()) {
            return { success: false, error: 'Zone requirement not met' };
        }

        // 计算获得的英雄之魂
        const soulsGained = this.calculateHeroSouls();

        // 保存转生前数据
        const ascensionData = {
            ascensionLevel: this.ascensionLevel,
            highestZone: this.highestZone,
            heroSouls: this.heroSouls
        };

        // 增加转生等级
        this.ascensionLevel++;
        this.heroSouls += soulsGained;

        // 重置游戏进度
        this.resetProgress();

        // 应用转生加成
        this.applyAscensionBonuses();

        // 触发转生效果
        if (this.game.uiManager) {
            this.game.uiManager.showAscensionEffect(soulsGained);
        }

        return {
            success: true,
            soulsGained: soulsGained,
            totalSouls: this.heroSouls,
            ascensionLevel: this.ascensionLevel
        };
    }

    /**
     * 计算可获得的英雄之魂
     * @returns {number} 英雄之魂数量
     */
    calculateHeroSouls() {
        // 基础英雄之魂
        let souls = Math.floor(this.currentZone / 100);

        // 根据英雄等级额外计算
        if (this.game.heroes) {
            this.game.heroes.forEach(hero => {
                if (hero.level > 200) {
                    souls += Math.floor((hero.level - 200) / 10);
                }
            });
        }

        // 转生等级加成
        souls = Math.floor(souls * (1 + this.ascensionLevel * 0.1));

        return Math.max(1, souls);
    }

    /**
     * 给予转生奖励
     */
    giveAscensionReward() {
        // 每100区域给予额外英雄之魂
        const bonusSouls = Math.floor(this.currentZone / 100);
        this.heroSouls += bonusSouls;

        if (this.game.uiManager) {
            this.game.uiManager.showBonusSouls(bonusSouls);
        }
    }

    /**
     * 应用转生加成
     */
    applyAscensionBonuses() {
        // 每个英雄之魂提供10% DPS加成
        const dpsBonus = 1 + (this.heroSouls * 0.1);
        this.game.dpsMultiplier = (this.game.dpsMultiplier || 1) * dpsBonus;
    }

    /**
     * 重置进度（转生时调用）
     */
    resetProgress() {
        this.currentZone = 1;
        this.currentLevel = 1;
        this.highestZone = 1;
        this.bossAttempts = 0;
        this.resetBossState();

        // 重置世界
        this.currentWorld = 1;

        // 重置战斗系统
        if (this.game.combatSystem) {
            this.game.combatSystem.reset();
        }

        // 重置升级系统
        if (this.game.upgradeSystem) {
            this.game.upgradeSystem.reset();
        }

        // 重置英雄
        if (this.game.heroes) {
            this.game.heroes.forEach(hero => {
                hero.level = 0;
                hero.unlocked = false;
                hero.dpsMultiplier = 1;
            });
        }

        // 重置金币
        this.game.gold = 0;

        // 生成新怪物
        this.game.spawnMonster();
    }

    // ==================== 世界系统 ====================

    /**
     * 检查世界解锁
     */
    checkWorldUnlock() {
        for (const world of this.worlds) {
            if (this.currentZone >= world.unlockZone && this.currentWorld < world.id) {
                this.currentWorld = world.id;
                
                // 触发世界解锁效果
                if (this.game.uiManager) {
                    this.game.uiManager.showWorldUnlock(world);
                }

                this.game.triggerEvent('worldUnlocked', { world });
            }
        }
    }

    /**
     * 获取当前世界数据
     * @returns {Object|null} 世界数据
     */
    getCurrentWorldData() {
        return this.worlds.find(w => w.id === this.currentWorld);
    }

    // ==================== 里程碑 ====================

    /**
     * 检查里程碑
     */
    checkMilestones() {
        for (const milestone of this.zoneMilestones) {
            if (this.highestZone >= milestone && !this.achievedMilestones.includes(milestone)) {
                this.achievedMilestones.push(milestone);
                this.onMilestoneReached(milestone);
            }
        }
    }

    /**
     * 里程碑达成
     * @param {number} milestone - 里程碑数值
     */
    onMilestoneReached(milestone) {
        // 给予里程碑奖励
        const reward = this.calculateMilestoneReward(milestone);
        this.game.addGold(reward);

        // 触发效果
        if (this.game.uiManager) {
            this.game.uiManager.showMilestone(milestone, reward);
        }

        this.game.triggerEvent('milestoneReached', { milestone, reward });
    }

    /**
     * 计算里程碑奖励
     * @param {number} milestone - 里程碑数值
     * @returns {number} 奖励金币
     */
    calculateMilestoneReward(milestone) {
        return milestone * 100;
    }

    // ==================== 离线进度 ====================

    /**
     * 计算离线进度
     * @param {number} lastSaveTime - 上次保存时间戳
     * @returns {Object} 离线进度结果
     */
    calculateOfflineProgress(lastSaveTime) {
        if (!this.offlineProgressEnabled || !lastSaveTime) {
            return { enabled: false };
        }

        const now = Date.now();
        const offlineTime = Math.min(now - lastSaveTime, this.maxOfflineTime);
        
        if (offlineTime < 60000) { // 少于1分钟不计算
            return { enabled: true, time: offlineTime, significant: false };
        }

        // 计算离线期间的DPS
        const dps = this.game.combatSystem ? this.game.combatSystem.totalDPS : 0;
        
        if (dps <= 0) {
            return { enabled: true, time: offlineTime, goldEarned: 0, monstersKilled: 0 };
        }

        // 计算平均怪物血量
        const avgMonsterHealth = this.calculateMonsterHealth();
        
        // 计算可击杀的怪物数
        const totalDamage = dps * (offlineTime / 1000);
        const monstersKilled = Math.floor(totalDamage / avgMonsterHealth);
        
        // 计算获得的金币
        const avgGold = this.calculateMonsterGold();
        const goldEarned = monstersKilled * avgGold;

        // 发放离线收益
        this.game.addGold(goldEarned);

        // 更新统计
        if (this.game.combatSystem) {
            this.game.combatSystem.monstersKilled += monstersKilled;
            this.game.combatSystem.totalDamageDealt += totalDamage;
        }

        return {
            enabled: true,
            time: offlineTime,
            goldEarned: goldEarned,
            monstersKilled: monstersKilled,
            dps: dps
        };
    }

    // ==================== 事件处理 ====================

    /**
     * 区域推进时调用
     */
    onZoneAdvanced() {
        if (this.game.uiManager) {
            this.game.uiManager.showZoneNotification(this.currentZone);
        }

        this.game.triggerEvent('zoneAdvanced', {
            zone: this.currentZone,
            highestZone: this.highestZone
        });
    }

    // ==================== 辅助方法 ====================

    /**
     * 获取进度信息
     * @returns {Object} 进度信息
     */
    getProgressInfo() {
        return {
            currentZone: this.currentZone,
            currentLevel: this.currentLevel,
            highestZone: this.highestZone,
            monstersPerZone: this.monstersPerZone,
            isBossFight: this.isBossFight,
            bossTimer: this.bossTimer,
            bossTimeLimit: this.bossTimeLimit,
            ascensionLevel: this.ascensionLevel,
            heroSouls: this.heroSouls,
            canAscend: this.canAscend(),
            currentWorld: this.currentWorld,
            worldName: this.getCurrentWorldData()?.name || '未知世界',
            zoneDifficulty: this.zoneDifficulty
        };
    }

    /**
     * 获取区域完成进度
     * @returns {number} 完成百分比 (0-1)
     */
    getZoneProgress() {
        return this.currentLevel / this.monstersPerZone;
    }

    /**
     * 获取Boss战剩余时间百分比
     * @returns {number} 剩余百分比 (0-1)
     */
    getBossTimePercent() {
        if (!this.isBossFight) return 0;
        return this.bossTimer / this.bossTimeLimit;
    }

    // ==================== 序列化 ====================

    /**
     * 序列化进度系统数据
     * @returns {Object} 序列化数据
     */
    serialize() {
        return {
            currentZone: this.currentZone,
            currentLevel: this.currentLevel,
            highestZone: this.highestZone,
            ascensionLevel: this.ascensionLevel,
            heroSouls: this.heroSouls,
            bossAttempts: this.bossAttempts,
            achievedMilestones: this.achievedMilestones,
            currentWorld: this.currentWorld
        };
    }

    /**
     * 反序列化进度系统数据
     * @param {Object} data - 序列化数据
     */
    deserialize(data) {
        if (!data) return;

        this.currentZone = data.currentZone || 1;
        this.currentLevel = data.currentLevel || 1;
        this.highestZone = data.highestZone || 1;
        this.ascensionLevel = data.ascensionLevel || 0;
        this.heroSouls = data.heroSouls || 0;
        this.bossAttempts = data.bossAttempts || 0;
        this.achievedMilestones = data.achievedMilestones || [];
        this.currentWorld = data.currentWorld || 1;

        this.calculateDifficulty();
    }

    /**
     * 重置进度系统
     */
    reset() {
        this.currentZone = 1;
        this.currentLevel = 1;
        this.highestZone = 1;
        this.ascensionLevel = 0;
        this.heroSouls = 0;
        this.bossAttempts = 0;
        this.achievedMilestones = [];
        this.currentWorld = 1;
        this.resetBossState();
        this.calculateDifficulty();
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressSystem;
}
