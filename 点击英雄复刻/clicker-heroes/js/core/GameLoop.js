/**
 * GameLoop.js
 * 游戏循环系统 - 基于时间步长的固定更新实现
 * 
 * 功能：
 * - 提供稳定的60FPS游戏循环
 * - 支持可变时间步长(deltaTime)和固定时间步长(fixedDeltaTime)
 * - 支持暂停/继续功能
 * - 支持慢动作/快动作效果
 * - 自动处理后台标签页节流
 * 
 * @author Clicker Heroes Team
 * @version 1.0.0
 */

/**
 * 游戏循环类
 * 管理游戏的主循环，处理更新和渲染时机
 */
class GameLoop {
    /**
     * 构造函数
     * @param {Game} game - 游戏主控制器实例
     * @param {Object} options - 配置选项
     */
    constructor(game, options = {}) {
        // 游戏主控制器引用
        this.game = game;
        
        // 配置选项
        this.options = {
            // 目标帧率（默认60fps）
            targetFPS: options.targetFPS || 60,
            // 是否使用固定时间步长
            useFixedTimeStep: options.useFixedTimeStep !== false,
            // 最大时间步长（防止卡顿时跳帧过多）
            maxDeltaTime: options.maxDeltaTime || 1000 / 10, // 最大100ms
            // 是否自动暂停（当页面不可见时）
            autoPauseOnHidden: options.autoPauseOnHidden !== false,
            // 是否启用慢动作
            enableSlowMotion: options.enableSlowMotion || false,
            // 慢动作速度倍率
            slowMotionSpeed: options.slowMotionSpeed || 0.5,
            ...options
        };
        
        // 时间步长计算（毫秒）
        this.timeStep = 1000 / this.options.targetFPS;
        
        // 运行状态
        this.isRunning = false;
        this.isPaused = false;
        
        // 时间相关变量
        this.lastTime = 0;           // 上一帧时间戳
        this.accumulator = 0;        // 时间累积器（用于固定步长）
        this.deltaTime = 0;          // 上一帧实际时间差
        this.fixedDeltaTime = this.timeStep; // 固定时间步长
        
        // 时间缩放（用于慢动作/快动作）
        this.timeScale = 1.0;
        
        // 动画帧请求ID
        this.rafId = null;
        
        // 性能统计
        this.stats = {
            frameCount: 0,           // 总帧数
            updateCount: 0,          // 总更新次数
            lastFpsUpdate: 0,        // 上次FPS更新时间
            fps: 0,                  // 当前FPS
            averageDeltaTime: 0,     // 平均时间差
            deltaTimeHistory: []     // 时间差历史（用于计算平均值）
        };
        
        // FPS计算相关
        this.fpsUpdateInterval = 500; // FPS更新间隔（毫秒）
        this.deltaTimeHistorySize = 60; // 历史记录大小
        
        // 回调函数
        this.onUpdate = null;       // 更新回调
        this.onRender = null;       // 渲染回调
        this.onPause = null;        // 暂停回调
        this.onResume = null;       // 恢复回调
        
        // 绑定this到方法
        this.tick = this.tick.bind(this);
        this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
        
        // 注册页面可见性变化监听
        if (this.options.autoPauseOnHidden) {
            this._setupVisibilityListener();
        }
    }

    /**
     * 启动游戏循环
     * @returns {boolean} 是否成功启动
     */
    start() {
        if (this.isRunning) {
            console.warn('[GameLoop] 游戏循环已经在运行中');
            return false;
        }
        
        console.log('[GameLoop] 启动游戏循环');
        
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        this.stats.lastFpsUpdate = this.lastTime;
        
        // 开始循环
        this.rafId = requestAnimationFrame(this.tick);
        
        return true;
    }

    /**
     * 停止游戏循环
     * @returns {boolean} 是否成功停止
     */
    stop() {
        if (!this.isRunning) {
            console.warn('[GameLoop] 游戏循环未运行');
            return false;
        }
        
        console.log('[GameLoop] 停止游戏循环');
        
        this.isRunning = false;
        this.isPaused = false;
        
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        
        return true;
    }

