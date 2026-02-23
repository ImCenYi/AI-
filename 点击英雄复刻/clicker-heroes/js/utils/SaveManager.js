/**
 * SaveManager - 存档管理器
 * 处理游戏保存、加载、自动保存、离线进度计算等功能
 */
class SaveManager {
    /**
     * 构造函数
     */
    constructor() {
        // ===== 存档配置 =====
        this.saveKey = 'clickerHeroesSave';           // 本地存储键名
        this.backupKey = 'clickerHeroesSaveBackup';   // 备份键名
        this.autoSaveInterval = 60000;                 // 自动保存间隔（60秒）
        this.maxBackups = 3;                           // 最大备份数量
        
        // ===== 存档状态 =====
        this.lastSaveTime = 0;                         // 上次保存时间
        this.isSaving = false;                         // 是否正在保存
        this.saveVersion = '1.0.0';                    // 存档版本
        
        // ===== 自动保存 =====
        this.autoSaveTimer = null;                     // 自动保存定时器
        this.autoSaveEnabled = true;                   // 是否启用自动保存
        
        // ===== 云存档 =====
        this.cloudSaveEnabled = false;                 // 是否启用云存档
        this.cloudSaveUrl = null;                      // 云存档URL
        
        // ===== 压缩设置 =====
        this.compressionEnabled = true;                // 是否启用压缩
    }

    // ==================== 保存功能 ====================

