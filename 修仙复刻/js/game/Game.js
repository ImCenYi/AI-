/**
 * Game Class - Main game controller
 */

class Game {
    constructor() {
        this.playerBase = { hp: new BigNum(300), atk: new BigNum(50), crit: 0 };
        this.currentHp = new BigNum(300);
        this.difficulty = 1;
        
        this.equipment = {};
        this.equippedTreasures = {}; 
        TREASURE_SLOTS.forEach(s => this.equippedTreasures[s] = null);
        
        this.treasureBag = []; 
        this.treasureChests = 0; // New: Chests from dungeon
        this.treasureDaily = 20; // Keys
        this.treasureLimit = 20;
        this.treasureFragments = new BigNum(0);
        
        this.enemies = []; 
        this.mode = 'wild';
        
        this.lawFragments = new BigNum(0);
        this.cultRound = 0;
        this.cultStep = 0;
        this.lawMultipliers = { atk: new BigNum(1), hp: new BigNum(1) };
        
        this.towerLevel = 0;
        this.dungeon = new Dungeon(this);
        
        // Abyss Relic System (深渊遗宝系统)
        // 先检查配置是否可用
        if (typeof ABYSS_BOSSES === 'undefined') {
            console.error('Game: ABYSS_BOSSES is not defined when initializing abyss system!');
        } else {
            console.log(`Game: ABYSS_BOSSES loaded with ${ABYSS_BOSSES.length} bosses`);
        }
        if (typeof ABYSS_RELIC_POOLS === 'undefined') {
            console.error('Game: ABYSS_RELIC_POOLS is not defined!');
        } else {
            const poolCount = Object.keys(ABYSS_RELIC_POOLS).length;
            const totalRelics = Object.values(ABYSS_RELIC_POOLS).reduce((sum, pool) => sum + (pool?.length || 0), 0);
            console.log(`Game: ABYSS_RELIC_POOLS loaded with ${poolCount} pools, ${totalRelics} relics`);
        }
        
        this.abyssRelic = new AbyssRelic(this);
        this.abyssDungeon = new AbyssDungeon(this);
        this.isAbyssModalOpen = false;
        this.isAbyssCodexModalOpen = false;
        
        // Realm System (境界系统)
        this.realmIndex = 0;  // Current realm level
        this.maxDifficulty = 1; // Historical max difficulty
        this.realmBossActive = false; // Is realm boss currently spawned
        this.realmBossKilled = false; // Has realm boss been killed this difficulty
        
        // Spirit Garden System (百草灵园)
        this.garden = new SpiritGarden(this);
        this.isGardenTabActive = false;
        this.isGardenModalOpen = false;
        
        // Garden cheat multipliers
        this.gardenExpMultiplier = 1;
        this.gardenStoneMultiplier = 1;
        this.gardenEssenceMultiplier = 1;
        
        // Ancient Treasure System (大千宝录古宝系统)
        this.ancientTreasure = new AncientTreasure(this);
        this.ancientTreasureMultiplier = new BigNum(1);
        this.ancientTreasureBonuses = {};
        this.treasureDrawTokens = 0; // 寻宝令
        this.isTreasureModalOpen = false;

        // ZhouTian System (周天星窍系统)
        this.zhouTian = new ZhouTianSystem(this);
        this.zhouTianBonuses = {};
        this.zhouTianExponentBonus = 0;
        this.isZhouTianModalOpen = false;
        this.selectedSectorForWash = null; // 星座图中选中的星域

        // StarBeast Dungeon (星空巨兽副本)
        this.starBeast = new StarBeastDungeon(this);
        this.isStarBeastModalOpen = false;

        // Technique System (功法系统)
        this.technique = new Technique(this);
        this.isTechniqueTabActive = false;

        // 灵石资源
        this.stones = new BigNum(0);

        this.isDead = false;
        this.lastTick = Date.now();
        this.autoChallenge = false;
        this.lastBossDeathTime = 0;
        this.lastMarrowTick = Date.now(); // 星髓自动获取计时

        this.initUI();
        this.spawnWildWave();
        this.updateRealmUI(); // Initialize realm UI
        this.loop();
    }

    initUI() {
        const grid = document.getElementById('equip-grid');
        grid.innerHTML = '';
        SLOT_KEYS.forEach(slot => {
            const div = document.createElement('div');
            div.className = 'equip-slot empty';
            div.id = `equip-${slot}`;
            div.innerHTML = `<div>${this.getIcon(slot)}</div><div>${SLOTS_CONFIG[slot].name}</div>`;
            grid.appendChild(div);
        });

        this.updateStatsUI();
        this.updateSystemUI();
        this.updateTreasureUI();
        this.updateZhouTianUI();
        this.dungeon.updateUI();
        if (this.starBeast) this.starBeast.updateUI();
        if (this.technique) this.technique.updateUI();
    }

    getIcon(slot) {
        const icons = {
            weapon:'⚔️', offhand:'🗡️', helm:'🪖', boots:'👢',
            legs:'🦵', armor:'🥋', bracers:'🧤', belt:'🎗️',
            necklace:'📿', orb:'🔮', ring:'💍', secret:'🏺'
        };
        return icons[slot] || '🛡️';
    }

    // --- Stats ---
    getTotalStats() {
        let stats = { ...this.playerBase };
        let maxHp = new BigNum(stats.hp); 

        for (let key in this.equipment) {
            const item = this.equipment[key];
            if (item) {
                stats.atk = stats.atk.add(item.atk);
                maxHp = maxHp.add(item.hp);
                stats.crit += item.crit || 0;
            }
        }
        
        stats.atk = stats.atk.mul(this.lawMultipliers.atk);
        maxHp = maxHp.mul(this.lawMultipliers.hp);
        
        let tMult = new BigNum(1);
        for (let key in this.equippedTreasures) {
            const t = this.equippedTreasures[key];
            if (t && t.attrType.type === 'all_stat') {
                tMult = tMult.mul(t.val);
                if(t.hasExtra) tMult = tMult.mul(t.extraVal);
            }
        }
        stats.atk = stats.atk.mul(tMult);
        maxHp = maxHp.mul(tMult);
        
        // Apply realm bonus
        const realmBonus = this.getRealmBonus();
        stats.atk = stats.atk.mul(realmBonus);
        maxHp = maxHp.mul(realmBonus);
        
        // Apply abyss relic all-stat multiplier
        if (this.abyssRelic) {
            const relicBonuses = this.abyssRelic.getEffectiveBonuses();
            stats.atk = stats.atk.mul(relicBonuses.allStatMultiplier);
            maxHp = maxHp.mul(relicBonuses.allStatMultiplier);
        }
        
        // Apply meridian refinement bonus
        // 混合加成：前9次乘算 ×1.1，最后1次指数 +0.1%
        if (this.garden && this.garden.refinement) {
            const refinement = this.garden.refinement;
            // 乘算部分
            stats.atk = stats.atk.mul(refinement.totalMultiplier);
            maxHp = maxHp.mul(refinement.totalMultiplier);
            // 指数部分（每轮最后1次）
            const expBonus = refinement.getTotalExpBonus();
            if (expBonus > 0) {
                stats.atk = stats.atk.expBonus(expBonus);
                maxHp = maxHp.expBonus(expBonus);
            }
        }
        
        // Apply Ancient Treasure bonus (大千宝录古宝加成)
        if (this.ancientTreasure) {
            const treasurePower = this.ancientTreasure.getTotalPowerMultiplier();
            if (treasurePower.gt(1)) {
                stats.atk = stats.atk.mul(treasurePower);
                maxHp = maxHp.mul(treasurePower);
            }
        }

        // Apply ZhouTian System bonus (周天星窍加成)
        if (this.zhouTian) {
            const ztBonuses = this.zhouTian.getAllBonuses();

            // 青龙 - 攻击加成
            if (ztBonuses.attack && ztBonuses.attack.value > 1) {
                stats.atk = stats.atk.mul(ztBonuses.attack.value);
            }

            // 朱雀 - 生命加成
            if (ztBonuses.health && ztBonuses.health.value > 1) {
                maxHp = maxHp.mul(ztBonuses.health.value);
            }

            // 麒麟 - 全属性加成
            if (ztBonuses.allStats && ztBonuses.allStats.value > 1) {
                stats.atk = stats.atk.mul(ztBonuses.allStats.value);
                maxHp = maxHp.mul(ztBonuses.allStats.value);
            }

            // 周天大圆满指数加成
            if (this.zhouTianExponentBonus > 0) {
                stats.atk = stats.atk.expBonus(this.zhouTianExponentBonus);
                maxHp = maxHp.expBonus(this.zhouTianExponentBonus);
            }
        }

        // Apply Technique System bonus (功法系统加成)
        // 新规则: 7个功法提供不同属性加成
        if (this.technique) {
            const techBonuses = this.technique.getAllBonuses();

            // 攻击加成 (功法1 + 功法6)
            if (techBonuses.atkMult > 1) {
                stats.atk = stats.atk.mul(techBonuses.atkMult);
            }

            // 生命加成 (功法2 + 功法7)
            if (techBonuses.hpMult > 1) {
                maxHp = maxHp.mul(techBonuses.hpMult);
            }
        }

        return { ...stats, maxHp };
    }

    // --- Realm System (境界系统) ---
    getCurrentRealm() {
        return getRealmInfo(this.realmIndex);
    }

    getNextRealm() {
        return getRealmInfo(this.realmIndex + 1);
    }

    getRealmBonus() {
        // 使用config.js中的新境界加成计算（基于跨度）
        return getRealmBonus(this.realmIndex);
    }

    /**
     * 获取下一次突破的倍率预览
     */
    getNextBreakthroughMultiplier() {
        if (!this.canBreakthrough()) return new BigNum(1);
        return getRealmBreakthroughMultiplier(this.realmIndex + 1);
    }

    /**
     * 获取当前突破的跨度（N难度差）
     */
    getCurrentBreakthroughSpan() {
        const currentRealm = getRealmInfo(this.realmIndex);
        const nextRealm = getRealmInfo(this.realmIndex + 1);
        if (!nextRealm) return 0;
        return nextRealm.requiredDifficulty - currentRealm.requiredDifficulty;
    }

    canBreakthrough() {
        const nextRealm = this.getNextRealm();
        // Check if we've reached the required difficulty and haven't already killed the boss
        return this.maxDifficulty >= nextRealm.requiredDifficulty && !this.realmBossKilled;
    }

    isRealmBossAlive() {
        return this.enemies.some(e => e.isRealmBoss);
    }

    summonRealmBoss() {
        if (this.isRealmBossAlive()) return;
        if (this.mode !== 'wild') {
            this.log('SYS', '只能在荒野模式挑战境界天劫！');
            return;
        }
        if (!this.canBreakthrough()) {
            this.log('SYS', '尚未满足境界突破条件！');
            return;
        }
        
        const nextRealm = this.getNextRealm();
        const difficulty = nextRealm.requiredDifficulty;
        
        // Realm boss uses the target difficulty's scale, multiplied by REALM_BOSS_MULT
        const scale = new BigNum(SCALE_ENEMY).pow(difficulty).mul(REALM_BOSS_MULT);
        
        this.enemies.push({
            id: `realm-boss-${Date.now()}`,
            name: `${nextRealm.name}·天劫`,
            maxHp: new BigNum(REALM_BOSS_HP_BASE).mul(scale),
            currentHp: new BigNum(REALM_BOSS_HP_BASE).mul(scale),
            atk: new BigNum(REALM_BOSS_ATK_BASE).mul(scale),
            isBoss: true,  // Treat as boss for some mechanics
            isRealmBoss: true,  // Special flag for realm boss
            emoji: REALM_BOSS_EMOJI
        });
        
        this.realmBossActive = true;
        this.log('SYS', `☯️ 境界天劫降临！击败${nextRealm.name}天劫即可突破！`);
        this.updateCombatUI(true);
        this.updateRealmUI();
    }

    handleRealmBossKill() {
        this.realmBossKilled = true;
        this.realmBossActive = false;
        this.realmIndex++;
        
        const currentRealm = this.getCurrentRealm();
        const bonus = this.getRealmBonus();
        
        this.log('GAIN', `🎉 境界突破成功！当前境界：${currentRealm.name}`);
        this.log('GAIN', `✨ 境界加成：全属性 x${formatNum(bonus)}`);
        
        // Check if next realm is immediately available (for multi-breakthrough)
        this.checkAndResetRealmBossKilled();
        
        this.updateRealmUI();
        this.updateStatsUI();
    }

    checkAndResetRealmBossKilled() {
        // Reset the killed flag if player can immediately breakthrough again
        const nextRealm = this.getNextRealm();
        if (this.maxDifficulty >= nextRealm.requiredDifficulty) {
            this.realmBossKilled = false;
        }
    }

    updateRealmUI() {
        const currentRealm = this.getCurrentRealm();
        const nextRealm = this.getNextRealm();
        const canBreak = this.canBreakthrough();
        const bonus = this.getRealmBonus();

        // 计算突破跨度和倍率
        const span = this.getCurrentBreakthroughSpan();
        const nextMultiplier = this.getNextBreakthroughMultiplier();

        // Update header display
        const levelDisplay = document.getElementById('level-display');
        if (levelDisplay) {
            levelDisplay.innerText = `荒野层数: ${this.difficulty} (${currentRealm.name})`;
        }

        // Update realm panel if elements exist
        const realmNameEl = document.getElementById('realm-name');
        const realmBonusEl = document.getElementById('realm-bonus');
        const nextRealmEl = document.getElementById('next-realm');
        const realmReqEl = document.getElementById('realm-req');
        const realmProgressEl = document.getElementById('realm-progress');
        const realmBtn = document.getElementById('btn-realm-challenge');
        const realmSpanEl = document.getElementById('realm-span');
        const realmMultiplierEl = document.getElementById('realm-multiplier');

        if (realmNameEl) realmNameEl.innerText = currentRealm.name;
        if (realmBonusEl) realmBonusEl.innerText = `x${formatNum(bonus)}`;
        if (nextRealmEl) nextRealmEl.innerText = nextRealm.name;
        if (realmReqEl) realmReqEl.innerText = `N${nextRealm.requiredDifficulty}`;

        // 显示跨度和倍率
        if (realmSpanEl) realmSpanEl.innerText = `跨越 ${span} 层`;
        if (realmMultiplierEl) realmMultiplierEl.innerText = `突破倍率 x${formatNum(nextMultiplier)}`;

        if (realmProgressEl) {
            const progress = Math.min(100, Math.floor((this.maxDifficulty / nextRealm.requiredDifficulty) * 100));
            realmProgressEl.innerText = `${this.maxDifficulty}/${nextRealm.requiredDifficulty} (${progress}%)`;
        }

        if (realmBtn) {
            if (this.isRealmBossAlive()) {
                realmBtn.innerText = '⚔️ 天劫战斗中...';
                realmBtn.classList.add('active');
                realmBtn.disabled = false;
            } else if (canBreak) {
                realmBtn.innerText = `☯️ 突破至${nextRealm.name} (x${formatNum(nextMultiplier)})`;
                realmBtn.classList.remove('active');
                realmBtn.disabled = false;
            } else {
                realmBtn.innerText = this.realmBossKilled ? '✅ 可继续突破' : '🔒 难度不足';
                realmBtn.classList.remove('active');
                realmBtn.disabled = true;
            }
        }
    }

    // --- Mode ---
    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        // 注意：第7个按钮是"星空巨兽"，它调用openStarBeastModal而不是switchTab，所以数组中需要留占位
        const btnIdx = ['law','dungeon','realm','garden','ancient-treasure','zhou-tian',null,'abyss','technique'].indexOf(tab);
        if (btnIdx >= 0) document.querySelectorAll('.tab-btn')[btnIdx].classList.add('active');
        document.getElementById(`tab-${tab}`).classList.add('active');

        // Update flags
        this.isGardenTabActive = (tab === 'garden');
        this.isTechniqueTabActive = (tab === 'technique');

        // Update realm UI when switching to realm tab
        if (tab === 'realm') {
            this.updateRealmUI();
        }