    /**
     * 暂停游戏循环
     * @returns {boolean} 是否成功暂停
     */
    pause() {
        if (!this.isRunning || this.isPaused) {
            return false;
        }
        
        console.log('[GameLoop] 暂停游戏循环');
        
        this.isPaused = true;
        
        if (this.onPause) {
            this.onPause();
        }
        
        return true;
    }

    /**
     * 恢复游戏循环
     * @returns {boolean} 是否成功恢复
     */
    resume() {
        if (!this.isRunning || !this.isPaused) {
            return false;
        }
        
        console.log('[GameLoop] 恢复游戏循环');
        
        this.isPaused = false;
        this.lastTime = performance.now(); // 重置时间防止大跳变
        
        if (this.onResume) {
            this.onResume();
        }
        
        return true;
    }

    /**
     * 切换暂停状态
     * @returns {boolean} 当前是否暂停
     */
    togglePause() {
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
        return this.isPaused;
    }

    /**
     * 游戏循环主函数
     * @param {number} currentTime - 当前时间戳（由requestAnimationFrame提供）
     */
    tick(currentTime) {
        // 如果停止运行，不再请求下一帧
        if (!this.isRunning) {
            return;
        }
        
        // 请求下一帧（确保即使出错也能继续）
        this.rafId = requestAnimationFrame(this.tick);
        
        // 如果暂停，跳过更新但继续渲染
        if (this.isPaused) {
            if (this.onRender) {
                this.onRender(0);
            }
            return;
        }
        
        // 计算时间差
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // 限制最大时间步长（防止卡顿导致跳帧过多）
        if (this.deltaTime > this.options.maxDeltaTime) {
            this.deltaTime = this.options.maxDeltaTime;
        }
        
        // 更新时间统计
        this._updateStats();
        
        // 应用时间缩放
        const scaledDeltaTime = this.deltaTime * this.timeScale;
        
        // 更新游戏逻辑
        if (this.options.useFixedTimeStep) {
            // 固定时间步长更新
            this._fixedUpdate(scaledDeltaTime);
        } else {
            // 可变时间步长更新
            this._variableUpdate(scaledDeltaTime);
        }
        
        // 渲染
        if (this.onRender) {
            this.onRender(this.deltaTime);
        }
        
        this.stats.frameCount++;
    }

    /**
     * 固定时间步长更新
     * @private
     * @param {number} deltaTime - 时间差
     */
    _fixedUpdate(deltaTime) {
        // 累积时间
        this.accumulator += deltaTime;
        
        // 以固定步长执行更新
        while (this.accumulator >= this.fixedDeltaTime) {
            // 调用游戏更新
            if (this.game && typeof this.game.update === 'function') {
                this.game.update(this.fixedDeltaTime);
            }
            
            // 调用更新回调
            if (this.onUpdate) {
                this.onUpdate(this.fixedDeltaTime);
            }
            
            this.accumulator -= this.fixedDeltaTime;
            this.stats.updateCount++;
        }
    }

    /**
     * 可变时间步长更新
     * @private
     * @param {number} deltaTime - 时间差
     */
    _variableUpdate(deltaTime) {
        // 直接调用游戏更新
        if (this.game && typeof this.game.update === 'function') {
            this.game.update(deltaTime);
        }
        
        // 调用更新回调
        if (this.onUpdate) {
            this.onUpdate(deltaTime);
        }
        
        this.stats.updateCount++;
    }

    /**
     * 更新性能统计
     * @private
     */
    _updateStats() {
        const now = performance.now();
        
        // 更新FPS
        if (now - this.stats.lastFpsUpdate >= this.fpsUpdateInterval) {
            const elapsed = now - this.stats.lastFpsUpdate;
            this.stats.fps = Math.round((this.stats.frameCount / elapsed) * 1000);
            this.stats.lastFpsUpdate = now;
            this.stats.frameCount = 0;
        }
        
        // 更新平均时间差
        this.stats.deltaTimeHistory.push(this.deltaTime);
        if (this.stats.deltaTimeHistory.length > this.deltaTimeHistorySize) {
            this.stats.deltaTimeHistory.shift();
        }
        
        const sum = this.stats.deltaTimeHistory.reduce((a, b) => a + b, 0);
        this.stats.averageDeltaTime = sum / this.stats.deltaTimeHistory.length;
    }

