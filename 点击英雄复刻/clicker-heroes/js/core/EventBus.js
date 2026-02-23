/**
 * EventBus.js
 * 事件总线系统 - 发布/订阅模式实现
 * 
 * 功能：
 * - 提供全局事件发布和订阅机制
 * - 支持事件命名空间（如 'player:levelup'）
 * - 支持一次性事件监听
 * - 支持事件优先级
 * - 支持异步事件处理
 * 
 * @author Clicker Heroes Team
 * @version 1.0.0
 */

/**
 * 事件总线类
 * 实现发布/订阅模式，用于组件间解耦通信
 */
class EventBus {
    /**
     * 构造函数
     * 初始化事件存储和配置
     */
    constructor() {
        // 事件映射表：eventName -> Array<{callback, priority, once, id}>
        this.events = {};
        
        // 命名空间映射：namespace -> Set<eventNames>
        this.namespaces = new Map();
        
        // 事件统计信息
        this.stats = {
            totalEmitted: 0,
            totalHandled: 0,
            totalErrors: 0
        };
        
        // 是否启用调试模式
        this.debug = false;
        
        // 事件ID计数器
        this.eventIdCounter = 0;
        
        // 拦截器列表
        this.interceptors = [];
    }

    /**
     * 订阅事件
     * @param {string} event - 事件名称（支持命名空间，如 'player:attack'）
     * @param {Function} callback - 回调函数
     * @param {Object} options - 配置选项
     * @param {number} options.priority - 优先级（数字越大优先级越高，默认0）
     * @param {boolean} options.once - 是否只执行一次
     * @returns {Function} 取消订阅的函数
     */
    on(event, callback, options = {}) {
        // 参数验证
        if (typeof event !== 'string' || event.trim() === '') {
            console.warn('[EventBus] on() 事件名称必须是有效的字符串');
            return () => {};
        }
        
        if (typeof callback !== 'function') {
            console.warn('[EventBus] on() 回调必须是函数');
            return () => {};
        }
        
        const { priority = 0, once = false } = options;
        
        // 初始化事件数组
        if (!this.events[event]) {
            this.events[event] = [];
        }
        
        // 生成唯一ID
        const id = ++this.eventIdCounter;
        
        // 创建监听器对象
        const listener = {
            id,
            callback,
            priority,
            once,
            namespace: this._extractNamespace(event)
        };
        
        // 按优先级插入（高优先级在前）
        const index = this.events[event].findIndex(l => l.priority < priority);
        if (index === -1) {
            this.events[event].push(listener);
        } else {
            this.events[event].splice(index, 0, listener);
        }
        
        // 记录命名空间
        if (listener.namespace) {
            if (!this.namespaces.has(listener.namespace)) {
                this.namespaces.set(listener.namespace, new Set());
            }
            this.namespaces.get(listener.namespace).add(event);
        }
        
        if (this.debug) {
            console.log(`[EventBus] 订阅事件: ${event}, 优先级: ${priority}, 一次性: ${once}`);
        }
        
        // 返回取消订阅函数
        return () => this.off(event, callback);
    }

    /**
     * 订阅一次性事件
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     * @param {Object} options - 配置选项
     * @returns {Function} 取消订阅的函数
     */
    once(event, callback, options = {}) {
        return this.on(event, callback, { ...options, once: true });
    }

    /**
     * 取消订阅事件
     * @param {string} event - 事件名称（支持通配符 '*'）
     * @param {Function} callback - 要移除的回调函数（不传则移除所有）
     * @returns {number} 移除的监听器数量
     */
    off(event, callback = null) {
        // 处理通配符取消订阅
        if (event === '*') {
            if (callback === null) {
                // 取消所有订阅
                const count = this.getListenerCount();
                this.events = {};
                this.namespaces.clear();
                return count;
            } else {
                // 从所有事件中移除指定回调
                let count = 0;
                for (const eventName of Object.keys(this.events)) {
                    count += this._removeListener(eventName, callback);
                }
                return count;
            }
        }
        
        // 处理命名空间取消订阅（如 'player:*'）
        if (event.endsWith(':*')) {
            const namespace = event.slice(0, -2);
            return this.offNamespace(namespace, callback);
        }
        
        // 常规取消订阅
        return this._removeListener(event, callback);
    }