        // Update garden overview when switching to garden tab
        if (tab === 'garden') {
            this.updateGardenOverview();
        }

        // Update abyss overview when switching to abyss tab
        if (tab === 'abyss') {
            this.updateAbyssOverview();
        }

        // Update ancient treasure overview when switching to ancient-treasure tab
        if (tab === 'ancient-treasure') {
            this.updateTreasureUI();
        }

        // Update ZhouTian overview when switching to zhou-tian tab
        if (tab === 'zhou-tian') {
            this.updateZhouTianUI();
        }

        // Update technique overview when switching to technique tab
        if (tab === 'technique') {
            this.technique.updateUI();
        }
    }

    toggleTowerMode() { this.changeMode('tower'); }
    toggleDungeonMode() { this.changeMode('dungeon'); }
    toggleAbyssMode() { this.changeMode('abyss'); }
    
    changeMode(newMode) {
        if (this.isDead) return;
        if (this.mode === 'dungeon') this.dungeon.stop();
        if (this.mode === 'abyss') this.abyssDungeon.stop();
        this.enemies = [];
        
        if (this.mode === newMode) {
            this.mode = 'wild';
            this.log('SYS', '返回荒野。');
        } else {
            this.mode = newMode;
            if (newMode === 'tower') this.log('SYS', '进入通天塔！');
            if (newMode === 'dungeon') {
                // 检查副本是否已解锁
                if (!this.dungeon.isUnlocked(this.dungeon.tier)) {
                    const required = getDungeonUnlockRequirement(this.dungeon.tier);
                    this.log('SYS', `🔒 副本T${this.dungeon.tier}需主线N${required}解锁！当前N${this.difficulty}`);
                    this.mode = 'wild';
                    this.updateButtons();
                    return;
                }
                this.log('SYS', `进入血色副本T${this.dungeon.tier}！伤害已被压缩。`);
                this.dungeon.start();
            }
            if (newMode === 'abyss') {
                this.log('SYS', '🌑 进入深渊战场！');
                this.abyssDungeon.start();
            }
        }
        this.updateButtons();
        if (this.mode !== 'dungeon' && this.mode !== 'abyss') this.spawnWildWave();
    }

    updateButtons() {
        const btnTower = document.getElementById('btn-tower-toggle');
        const btnDungeon = document.getElementById('btn-dungeon-toggle');
        const btnBoss = document.getElementById('btn-challenge');
        const stage = document.getElementById('stage-name');

        // 设置按钮文本
        btnTower.innerText = this.mode === 'tower' ? "🏃 离开通天塔" : "🗼 挑战通天塔";
        btnDungeon.innerText = this.mode === 'dungeon' ? "🏃 离开副本" : "🔥 进入副本";
        btnTower.classList.toggle('active', this.mode === 'tower');
        btnDungeon.classList.toggle('active', this.mode === 'dungeon');
        
        // 深渊模式特殊处理
        if (this.mode === 'abyss') {
            const abyssBoss = this.enemies.find(e => e.isAbyssBoss);
            btnBoss.style.display = 'block';
            btnBoss.innerText = "🏃 离开深渊战场";
            btnBoss.onclick = () => this.changeMode('wild');
            stage.innerText = abyssBoss ? `🌑 深渊战场 - ${abyssBoss.name}` : '🌑 深渊战场';
            stage.style.color = '#8b5cf6';
        } else if (this.mode === 'wild') {
            btnBoss.style.display = 'block';
            btnBoss.innerText = "💀 召唤荒野BOSS (右键自动)";
            btnBoss.onclick = () => this.manualSummonBoss();
            stage.innerText = `荒野 - 第 ${this.difficulty} 层`;
            stage.style.color = '';
        } else if (this.mode === 'tower') {
            btnBoss.style.display = 'block';
            btnBoss.innerText = "👺 召唤塔主 (右键自动)";
            btnBoss.onclick = () => this.manualSummonBoss();
            stage.innerText = `通天塔 - 第 ${this.towerLevel} 层`;
            stage.style.color = '';
        } else {
            btnBoss.style.display = 'none';
            const tierInfo = this.dungeon.isUnlocked(this.dungeon.tier) ? `T${this.dungeon.tier}` : `🔒T${this.dungeon.tier}`;
            stage.innerText = `副本${tierInfo} - 难度 ${this.dungeon.level}`;
            stage.style.color = '';
        }

        // 2. Override text if auto is active
        if (this.autoChallenge) {
            btnBoss.classList.add('auto-active');
            btnBoss.innerText = "自动挑战中 (右键关闭)";
        } else {
            btnBoss.classList.remove('auto-active');
        }
    }

    // --- Loop ---
    loop() {
        const now = Date.now();
        if (now - this.lastTick >= 1000) {
            this.combatTurn();
            if (this.autoChallenge && !this.isDead && this.mode !== 'dungeon') {
                if (!this.isBossAlive() && (now - this.lastBossDeathTime > 5000)) {
                    this.summonBoss();
                }
            }
            this.lastTick = now;
        }
        const stats = this.getTotalStats();
        if (!this.isDead && this.currentHp.lt(stats.maxHp) && this.currentHp.gt(0)) {
            const regen = stats.maxHp.mul(0.05);
            this.currentHp = this.currentHp.add(regen);
            if(this.currentHp.gt(stats.maxHp)) this.currentHp = stats.maxHp;
            this.updateCombatUI();
        }
        
        // Update spirit garden growth
        if (this.garden) {
            this.garden.updateGrowth();
            // Real-time update progress bars only (not full UI)
            if (this.isGardenModalOpen) {
                this.updateGardenProgressBars();
            }
        }
        
        // Update abyss dungeon (boss revive timers)
        if (this.abyssDungeon) {
            this.abyssDungeon.update();
        }

        // 星髓自动获取（每分钟100）
        if (this.zhouTian && now - this.lastMarrowTick >= 60000) {
            this.zhouTian.addMarrow(100);
            this.lastMarrowTick = now;
            this.updateZhouTianUI();
        }

        requestAnimationFrame(() => this.loop());
    }

    combatTurn() {
        if (this.isDead) return;
        this.enemies = this.enemies.filter(e => e.currentHp.gt(0));
        
        // 深渊模式下不生成野生怪物
        if (this.mode !== 'dungeon' && this.mode !== 'abyss' && this.enemies.filter(e => !e.isBoss).length < 10) {
            this.spawnWildWave();
        }
        if (this.mode === 'dungeon') this.dungeon.checkWaveClear();

        if (this.currentHp.lte(0)) {
            this.handleLoss();
            return;
        }

        const pStats = this.getTotalStats();
        
        // Damage (Player -> Enemy)
        let atk = pStats.atk;
        if (this.mode === 'dungeon' || this.mode === 'abyss' || this.mode === 'starbeast') {
            // 数值压缩：用于副本、深渊和星空巨兽
            let logVal = atk.log10();
            if(logVal < 0) logVal = 0;
            atk = new BigNum(Math.pow(logVal, 2));
        }

        const isSkill = Math.random() < 0.3;
        if (isSkill) {
            this.showSkillEffect("横扫千军!");
            this.enemies.forEach(e => this.dealDamage(e, atk.mul(1.1), pStats.crit));
        } else {
            if (this.enemies[0]) this.dealDamage(this.enemies[0], atk, pStats.crit);
        }

        // Damage (Enemy -> Player)
        // 过滤掉已死亡的敌人（刚被玩家击杀的）
        this.enemies = this.enemies.filter(e => e.currentHp.gt(0));
        
        let totalDmg = new BigNum(0);
        this.enemies.forEach(e => {
            totalDmg = totalDmg.add(e.atk);
        });

        if (this.mode === 'dungeon' || this.mode === 'abyss' || this.mode === 'starbeast') {
            // 数值压缩：用于副本、深渊和星空巨兽
            let logHp = pStats.maxHp.log10();
            if(logHp < 0) logHp = 0;
            const ehpVal = Math.pow(logHp, 2) * 5;

            if (ehpVal < 1) {
                this.currentHp = new BigNum(0);
            } else {
                let pct = totalDmg.div(new BigNum(ehpVal));
                let realDmg = this.currentHp.mul(pct);
                this.currentHp = this.currentHp.sub(realDmg);
                if(realDmg.gt(0)) this.showDamage(realDmg, 'player');
            }
        } else {
            this.currentHp = this.currentHp.sub(totalDmg);
            if(totalDmg.gt(0)) this.showDamage(totalDmg, 'player');
        }

        if (this.currentHp.lte(0)) {
            if (this.mode === 'starbeast' && this.starBeast) {
                this.starBeast.handleDefeat();
            } else {
                this.handleLoss();
            }
        }

        // 检查星空巨兽战斗胜利（敌人被击败）
        if (this.mode === 'starbeast' && this.enemies.length === 0 && this.starBeast?.active) {
            this.starBeast.handleVictory();
        }

        this.updateCombatUI();
    }

    dealDamage(enemy, amt, critRate) {
        let finalAmt = new BigNum(amt);
        let isCrit = false;
        if (Math.random() * 100 < critRate) {
            finalAmt = finalAmt.mul(2);
            isCrit = true;
        }
        enemy.currentHp = enemy.currentHp.sub(finalAmt);
        this.showDamage(finalAmt, enemy.id, isCrit);
        if (enemy.currentHp.lte(0)) this.handleKill(enemy);
    }

    handleKill(enemy) {
        // Check if it's a realm boss
        if (enemy.isRealmBoss) {
            this.handleRealmBossKill();
            return;
        }

        // Check if it's an abyss boss
        if (enemy.isAbyssBoss) {
            this.abyssDungeon.handleAbyssBossDeath(enemy);
            // 深渊BOSS死亡后不生成野生波次
            return;
        }

        // 星髓掉落
        if (this.zhouTian) {
            let marrowDrop = 0;
            if (enemy.isBoss) {
                // BOSS掉落 20-50 星髓
                marrowDrop = Math.floor(Math.random() * 31) + 20;
            } else {
                // 普通敌人 10% 几率掉落 5-15 星髓
                if (Math.random() < 0.1) {
                    marrowDrop = Math.floor(Math.random() * 11) + 5;
                }
            }
            if (marrowDrop > 0) {
                this.zhouTian.addMarrow(marrowDrop);
                // 不显示日志避免刷屏，只在UI更新
            }
        }

        // 灵石掉落（功法系统）- 只有主线敌人掉落
        if (this.technique && this.mode === 'wild') {
            const stoneDrop = this.calculateStoneDrop(enemy);
            if (stoneDrop.gt(0)) {
                this.stones = this.stones.add(stoneDrop);
                // 显示灵石跳字
                this.showStoneDrop(stoneDrop, enemy.id);
                // 灵石袋或BOSS时显示日志
                if (enemy.isBoss || stoneDrop.gte(1000)) {
                    this.log('GAIN', `💎 获得 ${formatNum(stoneDrop)} 灵石${stoneDrop.gte(1000) ? ' (灵石袋!)' : ''}`);
                }
            }
        }

        if (this.mode === 'tower') {
            if (enemy.isBoss) {
                this.towerLevel++;
                this.lastBossDeathTime = Date.now();
                this.log('GAIN', '击败塔主！层数+1');
                this.rollTowerLoot(true);
                this.updateButtons();
            } else {
                this.rollTowerLoot(false);
            }
        } else if (this.mode === 'wild') {
            if (enemy.isBoss) {
                this.difficulty++;
                // Update historical max difficulty
                if (this.difficulty > this.maxDifficulty) {
                    this.maxDifficulty = this.difficulty;
                    // Check if we can unlock realm breakthrough
                    this.checkAndResetRealmBossKilled();
                    this.updateRealmUI();
                }
                this.lastBossDeathTime = Date.now();
                this.log('GAIN', '击败BOSS！难度+1');
                
                // 检查是否解锁了新的副本层数
                const prevMaxTier = this.dungeon.getMaxUnlockedTier();
                const newMaxTier = Math.floor(this.difficulty / 300) + (this.difficulty >= 100 ? 1 : 0);
                if (this.difficulty === 100 || (this.difficulty > 300 && this.difficulty % 300 === 0)) {
                    const unlockedTier = this.dungeon.getMaxUnlockedTier();
                    this.log('SYS', `🎉 解锁副本T${unlockedTier}！当前主线N${this.difficulty}`);
                }
                
                this.rollWildLoot(true);
                this.updateButtons();
                this.dungeon.updateUI(); // 更新副本解锁状态显示
            } else {
                this.rollWildLoot(false);
            }
        }
    }

    /**
     * 计算灵石掉落 - 新规则
     *
     * 基础值: 1-3 随机
     * 难度加成: 每+1难度, x1.5
     * 灵石袋: 0.1% 概率获得100倍
     * 功法加成: 功法8 聚灵术提供掉率倍率
     */
    calculateStoneDrop(enemy) {
        const config = TECHNIQUE_CONFIG.stoneDrop;

        // 基础掉落: 1-3 随机
        const baseRoll = Math.floor(Math.random() * (config.baseMax - config.baseMin + 1)) + config.baseMin;

        // 难度加成: difficultyMult^(difficulty-1)
        // 难度1 = x1, 难度2 = x1.5, 难度3 = x2.25, 以此类推
        const difficultyMult = Math.pow(config.difficultyMult, Math.max(0, this.difficulty - 1));

        let drop = baseRoll * difficultyMult;

        // 功法加成: 聚灵术 (功法8)
        if (this.technique) {
            const techBonuses = this.technique.getAllBonuses();
            if (techBonuses.stoneDrop > 1) {
                drop *= techBonuses.stoneDrop;
            }
        }

        // 灵石袋判定: 0.1% 概率
        let isBag = false;
        if (Math.random() < config.bagChance) {
            drop *= config.bagMult;
            isBag = true;
        }

        return new BigNum(drop);
    }

    handleLoss() {
        if (this.isDead) return;
        this.isDead = true;
        this.currentHp = new BigNum(0);
        let reviveTime = (this.mode === 'dungeon' || this.mode === 'abyss') ? 15000 : 2000;
        
        let remaining = reviveTime / 1000;
        const reviveOverlay = document.getElementById('resurrect-overlay');
        const reviveText = document.getElementById('resurrect-text');
        reviveOverlay.style.display = 'flex';
        document.getElementById('player-entity').classList.add('player-dead');
        
        const timer = setInterval(() => {
            remaining--;
            if (remaining <= 0) clearInterval(timer);
            reviveText.innerHTML = `已死亡<br><span style="font-size:1rem; color:#fff;">${remaining}秒后复活...</span>`;
        }, 1000);
        reviveText.innerHTML = `已死亡<br><span style="font-size:1rem; color:#fff;">${remaining}秒后复活...</span>`;

        if(this.mode === 'dungeon') {
            this.dungeon.stop();
            this.dungeon.timeRemaining = 15;
            this.dungeon.startCountdown(() => {
            });
        }
        
        if(this.mode === 'abyss') {
            // 深渊死亡：BOSS进入复活，返回荒野
            this.abyssDungeon.stop();
            this.log('SYS', '💀 在深渊战场战败，BOSS进入复活...');
        }
        
        if(this.mode === 'wild' && this.enemies.some(e=>e.isBoss)) {
            this.enemies = this.enemies.filter(e=>!e.isBoss);
            this.lastBossDeathTime = Date.now();
        }
        
        setTimeout(() => this.revive(), reviveTime);
    }

    revive() {
        this.isDead = false;
        this.currentHp = this.getTotalStats().maxHp;
        document.getElementById('resurrect-overlay').style.display = 'none';
        document.getElementById('player-entity').classList.remove('player-dead');
        
        if (this.mode === 'dungeon') {
            this.dungeon.start(); 
        } else if (this.mode === 'abyss') {
            // 深渊复活后返回荒野
            this.changeMode('wild');
        } else {
            this.spawnWildWave();
        }
        
        // Restore realm boss if it was active
        if (this.realmBossActive && !this.isRealmBossAlive()) {
            this.realmBossActive = false;
            this.updateRealmUI();
        }
    }

    // --- Treasure System ---
    openTreasureBox(count) {
        if (this.treasureDaily < count) {
            this.log('SYS', '今日秘宝次数不足！');
            return;
        }
        if (this.treasureChests < count) {
            this.log('SYS', '没有宝箱了！请去副本刷取。');
            return;
        }
        
        this.treasureDaily -= count;
        this.treasureChests -= count;
        
        const num = Math.floor(Math.random() * 2) + 3; // 3-4
        // 应用遗宝秘宝等级加成
        let treasureLevelBoost = 0;
        if (this.abyssRelic) {
            treasureLevelBoost = this.abyssRelic.getEffectiveBonuses().treasureLevelBoost;
        }
        for(let i=0; i<num; i++) {
            const t = new Treasure(this.difficulty + 1 + treasureLevelBoost);
            this.treasureBag.push(t);
            this.log('GAIN', `获得秘宝: <span style="color:${TREASURE_QUALITIES[t.qKey].color}">${t.name}</span>`);
        }
        this.updateSystemUI();
        this.updateTreasureUI();
    }

    openTreasureModal() {
        document.getElementById('treasure-full-modal').style.display = 'flex';
        this.updateTreasureUI();
    }

    exchangeTreasure() {
        if (this.treasureFragments.gte(100)) {
            this.treasureFragments = this.treasureFragments.sub(100);
            // 应用遗宝秘宝等级加成
            let treasureLevelBoost = 0;
            if (this.abyssRelic) {
                treasureLevelBoost = this.abyssRelic.getEffectiveBonuses().treasureLevelBoost;
            }
            const t = new Treasure(this.difficulty + 1 + treasureLevelBoost);
            this.treasureBag.push(t);
            this.log('GAIN', `兑换成功: ${t.name}`);
            this.updateSystemUI();
            this.updateTreasureUI();
        } else {
            this.log('SYS', '碎片不足100');
        }
    }

    autoDecompose() {
        let count = 0;
        this.treasureBag = this.treasureBag.filter(t => {
            if (!t.isLocked) {
                count++;
                this.treasureFragments = this.treasureFragments.add(10);
                return false;
            }
            return true;
        });
        if (count > 0) this.log('SYS', `分解了 ${count} 个秘宝，获得 ${count*10} 碎片`);
        this.updateSystemUI();
        this.updateTreasureUI();
    }

    redeemCode(source) {
        const inputId = source === 'modal' ? 'redeem-code-modal' : 'redeem-code';
        const input = document.getElementById(inputId);
        if (input.value === 'VIP666') {
            const added = Math.min(this.treasureLimit - this.treasureDaily, 10);
            if (added > 0) {
                this.treasureDaily += added;
                this.log('SYS', `兑换成功！次数+${added}`);
            } else {
                this.log('SYS', '次数已满！');
            }
            input.value = '';
            this.updateSystemUI();
            this.updateTreasureUI();
        } else {
            this.log('SYS', '无效兑换码');
        }
    }

    // Manual Equip/Lock Logic
    showItemModal(index, isEquipped) {
        const t = isEquipped ? this.equippedTreasures[index] : this.treasureBag[index];
        if (!t) return;

        const modal = document.getElementById('item-modal');
        document.getElementById('modal-title').innerText = t.name;
        // Fix for color class
        document.getElementById('modal-title').style.color = TREASURE_QUALITIES[t.qKey].color;
        
        let desc = `等级: ${t.level}<br>${t.attrType.name}: ${formatNum(t.val)}倍`;
        if (t.hasExtra) desc += `<br>(VIP)额外加成: ${formatNum(t.extraVal)}倍`;
        desc += `<br>评分: ${formatNum(t.score)}`;
        document.getElementById('modal-desc').innerHTML = desc;

        const acts = document.getElementById('modal-actions');
        acts.innerHTML = '';

        if (isEquipped) {
            acts.innerHTML += `<button class="modal-btn btn-close" onclick="game.unequipTreasure('${index}')">卸下</button>`;
        } else {
            acts.innerHTML += `<button class="modal-btn btn-use" onclick="game.equipTreasure(${index})">装备</button>`;
            acts.innerHTML += `<button class="modal-btn btn-lock" onclick="game.toggleLock(${index})">${t.isLocked?'解锁':'锁定'}</button>`;
            acts.innerHTML += `<button class="modal-btn btn-split" onclick="game.decomposeSingle(${index})">分解</button>`;
        }
        
        modal.style.display = 'flex';
    }

    closeModal(id) { document.getElementById(id).style.display = 'none'; }

    equipTreasure(index) {
        const t = this.treasureBag[index];
        const old = this.equippedTreasures[t.slot];
        
        this.equippedTreasures[t.slot] = t;
        this.treasureBag.splice(index, 1); 
        
        if (old) this.treasureBag.push(old); 
        
        this.closeModal('item-modal');
        this.updateTreasureUI();
        this.updateSystemUI(); 
        this.updateStatsUI();
    }

    unequipTreasure(slot) {
        const t = this.equippedTreasures[slot];
        if (t) {
            this.equippedTreasures[slot] = null;
            this.treasureBag.push(t);
        }
        this.closeModal('item-modal');
        this.updateTreasureUI();
        this.updateStatsUI();
    }

    toggleLock(index) {
        this.treasureBag[index].isLocked = !this.treasureBag[index].isLocked;
        this.showItemModal(index, false);
        this.updateTreasureUI();
    }

    decomposeSingle(index) {
        this.treasureBag.splice(index, 1);
        this.treasureFragments = this.treasureFragments.add(10);
        this.closeModal('item-modal');
        this.updateSystemUI();
        this.updateTreasureUI();
    }

    updateTreasureUI() {
        // Equip Grid
        TREASURE_SLOTS.forEach(slot => {
            const updateSlot = (containerSelector) => {
                const container = document.querySelector(containerSelector);
                if (!container) return;
                
                let el = container.querySelector(`[data-slot="${slot}"]`);
                if (!el) {
                    el = document.createElement('div');
                    el.className = 'equip-slot empty';
                    el.setAttribute('data-slot', slot);
                    el.onclick = () => this.showItemModal(slot, true);
                    el.oncontextmenu = (e) => { e.preventDefault(); this.unequipTreasure(slot); };
                    container.appendChild(el);
                }
                
                const t = this.equippedTreasures[slot];
                if (t) {
                    el.className = `equip-slot`;
                    el.style.borderColor = TREASURE_QUALITIES[t.qKey].color;
                    el.style.color = TREASURE_QUALITIES[t.qKey].color;
                    el.innerHTML = `
                        <div class="t-lvl">Lv.${t.level}</div>
                        <div>🔮</div>
                        <div>${t.name.split('·')[2]}</div>
                        <div class="t-attr">${t.attrType.short} ${formatNum(t.val)}</div>
                    `;
                } else {
                    el.className = 'equip-slot empty';
                    el.style.borderColor = '#444';
                    el.style.color = '#888';
                    el.innerHTML = `<div>🔮</div><div>${slot}</div>`;
                }
            };

            updateSlot('#game-container #treasure-equip-grid');
            updateSlot('#treasure-full-modal #treasure-equip-grid');
        });

        // Bag Grid
        const updateBag = (containerSelector) => {
            const container = document.querySelector(containerSelector);
            if (!container) return;
            container.innerHTML = '';
            
            this.treasureBag.forEach((t, i) => {
                const div = document.createElement('div');
                div.className = `equip-slot`;
                div.style.position = 'relative';
                div.style.borderColor = TREASURE_QUALITIES[t.qKey].color;
                div.style.color = TREASURE_QUALITIES[t.qKey].color;
                
                div.innerHTML = `
                    <div class="t-lvl">Lv.${t.level}</div>
                    <div>${t.slot}</div>
                    <div class="t-attr">${t.attrType.short}</div>
                    <div style="font-size:0.6rem">${formatNum(t.val)}x</div>
                    ${t.isLocked ? '<div class="locked-icon">🔒</div>' : ''}
                `;
                div.oncontextmenu = (e) => {
                    e.preventDefault();
                    this.equipTreasure(i);
                };
                div.onclick = () => this.showItemModal(i, false);
                container.appendChild(div);
            });
        };

        updateBag('#treasure-bag');
        const modalBag = document.querySelector('#treasure-full-modal #treasure-bag');
        if(modalBag) updateBag('#treasure-full-modal #treasure-bag');
        
        // Update Bonus Text
        let bonus = "";
        let drops = new BigNum(0), pills = new BigNum(0);
        for(let k in this.equippedTreasures) {
            const t = this.equippedTreasures[k];
            if(t) {
                if(t.attrType.type === 'tower_drop') drops = drops.add(t.val);
                if(t.attrType.type === 'pill_mult') pills = pills.add(t.val);
            }
        }
        if (drops.gt(0)) bonus += `塔掉落x${formatNum(drops)} `;
        if (pills.gt(0)) bonus += `丹倍率x${formatNum(pills)}`;
        const bonusEl = document.getElementById('bonus-treasure');
        if(bonusEl) bonusEl.innerText = bonus || "无";
        
        // Update Counts
        const chest = this.treasureChests;
        const daily = `${this.treasureDaily}/${this.treasureLimit}`;
        const frags = formatNum(this.treasureFragments);

        if(document.getElementById('modal-chest-count')) document.getElementById('modal-chest-count').innerText = chest;
        if(document.getElementById('modal-daily-count')) document.getElementById('modal-daily-count').innerText = daily;
        if(document.getElementById('modal-frag-count')) document.getElementById('modal-frag-count').innerText = frags;
        
        if(document.getElementById('chest-count')) document.getElementById('chest-count').innerText = chest;
    }

    // --- Cheat System ---
    toggleCheatModal() {
        document.getElementById('cheat-modal').style.display = 'flex';
    }

    applyCheat() {
        const type = document.getElementById('cheat-type').value;
        const valStr = document.getElementById('cheat-val').value;
        let val = new BigNum(valStr); // Use BigNum parsing
        
        switch(type) {
            case 'atk':
                this.playerBase.atk = this.playerBase.atk.add(val);
                this.log('SYS', `金手指: 基础攻击 +${formatNum(val)}`);
                break;
            case 'hp':
                this.playerBase.hp = this.playerBase.hp.add(val);
                this.log('SYS', `金手指: 基础生命 +${formatNum(val)}`);
                break;
            case 'curHp':
                this.currentHp = this.currentHp.add(val);
                const max = this.getTotalStats().maxHp;
                if(this.currentHp.gt(max)) this.currentHp = max;
                this.log('SYS', `金手指: 恢复生命 +${formatNum(val)}`);
                break;
            case 'law':
                this.lawFragments = this.lawFragments.add(val);
                this.log('SYS', `金手指: 法则真意 +${formatNum(val)}`);
                break;
            case 'chest':
                this.treasureChests += val.toNumber();
                this.log('SYS', `金手指: 秘宝宝箱 +${formatNum(val)}`);
                break;
            case 'frag':
                this.treasureFragments = this.treasureFragments.add(val);
                this.log('SYS', `金手指: 秘宝碎片 +${formatNum(val)}`);
                break;
            case 'ticket':
                // For ticket we might just use normal number, but BigNum works
                this.treasureDaily += val.toNumber();
                this.log('SYS', `金手指: 秘宝次数 +${formatNum(val)}`);
                break;
            case 'realm':
                this.realmIndex += val.toNumber();
                this.log('SYS', `金手指: 境界等级 +${formatNum(val)}，当前境界：${this.getCurrentRealm().name}`);
                this.updateRealmUI();
                break;
            case 'diff':
                this.maxDifficulty += val.toNumber();
                this.log('SYS', `金手指: 历史最高难度 +${formatNum(val)}`);
                this.checkAndResetRealmBossKilled();
                this.updateRealmUI();
                break;
            case 'gardenExp':
                this.gardenExpMultiplier = val.toNumber();
                this.log('SYS', `金手指: 灵植经验倍率设为 ${this.gardenExpMultiplier}x`);
                break;
            case 'gardenStone':
                this.gardenStoneMultiplier = val.toNumber();
                this.log('SYS', `金手指: 灵植灵石倍率设为 ${this.gardenStoneMultiplier}x`);
                break;
            case 'gardenEssence':
                this.gardenEssenceMultiplier = val.toNumber();
                this.log('SYS', `金手指: 生灵精华倍率设为 ${this.gardenEssenceMultiplier}x`);
                break;
            case 'abyssFrag':
                // 给所有BOSS添加碎片
                const fragPerBoss = Math.floor(val.toNumber() / 5);
                for (const bossId in this.abyssRelic.fragments) {
                    this.abyssRelic.fragments[bossId] += fragPerBoss;
                }
                this.log('SYS', `金手指: 每个BOSS深渊遗宝碎片 +${fragPerBoss}`);
                this.updateAbyssOverview();
                break;
            case 'treasureToken':
                // 添加古宝寻宝令
                this.treasureDrawTokens += val.toNumber();
                this.log('SYS', `金手指: 古宝寻宝令 +${formatNum(val)}`);
                break;
            case 'zhouTianMarrow':
                // 添加周天星髓
                if (this.zhouTian) {
                    this.zhouTian.state.marrow += val.toNumber();
                    this.log('SYS', `金手指: 周天星髓 +${formatNum(val)}`);
                    this.updateZhouTianUI();
                }
                break;
            case 'currentDiff':
                // 增加当前难度并解锁相应系统
                const oldDiff = this.difficulty;
                this.difficulty += val.toNumber();
                this.maxDifficulty = Math.max(this.maxDifficulty, this.difficulty);
                this.log('SYS', `金手指: 当前难度 ${oldDiff} → ${this.difficulty}`);
                // 检查解锁新系统
                this.checkUnlocks();
                this.updateRealmUI();
                this.dungeon.updateUI();
                break;
        }
        
        this.updateStatsUI();
        this.updateSystemUI();
        this.updateTreasureUI();
        this.updateZhouTianUI();
        this.closeModal('cheat-modal');
    }
    
    // 检查系统解锁状态
    checkUnlocks() {
        // 检查境界突破解锁
        const nextRealm = getRealmInfo(this.realmIndex);
        if (nextRealm && this.difficulty >= nextRealm.requiredDifficulty) {
            this.log('SYS', `✨ 境界突破已解锁！当前可突破至：${nextRealm.name}`);
        }
        
        // 检查副本层数解锁
        const maxTier = this.dungeon.getMaxUnlockedTier();
        for (let tier = 1; tier <= 5; tier++) {
            const required = getDungeonUnlockRequirement(tier);
            if (this.difficulty >= required && tier > maxTier) {
                this.log('SYS', `🔥 副本T${tier}已解锁！`);
            }
        }
        
        // 检查深渊BOSS解锁
        if (typeof ABYSS_BOSSES !== 'undefined') {
            ABYSS_BOSSES.forEach(boss => {
                if (this.difficulty >= boss.unlockDifficulty) {
                    this.log('SYS', `🌑 ${boss.name}已解锁！`);
                }
            });
        }
        
        // 检查灵植园功能解锁
        if (this.garden) {
            if (this.garden.gardenLevel >= 2) {
                this.log('SYS', `🤖 傀儡托管已解锁！`);
            }
            if (this.garden.gardenLevel >= 10) {
                this.log('SYS', `🔥 丹火提炼已解锁！`);
            }
        }
    }

    // --- Other Logic ---
    spawnWildWave() {
        if(this.mode === 'dungeon') return;
        const scale = this.mode==='tower' ? new BigNum(SCALE_TOWER_STR).pow(this.towerLevel) : new BigNum(SCALE_ENEMY).pow(this.difficulty);
        const type = this.mode==='tower' ? TOWER_TYPES[0] : ENEMY_TYPES[0];
        
        let emojis = [];
        if (this.mode === 'tower') {
            emojis = ['👻', '🔥', '🗿', '🛡️', '🧙']; 
        } else {
            emojis = ['🐗', '🐍', '🦂', '🐻', '🐺'];
        }

        while(this.enemies.filter(e=>!e.isBoss).length < 10) {
            this.enemies.push({
                id: `mob-${Date.now()}-${Math.random()}`,
                name: type.name,
                maxHp: new BigNum(type.baseHp).mul(scale),
                currentHp: new BigNum(type.baseHp).mul(scale),
                atk: new BigNum(type.baseAtk).mul(scale),
                isBoss: false,
                emoji: emojis[Math.floor(Math.random() * emojis.length)]
            });
        }
        this.updateCombatUI(true);
    }

    isBossAlive() {
        return this.enemies.some(e => e.isBoss);
    }

    manualSummonBoss() {
        if (this.isBossAlive()) return;
        this.summonBoss();
    }

    summonBoss() {
        if (this.isBossAlive()) return;
        const scale = this.mode==='tower' ? new BigNum(SCALE_TOWER_STR).pow(this.towerLevel) : new BigNum(SCALE_ENEMY).pow(this.difficulty);
        const type = this.mode==='tower' ? TOWER_TYPES[1] : ENEMY_TYPES[1];
        this.enemies.push({
            id: `boss-${Date.now()}`,
            name: type.name,
            maxHp: new BigNum(type.baseHp).mul(scale),
            currentHp: new BigNum(type.baseHp).mul(scale),
            atk: new BigNum(type.baseAtk).mul(scale),
            isBoss: true,
            emoji: '👹'
        });
        this.log('SYS', '首领降临！');
        this.updateCombatUI(true);
    }

    toggleAutoBoss() {
        this.autoChallenge = !this.autoChallenge;
        this.updateButtons();
    }

    rollWildLoot(isBoss) {
        let pillMult = new BigNum(1);
        // 秘宝丹药倍率
        for(let k in this.equippedTreasures) {
            const t = this.equippedTreasures[k];
            if(t && t.attrType.type === 'pill_mult') pillMult = pillMult.mul(t.val);
        }
        // 深渊遗宝刷丹倍率
        if (this.abyssRelic) {
            const relicBonuses = this.abyssRelic.getEffectiveBonuses();
            pillMult = pillMult.mul(relicBonuses.pillEffectMultiplier);
        }
        // 功法系统丹药效果倍率 (功法4)
        if (this.technique) {
            const techBonuses = this.technique.getAllBonuses();
            if (techBonuses.pillMult > 1) {
                pillMult = pillMult.mul(techBonuses.pillMult);
            }
        }
        const pill = new Item(this.difficulty, 'pill');
        pill.hpValue = pill.hpValue.mul(pillMult);
        pill.atkValue = pill.atkValue.mul(pillMult);
        this.autoConsumePill(pill);

        if (Math.random() < (isBoss ? 1 : 0.5)) {
            // 应用遗宝装备等级加成
            let equipLevelBoost = 0;
            if (this.abyssRelic) {
                equipLevelBoost = this.abyssRelic.getEffectiveBonuses().equipLevelBoost;
            }
            this.checkAutoEquip(new Item(this.difficulty + equipLevelBoost));
        }
    }

    rollTowerLoot(isBoss) {
        let drop = new BigNum(SCALE_TOWER_DROP).pow(this.towerLevel).mul(1 + this.cultRound);
        if(isBoss) drop = drop.mul(10);

        // 秘宝爬塔掉率
        let tMult = new BigNum(1);
        for(let k in this.equippedTreasures) {
            const t = this.equippedTreasures[k];
            if(t && t.attrType.type === 'tower_drop') tMult = tMult.mul(t.val);
        }
        drop = drop.mul(tMult);

        // 深渊遗宝爬塔掉率
        if (this.abyssRelic) {
            const relicBonuses = this.abyssRelic.getEffectiveBonuses();
            drop = drop.mul(relicBonuses.towerDropMultiplier);
        }

        // 功法系统真意掉率加成 (功法5)
        if (this.technique) {
            const techBonuses = this.technique.getAllBonuses();
            if (techBonuses.essenceDrop > 1) {
                drop = drop.mul(techBonuses.essenceDrop);
            }
        }

        this.lawFragments = this.lawFragments.add(drop);
        this.log('GAIN', `获得真意: ${formatNum(drop)}`);
        this.updateSystemUI();
    }

    autoConsumePill(pill) {
        this.playerBase.hp = this.playerBase.hp.add(pill.hpValue);
        this.playerBase.atk = this.playerBase.atk.add(pill.atkValue);
        this.updateStatsUI();
    }

    checkAutoEquip(newItem) {
        const curr = this.equipment[newItem.type];
        // Score: HP + 5*Atk
        const getScore = (i) => i.hp.add(i.atk.mul(5));
        
        if (!curr || getScore(newItem).gt(getScore(curr))) {
            this.equipment[newItem.type] = newItem;
            this.log('GAIN', `换装: ${newItem.name}`);
            this.updateEquipUI();
        } else {
            this.playerBase.hp = this.playerBase.hp.add(1);
        }
        this.updateStatsUI();
    }

    updateEquipUI() {
        SLOT_KEYS.forEach(slot => {
            const el = document.getElementById(`equip-${slot}`);
            const item = this.equipment[slot];
            if (item) {
                el.className = `equip-slot q-${item.quality}`;
                el.innerHTML = `<div>${this.getIcon(slot)}</div><div>${item.name}</div>`;
                el.onclick = () => this.log('SYS', `${item.name}: 攻${formatNum(item.atk)} 血${formatNum(item.hp)}`);
            }
        });
    }

    cultivate() {
        const cost = new BigNum(2).mul(new BigNum(2).pow(this.cultRound));
        if (this.lawFragments.gte(cost)) {
            this.lawFragments = this.lawFragments.sub(cost);
            if (this.cultStep % 2 === 0) this.lawMultipliers.atk = this.lawMultipliers.atk.mul(1.1);
            else this.lawMultipliers.hp = this.lawMultipliers.hp.mul(1.1);
            this.cultStep++;
            if (this.cultStep >= 10) { this.cultStep = 0; this.cultRound++; }
            this.updateSystemUI();
            this.updateStatsUI();
            return true;
        }
        return false;
    }

    cultivateAll() {
        let count = 0;
        while(this.cultivate()) { count++; }
        if(count) this.log('SYS', `一键修炼 ${count} 次`);
        else this.log('SYS', '真意不足');
    }

    updateSystemUI() {
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if(el) el.innerText = val;
        };

        setVal('res-law', formatNum(this.lawFragments));
        setVal('cult-round', this.cultRound);
        setVal('cult-step', `${this.cultStep}/10`);
        const cost = new BigNum(2).mul(new BigNum(2).pow(this.cultRound));
        setVal('cult-cost', formatNum(cost));
        setVal('cult-next', (this.cultStep%2===0 ? "攻击" : "生命") + " x1.1");
        
        setVal('tower-lv', this.towerLevel);
        setVal('tower-drop', formatNum(new BigNum(SCALE_TOWER_DROP).pow(this.towerLevel)));
        
        setVal('dungeon-lv', this.dungeon.level);
        setVal('dungeon-tier', `T${this.dungeon.tier}`);
        
        // 更新副本状态显示
        const dungeonStatusEl = document.getElementById('dungeon-status');
        if (dungeonStatusEl) {
            if (!this.dungeon.isUnlocked(this.dungeon.tier)) {
                dungeonStatusEl.innerText = `🔒 需主线N${getDungeonUnlockRequirement(this.dungeon.tier)}`;
            } else {
                dungeonStatusEl.innerText = this.dungeon.active ? `波次 ${Math.min(this.dungeon.wave+1, 3)}/3` : "待机";
            }
        }
        
        if(document.getElementById('dungeon-timer')) document.getElementById('dungeon-timer').innerText = this.dungeon.timeRemaining > 0 ? `${this.dungeon.timeRemaining}s` : "--";
        
        // 更新层数输入框和推荐层数
        const tierInput = document.getElementById('dungeon-tier-input');
        if (tierInput) tierInput.value = this.dungeon.tier;
        
        // 更新推荐层数显示
        const recommendEl = document.getElementById('dungeon-recommend-tier');
        if (recommendEl) {
            const recommended = this.dungeon.calculateRecommendedTier();
            recommendEl.innerText = `💡 推荐层数: T${recommended}`;
        }
        
        // 更新解锁提示
        const hintEl = document.getElementById('dungeon-unlock-hint');
        const inputEl = document.getElementById('dungeon-tier-input');
        if (hintEl && inputEl) {
            const inputTier = parseInt(inputEl.value) || 1;
            if (!this.dungeon.isUnlocked(inputTier)) {
                hintEl.innerHTML = `🔒 T${inputTier}需主线N${getDungeonUnlockRequirement(inputTier)}解锁`;
                inputEl.style.borderColor = '#f87171';
            } else {
                hintEl.innerHTML = '';
                inputEl.style.borderColor = this.dungeon.tier === inputTier ? '#4ade80' : '#444';
            }
        }
        
        setVal('treasure-daily', `${this.treasureDaily}/${this.treasureLimit}`);
        setVal('treasure-frags', formatNum(this.treasureFragments));

        setVal('chest-count', this.treasureChests);

        // 更新灵石显示
        setVal('res-stones', formatNum(this.stones));
    }

    updateStatsUI() {
        const s = this.getTotalStats();
        // Prevent negative zero or weird display
        let cur = this.currentHp;
        if(cur.lt(0)) cur = new BigNum(0);
        
        document.getElementById('stat-hp').innerText = `${formatNum(cur)} / ${formatNum(s.maxHp)}`;
        document.getElementById('stat-atk').innerText = formatNum(s.atk);
        if(document.getElementById('stat-crit')) document.getElementById('stat-crit').innerText = s.crit + '%';
        
        // Realm Multiplier
        const realmBonus = this.getRealmBonus();
        if (document.getElementById('mul-realm')) {
            document.getElementById('mul-realm').innerText = `x${formatNum(realmBonus)}`;
        }
        
        // Multipliers
        const atkMul = this.lawMultipliers.atk.mul(100).toString() + '%';
        const hpMul = this.lawMultipliers.hp.mul(100).toString() + '%';
        document.getElementById('mul-atk').innerText = `${atkMul} / ${hpMul}`;
        
        document.getElementById('mul-drop').innerText = "+" + (this.cultRound * 100) + '%';
    }

    /**
     * 打开属性详情面板
     */
    openStatsDetailModal() {
        this.updateStatsDetailModal();
        document.getElementById('stats-detail-modal').style.display = 'flex';
    }
    
    /**
     * 更新属性详情面板内容
     */
    updateStatsDetailModal() {
        const s = this.getTotalStats();
        const currentRealm = this.getCurrentRealm();
        const realmBonus = this.getRealmBonus();
        
        // 基础属性
        document.getElementById('detail-base-hp').innerText = formatNum(this.playerBase.hp);
        document.getElementById('detail-base-atk').innerText = formatNum(this.playerBase.atk);
        document.getElementById('detail-base-crit').innerText = this.playerBase.crit + '%';
        
        // 最终属性
        document.getElementById('detail-final-hp').innerText = formatNum(s.maxHp);
        document.getElementById('detail-final-atk').innerText = formatNum(s.atk);
        document.getElementById('detail-final-crit').innerText = s.crit + '%';
        
        // 境界加成
        document.getElementById('detail-realm-name').innerText = currentRealm.name;
        document.getElementById('detail-realm-bonus').innerText = 'x' + formatNum(realmBonus);
        const realmCountEl = document.getElementById('detail-realm-count');
        if (realmCountEl) realmCountEl.innerText = this.realmIndex + '次';
        
        // 计算装备总加成
        let equipAtk = new BigNum(0);
        let equipHp = new BigNum(0);
        let equipCrit = 0;
        for (let key in this.equipment) {
            const item = this.equipment[key];
            if (item) {
                equipAtk = equipAtk.add(item.atk);
                equipHp = equipHp.add(item.hp);
                equipCrit += item.crit || 0;
            }
        }
        document.getElementById('detail-equip-atk').innerText = '+' + formatNum(equipAtk);
        document.getElementById('detail-equip-hp').innerText = '+' + formatNum(equipHp);
        document.getElementById('detail-equip-crit').innerText = '+' + equipCrit + '%';
        
        // 法则加成
        document.getElementById('detail-law-atk').innerText = 'x' + formatNum(this.lawMultipliers.atk);
        document.getElementById('detail-law-hp').innerText = 'x' + formatNum(this.lawMultipliers.hp);
        document.getElementById('detail-law-round').innerText = this.cultRound + '轮';
        
        // 秘宝加成
        let treasureMult = new BigNum(1);
        let treasurePillMult = new BigNum(1);
        let treasureTowerMult = new BigNum(1);
        const equippedTreasureList = [];
        for (let key in this.equippedTreasures) {
            const t = this.equippedTreasures[key];
            if (t) {
                if (t.attrType.type === 'all_stat') {
                    treasureMult = treasureMult.mul(t.val);
                    if (t.hasExtra) treasureMult = treasureMult.mul(t.extraVal);
                } else if (t.attrType.type === 'pill_mult') {
                    treasurePillMult = treasurePillMult.mul(t.val);
                    if (t.hasExtra) treasurePillMult = treasurePillMult.mul(t.extraVal);
                } else if (t.attrType.type === 'tower_drop') {
                    treasureTowerMult = treasureTowerMult.mul(t.val);
                    if (t.hasExtra) treasureTowerMult = treasureTowerMult.mul(t.extraVal);
                }
                equippedTreasureList.push(`${TREASURE_SLOTS.find(s => s.key === key)?.name || key}: ${t.attrType.short}×${formatNum(t.val)}`);
            }
        }
        document.getElementById('detail-treasure-mult').innerText = 'x' + formatNum(treasureMult);
        document.getElementById('detail-treasure-pill').innerText = 'x' + formatNum(treasurePillMult);
        document.getElementById('detail-treasure-tower').innerText = 'x' + formatNum(treasureTowerMult);
        document.getElementById('detail-treasure-list').innerText = equippedTreasureList.length > 0 
            ? equippedTreasureList.join(' | ') 
            : '未装备秘宝';
        
        // 遗宝加成
        if (this.abyssRelic) {
            const relicBonuses = this.abyssRelic.getEffectiveBonuses();
            document.getElementById('detail-relic-stat').innerText = 'x' + formatNum(relicBonuses.allStatMultiplier);
            document.getElementById('detail-relic-tower').innerText = 'x' + formatNum(relicBonuses.towerDropMultiplier);
            document.getElementById('detail-relic-pill').innerText = 'x' + formatNum(relicBonuses.pillEffectMultiplier);
            document.getElementById('detail-relic-equip').innerText = '+' + relicBonuses.equipLevelBoost;
            document.getElementById('detail-relic-treasure').innerText = '+' + relicBonuses.treasureLevelBoost;
        } else {
            document.getElementById('detail-relic-stat').innerText = 'x1';
            document.getElementById('detail-relic-tower').innerText = 'x1';
            document.getElementById('detail-relic-pill').innerText = 'x1';
            document.getElementById('detail-relic-equip').innerText = '+0';
            document.getElementById('detail-relic-treasure').innerText = '+0';
        }
        
        // 经脉淬炼加成
        if (this.garden && this.garden.refinement) {
            const refinement = this.garden.refinement;
            const expBonus = refinement.getTotalExpBonus();
            const currentRealm = refinement.getCurrentRealm();
            document.getElementById('detail-meridian-realm').innerText = currentRealm.displayName;
            document.getElementById('detail-meridian-realm').style.color = currentRealm.color;
            document.getElementById('detail-meridian-mult').innerText = '×' + formatNum(refinement.totalMultiplier) + ' / +' + (expBonus * 100).toFixed(1) + '%';
            document.getElementById('detail-meridian-round').innerText = refinement.refinementRound + '轮';
        } else {
            document.getElementById('detail-meridian-realm').innerText = '第1境·凡胎';
            document.getElementById('detail-meridian-realm').style.color = '#888';
            document.getElementById('detail-meridian-mult').innerText = '×1 / +0%';
            document.getElementById('detail-meridian-round').innerText = '0轮';
        }
    }

    updateCombatUI(force) {
        const s = this.getTotalStats();
        // Calculate percentage for HP bar
        let pct = 0;
        if (s.maxHp.gt(0)) {
            // Using log scale for percentage if numbers are huge? No, linear is standard for HP bars.
            // But we need to handle BigNum division result -> number
            let ratio = this.currentHp.div(s.maxHp).toNumber();
            pct = Math.min(100, Math.max(0, ratio * 100));
        }
        document.getElementById('player-hp-bar').style.width = pct + '%';
        
        const c = document.getElementById('enemy-container');
        if (force || c.children.length !== this.enemies.length) {
            c.innerHTML = '';
            this.enemies.forEach(e => {
                const el = document.createElement('div');
                // Add special class for realm boss or abyss boss
                let className = 'entity';
                if (e.isRealmBoss) {
                    className += ' realm-boss-entity';
                } else if (e.isAbyssBoss) {
                    className += ' abyss-boss-entity';
                } else if (e.isBoss) {
                    className += ' boss-entity';
                } else {
                    className += ' enemy-entity';
                }
                el.className = className;
                el.id = `e-${e.id}`;
                
                let hpPct = 100;
                if(e.maxHp.gt(0)) hpPct = Math.min(100, Math.max(0, e.currentHp.div(e.maxHp).toNumber() * 100));
                
                el.innerHTML = `<div class="enemy-stats">${formatNum(e.atk)}<br>${formatNum(e.currentHp)}</div>${e.emoji}<div class="hp-bar-container"><div class="hp-bar-fill enemy-hp" style="width:${hpPct}%"></div></div>`;
                c.appendChild(el);
            });
        } else {
            this.enemies.forEach(e => {
                const el = document.getElementById(`e-${e.id}`);
                if(el) {
                    let hpPct = 100;
                    if(e.maxHp.gt(0)) hpPct = Math.min(100, Math.max(0, e.currentHp.div(e.maxHp).toNumber() * 100));
                    
                    el.querySelector('.enemy-stats').innerHTML = `${formatNum(e.atk)}<br>${formatNum(e.currentHp)}`;
                    el.querySelector('.hp-bar-fill').style.width = hpPct+'%';
                }
            });
        }
    }

    showDamage(val, target, crit) {
        const overlay = document.getElementById('damage-overlay');
        const el = document.createElement('div');
        el.className = 'damage-text';
        el.innerHTML = (crit ? '💥 ' : '') + formatNum(val);

        if (target === 'player') {
            el.style.color = '#f44336';
            el.style.left = '50%';
            el.style.top = '70%';
        } else {
            const tEl = document.getElementById(`e-${target}`);
            if (tEl) {
                const rect = tEl.getBoundingClientRect();
                el.style.color = '#fff';
                el.style.left = (10 + Math.random()*80) + '%';
                el.style.top = (20 + Math.random()*40) + '%';
            }
        }
        overlay.appendChild(el);
        setTimeout(()=>el.remove(), 800);
    }

    /**
     * 显示灵石掉落跳字
     * @param {BigNum} amount - 灵石数量
     * @param {string} enemyId - 敌人ID，用于定位显示位置
     */
    showStoneDrop(amount, enemyId) {
        const overlay = document.getElementById('damage-overlay');
        const el = document.createElement('div');
        el.className = 'stone-drop-text';
        el.innerHTML = `💎 ${formatNum(amount)}`;

        // 样式设置
        el.style.position = 'absolute';
        el.style.color = '#10b981';
        el.style.fontSize = '1.1rem';
        el.style.fontWeight = 'bold';
        el.style.textShadow = '0 0 4px rgba(16,185,129,0.5)';
        el.style.pointerEvents = 'none';
        el.style.zIndex = '100';
        el.style.animation = 'floatUp 1s ease-out forwards';

        // 根据敌人位置定位，如果没有敌人元素则随机位置
        const tEl = document.getElementById(`e-${enemyId}`);
        if (tEl) {
            const rect = tEl.getBoundingClientRect();
            const overlayRect = overlay.getBoundingClientRect();
            el.style.left = (rect.left - overlayRect.left + rect.width/2 - 30) + 'px';
            el.style.top = (rect.top - overlayRect.top) + 'px';
        } else {
            el.style.left = (10 + Math.random()*70) + '%';
            el.style.top = (30 + Math.random()*30) + '%';
        }

        overlay.appendChild(el);
        setTimeout(()=>el.remove(), 1000);
    }
    
    showSkillEffect(txt) {
        const el = document.createElement('div');
        el.className = 'skill-text';
        el.innerText = txt;
        document.getElementById('skill-overlay').appendChild(el);
        setTimeout(()=>el.remove(), 1000);
    }
    
    log(type, msg) {
        const d = document.createElement('div');
        d.className = 'log-entry';
        d.innerHTML = `<span class="log-${type.toLowerCase()}">[${type}]</span> ${msg}`;
        const log = document.getElementById('battle-log');
        log.appendChild(d);
        log.scrollTop = log.scrollHeight;
    }

    // --- Spirit Garden Methods ---
    // Calculate garden income rates (per minute)
    calculateGardenIncomeRates() {
        if (!this.garden) return { stonesPerMin: new BigNum(0), expPerMin: new BigNum(0), essencePerMin: new BigNum(0) };
        
        const g = this.garden;
        let totalIncomePerSec = new BigNum(0);
        let totalExpPerSec = new BigNum(0);
        let totalEssencePerSec = new BigNum(0);
        
        g.lands.forEach(land => {
            if (land.unlocked && land.plant) {
                const crop = land.plant;
                const harvestsPerSec = 1 / crop.time;
                
                let income = crop.income.mul(harvestsPerSec);
                let exp = crop.exp.mul(harvestsPerSec);
                
                // Apply bonuses
                if (g.alchemyMode && g.gardenLevel >= GARDEN_CONFIG.alchemyUnlockLevel) {
                    income = income.mul(GARDEN_CONFIG.alchemyBonus);
                }
                if (this.hasAdvancedPuppet) {
                    income = income.mul(1.1);
                }
                
                // Apply cheat multipliers
                if (this.gardenStoneMultiplier > 1) {
                    income = income.mul(this.gardenStoneMultiplier);
                }
                if (this.gardenExpMultiplier > 1) {
                    exp = exp.mul(this.gardenExpMultiplier);
                }
                
                // 计算生灵精华产出（灵石的1/10）
                let essence = income.div(10);
                if (g.alchemyMode && g.gardenLevel >= GARDEN_CONFIG.alchemyUnlockLevel) {
                    essence = essence.mul(1.5);
                }
                // 应用生灵精华倍率
                if (this.gardenEssenceMultiplier > 1) {
                    essence = essence.mul(this.gardenEssenceMultiplier);
                }
                
                totalIncomePerSec = totalIncomePerSec.add(income);
                totalExpPerSec = totalExpPerSec.add(exp);
                totalEssencePerSec = totalEssencePerSec.add(essence);
            }
        });
        
        return {
            stonesPerMin: totalIncomePerSec.mul(60),
            expPerMin: totalExpPerSec.mul(60),
            essencePerMin: totalEssencePerSec.mul(60)
        };
    }
    
    // Update garden overview (shown in main tab)
    updateGardenOverview() {
        if (!this.garden) return;
        
        const g = this.garden;
        const rates = this.calculateGardenIncomeRates();
        const refinement = g.refinement;
        
        // Update overview elements
        const overviewLevel = document.getElementById('garden-overview-level');
        const overviewTurn = document.getElementById('garden-overview-turn');
        const overviewStones = document.getElementById('garden-overview-stones');
        const overviewIncome = document.getElementById('garden-overview-income');
        const overviewEssence = document.getElementById('garden-overview-essence');
        const overviewLands = document.getElementById('garden-overview-lands');
        const overviewMature = document.getElementById('garden-overview-mature');
        
        // 经脉淬炼信息
        const overviewRefineRealm = document.getElementById('garden-overview-refine-realm');
        const overviewRefineStep = document.getElementById('garden-overview-refine-step');
        const overviewMeridianBonus = document.getElementById('garden-overview-meridian-bonus');
        
        if (overviewLevel) overviewLevel.innerText = g.gardenLevel;
        if (overviewTurn) overviewTurn.innerText = GARDEN_CONFIG.turnNames[g.turn];
        if (overviewStones) overviewStones.innerText = formatNum(g.spiritStones);
        if (overviewIncome) overviewIncome.innerText = '+' + formatNum(rates.stonesPerMin) + '/分';
        if (overviewEssence) overviewEssence.innerText = formatNum(refinement.lifeEssence);
        
        // 生灵精华产出速率
        const overviewEssenceRate = document.getElementById('garden-overview-essence-rate');
        if (overviewEssenceRate) overviewEssenceRate.innerText = formatNum(rates.essencePerMin);
        
        // 更新经脉淬炼信息
        const currentRealm = refinement.getCurrentRealm();
        if (overviewRefineRealm) {
            overviewRefineRealm.innerText = currentRealm.displayName;
            overviewRefineRealm.style.color = currentRealm.color;
        }
        if (overviewRefineStep) overviewRefineStep.innerText = refinement.refinementStep;
        if (overviewMeridianBonus) {
            const expBonus = refinement.getTotalExpBonus();
            overviewMeridianBonus.innerText = '×' + formatNum(refinement.totalMultiplier) + ' / +' + (expBonus * 100).toFixed(1) + '%';
        }
        
        const unlockedLands = g.lands.filter(l => l.unlocked).length;
        const matureLands = g.lands.filter(l => l.plant && l.progress >= 100).length;
        if (overviewLands) overviewLands.innerText = unlockedLands;
        if (overviewMature) overviewMature.innerText = matureLands;
    }
    
    // Update a single land element
    updateSingleLand(index) {
        if (!this.garden) return;
        
        const g = this.garden;
        const land = g.lands[index];
        const div = document.getElementById(`garden-land-${index}`);
        if (!div) return;
        
        // Check if content needs updating by comparing current state
        const isLocked = !land.unlocked;
        const isEmpty = land.unlocked && !land.plant;
        const isGrowing = land.plant && land.progress < 100;
        const isMature = land.plant && land.progress >= 100;
        
        // Determine what classes/content this land should have
        let expectedClass = 'garden-land';
        let expectedHTML = '';
        
        if (isLocked) {
            expectedClass += ' locked';
            expectedHTML = `
                <div class="land-lock">
                    <i class="fas fa-lock"></i>
                    <div class="unlock-cost">${formatNum(land.unlockCost)}</div>
                </div>
            `;
        } else if (isEmpty) {
            expectedClass += ' empty';
            if (g.puppetMode && land.lastSeedId && g.gardenLevel >= GARDEN_CONFIG.puppetUnlockLevel) {
                expectedHTML = `<div class="auto-plant-hint"><i class="fas fa-magic"></i></div>`;
            } else {
                expectedHTML = `<div class="plant-hint"><i class="fas fa-plus"></i></div>`;
            }
        } else if (land.plant) {
            if (isMature) {
                expectedClass += ' mature';
                expectedHTML = `
                    <div class="crop-icon">${land.plant.icon}</div>
                    <div class="mature-indicator"><i class="fas fa-check"></i></div>
                `;
            } else {
                expectedClass += ' growing';
                expectedHTML = `
                    <div class="crop-icon">${land.plant.icon}</div>
                    <div class="progress-bar"><div style="width: ${land.progress.toFixed(1)}%"></div></div>
                `;
            }
        }
        
        // Only update if changed
        if (div.className !== expectedClass || div.innerHTML !== expectedHTML) {
            div.className = expectedClass;
            div.innerHTML = expectedHTML;
        }
    }
    
    // Update only seed selection state
    updateSeedSelection() {
        if (!this.garden) return;
        
        const g = this.garden;
        const seedList = document.getElementById('modal-seed-list');
        if (!seedList) return;
        
        seedList.querySelectorAll('.seed-item').forEach(item => {
            const cropId = parseInt(item.dataset.cropId);
            if (cropId === g.selectedSeedId) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    // Update only progress bars (real-time)
    updateGardenProgressBars() {
        if (!this.garden) return;
        
        const g = this.garden;
        
        // Update each land (efficient - only updates if changed)
        g.lands.forEach((land, index) => {
            this.updateSingleLand(index);
        });
    }
    
    // Update full garden UI (shown in modal)
    updateGardenUI() {
        if (!this.garden) return;
        
        const g = this.garden;
        
        // Update level and exp
        const levelEl = document.getElementById('garden-modal-level');
        const turnEl = document.getElementById('garden-modal-turn');
        const expBar = document.getElementById('garden-modal-exp-bar');
        const stonesEl = document.getElementById('garden-modal-stones');
        
        if (levelEl) levelEl.innerText = g.gardenLevel;
        if (turnEl) turnEl.innerText = GARDEN_CONFIG.turnNames[g.turn];
        if (stonesEl) stonesEl.innerText = formatNum(g.spiritStones);
        
        if (expBar) {
            const maxExp = g.getMaxExp();
            const pct = Math.min(100, g.gardenExp.div(maxExp).toNumber() * 100);
            expBar.style.width = pct + '%';
        }
        
        // Update income rates
        const rates = this.calculateGardenIncomeRates();
        const incomeEl = document.getElementById('garden-modal-income');
        const expRateEl = document.getElementById('garden-modal-exp-rate');
        const essenceRateEl = document.getElementById('garden-modal-essence-rate');
        if (incomeEl) incomeEl.innerText = '+' + formatNum(rates.stonesPerMin) + '/分';
        if (expRateEl) expRateEl.innerText = '+' + formatNum(rates.expPerMin) + '/分';
        if (essenceRateEl) essenceRateEl.innerText = '+' + formatNum(rates.essencePerMin) + '/分';
        
        // Update meridian refinement UI
        const refinement = g.refinement;
        
        // 更新经脉图
        const meridianContainer = document.getElementById('meridian-map-container');
        if (meridianContainer) {
            meridianContainer.innerHTML = refinement.getMeridianMapHTML();
        }
        
        // 更新淬炼信息
        const refineRoundEl = document.getElementById('garden-refine-round');
        const refineStepEl = document.getElementById('garden-refine-step');
        const meridianBonusEl = document.getElementById('garden-meridian-bonus');
        const lifeEssenceEl = document.getElementById('garden-life-essence');
        const refineCostEl = document.getElementById('garden-refine-cost');
        const refineRealmEl = document.getElementById('garden-refine-realm');
        const refineRealmDescEl = document.getElementById('garden-refine-realm-desc');
        
        if (refineRoundEl) refineRoundEl.innerText = refinement.refinementRound + '轮';
        if (refineStepEl) refineStepEl.innerText = refinement.refinementStep + '/10';
        if (meridianBonusEl) {
            const expBonus = refinement.getTotalExpBonus();
            meridianBonusEl.innerText = '×' + formatNum(refinement.totalMultiplier) + ' / +' + (expBonus * 100).toFixed(1) + '%';
        }
        if (lifeEssenceEl) lifeEssenceEl.innerText = formatNum(refinement.lifeEssence);
        if (refineCostEl) refineCostEl.innerText = formatNum(refinement.getRefinementCost());
        
        // 更新下一级预览
        const previewCurrent = document.getElementById('garden-preview-current');
        const previewNext = document.getElementById('garden-preview-next');
        const previewGain = document.getElementById('garden-preview-gain');
        if (previewCurrent && previewNext && previewGain) {
            const preview = refinement.getNextLevelPreview();
            previewCurrent.innerText = preview.current;
            previewNext.innerText = preview.next;
            previewGain.innerText = preview.gain;
        }
        
        // 更新境界信息
        const currentRealm = refinement.getCurrentRealm();
        if (refineRealmEl) {
            refineRealmEl.innerText = currentRealm.displayName;
            refineRealmEl.style.color = currentRealm.color;
        }
        if (refineRealmDescEl) refineRealmDescEl.innerText = currentRealm.desc;
        
        // Update land grid (create once, then efficient update)
        const landGrid = document.getElementById('modal-land-grid');
        if (landGrid) {
            // Create land elements if needed
            if (landGrid.children.length !== g.lands.length) {
                landGrid.innerHTML = '';
                g.lands.forEach((land, index) => {
                    const div = document.createElement('div');
                    div.className = 'garden-land';
                    div.id = `garden-land-${index}`;
                    // Use addEventListener once
                    div.addEventListener('click', (e) => {
                        g.handleLandClick(index, e);
                        // Only update changed land, not full UI
                        this.updateSingleLand(index);
                        this.updateGardenOverview();
                    });
                    landGrid.appendChild(div);
                });
            }
            
            // Update all lands
            g.lands.forEach((land, index) => {
                this.updateSingleLand(index);
            });
        }
        
        // Update turn selector (dropdown)
        const turnSelector = document.getElementById('modal-turn-selector');
        if (turnSelector) {
            const unlockedTurns = g.getUnlockedTurns();
            
            // Check if we need to rebuild options (unlock count changed)
            const currentOptions = turnSelector.querySelectorAll('option');
            const needRebuild = currentOptions.length !== (unlockedTurns + 1);
            
            if (needRebuild) {
                turnSelector.innerHTML = '';
                
                GARDEN_CONFIG.turnNames.forEach((name, idx) => {
                    if (idx <= unlockedTurns) {
                        const option = document.createElement('option');
                        option.value = idx;
                        option.innerText = name;
                        turnSelector.appendChild(option);
                    }
                });
            }
            
            // Set current selection
            turnSelector.value = g.shopTurn;
        }
        
        // Auto-select first seed if none selected or current not available
        const availableCrops = g.getAvailableCrops();
        const currentSeedAvailable = availableCrops.some(c => c.id === g.selectedSeedId);
        if (!g.selectedSeedId || !currentSeedAvailable) {
            if (availableCrops.length > 0) {
                g.selectedSeedId = availableCrops[0].id;
            }
        }
        
        // Update seed list (efficient: only create if needed, otherwise update selection)
        const seedList = document.getElementById('modal-seed-list');
        if (seedList) {
            const crops = g.getAvailableCrops();
            
            // Check if we need to recreate the list (first time, turn changed, or crops changed)
            const existingItems = seedList.querySelectorAll('.seed-item');
            const firstCropId = existingItems.length > 0 ? parseInt(existingItems[0].dataset.cropId) : null;
            const currentFirstCropId = crops.length > 0 ? crops[0].id : null;
            const needRecreate = existingItems.length !== crops.length || firstCropId !== currentFirstCropId;
            
            if (needRecreate) {
                // Full recreate
                seedList.innerHTML = '';
                
                // Debug: if no crops available, show message
                if (crops.length === 0) {
                    const emptyMsg = document.createElement('div');
                    emptyMsg.style.cssText = 'text-align:center; padding:20px; color:#666; font-size:0.8rem;';
                    emptyMsg.innerText = '暂无可用种子 (Lv.' + g.gardenLevel + ')';
                    seedList.appendChild(emptyMsg);
                }
                
                crops.forEach(crop => {
                    const div = document.createElement('div');
                    div.dataset.cropId = crop.id;
                    div.className = 'seed-item';
                    
                    div.addEventListener('click', (e) => {
                        e.stopPropagation();
                        g.selectSeed(crop.id);
                        // Only update selection, not full UI
                        this.updateSeedSelection();
                    });
                    
                    const qualityColor = CROP_QUALITY_COLORS[crop.quality] || '#9ca3af';
                    
                    div.innerHTML = `
                        <div class="seed-icon" style="color: ${qualityColor}">${crop.icon}</div>
                        <div class="seed-info">
                            <div class="seed-name" style="color: ${qualityColor}">${crop.name}</div>
                            <div class="seed-stats">
                                <span><i class="far fa-clock"></i> ${crop.time}s</span>
                                <span>💎 ${formatNum(crop.income)}</span>
                            </div>
                        </div>
                        <div class="seed-cost">-${formatNum(crop.cost)}</div>
                    `;
                    
                    seedList.appendChild(div);
                });
                
                // Show next unlock hint
                const nextUnlock = g.getNextUnlockInTurn();
                if (nextUnlock) {
                    const hint = document.createElement('div');
                    hint.className = 'unlock-hint';
                    hint.id = 'garden-unlock-hint';
                    hint.innerHTML = `<i class="fas fa-lock"></i> 下一级 ${nextUnlock.name} 需 Lv.${nextUnlock.reqLevel}`;
                    seedList.appendChild(hint);
                }
            }
            
            // Update selection state
            this.updateSeedSelection();
        }
        
        // Update tool selection
        const shovelBtn = document.getElementById('modal-shovel-btn');
        if (shovelBtn) {
            shovelBtn.className = 'tool-btn ' + (g.selectedTool === 'shovel' ? 'active' : '');
            // Bind click event if not already bound
            if (!shovelBtn.dataset.bound) {
                shovelBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log('Shovel button clicked');
                    this.selectGardenTool('shovel');
                });
                shovelBtn.dataset.bound = 'true';
            }
        }
        
        // Update puppet toggle
        const puppetBtn = document.getElementById('modal-puppet-btn');
        if (puppetBtn) {
            puppetBtn.className = 'puppet-toggle ' + (g.puppetMode ? 'active' : '');
            puppetBtn.innerHTML = g.puppetMode ? '🤖 傀儡: ON' : '🤖 傀儡: OFF';
            puppetBtn.disabled = g.gardenLevel < GARDEN_CONFIG.puppetUnlockLevel;
        }
        
        // Update alchemy toggle
        const alchemyToggle = document.getElementById('modal-alchemy-toggle');
        if (alchemyToggle) {
            alchemyToggle.style.display = g.gardenLevel >= GARDEN_CONFIG.alchemyUnlockLevel ? 'flex' : 'none';
            const alchemyBtn = document.getElementById('modal-alchemy-btn');
            if (alchemyBtn) {
                alchemyBtn.className = g.alchemyMode ? 'active' : '';
                alchemyBtn.innerText = g.alchemyMode ? 'ON (+20%)' : 'OFF';
            }
        }
    }
    
    // Open/Close Garden Modal
    openGardenModal() {
        this.isGardenModalOpen = true;
        // Ensure a valid seed is selected
        if (this.garden) {
            const availableCrops = this.garden.getAvailableCrops();
            const currentSeedAvailable = availableCrops.some(c => c.id === this.garden.selectedSeedId);
            if (!this.garden.selectedSeedId || !currentSeedAvailable) {
                if (availableCrops.length > 0) {
                    this.garden.selectedSeedId = availableCrops[0].id;
                }
            }
        }
        document.getElementById('garden-full-modal').style.display = 'flex';
        this.updateGardenUI();
    }
    
    closeGardenModal() {
        this.isGardenModalOpen = false;
        document.getElementById('garden-full-modal').style.display = 'none';
    }
    
    // --- Ancient Treasure System (大千宝录古宝系统) ---
    openAncientTreasureModal() {
        this.isTreasureModalOpen = true;
        document.getElementById('treasure-ancient-modal').style.display = 'flex';
        this.updateTreasureUI();
    }

    closeAncientTreasureModal() {
        this.isTreasureModalOpen = false;
        document.getElementById('treasure-ancient-modal').style.display = 'none';
    }
    
    closeTreasureDrawResult() {
        if (this.ancientTreasure) {
            this.ancientTreasure.showResult = false;
            this.ancientTreasure.drawResults = [];
        }
        const modal = document.getElementById('treasure-draw-result-modal');
        if (modal) modal.style.display = 'none';
        this.updateTreasureUI();
    }
    
    upgradeSelectedTreasure() {
        if (this.ancientTreasure.selectedId) {
            const result = this.ancientTreasure.upgrade(this.ancientTreasure.selectedId);
            if (result) {
                this.updateTreasureUI();
            }
        }
    }
    
    updateTreasureUI() {
        const at = this.ancientTreasure;

        // 更新标签概览面板 (always update these)
        const overviewTokensEl = document.getElementById('ancient-treasure-tokens');
        if (overviewTokensEl) overviewTokensEl.innerText = this.treasureDrawTokens || 0;

        const overviewProgressEl = document.getElementById('ancient-treasure-progress');
        if (overviewProgressEl) {
            const collected = at.getCollectedCount();
            const total = at.getTotalCount();
            const percent = total > 0 ? Math.floor((collected / total) * 100) : 0;
            overviewProgressEl.innerText = `${collected}/${total} (${percent}%)`;
        }

        const overviewPowerEl = document.getElementById('ancient-treasure-total-power');
        if (overviewPowerEl) {
            overviewPowerEl.innerText = '×' + at.formatLog10(at.getTotalPowerLog());
        }

        // 更新里程碑信息
        const milestoneEl = document.getElementById('ancient-treasure-milestone');
        if (milestoneEl) {
            const completed = at.getCompletedRealmCount();
            const totalRealms = Object.keys(at.library).length;
            const bonus = completed * at.milestoneBonus;
            milestoneEl.innerHTML = `
                <div style="color: #fbbf24; font-weight: bold;">🏆 已完成界域: ${completed}/${totalRealms}</div>
                <div style="font-size: 0.75rem; color: #888;">里程碑加成: +${bonus.toFixed(1)}% (每完成一个界域+50%)</div>
            `;
        }

        // 更新羁绊信息
        const synergiesEl = document.getElementById('ancient-treasure-synergies');
        if (synergiesEl) {
            let synergyHtml = '';
            at.synergies.forEach(synergy => {
                const activeCount = at.getSynergyActiveCount(synergy.id);
                const level = at.getSynergyLevel(synergy.id);
                const maxLevel = synergy.levels.length;
                const nextReq = level < maxLevel ? synergy.levels[level].require : synergy.levels[maxLevel - 1].require;

                let progressColor = '#666';
                if (level >= 3) progressColor = '#fbbf24'; // 满级金色
                else if (level >= 2) progressColor = '#a78bfa'; // 2级紫色
                else if (level >= 1) progressColor = '#60a5fa'; // 1级蓝色

                synergyHtml += `
                    <div style="
                        padding: 6px 8px;
                        background: rgba(255,255,255,0.03);
                        border-radius: 4px;
                        border-left: 3px solid ${progressColor};
                    ">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                            <span style="color: ${progressColor}; font-weight: bold;">${synergy.icon} ${synergy.name}</span>
                            <span style="font-size:0.7rem; color: #888;">Lv.${level}/${maxLevel}</span>
                        </div>
                        <div style="font-size:0.7rem; color: #aaa; margin-bottom:4px;">${synergy.desc}</div>
                        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.65rem;">
                            <span style="color: #666;">进度: ${activeCount}/${nextReq}</span>
                            <span style="color: ${level > 0 ? '#4ade80' : '#666'};">${level > 0 ? synergy.levels[level - 1].desc : '未激活'}</span>
                        </div>
                        ${level > 0 ? `
                        <div style="margin-top:4px; font-size:0.6rem; color: #4ade80;">
                            ${synergy.levels.slice(0, level).map(l => '✦ ' + l.desc).join('<br>')}
                        </div>
                        ` : ''}
                    </div>
                `;
            });
            synergiesEl.innerHTML = synergyHtml;
        }

        // 更新各界域收集进度
        const realmsProgressEl = document.getElementById('ancient-treasure-realms');
        if (realmsProgressEl) {
            let html = '<div style="margin-top: 10px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px;">';
            Object.keys(at.library).forEach(realmName => {
                const items = at.library[realmName];
                const collected = items.filter(item => {
                    const data = at.playerData[item.id];
                    return data && data.level > 0;
                }).length;
                const total = items.length;
                const isCompleted = at.isRealmCompleted(realmName);
                const percent = Math.floor((collected / total) * 100);

                html += `
                    <div style="
                        padding: 5px 8px;
                        background: ${isCompleted ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.05)'};
                        border: 1px solid ${isCompleted ? '#fbbf24' : '#444'};
                        border-radius: 4px;
                        font-size: 0.7rem;
                        text-align: center;
                    ">
                        <div style="color: ${isCompleted ? '#fbbf24' : '#aaa'};">${realmName.slice(0, 2)}</div>
                        <div style="color: #888;">${collected}/${total}</div>
                        <div style="width: 100%; height: 3px; background: #333; border-radius: 2px; margin-top: 2px;">
                            <div style="width: ${percent}%; height: 100%; background: ${isCompleted ? '#fbbf24' : '#3b82f6'}; border-radius: 2px;"></div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            realmsProgressEl.innerHTML = html;
        }

        // 如果modal未打开，只更新概览面板
        if (!this.isTreasureModalOpen) return;

        // 更新寻宝令显示 (modal内)
        const tokensEl = document.getElementById('treasure-draw-tokens');
        if (tokensEl) tokensEl.innerText = this.treasureDrawTokens || 0;
        
        // 更新总战力
        const totalPowerEl = document.getElementById('treasure-total-power');
        if (totalPowerEl) {
            totalPowerEl.innerText = '×' + at.formatLog10(at.getTotalPowerLog());
        }
        
        // 更新收集进度
        const collectedEl = document.getElementById('treasure-collected-count');
        const totalEl = document.getElementById('treasure-total-count');
        const tabPowerEl = document.getElementById('treasure-tab-power');
        if (collectedEl) collectedEl.innerText = at.getCollectedCount();
        if (totalEl) totalEl.innerText = at.getTotalCount();
        if (tabPowerEl) tabPowerEl.innerText = at.formatLog10(at.getTabPowerLog(at.activeTab));
        
        // 更新保底计数
        const pityEl = document.getElementById('treasure-pity-count');
        if (pityEl) pityEl.innerText = at.pityCount;
        
        // 更新标签页
        this.updateTreasureTabs();
        
        // 更新古宝列表
        this.updateTreasureList();
        
        // 更新详情面板
        this.updateTreasureDetail();
    }
    
    updateTreasureTabs() {
        const container = document.getElementById('treasure-tabs');
        if (!container) return;
        
        const at = this.ancientTreasure;
        const tabs = Object.keys(at.library);
        
        let html = '';
        tabs.forEach(tab => {
            const isActive = at.activeTab === tab;
            html += `
                <button class="treasure-tab-btn ${isActive ? 'active' : ''}" onclick="game.switchTreasureTab('${tab}')">
                    ${tab.slice(0, 2)}
                </button>
            `;
        });
        
        container.innerHTML = html;
    }
    
    switchTreasureTab(tabName) {
        this.ancientTreasure.activeTab = tabName;
        this.ancientTreasure.selectedId = null;
        this.updateTreasureUI();
    }
    
    updateTreasureList() {
        const container = document.getElementById('treasure-list-content');
        if (!container) {
            console.warn('[updateTreasureList] Container not found');
            return;
        }

        const at = this.ancientTreasure;
        if (!at || !at.library) {
            console.warn('[updateTreasureList] AncientTreasure not initialized');
            return;
        }

        console.log('[updateTreasureList] Active tab:', at.activeTab, 'Library:', Object.keys(at.library || {}));

        const ranks = ['UR', 'SSR', 'SR', 'R'];
        let totalItems = 0;
        let html = '';
        ranks.forEach(rank => {
            const items = at.getFilteredByRank(at.activeTab, rank);
            console.log('[updateTreasureList]', rank, ':', items.length, 'items');
            if (items.length === 0) return;
            totalItems += items.length;
            
            const rankColorClass = `treasure-rank-${rank.toLowerCase()}`;
            const growthRate = ((at.rankGrowth[rank] - 1) * 100).toFixed(0);
            
            html += `
                <div style="margin-bottom:15px;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                        <span style="font-size:0.65rem; font-weight:900; padding:2px 5px; border-radius:3px; color:#fff; ${rankColorClass}">${rank}</span>
                        <span style="font-size:0.6rem; color:#475569;">(成长率: ${growthRate}%)</span>
                        <div style="flex:1; height:1px; background:#1e293b;"></div>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(55px, 1fr)); gap:8px;">
            `;
            
            items.forEach(item => {
                const isUnlocked = at.isUnlocked(item.id);
                const hasShards = at.hasShards(item.id);
                const data = at.getPlayerData(item.id);
                const isSelected = at.selectedId === item.id;
                const rankClass = item.rank.toLowerCase();

                html += `
                    <div class="treasure-card ${rankClass} ${isUnlocked ? '' : 'locked'} ${hasShards ? 'has-shards' : ''} ${isSelected ? 'selected' : ''}"
                         onclick="game.selectTreasureItem(${item.id})"
                         style="
                            position: relative;
                            aspect-ratio: 1;
                            border-radius: 8px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                            background: ${isUnlocked ? at.rankColors[item.rank].bg : 'linear-gradient(135deg, #1e293b, #0f172a)'};
                            border: 2px solid ${isSelected ? '#fff' : (isUnlocked ? 'transparent' : '#334155')};
                            opacity: ${isUnlocked ? 1 : 0.5};
                            box-shadow: ${isUnlocked ? at.rankColors[item.rank].shadow : 'none'};
                         "
                    >
                        ${isUnlocked ? `<div style="position:absolute; top:2px; right:2px; font-size:0.55rem; background:rgba(0,0,0,0.5); padding:1px 3px; border-radius:3px; color:#fff;">${data.tier}重</div>` : ''}
                        ${isUnlocked ? `<div style="position:absolute; bottom:2px; left:2px; font-size:0.55rem; background:rgba(0,0,0,0.5); padding:1px 3px; border-radius:3px; color:#fff;">Lv.${at.getTotalLevel(item.id)}</div>` : ''}
                        ${hasShards && !isUnlocked ? `<div style="position:absolute; top:-3px; right:-3px; width:12px; height:12px; background:#fbbf24; border-radius:50%; box-shadow:0 0 5px #fbbf24;"></div>` : ''}
                        <div style="font-size:1.5rem;">${item.icon}</div>
                    </div>
                `;
            });
            
            html += '</div></div>';
        });

        console.log('[updateTreasureList] Total items rendered:', totalItems, 'HTML length:', html.length);
        container.innerHTML = html;
    }
    
    selectTreasureItem(id) {
        this.ancientTreasure.selectedId = id;
        this.updateTreasureUI();
    }
    
    updateTreasureDetail() {
        const at = this.ancientTreasure;
        const drawPanel = document.getElementById('treasure-draw-panel');
        const detailPanel = document.getElementById('treasure-detail-panel');

        if (!at.selectedId) {
            if (drawPanel) drawPanel.style.display = 'flex';
            if (detailPanel) detailPanel.style.display = 'none';
            return;
        }

        if (drawPanel) drawPanel.style.display = 'none';
        if (detailPanel) detailPanel.style.display = 'flex';

        const item = at.getTreasureData(at.selectedId);
        const data = at.getPlayerData(at.selectedId);
        if (!item) return;

        // 更新图标
        const iconContainer = document.getElementById('treasure-detail-icon-container');
        if (iconContainer) {
            const rankColorClass = `treasure-rank-${item.rank.toLowerCase()}`;
            iconContainer.className = rankColorClass;
            iconContainer.innerHTML = item.icon;
        }

        // 更新名称
        const nameEl = document.getElementById('treasure-detail-name');
        if (nameEl) nameEl.innerText = item.name;

        // 更新成长率
        const growthEl = document.getElementById('treasure-detail-growth');
        if (growthEl) growthEl.innerText = ((at.rankGrowth[item.rank] - 1) * 100).toFixed(0);

        // 更新属性类型
        const attrEl = document.getElementById('treasure-detail-attr');
        if (attrEl) attrEl.innerText = item.attr;

        // 更新战力
        const powerEl = document.getElementById('treasure-detail-power');
        if (powerEl) {
            powerEl.innerText = '×' + at.formatNumber(at.calculateSinglePower(at.selectedId));
        }

        // 更新下级预览
        const nextPowerEl = document.getElementById('treasure-detail-next-power');
        if (nextPowerEl) {
            nextPowerEl.innerText = '×' + at.formatNumber(at.calculateSinglePower(at.selectedId, 1));
        }

        // 更新描述
        const descEl = document.getElementById('treasure-detail-desc');
        if (descEl) descEl.innerText = item.desc;

        // 更新等级进度
        const levelEl = document.getElementById('treasure-detail-level');
        const levelBar = document.getElementById('treasure-detail-level-bar');
        if (levelEl) levelEl.innerText = data.level;
        if (levelBar) levelBar.style.width = (data.level / 10 * 100) + '%';

        // 更新碎片数量和升级消耗
        const shardsEl = document.getElementById('treasure-detail-shards');
        const costEl = document.getElementById('treasure-detail-cost');
        const cost = at.getUpgradeCost(at.selectedId);
        if (shardsEl) shardsEl.innerText = `${data.shards}/${cost}`;
        if (costEl) costEl.innerText = cost;

        // 更新觉醒效果
        const awakeningEl = document.getElementById('treasure-detail-awakening');
        if (awakeningEl) {
            const awakening = at.getAwakeningEffect(at.selectedId);
            if (awakening && data.level > 0) {
                let awakeningText = `★ 觉醒【${awakening.name}】第${awakening.tier}重`;
                awakeningText += `\n   ${awakening.desc}`;

                // 显示具体加成
                if (awakening.bonuses.attackMult && awakening.bonuses.attackMult > 1) {
                    awakeningText += `\n   攻击倍率 ×${awakening.bonuses.attackMult.toFixed(2)}`;
                }
                if (awakening.bonuses.hpMult && awakening.bonuses.hpMult > 1) {
                    awakeningText += `\n   生命倍率 ×${awakening.bonuses.hpMult.toFixed(2)}`;
                }
                if (awakening.bonuses.attackExpBonus > 0) {
                    awakeningText += `\n   攻击指数 +${(awakening.bonuses.attackExpBonus * 100).toFixed(1)}%`;
                }
                if (awakening.bonuses.regenBonus > 0) {
                    awakeningText += `\n   战斗恢复 +${(awakening.bonuses.regenBonus * 100).toFixed(1)}%`;
                }
                if (awakening.bonuses.allMult && awakening.bonuses.allMult > 1) {
                    awakeningText += `\n   全属性倍率 ×${awakening.bonuses.allMult.toFixed(2)}`;
                }

                awakeningEl.innerText = awakeningText;
                awakeningEl.style.display = 'block';
            } else {
                awakeningEl.style.display = 'none';
            }
        }

        // 更新按钮状态
        const upgradeBtn = document.getElementById('treasure-upgrade-btn');
        if (upgradeBtn) {
            upgradeBtn.disabled = data.shards < cost;
            upgradeBtn.style.opacity = data.shards < cost ? '0.5' : '1';
        }
    }
    
    gardenOneClickHarvest() {
        if (this.garden) this.garden.oneClickHarvest();
        this.updateGardenUI();
        this.updateGardenOverview();
    }
    
    gardenOneClickPlant() {
        if (this.garden) this.garden.oneClickPlant();
        this.updateGardenUI();
        this.updateGardenOverview();
    }
    
    gardenOneClickClear() {
        if (this.garden) this.garden.oneClickClear();
        this.updateGardenUI();
        this.updateGardenOverview();
    }
    
    togglePuppetMode() {
        if (this.garden) this.garden.togglePuppetMode();
        this.updateGardenUI();
        this.updateGardenOverview();
    }
    
    toggleAlchemyMode() {
        if (this.garden) this.garden.toggleAlchemyMode();
        this.updateGardenUI();
        this.updateGardenOverview();
    }
    
    selectGardenTool(tool) {
        if (this.garden) this.garden.selectTool(tool);
        this.updateGardenUI();
    }
    
    // ==================== Abyss Relic System (深渊遗宝系统) ====================
    
    updateAbyssOverview() {
        if (!this.abyssRelic) return;
        
        // 更新收集进度
        const progress = this.abyssRelic.getTotalProgress();
        const progressEl = document.getElementById('abyss-overview-progress');
        if (progressEl) {
            progressEl.innerText = `${progress.collected}/${progress.total} (${progress.percentage}%)`;
        }
        
        // 更新碎片数量（显示总碎片）
        const fragmentsEl = document.getElementById('abyss-overview-fragments');
        if (fragmentsEl) {
            const totalFragments = Object.values(this.abyssRelic.fragments).reduce((a, b) => a + b, 0);
            fragmentsEl.innerText = totalFragments;
        }
        
        // 更新属性加成预览
        const bonusPreview = document.getElementById('abyss-bonus-preview');
        if (bonusPreview) {
            const bonuses = this.abyssRelic.activeBonuses;
            const effBonuses = this.abyssRelic.getEffectiveBonuses();
            const bonusTexts = [];
            
            // 显示各BOSS碎片数量
            const fragTexts = [];
            for (const bossId in this.abyssRelic.fragments) {
                const bossName = this.abyssRelic.getBossName(bossId);
                fragTexts.push(`${bossName}: ${this.abyssRelic.fragments[bossId]}`);
            }
            bonusTexts.push(`🧩 碎片: ${fragTexts.join(' | ')}`);
            
            // 1. 全属性倍率（指数级乘数）
            if (bonuses.allStatMult > 1) {
                bonusTexts.push(`全属性倍率 ×${effBonuses.allStatMultiplier.toFixed(2)}`);
            }
            
            // 2. 爬塔掉率（指数级乘数）
            if (bonuses.towerDropRate > 1) {
                bonusTexts.push(`爬塔掉率 ×${effBonuses.towerDropMultiplier.toFixed(2)}`);
            }
            
            // 3. 刷丹倍率（指数级乘数）
            if (bonuses.pillEffectMult > 1) {
                bonusTexts.push(`刷丹倍率 ×${effBonuses.pillEffectMultiplier.toFixed(2)}`);
            }
            
            // 4. 装备等级
            if (effBonuses.equipLevelBoost > 0) {
                bonusTexts.push(`装备等级 +${effBonuses.equipLevelBoost}`);
            }
            
            // 5. 秘宝等级
            if (effBonuses.treasureLevelBoost > 0) {
                bonusTexts.push(`秘宝等级 +${effBonuses.treasureLevelBoost}`);
            }
            
            bonusPreview.innerHTML = bonusTexts.map(t => `<div style="color:#a78bfa;">${t}</div>`).join('');
        }
    }

    // ==================== ZhouTian System (周天星窍系统) ====================

    updateZhouTianUI() {
        if (!this.zhouTian) return;

        const state = this.zhouTian.state;
        const allBonuses = this.zhouTian.getAllBonuses();

        // 更新概览页
        const updateEl = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.innerText = value;
        };

        updateEl('zhou-tian-level', `第${state.level}周天`);
        updateEl('zhou-tian-exp-bonus', `+${(state.completions * 0.1).toFixed(1)}%`);
        updateEl('zhou-tian-complete-count', `${this.zhouTian.getCompleteSectorCount()}/5`);
        updateEl('zhou-tian-progress', `${(this.zhouTian.getCompleteSectorCount() / 5 * 100).toFixed(0)}%`);

        // 更新进度条
        const progressBar = document.getElementById('zhou-tian-progress');
        if (progressBar) {
            progressBar.style.width = `${this.zhouTian.getCompleteSectorCount() / 5 * 100}%`;
        }

        // 更新属性显示（使用新的加成结构）
        const formatBonus = (bonus) => {
            if (bonus.type === 'multiply') {
                return `×${bonus.value.toFixed(2)}`;
            } else {
                return `+${bonus.value.toFixed(0)}`;
            }
        };

        updateEl('zhou-tian-atk', formatBonus(allBonuses.attack));
        updateEl('zhou-tian-hp', formatBonus(allBonuses.health));
        updateEl('zhou-tian-equip', formatBonus(allBonuses.equipLevel));
        updateEl('zhou-tian-essence', formatBonus(allBonuses.lifeEssence));
        updateEl('zhou-tian-all', formatBonus(allBonuses.allStats));
        updateEl('zhou-tian-marrow-count', state.marrow.toLocaleString());

        // 更新弹窗（如果打开）
        if (this.isZhouTianModalOpen) {
            this.updateZhouTianModal();
        }
    }

    openZhouTianModal() {
        this.isZhouTianModalOpen = true;
        const modal = document.getElementById('zhou-tian-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.updateZhouTianModal();
        }
    }

    closeZhouTianModal() {
        this.isZhouTianModalOpen = false;
        const modal = document.getElementById('zhou-tian-modal');
        if (modal) modal.style.display = 'none';
    }

    updateZhouTianModal() {
        if (!this.zhouTian) return;

        const state = this.zhouTian.state;
        const sectors = this.zhouTian.sectors;
        const qualities = this.zhouTian.qualities;
        const layout = this.zhouTian.constellationLayout;

        // 更新右侧信息
        document.getElementById('zhou-tian-modal-marrow').innerText = state.marrow.toLocaleString();
        document.getElementById('zhou-tian-modal-level').innerText = `第${state.level}周天`;
        document.getElementById('zhou-tian-modal-exp').innerText = `+${(state.completions * 0.1).toFixed(1)}%`;
        // 计算总锁定数（每个区域4个，共20个）
        const totalLocks = state.locks.length;
        const maxLocks = 20;
        document.getElementById('zhou-tian-modal-locks').innerText = `${totalLocks}/${maxLocks}`;

        // 更新各星域加成
        const allBonuses = this.zhouTian.getAllBonuses();
        const formatBonusValue = (bonus) => bonus.type === 'multiply' ? `×${bonus.value.toFixed(2)}` : `+${bonus.value.toFixed(0)}`;

        document.getElementById('modal-bonus-attack').innerText = formatBonusValue(allBonuses.attack);
        document.getElementById('modal-bonus-health').innerText = formatBonusValue(allBonuses.health);
        document.getElementById('modal-bonus-equip').innerText = formatBonusValue(allBonuses.equipLevel);
        document.getElementById('modal-bonus-essence').innerText = formatBonusValue(allBonuses.lifeEssence);
        document.getElementById('modal-bonus-all').innerText = formatBonusValue(allBonuses.allStats);

        // 更新各星域锁定数
        for (let sIdx = 0; sIdx < 5; sIdx++) {
            const lockEl = document.getElementById(`modal-locks-${sIdx}`);
            if (lockEl) {
                const count = this.zhouTian.getSectorLockCount(sIdx);
                lockEl.innerText = `🔒${count}/4`;
                lockEl.style.opacity = count > 0 ? '1' : '0.5';
            }
        }

        // 渲染星座图
        this.renderConstellationMap();

        // 更新突破按钮显示状态
        const breakthroughPanel = document.getElementById('breakthrough-panel');
        if (breakthroughPanel) {
            const canBreak = this.zhouTian.canBreakthrough();
            const isBreaking = this.zhouTian.breakthroughActive;
            breakthroughPanel.style.display = canBreak ? 'block' : 'none';

            // 突破中禁用按钮
            const btn = breakthroughPanel.querySelector('button');
            if (btn) {
                btn.disabled = isBreaking;
                btn.style.opacity = isBreaking ? '0.5' : '1';
                btn.innerText = isBreaking ? '🚀 突破中...' : '🚀 突破周天';
            }
        }

        // 更新日志
        const logsContainer = document.getElementById('zhou-tian-logs');
        if (logsContainer) {
            logsContainer.innerHTML = this.zhouTian.logs.map(log =>
                `<div style="color:#64748b; font-size:0.65rem; border-left:2px solid #333; padding-left:6px;">${log}</div>`
            ).join('');
        }
    }

    // 渲染星座图
    renderConstellationMap() {
        const state = this.zhouTian.state;
        const sectors = this.zhouTian.sectors;
        const qualities = this.zhouTian.qualities;
        const layout = this.zhouTian.constellationLayout;

        const pointsContainer = document.getElementById('constellation-points');
        const labelsContainer = document.getElementById('constellation-labels');
        const linesSvg = document.getElementById('constellation-lines');

        if (!pointsContainer || !labelsContainer || !linesSvg) return;

        pointsContainer.innerHTML = '';
        labelsContainer.innerHTML = '';
        linesSvg.innerHTML = '';

        // 渲染星域标签
        const labelPositions = [
            { x: 25, y: 10, name: '🐉 青龙', color: '#22c55e' },
            { x: 75, y: 10, name: '🦅 朱雀', color: '#ef4444' },
            { x: 75, y: 90, name: '🐅 白虎', color: '#f59e0b' },
            { x: 25, y: 90, name: '🐢 玄武', color: '#3b82f6' },
            { x: 50, y: 50, name: '🦌 麒麟', color: '#a855f7' }
        ];

        labelPositions.forEach(label => {
            const labelEl = document.createElement('div');
            labelEl.style.cssText = `
                position: absolute;
                left: ${label.x}%;
                top: ${label.y}%;
                transform: translate(-50%, -50%);
                font-size: 0.75rem;
                font-weight: bold;
                color: ${label.color};
                text-shadow: 0 0 10px ${label.color}40;
                pointer-events: none;
            `;
            labelEl.innerText = label.name;
            labelsContainer.appendChild(labelEl);
        });

        // 渲染星窍点位和连线
        const points = [];

        layout.forEach((sectorLayout, sIdx) => {
            const isPreviewing = state.preview.sectorIdx === sIdx;
            const sector = sectors[sIdx];

            sectorLayout.positions.forEach((pos, i) => {
                const globalIdx = sIdx * 5 + i;
                const quality = isPreviewing ? state.preview.data[i] : state.acupoints[globalIdx];
                const q = qualities[quality - 1];
                const isLocked = state.locks.includes(globalIdx);
                const bonus = this.zhouTian.getAcupointBonus(globalIdx);
                const baseConfig = this.zhouTian.baseBonuses[sector.attr];

                points.push({ x: pos.x, y: pos.y, globalIdx, sector, q, isLocked, quality, bonus, baseConfig });

                // 属性简称映射
                const attrShortNames = {
                    attack: '攻',
                    health: '血',
                    equipLevel: '装',
                    lifeEssence: '精',
                    allStats: '全'
                };
                const attrName = attrShortNames[sector.attr] || '';

                // 创建星窍容器（包含按钮、加成显示）
                const container = document.createElement('div');
                container.style.cssText = `
                    position: absolute;
                    left: ${pos.x}%;
                    top: ${pos.y}%;
                    transform: translate(-50%, -50%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    z-index: 10;
                `;

                // 星窍按钮
                const btn = document.createElement('button');
                btn.style.cssText = `
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: ${isLocked ? '#1a3a1a' : q.bg};
                    border: 2px solid ${isLocked ? '#22c55e' : q.color};
                    box-shadow: 0 0 ${quality * 3}px ${q.color}40;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.7rem;
                    font-weight: bold;
                    color: ${q.color};
                    cursor: pointer;
                    transition: all 0.2s;
                    ${isPreviewing ? 'animation: pulse 1s infinite;' : ''}
                    ${isLocked ? 'position: relative;' : ''}
                `;
                btn.innerText = q.name;

                // 锁定图标显示在按钮上
                if (isLocked) {
                    const lockIcon = document.createElement('div');
                    lockIcon.style.cssText = `
                        position: absolute;
                        bottom: -2px;
                        right: -2px;
                        width: 14px;
                        height: 14px;
                        background: #22c55e;
                        border-radius: 50%;
                        font-size: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    `;
                    lockIcon.innerText = '🔒';
                    btn.appendChild(lockIcon);
                }

                btn.onmouseenter = () => this.showAcupointTooltip(globalIdx, btn);
                btn.onclick = () => this.selectAcupoint(globalIdx);
                btn.oncontextmenu = (e) => {
                    e.preventDefault();
                    this.zhouTianToggleLock(globalIdx);
                };
                container.appendChild(btn);

                // 容器绑定mouseleave，确保离开整个星窍区域时关闭tooltip
                container.onmouseleave = () => this.hideAcupointTooltip();

                // 加成显示（包含属性名称）
                const bonusValueText = baseConfig.type === 'multiply' ? `×${bonus.toFixed(2)}` : `+${bonus.toFixed(0)}`;
                const bonusText = `${attrName}${bonusValueText}`;
                const bonusEl = document.createElement('div');
                bonusEl.style.cssText = `
                    font-size: 0.6rem;
                    color: ${q.color};
                    margin-top: 2px;
                    text-shadow: 0 0 3px ${q.color}40;
                    white-space: nowrap;
                    font-weight: bold;
                `;
                bonusEl.innerText = bonusText;
                container.appendChild(bonusEl);

                pointsContainer.appendChild(container);

                // 绘制与下一个点的连线（简单的星座连线）
                if (i < sectorLayout.positions.length - 1) {
                    const nextPos = sectorLayout.positions[i + 1];
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', `${pos.x}%`);
                    line.setAttribute('y1', `${pos.y}%`);
                    line.setAttribute('x2', `${nextPos.x}%`);
                    line.setAttribute('y2', `${nextPos.y}%`);
                    line.setAttribute('stroke', sector.color);
                    line.setAttribute('stroke-width', '1');
                    line.setAttribute('stroke-opacity', '0.3');
                    linesSvg.appendChild(line);
                }
            });
        });

        // 绘制星域之间的连线（麒麟连接四象）
        const centerPoint = layout[4].positions[2]; // 麒麟中心
        [0, 1, 2, 3].forEach(sIdx => {
            const sectorCenter = layout[sIdx].positions[2]; // 各星域中心点
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', `${centerPoint.x}%`);
            line.setAttribute('y1', `${centerPoint.y}%`);
            line.setAttribute('x2', `${sectorCenter.x}%`);
            line.setAttribute('y2', `${sectorCenter.y}%`);
            line.setAttribute('stroke', '#fbbf24');
            line.setAttribute('stroke-width', '1');
            line.setAttribute('stroke-opacity', '0.2');
            line.setAttribute('stroke-dasharray', '4,4');
            linesSvg.appendChild(line);
        });

        // 更新洗练面板
        this.updateWashPanel();
    }

    // 显示星窍提示
    showAcupointTooltip(globalIdx, element) {
        // 先关闭已有tooltip
        this.hideAcupointTooltip();

        const sectorIdx = Math.floor(globalIdx / 5);
        const sector = this.zhouTian.sectors[sectorIdx];
        const quality = this.zhouTian.state.acupoints[globalIdx];
        const q = this.zhouTian.qualities[quality - 1];
        const bonus = this.zhouTian.getAcupointBonus(globalIdx);
        const baseConfig = this.zhouTian.baseBonuses[sector.attr];

        const tooltip = document.createElement('div');
        tooltip.id = 'acupoint-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            background: #1a1a1a;
            border: 1px solid ${q.color};
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 0.75rem;
            color: #fff;
            z-index: 10000;
            pointer-events: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        `;

        const bonusText = baseConfig.type === 'multiply' ? `×${bonus.toFixed(2)}` : `+${bonus.toFixed(0)}`;

        tooltip.innerHTML = `
            <div style="color:${q.color}; font-weight:bold; margin-bottom:4px;">${sector.name} - ${q.name}品</div>
            <div style="color:#888; font-size:0.7rem;">${baseConfig.desc}</div>
            <div style="color:#fbbf24; font-weight:bold;">${bonusText}</div>
        `;

        document.body.appendChild(tooltip);

        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width/2 - tooltip.offsetWidth/2}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
    }

    hideAcupointTooltip() {
        const tooltip = document.getElementById('acupoint-tooltip');
        if (tooltip) tooltip.remove();
    }

    // 选择星窍
    selectAcupoint(globalIdx) {
        const sectorIdx = Math.floor(globalIdx / 5);
        const sector = this.zhouTian.sectors[sectorIdx];
        const quality = this.zhouTian.state.acupoints[globalIdx];
        const q = this.zhouTian.qualities[quality - 1];
        const bonus = this.zhouTian.getAcupointBonus(globalIdx);
        const baseConfig = this.zhouTian.baseBonuses[sector.attr];

        // 显示详情
        const detailPanel = document.getElementById('acupoint-detail');
        const sectorName = document.getElementById('detail-sector-name');
        const qualityEl = document.getElementById('detail-quality');
        const bonusEl = document.getElementById('detail-bonus');
        const nextBonusEl = document.getElementById('detail-next-bonus');

        detailPanel.style.display = 'block';
        sectorName.innerText = sector.name;
        sectorName.style.color = sector.color;

        qualityEl.innerText = `${q.name}品`;
        qualityEl.style.background = q.bg;
        qualityEl.style.color = q.color;

        const bonusText = baseConfig.type === 'multiply' ? `×${bonus.toFixed(3)}` : `+${bonus.toFixed(1)}`;
        bonusEl.innerText = `${baseConfig.desc} ${bonusText}`;

        // 计算下一级加成
        if (quality < 5) {
            const nextQuality = quality + 1;
            const nextQ = this.zhouTian.qualities[nextQuality - 1];
            let nextBonus;
            if (baseConfig.type === 'multiply') {
                nextBonus = Math.pow(baseConfig.value, nextQuality);
            } else {
                nextBonus = baseConfig.value * nextQuality;
            }
            const nextText = baseConfig.type === 'multiply' ? `×${nextBonus.toFixed(3)}` : `+${nextBonus.toFixed(1)}`;
            nextBonusEl.innerText = `${nextQ.name}品 ${nextText}`;
            nextBonusEl.style.color = nextQ.color;
        } else {
            nextBonusEl.innerText = '已达最高品质';
            nextBonusEl.style.color = '#888';
        }

        // 选中星域用于洗练
        this.selectedSectorForWash = sectorIdx;
        this.updateWashPanel();
    }

    // 更新洗练面板
    updateWashPanel() {
        const panel = document.getElementById('sector-wash-panel');
        if (!panel) return;

        if (this.selectedSectorForWash === undefined || this.selectedSectorForWash === null) {
            panel.style.display = 'none';
            return;
        }

        const sIdx = this.selectedSectorForWash;
        const sector = this.zhouTian.sectors[sIdx];
        const state = this.zhouTian.state;
        const isPreviewing = state.preview.sectorIdx === sIdx;

        panel.style.display = 'block';
        document.getElementById('wash-sector-name').innerText = sector.name;
        document.getElementById('wash-sector-name').style.color = sector.color;

        const cost = this.zhouTian.getWashCost(sIdx);
        const costDisplay = document.getElementById('wash-cost-display');

        if (isPreviewing) {
            costDisplay.innerText = '预览中...';
            document.getElementById('wash-buttons').innerHTML = `
                <button onclick="game.zhouTianConfirmWash(true)" style="flex:1; padding:8px; background:#14532d; border:none; border-radius:6px; color:#4ade80; font-size:0.75rem; cursor:pointer;">✓ 应用</button>
                <button onclick="game.zhouTianConfirmWash(false)" style="flex:1; padding:8px; background:#333; border:none; border-radius:6px; color:#888; font-size:0.75rem; cursor:pointer;">✗ 放弃</button>
            `;
        } else {
            costDisplay.innerText = `消耗: ${cost} 星髓 (当前: ${state.marrow})`;
            const canWash = state.marrow >= cost;
            document.getElementById('wash-buttons').innerHTML = `
                <button onclick="game.zhouTianStartWash(${sIdx})"
                    style="flex:1; padding:8px; background:${canWash ? '#1e3a8a' : '#333'}; border:none; border-radius:6px; color:${canWash ? '#60a5fa' : '#666'}; font-size:0.75rem; cursor:pointer;"
                    ${!canWash ? 'disabled' : ''}>
                    🔮 洗练此域
                </button>
            `;
        }
    }

    // ZhouTian 交互方法
    zhouTianStartWash(sectorIdx) {
        if (this.zhouTian.startWash(sectorIdx)) {
            this.updateZhouTianModal();
            this.updateZhouTianUI();
        }
    }

    zhouTianConfirmWash(apply) {
        if (this.zhouTian.confirmWash(apply)) {
            this.updateZhouTianModal();
            this.updateZhouTianUI();
            this.updateStatsUI();
        }
    }

    zhouTianToggleLock(globalIdx) {
        // 切换锁定状态
        if (this.zhouTian.toggleLock(globalIdx)) {
            this.updateZhouTianModal();
            this.updateZhouTianUI();
        }
    }

    zhouTianAutoLock() {
        // 自动锁定所有天品星窍
        const locked = this.zhouTian.autoLock(5); // 只锁定天品
        if (locked > 0) {
            this.zhouTian.addLog(`自动锁定 ${locked} 个天品星窍`);
        } else {
            this.zhouTian.addLog('没有可锁定的天品星窍');
        }
        this.updateZhouTianModal();
        this.updateZhouTianUI();
    }

    zhouTianAutoWash() {
        // 自动洗练选中的星域或第一个未满的星域
        const targetSector = this.selectedSectorForWash !== undefined ? this.selectedSectorForWash : 0;

        for (let sIdx = 0; sIdx < 5; sIdx++) {
            const checkIdx = (targetSector + sIdx) % 5;
            if (!this.zhouTian.isSectorComplete(checkIdx)) {
                this.selectedSectorForWash = checkIdx;
                this.zhouTian.autoWash(checkIdx, 5);
                this.updateZhouTianModal();
                this.updateZhouTianUI();
                this.updateStatsUI();
                return;
            }
        }
        this.zhouTian.addLog('所有星域已圆满！');
    }

    zhouTianTriggerBreakthrough() {
        if (this.zhouTian.triggerBreakthrough()) {
            this.updateZhouTianModal();
            this.updateZhouTianUI();
            this.updateStatsUI();
        }
    }

    // ==================== StarBeast Dungeon (星空巨兽副本) ====================

    openStarBeastModal() {
        this.isStarBeastModalOpen = true;
        if (this.starBeast) {
            this.starBeast.openSelectionModal();
        }
    }

    closeStarBeastModal() {
        this.isStarBeastModalOpen = false;
        if (this.starBeast) {
            this.starBeast.closeSelectionModal();
        }
    }

    closeStarBeastRewardModal() {
        if (this.starBeast) {
            this.starBeast.closeRewardModal();
        }
    }

    // Open/Close Abyss Modal
    openAbyssModal() {
        console.log('openAbyssModal called');
        console.log('ABYSS_BOSSES available:', typeof ABYSS_BOSSES !== 'undefined', ABYSS_BOSSES?.length);
        
        this.isAbyssModalOpen = true;
        const modal = document.getElementById('abyss-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.abyssDungeon.renderAbyssMain();
            this.updateAbyssUI();
        } else {
            console.error('abyss-modal not found');
        }
    }
    
    closeAbyssModal() {
        this.isAbyssModalOpen = false;
        document.getElementById('abyss-modal').style.display = 'none';
    }
    
    updateAbyssUI() {
        if (!this.isAbyssModalOpen) return;
        
        // 更新深渊战场UI（战斗或BOSS列表）
        this.abyssDungeon.renderAbyssMain();
        
        // 更新总体收集进度
        const progress = this.abyssRelic.getTotalProgress();
        const progressEl = document.getElementById('abyss-total-progress');
        if (progressEl) {
            progressEl.innerText = `📚 遗宝收集：${progress.collected}/${progress.total} (${progress.percentage}%)`;
        }
    }
    
    // Open/Close Abyss Codex
    openAbyssCodex() {
        console.log('openAbyssCodex called');
        console.log('ABYSS_BOSSES available:', typeof ABYSS_BOSSES !== 'undefined', ABYSS_BOSSES?.length);
        console.log('ABYSS_RELIC_POOLS available:', typeof ABYSS_RELIC_POOLS !== 'undefined', Object.keys(ABYSS_RELIC_POOLS || {}).length);
        
        this.isAbyssCodexModalOpen = true;
        const modal = document.getElementById('abyss-codex-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.abyssDungeon.showRelicCollection();
        } else {
            console.error('abyss-codex-modal not found');
        }
    }
    
    closeAbyssCodex() {
        this.isAbyssCodexModalOpen = false;
        document.getElementById('abyss-codex-modal').style.display = 'none';
    }
    
    updateAbyssCodexUI() {
        if (!this.isAbyssCodexModalOpen) return;
        // UI is updated by showRelicCollection
    }
}

// Export for module systems if needed
try {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Game;
    }
} catch (e) {}
