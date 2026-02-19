/**
 * ZhouTianSystem Class - 周天星窍系统（星座图版）
 *
 * 星座图布局：
 * - 中央麒麟（十字形5点）
 * - 四方星座各5点（青龙、朱雀、白虎、玄武）
 *
 * 属性分配：
 * - 青龙：攻击力 ×1.2/窍
 * - 朱雀：生命值 ×1.2/窍
 * - 白虎：装备等级 +2/窍
 * - 玄武：生灵精华 ×1.15/窍
 * - 麒麟：全属性 ×1.1/窍
 */

class ZhouTianSystem {
    constructor(game) {
        this.game = game;

        // 星座图位置配置（用于UI渲染）
        this.constellationLayout = [
            // 东方青龙（左上）
            { sector: 0, positions: [{x:15,y:20}, {x:25,y:15}, {x:35,y:20}, {x:20,y:30}, {x:30,y:30}] },
            // 南方朱雀（右上）
            { sector: 1, positions: [{x:65,y:20}, {x:75,y:15}, {x:85,y:20}, {x:70,y:30}, {x:80,y:30}] },
            // 西方白虎（右下）
            { sector: 2, positions: [{x:65,y:70}, {x:75,y:65}, {x:85,y:70}, {x:70,y:80}, {x:80,y:80}] },
            // 北方玄武（左下）
            { sector: 3, positions: [{x:15,y:70}, {x:25,y:65}, {x:35,y:70}, {x:20,y:80}, {x:30,y:80}] },
            // 中央麒麟（中心十字）
            { sector: 4, positions: [{x:50,y:40}, {x:40,y:50}, {x:50,y:50}, {x:60,y:50}, {x:50,y:60}] }
        ];

        // 星域配置
        this.sectors = ZHOUTIAN_SECTORS;
        this.baseBonuses = ZHOUTIAN_BASE_BONUSES;
        this.qualities = ZHOUTIAN_QUALITIES;

        // 初始化状态
        this.state = {
            level: 1,
            completions: 0,
            marrow: 1000,
            acupoints: Array(25).fill(1), // 25个星窍品质（1-5）
            locks: [],
            preview: { sectorIdx: null, data: null }
        };

        this.washCosts = ZHOUTIAN_WASH_COSTS;
        this.breakthroughActive = false;
        this.logs = [];

        // 选中状态
        this.selectedAcupoint = null;
    }

    // ============ 加成计算 ============

    /**
     * 获取单个星窍的加成
     */
    getAcupointBonus(globalIdx) {
        const sectorIdx = Math.floor(globalIdx / 5);
        const quality = this.state.acupoints[globalIdx];
        const sector = this.sectors[sectorIdx];
        const base = this.baseBonuses[sector.attr];

        // 品质倍率：凡×1, 灵×2, 玄×3, 地×4, 天×5
        const qualityMult = quality;

        if (base.type === 'multiply') {
            // 乘算：基础值 ^ 品质倍率
            return Math.pow(base.value, qualityMult);
        } else {
            // 加算：基础值 × 品质倍率
            return base.value * qualityMult;
        }
    }

    /**
     * 获取星域总加成
     */
    getSectorBonus(sectorIdx) {
        const start = sectorIdx * 5;
        const sector = this.sectors[sectorIdx];
        const base = this.baseBonuses[sector.attr];
        const zhouTianCoeff = this.getZhouTianCoefficient();

        let totalBonus = base.type === 'multiply' ? 1 : 0;

        for (let i = start; i < start + 5; i++) {
            const bonus = this.getAcupointBonus(i);
            if (base.type === 'multiply') {
                totalBonus *= bonus;
            } else {
                totalBonus += bonus;
            }
        }

        // 应用周天系数
        if (base.type === 'multiply') {
            totalBonus *= zhouTianCoeff;
        } else {
            totalBonus *= zhouTianCoeff;
        }

        return {
            value: totalBonus,
            type: base.type,
            suffix: base.suffix,
            desc: base.desc
        };
    }

    /**
     * 获取所有加成
     */
    getAllBonuses() {
        const bonuses = {};
        this.sectors.forEach((sector, idx) => {
            bonuses[sector.attr] = this.getSectorBonus(idx);
        });
        return bonuses;
    }

    /**
     * 获取周天系数
     */
    getZhouTianCoefficient() {
        return 1 + (this.state.level - 1) * 0.5;
    }

    /**
     * 获取指数加成
     */
    getExponentBonus() {
        return this.state.completions * 0.1;
    }

    // ============ 状态查询 ============

    isSectorComplete(sectorIdx) {
        const start = sectorIdx * 5;
        for (let i = start; i < start + 5; i++) {
            if (this.state.acupoints[i] !== 5) return false;
        }
        return true;
    }

