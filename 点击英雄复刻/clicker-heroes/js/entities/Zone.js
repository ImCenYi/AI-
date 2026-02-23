/**
 * Zone.js - 区域类
 * 
 * 负责管理游戏中的区域/关卡系统，包括怪物生成、进度追踪、Boss战等
 * 每5个区域会出现一个Boss区域
 */

class Zone {
    /**
     * 创建一个新的区域实例
     * @param {number} zoneNumber - 区域编号（从1开始）
     */
    constructor(zoneNumber) {
        // 区域编号
        this.zoneNumber = zoneNumber;
        
        // 当前区域已击杀的怪物数量
        this.monstersKilled = 0;
        
        // 每个区域的怪物数量（普通区域10个，Boss区域1个）
        this.monstersPerZone = 10;
        
        // 判断是否为Boss区域（每5个区域，且区域号>=5）
        this.isBossZone = zoneNumber % 5 === 0 && zoneNumber >= 5;
        
        // Boss战计时器（秒）
        this.bossTimer = 30;
        
        // 当前Boss战剩余时间
        this.currentBossTime = this.bossTimer;
        
        // 当前怪物
        this.currentMonster = null;
        
        // 区域是否已完成
        this.isComplete = false;
    }

    /**
     * 生成新怪物
     * 普通区域生成普通怪物，Boss区域生成Boss
     * @returns {Monster} 新生成的怪物
     */
    spawnMonster() {
        // 如果是Boss区域且是第10个怪物（最后一个），生成Boss
        const isBoss = this.isBossZone && this.monstersKilled === this.monstersPerZone - 1;
        
        // 创建新怪物
        this.currentMonster = new Monster(this.zoneNumber, isBoss);
        
        // 如果是Boss，重置计时器
        if (isBoss) {
            this.currentBossTime = this.bossTimer;
        }
        
        return this.currentMonster;
    }

    /**
     * 获取当前怪物
     * 如果没有当前怪物，则生成一个新怪物
     * @returns {Monster} 当前怪物
     */
    getCurrentMonster() {
        if (!this.currentMonster || this.currentMonster.isDead()) {
            return this.spawnMonster();
        }
        return this.currentMonster;
    }

    /**
     * 处理怪物死亡事件
     * 更新击杀计数，检查是否可以进入下一区域
     * @returns {Object} 结果对象 { canAdvance: boolean, isZoneComplete: boolean, goldReward: number }
     */
    onMonsterKilled() {
        // 增加击杀计数
        this.monstersKilled++;
        
        // 获取金币奖励
        const goldReward = this.currentMonster ? this.currentMonster.goldReward : 0;
        
        // 清除当前怪物
        this.currentMonster = null;
        
        // 检查是否可以进入下一区域
        const canAdvance = this.canAdvance();
        
        // 检查区域是否完成
        const isZoneComplete = this.monstersKilled >= this.monstersPerZone;
        
        if (isZoneComplete) {
            this.isComplete = true;
        }
        
        return {
            canAdvance: canAdvance,
            isZoneComplete: isZoneComplete,
            goldReward: goldReward,
            monstersRemaining: this.monstersPerZone - this.monstersKilled
        };
    }

    /**
     * 检查是否可以进入下一区域
     * 普通区域：击杀10个怪物
     * Boss区域：击杀Boss（在30秒内）
     * @returns {boolean} 是否可以进入下一区域
     */
    canAdvance() {
        // 普通区域：击杀足够数量的怪物
        if (!this.isBossZone) {
            return this.monstersKilled >= this.monstersPerZone;
        }
        
        // Boss区域：击杀Boss且时间未耗尽
        return this.monstersKilled >= this.monstersPerZone && this.currentBossTime > 0;
    }

