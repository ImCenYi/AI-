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
        
        this.isDead = false;
        this.lastTick = Date.now();
        this.autoChallenge = false;
        this.lastBossDeathTime = 0;
        
        this.initUI();
        this.spawnWildWave();
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

        return { ...stats, maxHp };
    }

    // --- Mode ---
    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const btnIdx = ['law','tower','dungeon','treasure'].indexOf(tab);
        document.querySelectorAll('.tab-btn')[btnIdx].classList.add('active');
        document.getElementById(`tab-${tab}`).classList.add('active');
    }

    toggleTowerMode() { this.changeMode('tower'); }
    toggleDungeonMode() { this.changeMode('dungeon'); }
    
    changeMode(newMode) {
        if (this.isDead) return;
        if (this.mode === 'dungeon') this.dungeon.stop();
        this.enemies = [];
        
        if (this.mode === newMode) {
            this.mode = 'wild';
            this.log('SYS', '返回荒野。');
        } else {
            this.mode = newMode;
            if (newMode === 'tower') this.log('SYS', '进入通天塔！');
            if (newMode === 'dungeon') {
                this.log('SYS', '进入血色副本！伤害已被压缩。');
                this.dungeon.start();
            }
        }
        this.updateButtons();
        if (this.mode !== 'dungeon') this.spawnWildWave();
    }

    updateButtons() {
        const btnTower = document.getElementById('btn-tower-toggle');
        const btnDungeon = document.getElementById('btn-dungeon-toggle');
        const btnBoss = document.getElementById('btn-challenge');
        const stage = document.getElementById('stage-name');

        btnTower.innerText = this.mode === 'tower' ? "🏃 离开通天塔" : "🗼 挑战通天塔";
        btnDungeon.innerText = this.mode === 'dungeon' ? "🏃 离开副本" : "🔥 进入副本";
        btnTower.classList.toggle('active', this.mode === 'tower');
        btnDungeon.classList.toggle('active', this.mode === 'dungeon');
        
        // 1. Set default text based on mode
        if (this.mode === 'wild') {
            btnBoss.style.display = 'block';
            btnBoss.innerText = "💀 召唤荒野BOSS (右键自动)";
            stage.innerText = `荒野 - 第 ${this.difficulty} 层`;
        } else if (this.mode === 'tower') {
            btnBoss.style.display = 'block';
            btnBoss.innerText = "👺 召唤塔主 (右键自动)";
            stage.innerText = `通天塔 - 第 ${this.towerLevel} 层`;
        } else {
            btnBoss.style.display = 'none';
            stage.innerText = `副本 - 难度 ${this.dungeon.level}`;
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
        requestAnimationFrame(() => this.loop());
    }

    combatTurn() {
        if (this.isDead) return;
        this.enemies = this.enemies.filter(e => e.currentHp.gt(0));
        
        if (this.mode !== 'dungeon' && this.enemies.filter(e => !e.isBoss).length < 10) {
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
        if (this.mode === 'dungeon') {
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
        let totalDmg = new BigNum(0);
        this.enemies.forEach(e => {
            totalDmg = totalDmg.add(e.atk);
        });

        if (this.mode === 'dungeon') {
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

        if (this.currentHp.lte(0)) this.handleLoss();
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
                this.lastBossDeathTime = Date.now();
                this.log('GAIN', '击败BOSS！难度+1');
                this.rollWildLoot(true);
                this.updateButtons();
            } else {
                this.rollWildLoot(false);
            }
        }
    }

    handleLoss() {
        if (this.isDead) return;
        this.isDead = true;
        this.currentHp = new BigNum(0);
        let reviveTime = (this.mode === 'dungeon') ? 15000 : 2000;
        
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
        } else {
            this.spawnWildWave();
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
        for(let i=0; i<num; i++) {
            const t = new Treasure(this.difficulty + 1);
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
            const t = new Treasure(this.difficulty + 1);
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
        }
        
        this.updateStatsUI();
        this.updateSystemUI();
        this.updateTreasureUI();
        this.closeModal('cheat-modal');
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
        for(let k in this.equippedTreasures) {
            const t = this.equippedTreasures[k];
            if(t && t.attrType.type === 'pill_mult') pillMult = pillMult.mul(t.val); 
        }
        const pill = new Item(this.difficulty, 'pill');
        pill.hpValue = pill.hpValue.mul(pillMult); 
        pill.atkValue = pill.atkValue.mul(pillMult);
        this.autoConsumePill(pill);

        if (Math.random() < (isBoss ? 1 : 0.5)) {
            this.checkAutoEquip(new Item(this.difficulty));
        }
    }

    rollTowerLoot(isBoss) {
        let drop = new BigNum(SCALE_TOWER_DROP).pow(this.towerLevel).mul(1 + this.cultRound);
        if(isBoss) drop = drop.mul(10);
        
        let tMult = new BigNum(1);
        for(let k in this.equippedTreasures) {
            const t = this.equippedTreasures[k];
            if(t && t.attrType.type === 'tower_drop') tMult = tMult.mul(t.val);
        }
        drop = drop.mul(tMult);
        
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
        
        setVal('dungeon-lv', this.difficulty);
        setVal('dungeon-status', this.dungeon.active ? `波次 ${Math.min(this.dungeon.wave+1, 3)}/3` : "待机");
        if(document.getElementById('dungeon-timer')) document.getElementById('dungeon-timer').innerText = this.dungeon.timeRemaining > 0 ? `${this.dungeon.timeRemaining}s` : "--";
        
        setVal('treasure-daily', `${this.treasureDaily}/${this.treasureLimit}`);
        setVal('treasure-frags', formatNum(this.treasureFragments));
        
        setVal('chest-count', this.treasureChests);
    }

    updateStatsUI() {
        const s = this.getTotalStats();
        // Prevent negative zero or weird display
        let cur = this.currentHp;
        if(cur.lt(0)) cur = new BigNum(0);
        
        document.getElementById('stat-hp').innerText = `${formatNum(cur)} / ${formatNum(s.maxHp)}`;
        document.getElementById('stat-atk').innerText = formatNum(s.atk);
        if(document.getElementById('stat-crit')) document.getElementById('stat-crit').innerText = s.crit + '%';
        
        // Multipliers
        const atkMul = this.lawMultipliers.atk.mul(100).toString() + '%';
        const hpMul = this.lawMultipliers.hp.mul(100).toString() + '%';
        document.getElementById('mul-atk').innerText = `${atkMul} / ${hpMul}`;
        
        document.getElementById('mul-drop').innerText = "+" + (this.cultRound * 100) + '%';
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
                el.className = `entity ${e.isBoss?'boss-entity':'enemy-entity'}`;
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
}

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
}
