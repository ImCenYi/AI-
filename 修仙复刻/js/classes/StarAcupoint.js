/**
 * 周天星窍系统 - 无限循环突破式养成
 * 36个星窍，追求全UR品质，达成后突破周天，基础×2重置
 */
class StarAcupointSystem {
    constructor(game) {
        this.game = game;
        
        // 当前周天（突破次数）
        this.zhouTian = 1;
        
        // 36个星窍品质（1-9，1=凡，9=神/UR）
        this.acupoints = new Array(36).fill(1);
        
        // 星髓材料
        this.starMarrow = new BigNum(1000);
        
        // 洗练预览
        this.preview = null;
        
        // 锁定的星窍索引
        this.lockedIndices = new Set();
        
        // 洗练基础消耗
        this.baseCost = 100;
        
        // 品质配置
        this.qualities = [
            { name: '凡', color: '#888', multiplier: 1 },      // 1
            { name: '灵', color: '#4caf50', multiplier: 3 },   // 2
            { name: '玄', color: '#2196f3', multiplier: 9 },   // 3
            { name: '地', color: '#9c27b0', multiplier: 27 },  // 4
            { name: '天', color: '#ff9800', multiplier: 81 },  // 5
            { name: '圣', color: '#f44336', multiplier: 243 }, // 6
            { name: '道', color: '#ffeb3b', multiplier: 729 }, // 7
            { name: '仙', color: '#00bcd4', multiplier: 2187 },// 8
            { name: '神', color: '#ffffff', multiplier: 6561 } // 9 (UR)
        ];
        
        // 洗练品质权重
        this.qualityWeights = [40, 25, 15, 10, 6, 3, 0.8, 0.15, 0.05];
        
        // 最大锁定数
        this.maxLocks = 3;
        
        // 矿脉系统
        this.mine = new StarMine(this);
    }
    
    /**
     * 获取星窍品质信息
     */
    getQualityInfo(level) {
        return this.qualities[level - 1] || this.qualities[0];
    }
    
    /**
     * 随机品质（按权重）
     */
    randomQuality() {
        const total = this.qualityWeights.reduce((a, b) => a + b, 0);
        let roll = Math.random() * total;
        
        for (let i = 0; i < this.qualityWeights.length; i++) {
            roll -= this.qualityWeights[i];
            if (roll <= 0) return i + 1;
        }
        return 1;
    }
    
    /**
     * 计算洗练消耗
     */
    calculateCost() {
        return this.baseCost + this.lockedIndices.size * 80;
    }
    
    /**
     * 洗练（悟道）
     */
    enlighten() {
        const cost = this.calculateCost();
        if (this.starMarrow.lt(cost)) {
            return { success: false, message: '星髓不足' };
        }
        
        // 扣除材料
        this.starMarrow = this.starMarrow.sub(cost);
        
        // 生成新结果
        const newAcupoints = this.acupoints.map((q, i) => {
            if (this.lockedIndices.has(i)) return q;
            return this.randomQuality();
        });
        
        this.preview = newAcupoints;
        
        return { 
            success: true, 
            message: '悟道完成，请查看结果',
            newAcupoints: newAcupoints
        };
    }
    
    /**
     * 确认替换
     */
    confirmReplace() {
        if (!this.preview) return { success: false, message: '没有可替换的结果' };
        
        this.acupoints = this.preview;
        this.preview = null;
        
        // 检查是否可以突破
        const breakthrough = this.checkBreakthrough();
        
        return { 
            success: true, 
            message: '已替换新结果',
            breakthrough: breakthrough
        };
    }
    
    /**
     * 放弃预览
     */
    discardPreview() {
        this.preview = null;
        return { success: true, message: '已放弃本次悟道结果' };
    }
    
    /**
     * 检查是否可以突破
     */
    checkBreakthrough() {
        return this.acupoints.every(q => q === 9);
    }
    
    /**
     * 突破周天
     */
    breakthrough() {
        if (!this.checkBreakthrough()) {
            return { success: false, message: '未达到突破条件' };
        }
        
        this.zhouTian++;
        this.acupoints.fill(1);
        this.preview = null;
        this.lockedIndices.clear();
        
        return { 
            success: true, 
            message: `突破成功！进入第${this.zhouTian}周天！`,
            zhouTian: this.zhouTian
        };
    }
    
    /**
     * 切换锁定状态
     */
    toggleLock(index) {
        if (this.lockedIndices.has(index)) {
            this.lockedIndices.delete(index);
            return { locked: false, count: this.lockedIndices.size };
        } else {
            if (this.lockedIndices.size >= this.maxLocks) {
                return { locked: false, count: this.lockedIndices.size, message: '已达到最大锁定数' };
            }
            this.lockedIndices.add(index);
            return { locked: true, count: this.lockedIndices.size };
        }
    }
    