    getCompleteSectorCount() {
        let count = 0;
        for (let i = 0; i < 5; i++) {
            if (this.isSectorComplete(i)) count++;
        }
        return count;
    }

    canBreakthrough() {
        return this.state.acupoints.every(q => q === 5);
    }

    // ============ 洗练操作 ============

    getWashCost(sectorIdx) {
        const sectorLocks = this.state.locks.filter(idx =>
            idx >= sectorIdx * 5 && idx < (sectorIdx + 1) * 5
        );
        return this.washCosts[Math.min(sectorLocks.length, 4)];
    }

    startWash(sectorIdx) {
        if (this.state.preview.sectorIdx !== null) return false;
        if (this.breakthroughActive) return false;

        const cost = this.getWashCost(sectorIdx);
        if (this.state.marrow < cost) {
            this.addLog('星髓不足！');
            return false;
        }

        this.state.marrow -= cost;
        this.state.preview.sectorIdx = sectorIdx;
        this.state.preview.data = [];

        for (let i = 0; i < 5; i++) {
            const globalIdx = sectorIdx * 5 + i;
            if (this.state.locks.includes(globalIdx)) {
                this.state.preview.data.push(this.state.acupoints[globalIdx]);
            } else {
                this.state.preview.data.push(Math.floor(Math.random() * 5) + 1);
            }
        }

        this.addLog(`${this.sectors[sectorIdx].name} 洗练预览中...`);
        return true;
    }

    confirmWash(apply) {
        if (this.state.preview.sectorIdx === null) return false;

        const sectorIdx = this.state.preview.sectorIdx;

        if (apply) {
            for (let i = 0; i < 5; i++) {
                this.state.acupoints[sectorIdx * 5 + i] = this.state.preview.data[i];
            }

            // 自动锁定新出的天品
            let newLocked = 0;
            for (let i = 0; i < 5; i++) {
                const globalIdx = sectorIdx * 5 + i;
                const quality = this.state.acupoints[globalIdx];
                if (quality >= 5 && !this.state.locks.includes(globalIdx)) {
                    const sectorLockCount = this.getSectorLockCount(sectorIdx);
                    if (sectorLockCount < 4) {
                        this.state.locks.push(globalIdx);
                        newLocked++;
                    }
                }
            }

            if (newLocked > 0) {
                this.addLog(`${this.sectors[sectorIdx].name} 洗练完成！自动锁定 ${newLocked} 个天品`);
            } else {
                this.addLog(`${this.sectors[sectorIdx].name} 洗练完成！`);
            }

            // 检查是否可以突破，但不自动突破
            if (this.canBreakthrough()) {
                this.addLog('✨ 周天已满，可手动突破！');
            }

            this.applyBonuses();
        } else {
            this.addLog('放弃洗练结果');
        }

        this.state.preview.sectorIdx = null;
        this.state.preview.data = null;
        return true;
    }

    // 获取指定星域的锁定数量
    getSectorLockCount(sectorIdx) {
        return this.state.locks.filter(idx => idx >= sectorIdx * 5 && idx < (sectorIdx + 1) * 5).length;
    }

    toggleLock(index) {
        if (this.state.preview.sectorIdx !== null) return false;
        if (this.breakthroughActive) return false;

        const sectorIdx = Math.floor(index / 5);
        const idx = this.state.locks.indexOf(index);

        if (idx > -1) {
            // 解锁
            this.state.locks.splice(idx, 1);
        } else {
            // 锁定 - 每个区域最多4个
            const sectorLockCount = this.getSectorLockCount(sectorIdx);
            if (sectorLockCount >= 4) {
                this.addLog(`${this.sectors[sectorIdx].name}最多锁定4个星窍！`);
                return false;
            }
            this.state.locks.push(index);
        }

        return true;
    }

    // ============ 周天突破 ============

    triggerBreakthrough() {
        if (this.breakthroughActive) {
            this.addLog('突破进行中，请稍候...');
            return false;
        }
        if (!this.canBreakthrough()) {
            this.addLog('未达到突破条件！');
            return false;
        }
        this.breakthroughActive = true;

        setTimeout(() => {
            this.state.level++;
            this.state.completions++;
            // 重置星窍为凡品，但属性保留（基于新的周天系数）
            this.state.acupoints.fill(1);
            this.state.locks = [];

            this.addLog(`🎉 周天大圆满！进入第 ${this.state.level} 周天！`);
            this.addLog(`✨ 获得指数加成 +0.1%，当前总加成 +${this.getExponentBonus().toFixed(1)}%`);
            this.addLog('🔄 星窍已重置，继续洗练以提升属性');

            this.breakthroughActive = false;
            this.applyBonuses();

            if (this.game.updateZhouTianUI) {
                this.game.updateZhouTianUI();
            }
        }, 2000);
        return true;
    }

