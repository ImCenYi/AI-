/**
 * UI管理器类
 * 负责游戏界面的更新和事件绑定
 * @file js/rendering/UIManager.js
 */

class UIManager {
    /**
     * 创建UI管理器实例
     * @param {Object} game - 游戏主对象
     */
    constructor(game) {
        this.game = game;
        
        // DOM元素引用
        this.elements = {};
        
        // Canvas渲染器引用
        this.canvasRenderer = null;
        
        // 事件回调函数存储
        this.eventHandlers = {};
        
        // 初始化
        this.bindElements();
        this.bindEvents();
    }

    /**
     * 绑定DOM元素引用
     */
    bindElements() {
        // 顶部统计栏元素
        this.elements.goldDisplay = document.getElementById('gold-display');
        this.elements.dpsDisplay = document.getElementById('dps-display');
        this.elements.zoneDisplay = document.getElementById('zone-display');
        this.elements.clickDamageDisplay = document.getElementById('click-damage-display');
        
        // 怪物区域元素
        this.elements.monsterCanvas = document.getElementById('monster-canvas');
        this.elements.monsterName = document.getElementById('monster-name');
        this.elements.monsterLevel = document.getElementById('monster-level');
        
        // 英雄列表面板
        this.elements.heroList = document.getElementById('hero-list');
        
        // 升级详情面板
        this.elements.upgradePanel = document.getElementById('upgrade-panel');
        this.elements.selectedHeroName = document.getElementById('selected-hero-name');
        this.elements.selectedHeroLevel = document.getElementById('selected-hero-level');
        this.elements.selectedHeroDPS = document.getElementById('selected-hero-dps');
        this.elements.upgradeCost = document.getElementById('upgrade-cost');
        this.elements.buyButton = document.getElementById('buy-button');
        
        // 游戏控制按钮
        this.elements.settingsButton = document.getElementById('settings-button');
        this.elements.achievementsButton = document.getElementById('achievements-button');
        
        // 模态框元素
        this.elements.modal = document.getElementById('modal');
        this.elements.modalTitle = document.getElementById('modal-title');
        this.elements.modalContent = document.getElementById('modal-content');
        this.elements.modalClose = document.getElementById('modal-close');
    }

