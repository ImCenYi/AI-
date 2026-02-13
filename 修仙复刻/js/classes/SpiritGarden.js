/**
 * SpiritGarden Class - 百草灵园系统
 */

class SpiritGarden {
    constructor(game) {
        this.game = game;
        
        // Garden level and exp
        this.gardenLevel = 1;
        this.gardenExp = new BigNum(0);
        this.spiritStones = new BigNum(100);  // 初始100灵石
        this.turn = 0;  // 当前转数
        this.shopTurn = 0;  // 当前商店显示的转数
        
        // Settings
        this.puppetMode = false;
        this.alchemyMode = false;
        this.selectedSeedId = null;
        this.selectedTool = null;  // null or 'shovel'
        
        // Initialize lands
        this.lands = [];
        for (let i = 0; i < GARDEN_CONFIG.maxLands; i++) {
            this.lands.push({
                id: i,
                unlocked: i < GARDEN_CONFIG.initialLands,
                unlockCost: this.calculateUnlockCost(i),
                plant: null,
                progress: 0,
                lastSeedId: null
            });
        }
        
        // Generate all crops (7 base × 10 turns)
        this.allCrops = this.generateAllCrops();
        
        // Auto-select first available seed
        this.autoSelectFirstSeed();
        
        // Start growth loop
        this.startGrowthLoop();
    }
    
    calculateUnlockCost(index) {
        return new BigNum(GARDEN_CONFIG.unlockCostBase)
            .mul(new BigNum(GARDEN_CONFIG.unlockCostGrowth).pow(index));
    }
    
    generateAllCrops() {
        const crops = [];
        const baseCrops = GARDEN_CONFIG.baseCrops;
        
        for (let t = 0; t < 10; t++) {
            const multiplier = new BigNum(100).pow(t);
            
            baseCrops.forEach(crop => {
                crops.push({
                    ...crop,
                    id: crop.id + t * 1000,
                    name: t === 0 ? crop.name : `${t}转·${crop.name}`,
                    cost: new BigNum(crop.cost).mul(multiplier),
                    income: new BigNum(crop.income).mul(multiplier),
                    exp: new BigNum(crop.exp).mul(multiplier),
                    reqLevel: crop.reqLevel + t * 100,
                    turn: t
                });
            });
        }
        
        return crops;
    }
    
    getMaxExp() {
        // Level up formula: 100 × 1.05^level
        return new BigNum(100).mul(new BigNum(1.05).pow(this.gardenLevel));
    }
    
    getAvailableCrops() {
        return this.allCrops.filter(c => 
            c.turn === this.shopTurn && 
            c.reqLevel <= this.gardenLevel
        );
    }
    
    getCropById(id) {
        return this.allCrops.find(c => c.id === id);
    }
    
    getNextUnlockInTurn() {
        return this.allCrops.find(c => 
            c.turn === this.shopTurn && 
            c.reqLevel > this.gardenLevel
        );
    }
    
    getUnlockedTurns() {
        return Math.min(9, Math.floor((this.gardenLevel - 1) / 100));
    }
    
    startGrowthLoop() {
        // Growth loop is called from game's main loop
    }
    
    updateGrowth() {
        const now = Date.now();
        
        this.lands.forEach(land => {
            if (land.plant && land.progress < 100) {
                const elapsed = (now - land.plant.startTime) / 1000;
                let growTime = land.plant.time;
                
                // Apply puppet speed bonus if advanced puppet unlocked
                if (this.game.hasAdvancedPuppet) {
                    growTime *= 0.8;  // -20% time
                }
                
                land.progress = Math.min(100, (elapsed / growTime) * 100);
            }
        });
        
        // Auto harvest and plant if puppet mode is on
        if (this.puppetMode && this.gardenLevel >= GARDEN_CONFIG.puppetUnlockLevel) {
            this.lands.forEach(land => {
                // Auto harvest
                if (land.plant && land.progress >= 100) {
                    this.harvest(land);
                }
                // Auto plant last seed
                if (land.unlocked && !land.plant && land.lastSeedId) {
                    this.plant(land, land.lastSeedId);
                }
            });
        }
    }
    
    handleLandClick(index, event) {
        const land = this.lands[index];
        
        // Shovel mode - remove plant
        if (this.selectedTool === 'shovel') {
            if (land.plant) {
                const refund = land.plant.cost.mul(0.8);
                this.spiritStones = this.spiritStones.add(refund);
                land.plant = null;
                land.progress = 0;
                land.lastSeedId = null;
                this.game.log('SYS', `移除灵植，回收 ${formatNum(refund)} 灵石`);
                if (this.game.isGardenModalOpen) {
                    this.game.updateGardenUI();
                }
                this.game.updateGardenOverview();
            }
            return;
        }
        
        // Unlock land
        if (!land.unlocked) {
            if (this.spiritStones.gte(land.unlockCost)) {
                this.spiritStones = this.spiritStones.sub(land.unlockCost);
                land.unlocked = true;
                this.game.log('GAIN', `开辟灵田成功！消耗 ${formatNum(land.unlockCost)} 灵石`);
                if (this.game.isGardenModalOpen) {
                    this.game.updateGardenUI();
                }
                this.game.updateGardenOverview();
            } else {
                this.game.log('SYS', '灵石不足，无法开辟灵田');
            }
            return;
        }
        
        // Harvest mature crop
        if (land.plant && land.progress >= 100) {
            this.harvest(land);
            return;
        }
        
        // Plant new crop
        if (!land.plant && this.selectedSeedId) {
            this.plant(land, this.selectedSeedId);
            return;
        }
    }
    