    /**
     * 一键锁定最高品质
     */
    autoLockHighest() {
        this.lockedIndices.clear();
        
        // 按品质排序，取前3个
        const indexed = this.acupoints.map((q, i) => ({ q, i }));
        indexed.sort((a, b) => b.q - a.q);
        
        for (let i = 0; i < Math.min(3, indexed.length); i++) {
            this.lockedIndices.add(indexed[i].i);
        }
        
        return { count: this.lockedIndices.size };
    }
    
    /**
     * 清除所有锁定
     */
    clearLocks() {
        this.lockedIndices.clear();
    }
    
    /**
     * 获取神窍数量
     */
    getGodCount() {
        return this.acupoints.filter(q => q === 9).length;
    }
    
    /**
     * 获取突破进度
     */
    getProgress() {
        return this.getGodCount() / 36;
    }
    
    /**
     * 计算总倍率
     */
    getMultiplier() {
        // 基础倍率：2^(周天-1)
        const base = Math.pow(2, this.zhouTian - 1);
        
        // 星窍倍率总和
        let acupointSum = 0;
        for (let q of this.acupoints) {
            acupointSum += this.qualities[q - 1].multiplier;
        }
        
        return base * acupointSum;
    }
    
    /**
     * 计算对战斗属性的加成
     */
    getBattleBonus() {
        const multiplier = this.getMultiplier();
        return {
            atk: multiplier,
            hp: multiplier,
            def: multiplier
        };
    }
    
    /**
     * 添加星髓
     */
    addStarMarrow(amount) {
        this.starMarrow = this.starMarrow.add(amount);
    }
    
    /**
     * 序列化
     */
    serialize() {
        return {
            zhouTian: this.zhouTian,
            acupoints: this.acupoints,
            starMarrow: this.starMarrow.serialize(),
            lockedIndices: Array.from(this.lockedIndices)
        };
    }
    
    /**
     * 反序列化
     */
    deserialize(data) {
        if (data.zhouTian) this.zhouTian = data.zhouTian;
        if (data.acupoints) this.acupoints = data.acupoints;
        if (data.starMarrow) this.starMarrow = BigNum.from(data.starMarrow);
        if (data.lockedIndices) this.lockedIndices = new Set(data.lockedIndices);
    }
}

/**
 * 星髓矿脉副本
 */
class StarMine {
    constructor(starSystem) {
        this.starSystem = starSystem;
        
        // 当前深度
        this.depth = 0;
        
        // 已获得星髓
        this.collected = new BigNum(0);
        
        // 今日次数
        this.dailyAttempts = 3;
        this.maxDailyAttempts = 3;
        
        // 坍塌概率
        this.collapseChance = 0.10;
        
        // 每层奖励
        this.rewardPerFloor = 100;
        
        // 是否正在探险
        this.isExploring = false;
    }
    
    /**
     * 开始/继续探险
     */
    explore() {
        if (this.dailyAttempts <= 0) {
            return { success: false, message: '今日次数已用完' };
        }
        
        if (!this.isExploring) {
            this.isExploring = true;
            this.depth = 0;
            this.collected = new BigNum(0);
        }
        
        // 判定坍塌
        if (Math.random() < this.collapseChance) {
            // 坍塌！损失50%
            const lost = this.collected.mul(0.5);
            this.collected = this.collected.sub(lost);
            this.isExploring = false;
            this.dailyAttempts--;
            
            return {
                success: false,
                collapsed: true,
                depth: this.depth,
                collected: this.collected,
                lost: lost,
                message: `坍塌！损失${lost.format()}星髓，只保留了${this.collected.format()}`
            };
        }
        
        // 成功深入
        this.depth++;
        this.collected = this.collected.add(this.rewardPerFloor);
        
        return {
            success: true,
            depth: this.depth,
            collected: this.collected,
            message: `深入${this.depth}层，获得${this.collected.format()}星髓`
        };
    }
    
    /**
     * 见好就收
     */
    cashOut() {
        if (!this.isExploring) {
            return { success: false, message: '未在探险中' };
        }
        
        this.starSystem.addStarMarrow(this.collected);
        const amount = this.collected;
        this.isExploring = false;
        this.dailyAttempts--;
        
        return {
            success: true,
            collected: amount,
            message: `收获${amount.format()}星髓！`
        };
    }
    
    /**
     * 重置每日次数
     */
    resetDaily() {
        this.dailyAttempts = this.maxDailyAttempts;
        this.isExploring = false;
        this.depth = 0;
        this.collected = new BigNum(0);
    }
    
    /**
     * 序列化
     */
    serialize() {
        return {
            dailyAttempts: this.dailyAttempts,
            maxDepth: this.depth  // 记录历史最大深度
        };
    }
    
    deserialize(data) {
        if (data.dailyAttempts !== undefined) this.dailyAttempts = data.dailyAttempts;
    }
}