    /**
     * 更新Boss计时器
     * 每帧调用，减少剩余时间
     * @param {number} deltaTime - 时间增量（秒）
     * @returns {boolean} 如果Boss时间耗尽返回false
     */
    updateBossTimer(deltaTime) {
        // 只有Boss区域才需要计时
        if (!this.isBossZone) {
            return true;
        }
        
        // 如果Boss已死亡，不需要计时
        if (this.currentMonster && this.currentMonster.isDead()) {
            return true;
        }
        
        // 减少剩余时间
        this.currentBossTime -= deltaTime;
        
        // 检查时间是否耗尽
        if (this.currentBossTime <= 0) {
            this.currentBossTime = 0;
            this.onBossTimerExpired();
            return false;
        }
        
        return true;
    }

    /**
     * Boss时间耗尽时的处理
     * Boss会恢复满血，玩家需要重新挑战
     */
    onBossTimerExpired() {
        // 重置Boss血量
        if (this.currentMonster) {
            this.currentMonster.reset();
        }
        
        // 重置计时器
        this.currentBossTime = this.bossTimer;
        
        // 重置击杀计数（玩家需要重新打这10个怪物）
        this.monstersKilled = 0;
    }

    /**
     * 获取Boss计时器百分比
     * @returns {number} 剩余时间百分比 (0-100)
     */
    getBossTimerPercentage() {
        if (!this.isBossZone) return 100;
        return (this.currentBossTime / this.bossTimer) * 100;
    }

    /**
     * 获取区域进度百分比
     * @returns {number} 进度百分比 (0-100)
     */
    getProgressPercentage() {
        return (this.monstersKilled / this.monstersPerZone) * 100;
    }

    /**
     * 获取区域信息
     * @returns {Object} 区域信息对象
     */
    getInfo() {
        return {
            zoneNumber: this.zoneNumber,
            isBossZone: this.isBossZone,
            monstersKilled: this.monstersKilled,
            monstersPerZone: this.monstersPerZone,
            monstersRemaining: this.monstersPerZone - this.monstersKilled,
            progressPercentage: this.getProgressPercentage(),
            isComplete: this.isComplete,
            bossTimeRemaining: this.isBossZone ? this.currentBossTime : null,
            bossTimerPercentage: this.getBossTimerPercentage()
        };
    }

    /**
     * 重置区域状态
     * 用于重新挑战区域
     */
    reset() {
        this.monstersKilled = 0;
        this.currentBossTime = this.bossTimer;
        this.currentMonster = null;
        this.isComplete = false;
    }

    /**
     * 将区域数据序列化为JSON对象
     * 用于游戏存档
     * @returns {Object} 序列化后的区域数据
     */
    serialize() {
        return {
            zoneNumber: this.zoneNumber,
            monstersKilled: this.monstersKilled,
            monstersPerZone: this.monstersPerZone,
            isBossZone: this.isBossZone,
            bossTimer: this.bossTimer,
            currentBossTime: this.currentBossTime,
            isComplete: this.isComplete,
            currentMonster: this.currentMonster ? this.currentMonster.serialize() : null
        };
    }

    /**
     * 从序列化数据反序列化区域对象
     * 用于加载游戏存档
     * @param {Object} data - 序列化的区域数据
     * @returns {Zone} 反序列化后的区域实例
     */
    static deserialize(data) {
        const zone = new Zone(data.zoneNumber);
        
        // 恢复基础属性
        zone.monstersKilled = data.monstersKilled || 0;
        zone.monstersPerZone = data.monstersPerZone || 10;
        zone.isBossZone = data.isBossZone || false;
        zone.bossTimer = data.bossTimer || 30;
        zone.currentBossTime = data.currentBossTime || zone.bossTimer;
        zone.isComplete = data.isComplete || false;
        
        // 恢复当前怪物
        if (data.currentMonster) {
            zone.currentMonster = Monster.deserialize(data.currentMonster);
        }
        
        return zone;
    }
}

// 导出Zone类（支持ES6模块和CommonJS）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Zone;
}