    harvest(land) {
        if (!land.plant) return;
        
        let income = land.plant.income;
        let exp = land.plant.exp;
        
        // Apply alchemy bonus
        if (this.alchemyMode && this.gardenLevel >= GARDEN_CONFIG.alchemyUnlockLevel) {
            income = income.mul(GARDEN_CONFIG.alchemyBonus);
        }
        
        // Apply advanced puppet bonus
        if (this.game.hasAdvancedPuppet) {
            income = income.mul(1.1);
        }
        
        // Apply cheat multipliers
        if (this.game.gardenStoneMultiplier && this.game.gardenStoneMultiplier > 1) {
            income = income.mul(this.game.gardenStoneMultiplier);
        }
        if (this.game.gardenExpMultiplier && this.game.gardenExpMultiplier > 1) {
            exp = exp.mul(this.game.gardenExpMultiplier);
        }
        
        // Add spirit stones
        this.spiritStones = this.spiritStones.add(income);
        
        // Add garden exp
        this.gardenExp = this.gardenExp.add(exp);
        
        // Convert to law fragments (if law system unlocked)
        if (this.game.lawFragments !== undefined) {
            const lawGain = exp.mul(GARDEN_CONFIG.expToLawRate);
            this.game.lawFragments = this.game.lawFragments.add(lawGain);
        }
        
        // Remember last planted seed
        land.lastSeedId = land.plant.id;
        
        // Clear land
        const cropName = land.plant.name;
        land.plant = null;
        land.progress = 0;
        
        // Check level up
        this.checkLevelUp();
        
        // Update UIs
        if (this.game.isGardenModalOpen) {
            this.game.updateGardenUI();
        }
        this.game.updateGardenOverview();
        this.game.updateSystemUI();
        
        this.game.log('GAIN', `收获 ${cropName}，获得 ${formatNum(income)} 灵石`);
    }
    
    plant(land, seedId) {
        const seed = this.getCropById(seedId);
        if (!seed) return false;
        
        if (this.spiritStones.gte(seed.cost)) {
            this.spiritStones = this.spiritStones.sub(seed.cost);
            land.plant = {
                ...seed,
                startTime: Date.now()
            };
            land.lastSeedId = seedId;
            
            // Update UIs
            if (this.game.isGardenModalOpen) {
                this.game.updateGardenUI();
            }
            this.game.updateGardenOverview();
            
            return true;
        }
        return false;
    }
    
    checkLevelUp() {
        const maxExp = this.getMaxExp();
        let leveledUp = false;
        
        while (this.gardenExp.gte(maxExp)) {
            this.gardenExp = this.gardenExp.sub(maxExp);
            this.gardenLevel++;
            leveledUp = true;
            
            // Check for turn unlock
            const newTurn = Math.floor((this.gardenLevel - 1) / 100);
            if (newTurn > this.turn) {
                this.turn = newTurn;
                this.shopTurn = newTurn;
                this.game.log('GAIN', `🌿 灵植阁解锁 [${GARDEN_CONFIG.turnNames[newTurn]}] 种子！`);
            }
        }
        
        if (leveledUp) {
            this.game.log('GAIN', `灵植园等级提升至 Lv.${this.gardenLevel}`);
        }
    }
    
    oneClickHarvest() {
        let count = 0;
        this.lands.forEach(land => {
            if (land.plant && land.progress >= 100) {
                this.harvest(land);
                count++;
            }
        });
        if (count > 0) {
            this.game.log('SYS', `一键收获了 ${count} 株灵植`);
        }
    }
    
    oneClickPlant() {
        if (!this.selectedSeedId) {
            this.game.log('SYS', '请先选择种子');
            return;
        }
        
        const seed = this.getCropById(this.selectedSeedId);
        let count = 0;
        
        this.lands.forEach(land => {
            if (land.unlocked && !land.plant && this.spiritStones.gte(seed.cost)) {
                if (this.plant(land, this.selectedSeedId)) {
                    count++;
                }
            }
        });
        
        if (count > 0) {
            this.game.log('SYS', `一键种植了 ${count} 株 ${seed.name}`);
        }
    }
    