    /**
     * 绑定事件处理器
     */
    bindEvents() {
        // Canvas点击事件 - 攻击怪物
        if (this.elements.monsterCanvas) {
            this.elements.monsterCanvas.addEventListener('click', (e) => {
                this.handleMonsterClick(e);
            });
            
            // 鼠标悬停效果
            this.elements.monsterCanvas.addEventListener('mousemove', (e) => {
                this.handleMonsterHover(e);
            });
            
            this.elements.monsterCanvas.addEventListener('mouseleave', () => {
                this.elements.monsterCanvas.style.cursor = 'default';
            });
        }
        
        // 设置按钮
        if (this.elements.settingsButton) {
            this.elements.settingsButton.addEventListener('click', () => {
                this.showSettingsModal();
            });
        }
        
        // 成就按钮
        if (this.elements.achievementsButton) {
            this.elements.achievementsButton.addEventListener('click', () => {
                this.showAchievementsModal();
            });
        }
        
        // 模态框关闭按钮
        if (this.elements.modalClose) {
            this.elements.modalClose.addEventListener('click', () => {
                this.closeModal();
            });
        }
        
        // 点击模态框背景关闭
        if (this.elements.modal) {
            this.elements.modal.addEventListener('click', (e) => {
                if (e.target === this.elements.modal) {
                    this.closeModal();
                }
            });
        }
        
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    /**
     * 设置Canvas渲染器
     * @param {CanvasRenderer} renderer - Canvas渲染器实例
     */
    setCanvasRenderer(renderer) {
        this.canvasRenderer = renderer;
    }

    /**
     * 处理怪物点击事件
     * @param {MouseEvent} e - 鼠标事件
     */
    handleMonsterClick(e) {
        if (!this.game) return;
        
        const rect = this.elements.monsterCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 调用游戏的点击攻击方法
        if (this.game.onMonsterClick) {
            const damage = this.game.onMonsterClick();
            
            // 显示伤害数字
            if (this.canvasRenderer && damage > 0) {
                const isCrit = Math.random() < 0.1; // 10%暴击率
                const finalDamage = isCrit ? damage * 2 : damage;
                this.canvasRenderer.spawnDamageNumber(finalDamage, x, y, isCrit);
                this.canvasRenderer.onMonsterClick(x, y);
            }
        }
    }

    /**
     * 处理怪物悬停事件
     * @param {MouseEvent} e - 鼠标事件
     */
    handleMonsterHover(e) {
        const rect = this.elements.monsterCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 计算是否在怪物区域内（简化判断）
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        
        if (distance < 80) {
            this.elements.monsterCanvas.style.cursor = 'crosshair';
        } else {
            this.elements.monsterCanvas.style.cursor = 'default';
        }
    }

    /**
     * 更新金币显示
     * @param {number} gold - 当前金币数量
     */
    updateGold(gold) {
        if (this.elements.goldDisplay) {
            this.elements.goldDisplay.textContent = this.formatNumber(gold);

            // 添加金币增加动画效果
            this.elements.goldDisplay.classList.add('gold-update');
            setTimeout(() => {
                this.elements.goldDisplay.classList.remove('gold-update');
            }, 200);
        }

        // 金币变化时刷新英雄列表（更新按钮可用状态）
        if (this.game && this.game.heroes) {
            this.updateHeroList(this.game.heroes);
        }
    }

    /**
     * 更新DPS显示
     * @param {number} dps - 当前每秒伤害
     */
    updateDPS(dps) {
        if (this.elements.dpsDisplay) {
            this.elements.dpsDisplay.textContent = this.formatNumber(dps) + '/秒';
        }
    }

    /**
     * 更新区域显示
     * @param {number} zone - 当前区域编号
     */
    updateZone(zone) {
        if (this.elements.zoneDisplay) {
            this.elements.zoneDisplay.textContent = '区域 ' + zone;
        }
    }

    /**
     * 更新点击伤害显示
     * @param {number} damage - 当前点击伤害
     */
    updateClickDamage(damage) {
        if (this.elements.clickDamageDisplay) {
            this.elements.clickDamageDisplay.textContent = this.formatNumber(damage);
        }
    }

    /**
     * 更新怪物信息
     * @param {Object} monster - 怪物对象
     */
    updateMonsterInfo(monster) {
        if (this.elements.monsterName && monster) {
            this.elements.monsterName.textContent = monster.name || '未知怪物';
        }
        if (this.elements.monsterLevel && monster) {
            this.elements.monsterLevel.textContent = 'Lv.' + (monster.level || 1);
        }
    }

    /**
     * 更新怪物HP显示
     * @param {number} hp - 当前HP
     * @param {number} maxHP - 最大HP
     */
    updateMonsterHP(hp, maxHP) {
        // HP条由CanvasRenderer绘制，这里可以添加额外的UI更新
        if (hp <= 0 && this.canvasRenderer) {
            this.canvasRenderer.onMonsterDeath();
        }
    }

    /**
     * 更新英雄列表
     * @param {Array} heroes - 英雄数组
     */
    updateHeroList(heroes) {
        if (!this.elements.heroList) return;
        
        this.elements.heroList.innerHTML = '';
        
        heroes.forEach((hero, index) => {
            const heroCard = this.createHeroCard(hero, index);
            this.elements.heroList.appendChild(heroCard);
        });
    }

    /**
     * 创建英雄卡片元素
     * @param {Object} hero - 英雄数据
     * @param {number} index - 英雄索引
     * @returns {HTMLElement} 英雄卡片元素
     */
    createHeroCard(hero, index) {
        const card = document.createElement('div');
        card.className = 'hero-card';
        card.dataset.heroId = hero.id;
        
        // 判断是否可购买
        const canAfford = this.game && this.game.gold >= hero.cost;
        if (canAfford) {
            card.classList.add('can-afford');
        }
        
        // 英雄图标
        const icon = document.createElement('div');
        icon.className = 'hero-icon';
        icon.style.backgroundColor = this.getHeroColor(index);
        icon.textContent = hero.name.charAt(0);
        
        // 英雄信息
        const info = document.createElement('div');
        info.className = 'hero-info';
        
        const name = document.createElement('div');
        name.className = 'hero-name';
        name.textContent = hero.name;
        
        const level = document.createElement('div');
        level.className = 'hero-level';
        level.textContent = `等级 ${hero.level}`;
        
        const dps = document.createElement('div');
        dps.className = 'hero-dps';
        dps.textContent = `DPS: ${this.formatNumber(hero.currentDPS || 0)}`;
        
        info.appendChild(name);
        info.appendChild(level);
        info.appendChild(dps);
        
        // 购买按钮
        const buyBtn = document.createElement('button');
        buyBtn.className = 'hero-buy-btn';
        buyBtn.textContent = this.formatNumber(hero.cost);
        buyBtn.disabled = !canAfford;
        buyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.onHeroBuyClick(hero.id);
        });
        
        card.appendChild(icon);
        card.appendChild(info);
        card.appendChild(buyBtn);
        
        // 点击卡片显示详情
        card.addEventListener('click', () => {
            this.showHeroDetails(hero);
        });
        
