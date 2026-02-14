/**
 * Dungeon Class - 副本系统管理
 * 
 * 战斗模式：数值压缩模式敌人
 * - 使用对数压缩处理极大数值
 * - 玩家攻击压缩：(log10(攻击))^2
 * - 敌人伤害换算：伤害比例 = 敌人攻击 / 玩家压缩生命
 */

class Dungeon {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.tier = 1;      // 副本层数 T1, T2, T3...
        this.level = 1;     // 副本难度等级
        this.wave = 0;
        this.waves = [
            [{ type: 'mob', count: 10, delay: 0 }],
            [{ type: 'elite', count: 3, delay: 3000 }], 
            [{ type: 'boss', count: 1, delay: 3000 }]
        ];
        this.timer = null;
        this.autoRestartTimer = null;
        this.timeRemaining = 0;
        this.spawnEventsScheduled = 0;
        this.spawnEventsCompleted = 0;
    }

    // 检查指定层数是否已解锁
    isUnlocked(tier) {
        const required = getDungeonUnlockRequirement(tier);
        return this.game.difficulty >= required;
    }

    // 获取当前已解锁的最高层数
    getMaxUnlockedTier() {
        for (let t = MAX_DUNGEON_TIER; t >= 1; t--) {
            if (this.isUnlocked(t)) return t;
        }
        return 0;
    }

    // 获取解锁下一层所需的主线层数
    getNextUnlockRequirement() {
        const nextTier = this.getMaxUnlockedTier() + 1;
        if (nextTier > MAX_DUNGEON_TIER) return null;
        return getDungeonUnlockRequirement(nextTier);
    }

    start() {
        this.active = true;
        // 副本难度 = 层数（T1=1, T2=2, T3=3...）
        // 与主线难度完全独立
        this.level = this.tier; 
        this.wave = 0;
        this.game.enemies = [];
        this.spawnEventsScheduled = 0;
        this.spawnEventsCompleted = 0;
        this.nextWave();
        this.updateUI();
    }

    stop() {
        this.active = false;
        clearTimeout(this.timer);
        clearTimeout(this.autoRestartTimer);
        this.game.enemies = [];
        this.timeRemaining = 0;
        this.updateUI();
    }

    nextWave() {
        if (this.wave >= this.waves.length) {
            this.victory();
            return;
        }
        
        const waveEvents = this.waves[this.wave];
        this.spawnEventsScheduled = waveEvents.length;
        this.spawnEventsCompleted = 0;

        this.game.log('SYS', `副本波次 ${this.wave + 1}/${this.waves.length} 开始...`);

        waveEvents.forEach(event => {
            setTimeout(() => {
                if(!this.active) return;
                for(let i=0; i<event.count; i++) {
                    this.spawnEnemy(event.type);
                }
                this.spawnEventsCompleted++;
                this.checkWaveClear(); 
            }, event.delay);
        });
        this.updateUI();
    }

    checkWaveClear() {
        if (!this.active) return;
        
        if (this.game.enemies.length === 0 && this.spawnEventsCompleted >= this.spawnEventsScheduled) {
            this.wave++;
            this.nextWave();
        }
    }

    spawnEnemy(typeKey) {
        const conf = DUNGEON_TYPES.find(d => d.type === typeKey);
        if(!conf) return;

        let isBoss = (typeKey === 'boss');
        
        let atkScale, hpScale;

        if (this.level === 1) {
            atkScale = Math.pow(DUNGEON_N1_MULT, 2);
            hpScale = Math.pow(DUNGEON_N1_MULT, 2);
        } else {
            atkScale = Math.pow((this.level - 1) * DUNGEON_ATK_INC, 2);
            hpScale = Math.pow((this.level - 1) * DUNGEON_HP_INC, 2);
        }

        if(atkScale < 1) atkScale = 1;
        if(hpScale < 1) hpScale = 1;

        let baseHp = new BigNum(conf.baseHp).mul(hpScale);
        let baseAtk = new BigNum(conf.baseAtk).mul(atkScale);
        
        this.game.enemies.push({
            id: `dungeon-${Date.now()}-${Math.random()}`,
            name: conf.name,
            maxHp: baseHp,
            currentHp: baseHp,
            atk: baseAtk,
            isBoss: isBoss,
            isDungeon: true,
            emoji: isBoss ? '👿' : (typeKey==='elite'?'👺':'💀')
        });
        this.game.updateCombatUI(true);
    }

    victory() {
        this.game.log('SYS', `副本通关！30秒后开启下一轮。`);
        this.game.log('SYS', `获得宝箱！可在秘宝阁开启。`);
        this.game.treasureChests++; 
        this.active = false; 
        this.game.updateSystemUI();
        
        this.timeRemaining = 30;
        this.startCountdown(() => {
            if(this.game.mode === 'dungeon') {
                this.game.difficulty++; 
                this.start();
            }
        });
    }

    startCountdown(callback) {
        clearInterval(this.autoRestartTimer);
        this.autoRestartTimer = setInterval(() => {
            if (this.timeRemaining > 0) {
                this.timeRemaining--;
                this.updateUI();
            } else {
                clearInterval(this.autoRestartTimer);
                callback();
            }
        }, 1000);
    }

    updateUI() {
        const statusEl = document.getElementById('dungeon-status');
        const timerEl = document.getElementById('dungeon-timer');
        const tierEl = document.getElementById('dungeon-tier');
        const tierInput = document.getElementById('dungeon-tier-input');
        
        if (statusEl) {
            if (!this.isUnlocked(this.tier)) {
                statusEl.innerText = `🔒 需主线N${getDungeonUnlockRequirement(this.tier)}`;
            } else {
                statusEl.innerText = this.active ? `波次 ${Math.min(this.wave+1, 3)}/3` : "待机";
            }
        }
        if (timerEl) timerEl.innerText = this.timeRemaining > 0 ? `${this.timeRemaining}s` : "--";
        if (tierEl) tierEl.innerText = `T${this.tier}`;
        if (tierInput) tierInput.value = this.tier;
        
        // 更新层数选择UI
        this.updateTierUI();
    }

    // 新的层数选择UI更新
    updateTierUI() {
        const input = document.getElementById('dungeon-tier-input');
        const hintEl = document.getElementById('dungeon-unlock-hint');
        const recommendEl = document.getElementById('dungeon-recommend-tier');
        
        if (input) {
            // 检查当前输入的层数是否解锁
            const inputTier = parseInt(input.value) || 1;
            if (!this.isUnlocked(inputTier)) {
                input.style.borderColor = '#f87171'; // 红色边框表示未解锁
                if (hintEl) {
                    hintEl.innerText = `🔒 T${inputTier}需主线N${getDungeonUnlockRequirement(inputTier)}解锁`;
                }
            } else {
                input.style.borderColor = this.tier === inputTier ? '#4ade80' : '#444'; // 绿色表示当前选中
                if (hintEl) hintEl.innerText = '';
            }
        }
        
        // 更新推荐层数
        if (recommendEl) {
            const recommended = this.calculateRecommendedTier();
            recommendEl.innerText = `💡 推荐层数: T${recommended} (基于您当前的实力)`;
        }
    }

    // 计算推荐层数 - 基于玩家当前实力
    calculateRecommendedTier() {
        // 获取玩家总属性
        const stats = this.game.getTotalStats();
        const playerAtk = stats.atk;
        const playerHp = stats.maxHp;
        
        // 使用对数计算玩家实力指数
        // log10(攻击) + log10(生命) / 2
        const playerPower = Math.log10(playerAtk.m) + playerAtk.e + 
                           (Math.log10(playerHp.m) + playerHp.e) / 2;
        
        // 副本难度指数 = T * 0.5 (每增加1层，指数增加0.5)
        // 推荐层数 = (玩家实力指数 - 基础值) / 0.5
        // 基础值设为4 (对应N100左右的玩家)
        const basePower = 4;
        const powerPerTier = 0.5;
        
        let recommendedTier = Math.floor((playerPower - basePower) / powerPerTier);
        
        // 确保在合理范围内
        recommendedTier = Math.max(1, recommendedTier);
        
        // 检查是否解锁
        while (recommendedTier > 1 && !this.isUnlocked(recommendedTier)) {
            recommendedTier--;
        }
        
        return recommendedTier;
    }

    // 从输入框设置层数
    setTierFromInput() {
        const input = document.getElementById('dungeon-tier-input');
        if (!input) return false;
        
        const tier = parseInt(input.value);
        if (isNaN(tier) || tier < 1) {
            this.game.log('SYS', '请输入有效的层数(>=1)');
            return false;
        }
        
        return this.setTier(tier);
    }

    setTier(tier) {
        if (tier < 1 || tier > MAX_DUNGEON_TIER) {
            this.game.log('SYS', `层数必须在1-${MAX_DUNGEON_TIER}之间`);
            return false;
        }
        if (!this.isUnlocked(tier)) {
            this.game.log('SYS', `副本T${tier}需主线N${getDungeonUnlockRequirement(tier)}解锁！`);
            return false;
        }
        this.tier = tier;
        this.updateUI();
        this.game.log('SYS', `已切换到副本T${tier}`);
        return true;
    }
}

// Export for module systems if needed
try {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Dungeon;
    }
} catch (e) {}