    oneClickClear() {
        let count = 0;
        let totalRefund = new BigNum(0);
        
        this.lands.forEach(land => {
            if (land.plant && land.progress < 100) {
                totalRefund = totalRefund.add(land.plant.cost.mul(0.8));
                land.plant = null;
                land.progress = 0;
                land.lastSeedId = null;
                count++;
            }
        });
        
        if (count > 0) {
            this.spiritStones = this.spiritStones.add(totalRefund);
            this.game.log('SYS', `已铲除 ${count} 株生长中的灵植，回收 ${formatNum(totalRefund)} 灵石`);
            if (this.game.isGardenModalOpen) {
                this.game.updateGardenUI();
            }
            this.game.updateGardenOverview();
        }
    }
    
    selectSeed(id) {
        console.log('selectSeed called:', id);
        this.selectedSeedId = id;
        this.selectedTool = null;
        if (this.game.isGardenModalOpen) {
            this.game.updateGardenUI();
        }
    }
    
    selectTool(tool) {
        console.log('selectTool called:', tool);
        this.selectedTool = tool;
        this.selectedSeedId = null;
        if (this.game.isGardenModalOpen) {
            this.game.updateGardenUI();
        }
    }
    
    togglePuppetMode() {
        if (this.gardenLevel < GARDEN_CONFIG.puppetUnlockLevel) {
            this.game.log('SYS', `傀儡托管需要灵植园达到 Lv.${GARDEN_CONFIG.puppetUnlockLevel}`);
            return;
        }
        this.puppetMode = !this.puppetMode;
        this.game.log('SYS', `傀儡托管 ${this.puppetMode ? '开启' : '关闭'}`);
        if (this.game.isGardenModalOpen) {
            this.game.updateGardenUI();
        }
        this.game.updateGardenOverview();
    }
    
    toggleAlchemyMode() {
        if (this.gardenLevel < GARDEN_CONFIG.alchemyUnlockLevel) {
            this.game.log('SYS', `丹火提炼需要灵植园达到 Lv.${GARDEN_CONFIG.alchemyUnlockLevel}`);
            return;
        }
        this.alchemyMode = !this.alchemyMode;
        this.game.log('SYS', `丹火提炼 ${this.alchemyMode ? '开启' : '关闭'} (${this.alchemyMode ? '+20%' : '无'}收益)`);
        if (this.game.isGardenModalOpen) {
            this.game.updateGardenUI();
        }
        this.game.updateGardenOverview();
    }
    
    setShopTurn(turn) {
        if (turn <= this.getUnlockedTurns()) {
            this.shopTurn = turn;
            // Auto-select first available seed when switching turns
            this.selectFirstAvailableSeed();
        }
    }
    
    autoSelectFirstSeed() {
        const availableCrops = this.getAvailableCrops();
        if (availableCrops.length > 0 && !this.selectedSeedId) {
            this.selectedSeedId = availableCrops[0].id;
        }
    }
    
    selectFirstAvailableSeed() {
        const availableCrops = this.getAvailableCrops();
        if (availableCrops.length > 0) {
            // Always select first seed of current turn
            this.selectedSeedId = availableCrops[0].id;
            console.log('Selected seed:', availableCrops[0].name, 'ID:', this.selectedSeedId);
        } else {
            this.selectedSeedId = null;
        }
    }
    
    // Serialization
    serialize() {
        return {
            gardenLevel: this.gardenLevel,
            gardenExp: this.gardenExp,
            spiritStones: this.spiritStones,
            turn: this.turn,
            shopTurn: this.shopTurn,
            puppetMode: this.puppetMode,
            alchemyMode: this.alchemyMode,
            selectedSeedId: this.selectedSeedId,
            lands: this.lands.map(l => ({
                unlocked: l.unlocked,
                lastSeedId: l.lastSeedId,
                plantSeedId: l.plant ? l.plant.id : null,
                plantStartTime: l.plant ? l.plant.startTime : null
            }))
        };
    }
    
    deserialize(data) {
        if (!data) return;
        
        this.gardenLevel = data.gardenLevel || 1;
        this.gardenExp = new BigNum(data.gardenExp || 0);
        this.spiritStones = new BigNum(data.spiritStones || 100);
        this.turn = data.turn || 0;
        this.shopTurn = data.shopTurn || 0;
        this.puppetMode = data.puppetMode || false;
        this.alchemyMode = data.alchemyMode || false;
        this.selectedSeedId = data.selectedSeedId || null;
        
        if (data.lands) {
            data.lands.forEach((lData, i) => {
                if (this.lands[i]) {
                    this.lands[i].unlocked = lData.unlocked;
                    this.lands[i].lastSeedId = lData.lastSeedId;
                    
                    if (lData.plantSeedId) {
                        const seed = this.getCropById(lData.plantSeedId);
                        if (seed) {
                            this.lands[i].plant = {
                                ...seed,
                                startTime: lData.plantStartTime
                            };
                            // Calculate current progress
                            const now = Date.now();
                            const elapsed = (now - lData.plantStartTime) / 1000;
                            this.lands[i].progress = Math.min(100, (elapsed / seed.time) * 100);
                        }
                    }
                }
            });
        }
    }
}

// Export for module systems if needed
try {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SpiritGarden;
    }
} catch (e) {}
