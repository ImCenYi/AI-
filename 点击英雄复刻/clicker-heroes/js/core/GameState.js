/**
 * GameState.js
 * 游戏状态管理系统 - 观察者模式实现
 * 
 * 功能：
 * - 集中管理游戏所有状态数据
 * - 支持状态订阅/通知机制（观察者模式）
 * - 提供状态持久化支持
 * 
 * @author Clicker Heroes Team
 * @version 1.0.0
 */

/**
 * 游戏状态管理类
 * 使用观察者模式实现，当状态变化时自动通知所有订阅者
 */
class GameState {
    /**
     * 构造函数
     * 初始化状态存储和监听器映射
     */
    constructor() {
        // 存储所有游戏状态数据
        this.state = {};
        
        // 监听器映射表：key -> Set(callbacks)
        // 使用Map存储，key为状态键名，值为回调函数集合
        this.listeners = new Map();
        
        // 全局监听器集合（监听所有状态变化）
        this.globalListeners = new Set();
        
        // 状态变化历史（用于调试和回放）
        this.history = [];
        
        // 是否启用历史记录
        this.enableHistory = false;
        
        // 最大历史记录数
        this.maxHistorySize = 100;
    }

    /**
     * 获取指定键的状态值
     * @param {string} key - 状态键名
     * @param {*} defaultValue - 默认值（当键不存在时返回）
     * @returns {*} 状态值或默认值
     */
    get(key, defaultValue = undefined) {
        // 检查key是否为字符串
        if (typeof key !== 'string') {
            console.warn('[GameState] get() 参数key必须是字符串');
            return defaultValue;
        }
        
        // 使用点号分隔的路径支持嵌套对象访问
        // 例如: get('player.stats.level') 等价于 state.player.stats.level
        const keys = key.split('.');
        let value = this.state;
        
        for (const k of keys) {
            if (value === null || value === undefined || typeof value !== 'object') {
                return defaultValue;
            }
            value = value[k];
        }
        
        return value !== undefined ? value : defaultValue;
    }