    /**
     * 设置时间缩放
     * @param {number} scale - 时间缩放倍率（1.0为正常，0.5为慢动作，2.0为快动作）
     */
    setTimeScale(scale) {
        if (scale < 0) {
            console.warn('[GameLoop] 时间缩放不能为负数');
            return;
        }
        this.timeScale = scale;
        console.log(`[GameLoop] 时间缩放设置为: ${scale}x`);
    }

    /**
     * 获取当前时间缩放
     * @returns {number} 时间缩放倍率
     */
    getTimeScale() {
        return this.timeScale;
    }

    /**
     * 启用慢动作
     * @param {number} speed - 慢动作速度（默认0.5）
     */
    enableSlowMotion(speed = 0.5) {
        this.setTimeScale(speed);
        console.log(`[GameLoop] 慢动作模式: ${speed}x`);
    }

    /**
     * 禁用慢动作
     */
    disableSlowMotion() {
        this.setTimeScale(1.0);
        console.log('[GameLoop] 慢动作模式已关闭');
    }

    /**
     * 设置目标帧率
     * @param {number} fps - 目标帧率
     */
    setTargetFPS(fps) {
        if (fps < 1 || fps > 240) {
            console.warn('[GameLoop] 目标帧率必须在1-240之间');
            return;
        }
        this.options.targetFPS = fps;
        this.timeStep = 1000 / fps;
        this.fixedDeltaTime = this.timeStep;
        console.log(`[GameLoop] 目标帧率设置为: ${fps} FPS`);
    }

    /**
     * 获取性能统计
     * @returns {Object} 性能统计信息
     */
    getStats() {
        return {
            fps: this.stats.fps,
            averageDeltaTime: Math.round(this.stats.averageDeltaTime * 100) / 100,
            totalUpdates: this.stats.updateCount,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            timeScale: this.timeScale
        };
    }

    /**
     * 重置性能统计
     */
    resetStats() {
        this.stats = {
            frameCount: 0,
            updateCount: 0,
            lastFpsUpdate: performance.now(),
            fps: 0,
            averageDeltaTime: 0,
            deltaTimeHistory: []
        };
    }

    /**
     * 设置更新回调
     * @param {Function} callback - 更新回调函数，参数为deltaTime
     */
    setUpdateCallback(callback) {
        if (typeof callback === 'function') {
            this.onUpdate = callback;
        }
    }

    /**
     * 设置渲染回调
     * @param {Function} callback - 渲染回调函数，参数为deltaTime
     */
    setRenderCallback(callback) {
        if (typeof callback === 'function') {
            this.onRender = callback;
        }
    }

    /**
     * 设置暂停回调
     * @param {Function} callback - 暂停回调函数
     */
    setPauseCallback(callback) {
        if (typeof callback === 'function') {
            this.onPause = callback;
        }
    }

    /**
     * 设置恢复回调
     * @param {Function} callback - 恢复回调函数
     */
    setResumeCallback(callback) {
        if (typeof callback === 'function') {
            this.onResume = callback;
        }
    }

    /**
     * 设置页面可见性变化监听
     * @private
     */
    _setupVisibilityListener() {
        document.addEventListener('visibilitychange', this._handleVisibilityChange);
    }

    /**
     * 处理页面可见性变化
     * @private
     */
    _handleVisibilityChange() {
        if (document.hidden) {
            // 页面隐藏时暂停
            if (this.isRunning && !this.isPaused) {
                console.log('[GameLoop] 页面隐藏，自动暂停');
                this.pause();
                this._wasPausedByVisibility = true;
            }
        } else {
            // 页面显示时恢复
            if (this._wasPausedByVisibility) {
                console.log('[GameLoop] 页面显示，自动恢复');
                this.resume();
                this._wasPausedByVisibility = false;
            }
        }
    }

    /**
     * 销毁游戏循环
     * 清理所有资源和监听器
     */
    destroy() {
        this.stop();
        
        // 移除页面可见性监听
        document.removeEventListener('visibilitychange', this._handleVisibilityChange);
        
        // 清理回调
        this.onUpdate = null;
        this.onRender = null;
        this.onPause = null;
        this.onResume = null;
        
        // 清理引用
        this.game = null;
        
        console.log('[GameLoop] 游戏循环已销毁');
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameLoop;
}