    // ============ 资源管理 ============

    addMarrow(amount) {
        // 玄武加成应用于获取
        const xuanwuBonus = this.getSectorBonus(3);
        const actualAmount = Math.floor(amount * (xuanwuBonus.type === 'multiply' ? xuanwuBonus.value : 1));

        this.state.marrow += actualAmount;
        return actualAmount;
    }

    consumeMarrow(amount) {
        if (this.state.marrow < amount) return false;
        this.state.marrow -= amount;
        return true;
    }

    // ============ 加成应用 ============

    applyBonuses() {
        if (!this.game) return;

        const bonuses = this.getAllBonuses();

        this.game.zhouTianBonuses = {
            attack: bonuses.attack.value,
            health: bonuses.health.value,
            equipLevel: bonuses.equipLevel.value,
            lifeEssence: bonuses.lifeEssence.value,
            allStats: bonuses.allStats.value
        };

        this.game.zhouTianExponentBonus = this.getExponentBonus();

        if (this.game.updateStatsUI) {
            this.game.updateStatsUI();
        }
    }

    // ============ 快捷操作 ============

    autoLock(minQuality = 5) {
        let locked = 0;
        for (let sIdx = 0; sIdx < 5; sIdx++) {
            const start = sIdx * 5;
            const sectorLockCount = this.getSectorLockCount(sIdx);
            let availableSlots = 4 - sectorLockCount;

            for (let i = 0; i < 5 && availableSlots > 0; i++) {
                const globalIdx = start + i;
                const quality = this.state.acupoints[globalIdx];

                if (quality >= minQuality && !this.state.locks.includes(globalIdx)) {
                    this.state.locks.push(globalIdx);
                    locked++;
                    availableSlots--;
                }
            }
        }
        return locked;
    }

    autoWash(sectorIdx, targetQuality = 5) {
        let attempts = 0;
        const maxAttempts = 200;

        while (attempts < maxAttempts) {
            // 检查是否已全部达标
            const allComplete = this.isSectorComplete(sectorIdx);
            if (allComplete) {
                this.addLog(`${this.sectors[sectorIdx].name} 已全满！`);
                return true;
            }

            const cost = this.getWashCost(sectorIdx);
            if (this.state.marrow < cost) {
                this.addLog('星髓不足，自动洗练停止');
                break;
            }

            this.state.marrow -= cost;
            const newQualities = [];

            // 洗练：锁定的保留，未锁定的随机
            for (let i = 0; i < 5; i++) {
                const globalIdx = sectorIdx * 5 + i;
                if (this.state.locks.includes(globalIdx)) {
                    newQualities.push(this.state.acupoints[globalIdx]);
                } else {
                    newQualities.push(Math.floor(Math.random() * 5) + 1);
                }
            }

            // 应用新品质
            for (let i = 0; i < 5; i++) {
                this.state.acupoints[sectorIdx * 5 + i] = newQualities[i];
            }

            attempts++;

            // 洗出天品就自动锁定（如果还有槽位）
            let newLocked = 0;
            for (let i = 0; i < 5; i++) {
                const globalIdx = sectorIdx * 5 + i;
                if (newQualities[i] >= targetQuality && !this.state.locks.includes(globalIdx)) {
                    const sectorLockCount = this.getSectorLockCount(sectorIdx);
                    if (sectorLockCount < 4) {
                        this.state.locks.push(globalIdx);
                        newLocked++;
                    }
                }
            }

            // 如果全部达标，结束
            if (newQualities.every(q => q >= targetQuality)) {
                this.addLog(`${this.sectors[sectorIdx].name} 自动洗练完成，共${attempts}次`);
                this.applyBonuses();
                return true;
            }
        }

        this.addLog(`${this.sectors[sectorIdx].name} 自动洗练${attempts}次，未达成目标`);
        this.applyBonuses();
        return false;
    }

    // ============ 日志 ============

    addLog(msg) {
        const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        this.logs.unshift(`[${time}] ${msg}`);
        if (this.logs.length > 20) this.logs.pop();
    }

    // ============ 序列化 ============

    serialize() {
        return {
            level: this.state.level,
            completions: this.state.completions,
            marrow: this.state.marrow,
            acupoints: this.state.acupoints,
            locks: this.state.locks
        };
    }

    load(data) {
        if (!data) return;
        if (data.level !== undefined) this.state.level = data.level;
        if (data.completions !== undefined) this.state.completions = data.completions;
        if (data.marrow !== undefined) this.state.marrow = data.marrow;
        if (data.acupoints) this.state.acupoints = data.acupoints;
        if (data.locks) this.state.locks = data.locks;
        this.applyBonuses();
    }
}

// Export
try {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { ZhouTianSystem };
    }
} catch (e) {}
