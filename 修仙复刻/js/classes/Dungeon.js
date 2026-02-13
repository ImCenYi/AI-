/**
 * Dungeon Class - Dungeon system management
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
        // 副本难度 = 基础难度 * 层数倍率
        this.level = this.game.difficulty * this.tier; 
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
        
        if (statusEl) {
            if (!this.isUnlocked(this.tier)) {
                statusEl.innerText = `🔒 需主线N${getDungeonUnlockRequirement(this.tier)}`;
            } else {
                statusEl.innerText = this.active ? `波次 ${Math.min(this.wave+1, 3)}/3` : "待机";
            }
        }
        if (timerEl) timerEl.innerText = this.timeRemaining > 0 ? `${this.timeRemaining}s` : "--";
        if (tierEl) tierEl.innerText = `T${this.tier}`;
        
        // 更新层数选择按钮状态
        this.updateTierButtons();
    }

    updateTierButtons() {
        for (let t = 1; t <= MAX_DUNGEON_TIER; t++) {
            const btn = document.getElementById(`dungeon-tier-${t}`);
            if (btn) {
                const unlocked = this.isUnlocked(t);
                btn.classList.toggle('locked', !unlocked);
                btn.classList.toggle('active', this.tier === t && unlocked);
                btn.disabled = !unlocked;
            }
        }
    }

    setTier(tier) {
        if (tier < 1 || tier > MAX_DUNGEON_TIER) return false;
        if (!this.isUnlocked(tier)) {
            this.game.log('SYS', `副本T${tier}需主线N${getDungeonUnlockRequirement(tier)}解锁！`);
            return false;
        }
        this.tier = tier;
        this.updateUI();
        return true;
    }
}

// Export for module systems if needed
try {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Dungeon;
    }
} catch (e) {}