    /**
     * 设置指定键的状态值
     * @param {string} key - 状态键名
     * @param {*} value - 新的状态值
     * @param {boolean} silent - 是否静默更新（不触发通知）
     * @returns {boolean} 是否成功设置
     */
    set(key, value, silent = false) {
        // 检查key是否为字符串
        if (typeof key !== 'string') {
            console.warn('[GameState] set() 参数key必须是字符串');
            return false;
        }
        
        // 获取旧值用于比较
        const oldValue = this.get(key);
        
        // 如果值没有变化，跳过更新
        if (oldValue === value) {
            return true;
        }
        
        // 使用点号分隔的路径设置嵌套对象值
        const keys = key.split('.');
        let target = this.state;
        
        // 遍历到倒数第二个键，创建中间对象（如果不存在）
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!target[k] || typeof target[k] !== 'object') {
                target[k] = {};
            }
            target = target[k];
        }
        
        // 设置最终值
        const lastKey = keys[keys.length - 1];
        target[lastKey] = value;
        
        // 记录历史
        if (this.enableHistory) {
            this._addToHistory(key, oldValue, value);
        }
        
        // 触发通知（除非静默模式）
        if (!silent) {
            this.notify(key, value, oldValue);
        }
        
        return true;
    }

    /**
     * 批量设置多个状态值
     * @param {Object} updates - 状态更新对象 {key1: value1, key2: value2, ...}
     * @param {boolean} silent - 是否静默更新
     * @returns {number} 成功更新的数量
     */
    batchSet(updates, silent = false) {
        if (!updates || typeof updates !== 'object') {
            console.warn('[GameState] batchSet() 参数必须是对象');
            return 0;
        }
        
        let count = 0;
        const changedKeys = [];
        
        // 先批量更新所有值
        for (const [key, value] of Object.entries(updates)) {
            const oldValue = this.get(key);
            if (oldValue !== value) {
                this.set(key, value, true); // 静默更新
                changedKeys.push(key);
                count++;
            }
        }
        
        // 批量触发通知
        if (!silent && changedKeys.length > 0) {
            for (const key of changedKeys) {
                this.notify(key, updates[key], this.get(key));
            }
            // 触发全局批量更新事件
            this._notifyGlobalListeners('batch', { keys: changedKeys, updates });
        }
        
        return count;
    }

    /**
     * 订阅指定状态键的变化
     * @param {string} key - 状态键名（支持通配符 '*' 订阅所有）
     * @param {Function} callback - 回调函数，参数为(newValue, oldValue, key)
     * @returns {Function} 取消订阅的函数
     */
    subscribe(key, callback) {
        // 参数验证
        if (typeof key !== 'string') {
            console.warn('[GameState] subscribe() 参数key必须是字符串');
            return () => {};
        }
        
        if (typeof callback !== 'function') {
            console.warn('[GameState] subscribe() 参数callback必须是函数');
            return () => {};
        }
        
        // 全局订阅（监听所有状态变化）
        if (key === '*') {
            this.globalListeners.add(callback);
            
            // 返回取消订阅函数
            return () => {
                this.globalListeners.delete(callback);
            };
        }
        
        // 特定键订阅
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        
        this.listeners.get(key).add(callback);
        
        // 返回取消订阅函数
        return () => {
            this.off(key, callback);
        };
    }

    /**
     * 取消订阅
     * @param {string} key - 状态键名
     * @param {Function} callback - 要移除的回调函数
     * @returns {boolean} 是否成功移除
     */
    off(key, callback) {
        if (key === '*') {
            return this.globalListeners.delete(callback);
        }
        
        if (!this.listeners.has(key)) {
            return false;
        }
        
        const removed = this.listeners.get(key).delete(callback);
        
        // 如果没有监听器了，清理该键的映射
        if (this.listeners.get(key).size === 0) {
            this.listeners.delete(key);
        }
        
        return removed;
    }

    /**
     * 通知指定键的所有订阅者
     * @param {string} key - 状态键名
     * @param {*} newValue - 新值
     * @param {*} oldValue - 旧值
     */
    notify(key, newValue, oldValue) {
        // 通知特定键的订阅者
        if (this.listeners.has(key)) {
            for (const callback of this.listeners.get(key)) {
                try {
                    callback(newValue, oldValue, key);
                } catch (error) {
                    console.error(`[GameState] 订阅者回调执行失败: ${key}`, error);
                }
            }
        }
        
        // 通知父路径的订阅者（支持嵌套监听）
        // 例如：监听 'player' 会收到 'player.stats.level' 的变化通知
        const keyParts = key.split('.');
        for (let i = 1; i < keyParts.length; i++) {
            const parentKey = keyParts.slice(0, i).join('.');
            if (this.listeners.has(parentKey)) {
                for (const callback of this.listeners.get(parentKey)) {
                    try {
                        callback(this.get(parentKey), null, key);
                    } catch (error) {
                        console.error(`[GameState] 父路径订阅者回调执行失败: ${parentKey}`, error);
                    }
                }
            }
        }
        
        // 通知全局订阅者
        this._notifyGlobalListeners(key, { newValue, oldValue });
    }

    /**
     * 通知全局订阅者
     * @private
     * @param {string} key - 状态键名
     * @param {Object} data - 变化数据
     */
    _notifyGlobalListeners(key, data) {
        for (const callback of this.globalListeners) {
            try {
                callback(data.newValue, data.oldValue, key);
            } catch (error) {
                console.error('[GameState] 全局订阅者回调执行失败:', error);
            }
        }
    }

    /**
     * 添加历史记录
     * @private
     * @param {string} key - 状态键名
     * @param {*} oldValue - 旧值
     * @param {*} newValue - 新值
     */
    _addToHistory(key, oldValue, newValue) {
        this.history.push({
            timestamp: Date.now(),
            key,
            oldValue,
            newValue
        });
        
        // 限制历史记录大小
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    /**
     * 删除指定状态键
     * @param {string} key - 状态键名
     * @param {boolean} silent - 是否静默删除
     * @returns {boolean} 是否成功删除
     */
    delete(key, silent = false) {
        const keys = key.split('.');
        let target = this.state;
        
        // 遍历到倒数第二个键
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!target[k] || typeof target[k] !== 'object') {
                return false;
            }
            target = target[k];
        }
        
        const lastKey = keys[keys.length - 1];
        const oldValue = target[lastKey];
        
        if (!(lastKey in target)) {
            return false;
        }
        
        delete target[lastKey];
        
        if (!silent) {
            this.notify(key, undefined, oldValue);
        }
        
        return true;
    }

    /**
     * 检查指定键是否存在
     * @param {string} key - 状态键名
     * @returns {boolean} 是否存在
     */
    has(key) {
        return this.get(key) !== undefined;
    }

    /**
     * 获取所有状态键
     * @returns {string[]} 所有键的数组
     */
    keys() {
        return Object.keys(this.state);
    }

    /**
     * 获取所有状态
     * @returns {Object} 完整的状态对象副本
     */
    getAll() {
        return JSON.parse(JSON.stringify(this.state));
    }

    /**
     * 重置所有状态
     * @param {Object} newState - 新的状态对象
     * @param {boolean} silent - 是否静默重置
     */
    reset(newState = {}, silent = false) {
        const oldState = this.state;
        this.state = newState;
        
        if (!silent) {
            // 通知所有订阅者状态已重置
            for (const key of this.listeners.keys()) {
                this.notify(key, this.get(key), undefined);
            }
            this._notifyGlobalListeners('reset', { newState, oldState });
        }
    }

    /**
     * 清空所有状态
     * @param {boolean} silent - 是否静默清空
     */
    clear(silent = false) {
        this.reset({}, silent);
        this.history = [];
    }

    /**
     * 获取状态变化历史
     * @param {number} limit - 限制返回数量
     * @returns {Array} 历史记录数组
     */
    getHistory(limit = null) {
        if (limit && limit > 0) {
            return this.history.slice(-limit);
        }
        return [...this.history];
    }

    /**
     * 清空历史记录
     */
    clearHistory() {
        this.history = [];
    }

    /**
     * 启用/禁用历史记录
     * @param {boolean} enable - 是否启用
     */
    setHistoryEnabled(enable) {
        this.enableHistory = enable;
        if (!enable) {
            this.clearHistory();
        }
    }

    /**
     * 序列化状态（用于保存游戏）
     * @returns {string} JSON字符串
     */
    serialize() {
        return JSON.stringify({
            state: this.state,
            timestamp: Date.now()
        });
    }

    /**
     * 反序列化状态（用于加载游戏）
     * @param {string} jsonString - JSON字符串
     * @param {boolean} silent - 是否静默加载
     * @returns {boolean} 是否成功加载
     */
    deserialize(jsonString, silent = false) {
        try {
            const data = JSON.parse(jsonString);
            if (data && typeof data.state === 'object') {
                this.reset(data.state, silent);
                return true;
            }
        } catch (error) {
            console.error('[GameState] 反序列化失败:', error);
        }
        return false;
    }

    /**
     * 获取订阅者数量
     * @param {string} key - 状态键名（不传则返回总数）
     * @returns {number} 订阅者数量
     */
    getSubscriberCount(key = null) {
        if (key) {
            return this.listeners.has(key) ? this.listeners.get(key).size : 0;
        }
        
        let total = this.globalListeners.size;
        for (const callbacks of this.listeners.values()) {
            total += callbacks.size;
        }
        return total;
    }
}

// 导出模块（支持CommonJS和ES6模块）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameState;
}