    /**
     * 从指定事件中移除监听器
     * @private
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     * @returns {number} 移除的数量
     */
    _removeListener(event, callback) {
        if (!this.events[event]) {
            return 0;
        }
        
        let removedCount = 0;
        
        if (callback === null) {
            // 移除所有监听器
            removedCount = this.events[event].length;
            delete this.events[event];
        } else {
            // 移除指定回调
            const originalLength = this.events[event].length;
            this.events[event] = this.events[event].filter(l => l.callback !== callback);
            removedCount = originalLength - this.events[event].length;
            
            // 清理空数组
            if (this.events[event].length === 0) {
                delete this.events[event];
            }
        }
        
        return removedCount;
    }

    /**
     * 取消指定命名空间的所有订阅
     * @param {string} namespace - 命名空间
     * @param {Function} callback - 回调函数（不传则移除所有）
     * @returns {number} 移除的监听器数量
     */
    offNamespace(namespace, callback = null) {
        if (!this.namespaces.has(namespace)) {
            return 0;
        }
        
        let count = 0;
        for (const event of this.namespaces.get(namespace)) {
            count += this._removeListener(event, callback);
        }
        
        if (callback === null) {
            this.namespaces.delete(namespace);
        }
        
        return count;
    }

    /**
     * 触发事件（同步执行）
     * @param {string} event - 事件名称
     * @param {*} data - 事件数据
     * @returns {Array} 所有回调的返回值数组
     */
    emit(event, data = null) {
        return this._emit(event, data, false);
    }

    /**
     * 触发事件（异步执行）
     * @param {string} event - 事件名称
     * @param {*} data - 事件数据
     * @returns {Promise<Array>} 所有回调返回值的Promise
     */
    async emitAsync(event, data = null) {
        return this._emit(event, data, true);
    }

    /**
     * 内部触发事件方法
     * @private
     * @param {string} event - 事件名称
     * @param {*} data - 事件数据
     * @param {boolean} async - 是否异步执行
     * @returns {Array|Promise<Array>} 回调返回值
     */
    _emit(event, data, async = false) {
        this.stats.totalEmitted++;
        
        if (this.debug) {
            console.log(`[EventBus] 触发事件: ${event}`, data);
        }
        
        // 执行拦截器
        for (const interceptor of this.interceptors) {
            const result = interceptor(event, data);
            if (result === false) {
                if (this.debug) {
                    console.log(`[EventBus] 事件被拦截: ${event}`);
                }
                return async ? Promise.resolve([]) : [];
            }
        }
        
        if (!this.events[event] || this.events[event].length === 0) {
            return async ? Promise.resolve([]) : [];
        }
        
        const listeners = [...this.events[event]]; // 复制数组防止修改
        const results = [];
        const toRemove = []; // 记录需要移除的一次性监听器
        
        for (const listener of listeners) {
            try {
                let result;
                
                if (async) {
                    result = Promise.resolve(listener.callback(data, event));
                } else {
                    result = listener.callback(data, event);
                }
                
                results.push(result);
                this.stats.totalHandled++;
                
                // 标记一次性监听器
                if (listener.once) {
                    toRemove.push(listener);
                }
            } catch (error) {
                this.stats.totalErrors++;
                console.error(`[EventBus] 事件处理错误: ${event}`, error);
                results.push(async ? Promise.reject(error) : undefined);
            }
        }
        
        // 移除一次性监听器
        for (const listener of toRemove) {
            this.events[event] = this.events[event].filter(l => l.id !== listener.id);
        }
        
        // 清理空数组
        if (this.events[event].length === 0) {
            delete this.events[event];
        }
        
        return async ? Promise.all(results) : results;
    }