        return card;
    }

    /**
     * 处理英雄购买点击
     * @param {string} heroId - 英雄ID
     */
    onHeroBuyClick(heroId) {
        if (this.game && this.game.buyHero) {
            const result = this.game.buyHero(heroId);
            if (result.success) {
                this.showNotification('购买成功！', 'success');
                // 刷新英雄列表以更新按钮状态
                this.updateHeroList(this.game.heroes);
            } else {
                this.showNotification(result.error || '金币不足！', 'error');
            }
        }
    }

    /**
     * 显示英雄详情
     * @param {Object} hero - 英雄数据
     */
    showHeroDetails(hero) {
        if (!this.elements.upgradePanel) return;
        
        this.elements.selectedHeroName.textContent = hero.name;
        this.elements.selectedHeroLevel.textContent = `当前等级: ${hero.level}`;
        this.elements.selectedHeroDPS.textContent = `当前DPS: ${this.formatNumber(hero.currentDPS || 0)}`;
        this.elements.upgradeCost.textContent = `升级成本: ${this.formatNumber(hero.cost)}`;
        
        // 更新购买按钮状态
        const canAfford = this.game && this.game.gold >= hero.cost;
        this.elements.buyButton.disabled = !canAfford;
        this.elements.buyButton.onclick = () => {
            this.onHeroBuyClick(hero.id);
        };
        
        // 高亮选中的英雄卡片
        document.querySelectorAll('.hero-card').forEach(card => {
            card.classList.remove('selected');
            if (card.dataset.heroId === hero.id) {
                card.classList.add('selected');
            }
        });
    }

    /**
     * 显示伤害数字
     * @param {number} damage - 伤害值
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {boolean} isCrit - 是否为暴击
     */
    showDamageNumber(damage, x, y, isCrit = false) {
        if (this.canvasRenderer) {
            this.canvasRenderer.spawnDamageNumber(damage, x, y, isCrit);
        }
    }

    /**
     * 显示通知消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 (success/error/warning/info)
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 动画显示
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // 自动消失
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }

    /**
     * 显示设置模态框
     */
    showSettingsModal() {
        this.elements.modalTitle.textContent = '游戏设置';
        this.elements.modalContent.innerHTML = `
            <div class="settings-section">
                <h3>音频设置</h3>
                <label class="setting-item">
                    <span>背景音乐</span>
                    <input type="checkbox" id="bgm-toggle" checked>
                </label>
                <label class="setting-item">
                    <span>音效</span>
                    <input type="checkbox" id="sfx-toggle" checked>
                </label>
            </div>
            <div class="settings-section">
                <h3>游戏设置</h3>
                <label class="setting-item">
                    <span>显示伤害数字</span>
                    <input type="checkbox" id="damage-numbers-toggle" checked>
                </label>
                <label class="setting-item">
                    <span>粒子效果</span>
                    <input type="checkbox" id="particles-toggle" checked>
                </label>
            </div>
            <div class="settings-section">
                <h3>数据管理</h3>
                <button class="btn btn-danger" id="reset-game-btn">重置游戏</button>
                <button class="btn btn-primary" id="export-save-btn">导出存档</button>
            </div>
        `;
        this.elements.modal.classList.add('show');
    }

    /**
     * 显示成就模态框
     */
    showAchievementsModal() {
        this.elements.modalTitle.textContent = '成就';
        this.elements.modalContent.innerHTML = `
            <div class="achievements-list">
                <div class="achievement-item locked">
                    <div class="achievement-icon">🏆</div>
                    <div class="achievement-info">
                        <div class="achievement-name">初出茅庐</div>
                        <div class="achievement-desc">击败第一个怪物</div>
                    </div>
                </div>
                <div class="achievement-item locked">
                    <div class="achievement-icon">💰</div>
                    <div class="achievement-info">
                        <div class="achievement-name">小富翁</div>
                        <div class="achievement-desc">累计获得1000金币</div>
                    </div>
                </div>
                <div class="achievement-item locked">
                    <div class="achievement-icon">⚔️</div>
                    <div class="achievement-info">
                        <div class="achievement-name">英雄集结</div>
                        <div class="achievement-desc">雇佣5个英雄</div>
                    </div>
                </div>
                <div class="achievement-item locked">
                    <div class="achievement-icon">🌟</div>
                    <div class="achievement-info">
                        <div class="achievement-name">区域征服者</div>
                        <div class="achievement-desc">到达第10区域</div>
                    </div>
                </div>
            </div>
        `;
        this.elements.modal.classList.add('show');
    }

    /**
     * 关闭模态框
     */
    closeModal() {
        if (this.elements.modal) {
            this.elements.modal.classList.remove('show');
        }
    }

    /**
     * 获取英雄颜色
     * @param {number} index - 英雄索引
     * @returns {string} 颜色值
     */
    getHeroColor(index) {
        const colors = [
            '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
            '#9b59b6', '#1abc9c', '#e91e63', '#795548'
        ];
        return colors[index % colors.length];
    }

    /**
     * 格式化数字显示
     * @param {number} num - 要格式化的数字
     * @returns {string} 格式化后的字符串
     */
    formatNumber(num) {
        if (num === undefined || num === null) return '0';
        if (num >= 1e15) return (num / 1e15).toFixed(2) + 'Q';
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return Math.floor(num).toString();
    }

    /**
     * 更新所有UI
     * 在游戏状态变化时调用
     */
    updateAll() {
        if (!this.game) return;
        
        this.updateGold(this.game.gold);
        this.updateDPS(this.game.dps);
        this.updateZone(this.game.zone);
        this.updateClickDamage(this.game.clickDamage);
        
        if (this.game.currentMonster) {
            this.updateMonsterInfo(this.game.currentMonster);
        }
        
        if (this.game.heroes) {
            this.updateHeroList(this.game.heroes);
        }
    }
}

// 导出模块（如果在模块环境中使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}