    /**
     * 保存游戏
     * @param {Object} game - 游戏主对象
     * @param {boolean} showNotification - 是否显示通知
     * @returns {Object} 保存结果
     */
    save(game, showNotification = false) {
        if (this.isSaving) {
            return { success: false, error: 'Save in progress' };
        }

        this.isSaving = true;

        try {
            // 构建存档数据
            const saveData = this.buildSaveData(game);
            
            // 序列化存档数据
            const serializedData = this.serialize(saveData);
            
            // 保存到本地存储
            this.saveToLocalStorage(serializedData);
            
            // 创建备份
            this.createBackup(serializedData);
            
            // 更新保存时间
            this.lastSaveTime = Date.now();
            
            // 显示通知
            if (showNotification && game.uiManager) {
                game.uiManager.showSaveNotification();
            }

            this.isSaving = false;

            return {
                success: true,
                timestamp: this.lastSaveTime,
                size: serializedData.length
            };

        } catch (error) {
            this.isSaving = false;
            console.error('Save failed:', error);
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 构建存档数据
     * @param {Object} game - 游戏主对象
     * @returns {Object} 存档数据对象
     */
    buildSaveData(game) {
        const saveData = {
            // 存档元数据
            metadata: {
                version: this.saveVersion,
                timestamp: Date.now(),
                saveDate: new Date().toISOString()
            },

            // 游戏状态
            gameState: {
                gold: game.gold || 0,
                totalGoldEarned: game.totalGoldEarned || 0,
                experience: game.experience || 0,
                level: game.level || 1,
                damageMultiplier: game.damageMultiplier || 1,
                dpsMultiplier: game.dpsMultiplier || 1,
                goldMultiplier: game.goldMultiplier || 1
            },

            // 战斗系统数据
            combatSystem: game.combatSystem ? game.combatSystem.serialize() : {},

            // 升级系统数据
            upgradeSystem: game.upgradeSystem ? game.upgradeSystem.serialize() : {},

            // 进度系统数据
            progressSystem: game.progressSystem ? game.progressSystem.serialize() : {},

            // 英雄数据
            heroes: game.heroes ? game.heroes.map(hero => ({
                id: hero.id,
                level: hero.level,
                unlocked: hero.unlocked,
                dpsMultiplier: hero.dpsMultiplier || 1
            })) : [],

            // 升级数据
            upgrades: game.upgrades ? game.upgrades.map(upgrade => ({
                id: upgrade.id,
                purchased: upgrade.purchased,
                purchaseCount: upgrade.purchaseCount || 0
            })) : [],

            // 成就数据
            achievements: game.achievements ? game.achievements.map(achievement => ({
                id: achievement.id,
                unlocked: achievement.unlocked,
                unlockTime: achievement.unlockTime
            })) : [],

            // 统计
            statistics: game.statistics || {},

            // 设置
            settings: game.settings || {}
        };

        return saveData;
    }

    /**
     * 序列化存档数据
     * @param {Object} data - 存档数据
     * @returns {string} 序列化后的字符串
     */
    serialize(data) {
        // 使用JSON序列化
        const jsonString = JSON.stringify(data);
        
        // 如果需要压缩，可以使用简单的压缩算法
        if (this.compressionEnabled && typeof LZString !== 'undefined') {
            return LZString.compressToBase64(jsonString);
        }
        
        return jsonString;
    }

    /**
     * 保存到本地存储
     * @param {string} data - 序列化后的数据
     */
    saveToLocalStorage(data) {
        try {
            localStorage.setItem(this.saveKey, data);
        } catch (e) {
            // 存储空间不足，尝试清理旧数据
            if (e.name === 'QuotaExceededError') {
                this.cleanupStorage();
                localStorage.setItem(this.saveKey, data);
            } else {
                throw e;
            }
        }
    }

    // ==================== 加载功能 ====================

    /**
     * 加载游戏
     * @returns {Object|null} 加载的存档数据
     */
    load() {
        try {
            // 从本地存储读取
            const savedData = localStorage.getItem(this.saveKey);
            
            if (!savedData) {
                return null; // 没有存档
            }

            // 反序列化
            const saveData = this.deserialize(savedData);
            
            // 验证存档版本
            if (!this.validateSaveData(saveData)) {
                // 尝试从备份恢复
                return this.loadFromBackup();
            }

            return saveData;

        } catch (error) {
            console.error('Load failed:', error);
            
            // 尝试从备份恢复
            return this.loadFromBackup();
        }
    }

    /**
     * 反序列化存档数据
     * @param {string} data - 序列化后的字符串
     * @returns {Object} 存档数据对象
     */
    deserialize(data) {
        // 检查是否是压缩数据
        if (this.compressionEnabled && typeof LZString !== 'undefined') {
            try {
                const decompressed = LZString.decompressFromBase64(data);
                if (decompressed) {
                    return JSON.parse(decompressed);
                }
            } catch (e) {
                // 不是压缩数据，继续尝试JSON解析
            }
        }
        
        return JSON.parse(data);
    }

    /**
     * 验证存档数据
     * @param {Object} data - 存档数据
     * @returns {boolean} 是否有效
     */
    validateSaveData(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }

        // 检查必要的字段
        if (!data.metadata || !data.gameState) {
            return false;
        }

        // 检查版本兼容性
        const saveVersion = data.metadata.version;
        if (saveVersion && !this.isVersionCompatible(saveVersion)) {
            console.warn('Save version incompatible:', saveVersion);
            // 尝试迁移
            return this.migrateSaveData(data);
        }

        return true;
    }

    /**
     * 检查版本兼容性
     * @param {string} saveVersion - 存档版本
     * @returns {boolean} 是否兼容
     */
    isVersionCompatible(saveVersion) {
        // 简单版本检查，主版本号必须相同
        const currentMajor = this.saveVersion.split('.')[0];
        const saveMajor = saveVersion.split('.')[0];
        return currentMajor === saveMajor;
    }

    /**
     * 迁移存档数据
     * @param {Object} data - 旧版本存档数据
     * @returns {boolean} 是否成功迁移
     */
    migrateSaveData(data) {
        // 这里可以添加版本迁移逻辑
        // 例如：添加新字段、重命名字段等
        
        // 确保所有必要字段存在
        if (!data.gameState) data.gameState = {};
        if (!data.heroes) data.heroes = [];
        if (!data.upgrades) data.upgrades = [];
        if (!data.achievements) data.achievements = [];
        
        return true;
    }

    // ==================== 自动保存 ====================

    /**
     * 开始自动保存
     * @param {Object} game - 游戏主对象
     */
    startAutoSave(game) {
        if (!this.autoSaveEnabled) return;

        // 清除现有定时器
        this.stopAutoSave();

        // 创建新的定时器
        this.autoSaveTimer = setInterval(() => {
            this.save(game, false);
        }, this.autoSaveInterval);

        console.log('Auto-save started');
    }

    /**
     * 停止自动保存
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
            console.log('Auto-save stopped');
        }
    }

    /**
     * 设置自动保存间隔
     * @param {number} interval - 间隔（毫秒）
     */
    setAutoSaveInterval(interval) {
        this.autoSaveInterval = Math.max(10000, interval); // 最少10秒
        
        // 如果正在自动保存，重启定时器
        if (this.autoSaveTimer) {
            this.startAutoSave(this.game);
        }
    }

    // ==================== 备份功能 ====================

    /**
     * 创建备份
     * @param {string} data - 序列化后的数据
     */
    createBackup(data) {
        try {
            // 获取现有备份
            const backups = this.getBackups();
            
            // 添加新备份
            backups.push({
                timestamp: Date.now(),
                data: data
            });
            
            // 限制备份数量
            while (backups.length > this.maxBackups) {
                backups.shift();
            }
            
            // 保存备份
            localStorage.setItem(this.backupKey, JSON.stringify(backups));
            
        } catch (e) {
            console.warn('Backup creation failed:', e);
        }
    }

    /**
     * 获取备份列表
     * @returns {Array} 备份列表
     */
    getBackups() {
        try {
            const backupsJson = localStorage.getItem(this.backupKey);
            return backupsJson ? JSON.parse(backupsJson) : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * 从备份恢复
     * @param {number} index - 备份索引（默认最新）
     * @returns {Object|null} 恢复的存档数据
     */
    loadFromBackup(index = -1) {
        const backups = this.getBackups();
        
        if (backups.length === 0) {
            return null;
        }

        // 获取指定备份或最新备份
        const backup = index >= 0 ? backups[index] : backups[backups.length - 1];
        
        if (!backup || !backup.data) {
            return null;
        }

        try {
            return this.deserialize(backup.data);
        } catch (e) {
            console.error('Backup load failed:', e);
            return null;
        }
    }

    /**
     * 删除备份
     * @param {number} index - 备份索引
     */
    deleteBackup(index) {
        const backups = this.getBackups();
        
        if (index >= 0 && index < backups.length) {
            backups.splice(index, 1);
            localStorage.setItem(this.backupKey, JSON.stringify(backups));
        }
    }

    /**
     * 清除所有备份
     */
    clearBackups() {
        localStorage.removeItem(this.backupKey);
    }

    // ==================== 离线进度 ====================

    /**
     * 计算离线进度
     * @param {number} lastSaveTime - 上次保存时间戳
     * @returns {Object} 离线进度结果
     */
    calculateOfflineProgress(lastSaveTime) {
        if (!lastSaveTime) {
            return { enabled: false, reason: 'No last save time' };
        }

        const now = Date.now();
        const offlineTime = now - lastSaveTime;

        // 检查离线时间
        if (offlineTime < 60000) { // 少于1分钟
            return {
                enabled: true,
                time: offlineTime,
                significant: false,
                reason: 'Offline time too short'
            };
        }

        // 最大离线时间限制（24小时）
        const maxOfflineTime = 24 * 60 * 60 * 1000;
        const effectiveOfflineTime = Math.min(offlineTime, maxOfflineTime);

        return {
            enabled: true,
            time: offlineTime,
            effectiveTime: effectiveOfflineTime,
            significant: true
        };
    }

    /**
     * 应用离线进度到游戏
     * @param {Object} game - 游戏主对象
     * @param {Object} progress - 离线进度数据
     */
    applyOfflineProgress(game, progress) {
        if (!progress || !progress.significant) return;

        // 计算离线收益
        let goldEarned = 0;
        let monstersKilled = 0;
        let experienceGained = 0;

        // 如果有战斗系统，使用其计算
        if (game.combatSystem && game.progressSystem) {
            const dps = game.combatSystem.totalDPS;
            
            if (dps > 0) {
                const avgMonsterHealth = game.progressSystem.calculateMonsterHealth();
                const avgGold = game.progressSystem.calculateMonsterGold();
                
                const totalDamage = dps * (progress.effectiveTime / 1000);
                monstersKilled = Math.floor(totalDamage / Math.max(1, avgMonsterHealth));
                goldEarned = monstersKilled * avgGold;
                experienceGained = monstersKilled * (game.progressSystem.currentZone || 1);
            }
        }

        // 应用收益
        if (goldEarned > 0) {
            game.addGold(goldEarned);
        }
        
        if (experienceGained > 0) {
            game.addExperience(experienceGained);
        }

        // 更新统计
        if (game.combatSystem) {
            game.combatSystem.monstersKilled += monstersKilled;
        }

        return {
            goldEarned,
            monstersKilled,
            experienceGained,
            offlineTime: progress.time
        };
    }

    // ==================== 导入导出 ====================

    /**
     * 导出存档为字符串
     * @param {Object} game - 游戏主对象
     * @returns {string} 导出的存档字符串
     */
    exportSave(game) {
        const saveData = this.buildSaveData(game);
        return btoa(JSON.stringify(saveData)); // Base64编码
    }

    /**
     * 从字符串导入存档
     * @param {string} saveString - 存档字符串
     * @returns {Object} 导入结果
     */
    importSave(saveString) {
        try {
            const saveData = JSON.parse(atob(saveString)); // Base64解码
            
            if (!this.validateSaveData(saveData)) {
                return { success: false, error: 'Invalid save data' };
            }

            // 保存到本地存储
            const serializedData = this.serialize(saveData);
            this.saveToLocalStorage(serializedData);

            return { success: true, data: saveData };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ==================== 存储管理 ====================

    /**
     * 清理存储空间
     */
    cleanupStorage() {
        // 清除旧备份
        this.clearBackups();
        
        // 可以尝试清除其他不必要的数据
        console.log('Storage cleaned up');
    }

    /**
     * 删除存档
     */
    deleteSave() {
        localStorage.removeItem(this.saveKey);
        this.clearBackups();
        this.lastSaveTime = 0;
    }

    /**
     * 检查是否有存档
     * @returns {boolean} 是否有存档
     */
    hasSave() {
        return localStorage.getItem(this.saveKey) !== null;
    }

    /**
     * 获取存档信息
     * @returns {Object|null} 存档信息
     */
    getSaveInfo() {
        const savedData = localStorage.getItem(this.saveKey);
        
        if (!savedData) return null;

        try {
            const saveData = this.deserialize(savedData);
            
            return {
                version: saveData.metadata?.version,
                timestamp: saveData.metadata?.timestamp,
                saveDate: saveData.metadata?.saveDate,
                size: savedData.length,
                zone: saveData.progressSystem?.currentZone,
                gold: saveData.gameState?.gold,
                highestZone: saveData.progressSystem?.highestZone
            };
        } catch (e) {
            return null;
        }
    }

    // ==================== 云存档（预留接口）====================

    /**
     * 启用云存档
     * @param {string} url - 云存档服务器URL
     */
    enableCloudSave(url) {
        this.cloudSaveEnabled = true;
        this.cloudSaveUrl = url;
    }

    /**
     * 上传存档到云端
     * @param {Object} game - 游戏主对象
     * @returns {Promise} 上传结果
     */
    async uploadToCloud(game) {
        if (!this.cloudSaveEnabled || !this.cloudSaveUrl) {
            return { success: false, error: 'Cloud save not enabled' };
        }

        const saveData = this.buildSaveData(game);
        
        try {
            const response = await fetch(this.cloudSaveUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(saveData)
            });

            return { success: response.ok };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * 从云端下载存档
     * @returns {Promise} 下载结果
     */
    async downloadFromCloud() {
        if (!this.cloudSaveEnabled || !this.cloudSaveUrl) {
            return { success: false, error: 'Cloud save not enabled' };
        }

        try {
            const response = await fetch(this.cloudSaveUrl);
            const saveData = await response.json();

            if (this.validateSaveData(saveData)) {
                const serializedData = this.serialize(saveData);
                this.saveToLocalStorage(serializedData);
                return { success: true, data: saveData };
            }

            return { success: false, error: 'Invalid save data' };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SaveManager;
}