    /**
     * 触发事件并等待所有回调完成（包括异步回调）
     * @param {string} event - 事件名称
     * @param {*} data - 事件数据
     * @returns {Promise<Array>} 所有回调返回值的Promise
     */
    async emitAndWait(event, data = null) {
        this.stats.totalEmitted++;
        
        if (!this.events[event] || this.events[event].length === 0) {
            return [];
        }
        
        const listeners = [...this.events[event]];
        const results = [];
        const toRemove = [];
        
        for (const listener of listeners) {
            try {
                const result = await Promise.resolve(listener.callback(data, event));
                results.push(result);
                this.stats.totalHandled++;
                
                if (listener.once) {
                    toRemove.push(listener);
                }
            } catch (error) {
                this.stats.totalErrors++;
                console.error(`[EventBus] 事件处理错误: ${event}`, error);
                results.push(undefined);
            }
        }
        
        // 移除一次性监听器
        for (const listener of toRemove) {
            this.events[event] = this.events[event].filter(l => l.id !== listener.id);
        }
        
        if (this.events[event].length === 0) {
            delete this.events[event];
        }
        
        return results;
    }

    /**
     * 提取命名空间
     * @private
     * @param {string} event - 事件名称
     * @returns {string|null} 命名空间
     */
    _extractNamespace(event) {
        const colonIndex = event.indexOf(':');
        return colonIndex > 0 ? event.substring(0, colonIndex) : null;
    }

    /**
     * 添加事件拦截器
     * @param {Function} interceptor - 拦截器函数，返回false阻止事件传播
     * @returns {Function} 移除拦截器的函数
     */
    addInterceptor(interceptor) {
        if (typeof interceptor !== 'function') {
            console.warn('[EventBus] 拦截器必须是函数');
            return () => {};
        }
        
        this.interceptors.push(interceptor);
        
        return () => {
            const index = this.interceptors.indexOf(interceptor);
            if (index > -1) {
                this.interceptors.splice(index, 1);
            }
        };
    }

    /**
     * 检查事件是否有监听器
     * @param {string} event - 事件名称
     * @returns {boolean} 是否有监听器
     */
    hasListeners(event) {
        return !!(this.events[event] && this.events[event].length > 0);
    }

    /**
     * 获取事件监听器数量
     * @param {string} event - 事件名称（不传则返回总数）
     * @returns {number} 监听器数量
     */
    getListenerCount(event = null) {
        if (event) {
            return this.events[event] ? this.events[event].length : 0;
        }
        
        let total = 0;
        for (const listeners of Object.values(this.events)) {
            total += listeners.length;
        }
        return total;
    }

    /**
     * 获取所有事件名称
     * @returns {string[]} 事件名称数组
     */
    getEventNames() {
        return Object.keys(this.events);
    }

    /**
     * 获取所有命名空间
     * @returns {string[]} 命名空间数组
     */
    getNamespaces() {
        return Array.from(this.namespaces.keys());
    }

    /**
     * 获取统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * 重置统计信息
     */
    resetStats() {
        this.stats = {
            totalEmitted: 0,
            totalHandled: 0,
            totalErrors: 0
        };
    }

    /**
     * 设置调试模式
     * @param {boolean} enabled - 是否启用
     */
    setDebug(enabled) {
        this.debug = enabled;
    }

    /**
     * 清空所有事件和监听器
     */
    clear() {
        this.events = {};
        this.namespaces.clear();
        this.interceptors = [];
        this.resetStats();
    }

    /**
     * 销毁事件总线
     */
    destroy() {
        this.clear();
        this.eventIdCounter = 0;
    }
}

// 创建全局事件总线实例（单例模式）
EventBus.instance = null;

/**
 * 获取全局事件总线实例
 * @returns {EventBus} 全局事件总线实例
 */
EventBus.getInstance = function() {
    if (!EventBus.instance) {
        EventBus.instance = new EventBus();
    }
    return EventBus.instance;
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventBus;
}
