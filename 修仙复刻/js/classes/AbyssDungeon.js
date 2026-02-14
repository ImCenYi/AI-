// 深渊战场管理类 - 独立场景版本
// BOSS战斗在单独的深渊场景中进行

class AbyssDungeon {
    constructor(game) {
        this.game = game;
        this.abyssRelic = game.abyssRelic;
        
        // BOSS状态管理
        this.bossStates = {};
        
        // 当前选中的BOSS
        this.selectedBossId = null;
        
        // 战斗状态
        this.active = false;
        
        // 初始化
        this.initBossStates();
    }
    
    /**
     * 初始化BOSS状态
     */
    initBossStates() {
        if (typeof ABYSS_BOSSES === 'undefined' || !Array.isArray(ABYSS_BOSSES)) {
            console.error('AbyssDungeon: ABYSS_BOSSES not defined!');
            return;
        }
        
        for (const boss of ABYSS_BOSSES) {
            if (boss && boss.id) {
                this.bossStates[boss.id] = {
                    isDead: false,
                    reviveAt: 0
                };
            }
        }
        
        console.log(`AbyssDungeon: ${Object.keys(this.bossStates).length} bosses initialized`);
    }
    
    /**
     * 检查BOSS挑战状态
     */
    canChallenge(bossId) {
        const boss = ABYSS_BOSSES.find(b => b.id === bossId);
        if (!boss) return { can: false, reason: 'BOSS不存在' };
        
        // 检查解锁
        if (this.game.difficulty < boss.unlockDifficulty) {
            return { can: false, reason: `N${boss.unlockDifficulty}解锁` };
        }
        
        // 检查复活时间
        const state = this.bossStates[bossId];
        const now = Date.now();
        if (state.isDead && now < state.reviveAt) {
            const remaining = Math.ceil((state.reviveAt - now) / 1000);
            return { can: false, reason: `复活倒计时 ${remaining}s` };
        }
        
        return { can: true };
    }
    
    /**
     * 选择并进入深渊战场
     */
    selectBoss(bossId) {
        const check = this.canChallenge(bossId);
        if (!check.can) {
            this.game.log('SYS', `无法挑战：${check.reason}`);
            return false;
        }
        
        this.selectedBossId = bossId;
        
        // 关闭深渊选择模态框
        this.game.closeAbyssModal();
        
        // 切换到深渊模式（独立场景）
        this.game.changeMode('abyss');
        
        return true;
    }
    
    /**
     * 开始深渊战斗
     */
    start() {
        this.active = true;
        
        if (!this.selectedBossId) {
            // 如果没有选中的BOSS，默认选第一个可挑战的
            for (const boss of ABYSS_BOSSES) {
                if (this.canChallenge(boss.id).can) {
                    this.selectedBossId = boss.id;
                    break;
                }
            }
        }
        
        if (this.selectedBossId) {
            this.spawnAbyssBoss(this.selectedBossId);
        }
    }
    
    /**
     * 停止深渊战斗
     */
    stop() {
        this.active = false;
        this.selectedBossId = null;
        this.game.enemies = [];
    }
    
    /**
     * 生成深渊BOSS
     */
    spawnAbyssBoss(bossId) {
        const bossConfig = ABYSS_BOSSES.find(b => b.id === bossId);
        if (!bossConfig) return;
        
        const A = bossConfig.unlockDifficulty;
        
        // 压缩基准：基于解锁难度
        const compressedBase = Math.pow(0.33 * A, 2);
        
        // BOSS属性：40秒击杀设计
        const bossHp = compressedBase * 40;
        const bossAtk = compressedBase * 0.1;
        
        // 创建深渊BOSS敌人
        const abyssBoss = {
            id: `abyss-boss-${bossConfig.id}`,
            name: bossConfig.name,
            emoji: bossConfig.emoji,
            isBoss: true,
            maxHp: new BigNum(bossHp),
            currentHp: new BigNum(bossHp),
            atk: new BigNum(bossAtk),
            // 深渊BOSS特殊标记
            isAbyssBoss: true,
            abyssBossId: bossConfig.id,
            color: bossConfig.color
        };
        
        this.game.enemies = [abyssBoss];
        this.game.updateCombatUI(true);
        
        this.game.log('SYS', `🌑 深渊挑战开始！对阵 ${bossConfig.name}`);
    }
    
    /**
     * 处理深渊BOSS死亡
     */
    handleAbyssBossDeath(bossEnemy) {
        if (!bossEnemy.isAbyssBoss || !bossEnemy.abyssBossId) return;
        
        const bossId = bossEnemy.abyssBossId;
        const bossConfig = ABYSS_BOSSES.find(b => b.id === bossId);
        
        // 设置复活
        this.setBossDead(bossId);
        
        // 掉落遗宝（新机制：每次3个）
        const dropResults = this.abyssRelic.dropRelic(bossId);
        if (dropResults && dropResults.length > 0) {
            // 显示掉落弹窗
            this.showDropModal(dropResults);
            // 日志记录
            dropResults.forEach(result => this.handleDrop(result));
        }
        
        this.game.log('GAIN', `✨ 击败 ${bossConfig.name}！`);
        
        // 几秒后自动返回荒野
        setTimeout(() => {
            if (this.game.mode === 'abyss') {
                this.game.changeMode('wild');
                this.game.log('SYS', '🏃 离开深渊战场，返回荒野。');
            }
        }, 3000);
        
        // 清除选中
        this.selectedBossId = null;
    }
    
    /**
     * 显示遗宝掉落弹窗
     */
    showDropModal(dropResults) {
        // 移除已有的弹窗
        const existingModal = document.getElementById('relic-drop-modal');
        if (existingModal) existingModal.remove();
        
        // 创建弹窗HTML
        const modalHtml = `
            <div id="relic-drop-modal" class="modal-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                cursor: pointer;
            ">
                <div class="relic-drop-content" style="
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border: 2px solid #fbbf24;
                    border-radius: 16px;
                    padding: 30px 40px;
                    text-align: center;
                    max-width: 600px;
                    animation: dropModalAppear 0.5s ease-out;
                " onclick="event.stopPropagation()">
                    <div style="font-size: 1.5rem; color: #fbbf24; margin-bottom: 20px; font-weight: bold;">
                        🎉 获得深渊遗宝
                    </div>
                    <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; margin: 20px 0;">
                        ${dropResults.map(result => this.renderDropItem(result)).join('')}
                    </div>
                    <div style="color: #888; font-size: 0.85rem; margin-top: 15px;">
                        点击任意位置关闭
                    </div>
                </div>
            </div>
            <style>
                @keyframes dropModalAppear {
                    0% { transform: scale(0.8); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes relicItemAppear {
                    0% { transform: scale(0) rotate(-10deg); opacity: 0; }
                    60% { transform: scale(1.1) rotate(5deg); }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
            </style>
        `;
        
        // 添加到页面
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // 点击关闭
        const modal = document.getElementById('relic-drop-modal');
        modal.addEventListener('click', () => modal.remove());
        
        // 5秒后自动关闭
        setTimeout(() => {
            if (document.getElementById('relic-drop-modal')) {
                modal.remove();
            }
        }, 5000);
    }
    
    /**
     * 渲染单个掉落物品
     */
    renderDropItem(dropResult) {
        const relic = dropResult.relic;
        const qualityConf = RELIC_QUALITIES[relic.quality];
        const attrInfo = this.abyssRelic.getRelicAttrInfo(relic);
        
        let typeLabel = '';
        let typeColor = '';
        switch(dropResult.type) {
            case 'new':
                typeLabel = '新获得';
                typeColor = '#4ade80';
                break;
            case 'upgrade':
                typeLabel = `Lv.${relic.level}`;
                typeColor = '#60a5fa';
                break;
            case 'overflow':
                typeLabel = `+${dropResult.fragments}碎片`;
                typeColor = '#a78bfa';
                break;
        }
        
        const attrDisplay = attrInfo ? 
            (attrInfo.calcType === 'multiplicative' ? 
                `×${attrInfo.value.toFixed(2)} ${attrInfo.name}` : 
                `+${attrInfo.value.toFixed(3)} ${attrInfo.name}`) : 
            '';
        
        return `
            <div class="relic-drop-item" style="
                background: linear-gradient(135deg, ${qualityConf.color}20 0%, ${qualityConf.color}05 100%);
                border: 2px solid ${qualityConf.color};
                border-radius: 12px;
                padding: 15px;
                width: 140px;
                animation: relicItemAppear 0.5s ease-out ${Math.random() * 0.3}s both;
            ">
                <div style="font-size: 2.5rem; margin-bottom: 8px;">${relic.icon}</div>
                <div style="color: ${qualityConf.color}; font-weight: bold; font-size: 0.85rem; margin-bottom: 5px;">
                    ${relic.name}
                </div>
                <div style="background: ${typeColor}30; color: ${typeColor}; font-size: 0.75rem; padding: 2px 8px; border-radius: 10px; display: inline-block; margin-bottom: 5px;">
                    ${typeLabel}
                </div>
                <div style="color: #aaa; font-size: 0.7rem;">
                    ${attrDisplay}
                </div>
            </div>
        `;
    }
    
    /**
     * 处理遗宝掉落
     */
    handleDrop(dropResult) {
        const qualityConf = RELIC_QUALITIES[dropResult.relic.quality];
        
        switch(dropResult.type) {
            case 'new':
                this.game.log('GAIN', `🎁 获得遗宝：${dropResult.relic.name}！`);
                const attrInfo = this.abyssRelic.getRelicAttrInfo(dropResult.relic);
                if (attrInfo) {
                    const valueStr = attrInfo.calcType === 'multiplicative'
                        ? `×${attrInfo.value.toFixed(2)}`
                        : `+${attrInfo.value.toFixed(2)}`;
                    this.game.log('SYS', `⭐ ${qualityConf.name} | ${attrInfo.name} ${valueStr}`);
                }
                break;
            case 'upgrade':
                this.game.log('GAIN', `⬆️ ${dropResult.relic.name} 升级至 Lv.${dropResult.relic.level}！`);
                break;
            case 'overflow':
                this.game.log('GAIN', `♻️ ${dropResult.relic.name} 已满级，获得 ${dropResult.fragments} 碎片`);
                break;
        }
        
        // 更新深渊概览
        this.game.updateAbyssOverview();
    }
    
    /**
     * 设置BOSS死亡状态
     */
    setBossDead(bossId) {
        const boss = ABYSS_BOSSES.find(b => b.id === bossId);
        if (!boss) return;
        
        this.bossStates[bossId] = {
            isDead: true,
            reviveAt: Date.now() + boss.reviveTime * 1000
        };
    }
    
    /**
     * 渲染深渊主界面（BOSS列表）
     */
    renderAbyssMain() {
        this.renderBossSelectPanel();
    }
    
    /**
     * 渲染BOSS选择面板
     */
    renderBossSelectPanel() {
        const panel = document.getElementById('boss-select-list');
        if (!panel) return;
        
        if (typeof ABYSS_BOSSES === 'undefined' || !ABYSS_BOSSES.length) {
            panel.innerHTML = '<div style="color:#f87171;padding:20px;text-align:center;">BOSS数据加载失败</div>';
            return;
        }
        
        panel.innerHTML = ABYSS_BOSSES.map(boss => {
            const state = this.bossStates[boss.id];
            const check = this.canChallenge(boss.id);
            
            const now = Date.now();
            const isReviving = state.isDead && now < state.reviveAt;
            const reviveRemaining = isReviving ? Math.ceil((state.reviveAt - now) / 1000) : 0;
            
            let statusText, statusColor, canClick, btnText;
            
            if (this.game.difficulty < boss.unlockDifficulty) {
                statusText = `🔒 N${boss.unlockDifficulty}解锁`;
                statusColor = '#666';
                canClick = false;
                btnText = '未解锁';
            } else if (isReviving) {
                statusText = `⏱️ 复活 ${reviveRemaining}s`;
                statusColor = '#fbbf24';
                canClick = false;
                btnText = '复活中';
            } else {
                statusText = '⚔️ 可挑战';
                statusColor = '#4ade80';
                canClick = true;
                btnText = '进入挑战';
            }
            
            return `
                <div class="boss-card" 
                     style="border: 2px solid ${canClick ? boss.color : '#333'}; 
                            padding: 15px; margin: 8px; border-radius: 10px; 
                            background: rgba(255,255,255,0.03);
                            opacity: ${canClick ? 1 : 0.6};">
                    <div style="font-size: 2.5rem; text-align: center; margin-bottom: 8px;">${boss.emoji}</div>
                    <div style="color: ${boss.color}; font-weight: bold; text-align: center; font-size: 1.1rem;">${boss.name}</div>
                    <div style="color: ${statusColor}; font-size: 0.85rem; text-align: center; margin-top: 8px;">${statusText}</div>
                    <div style="font-size: 0.75rem; color: #888; text-align: center; margin-top: 5px;">
                        复活时间: ${boss.reviveTime}秒 | 目标: 40秒击杀
                    </div>
                    ${canClick ? `
                        <button onclick="game.abyssDungeon.selectBoss('${boss.id}')" 
                                style="display: block; width: 100%; margin-top: 10px; padding: 8px; 
                                       background: ${boss.color}; color: white; border: none; 
                                       border-radius: 5px; cursor: pointer; font-weight: bold;">
                            ${btnText}
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');
    }
    
    /**
     * 获取所有BOSS状态
     */
    getAllBossStatus() {
        if (typeof ABYSS_BOSSES === 'undefined') return [];
        
        return ABYSS_BOSSES.map(boss => {
            const state = this.bossStates[boss.id];
            const check = this.canChallenge(boss.id);
            
            return {
                ...boss,
                isUnlocked: this.game.difficulty >= boss.unlockDifficulty,
                canChallenge: check.can,
                reason: check.reason,
                isDead: state.isDead && Date.now() < state.reviveAt,
                reviveRemaining: state.isDead ? Math.ceil((state.reviveAt - Date.now()) / 1000) : 0
            };
        });
    }
    
    /**
     * 更新BOSS状态（检查复活）
     */
    update() {
        let changed = false;
        for (const bossId in this.bossStates) {
            const state = this.bossStates[bossId];
            if (state.isDead && Date.now() >= state.reviveAt) {
                state.isDead = false;
                changed = true;
            }
        }
        
        if (changed && this.game.isAbyssModalOpen) {
            this.renderAbyssMain();
        }
    }
    
    // ==================== 遗宝图鉴功能（5列布局） ====================
    
    showRelicCollection() {
        const modal = document.getElementById('abyss-codex-modal');
        if (!modal) return;
        
        modal.style.display = 'flex';
        this.renderAllBossRelics();
    }
    
    /**
     * 渲染所有BOSS的遗宝（5列布局）
     */
    renderAllBossRelics() {
        const container = document.getElementById('relic-codex-container');
        if (!container) return;
        
        if (!ABYSS_BOSSES?.length || !ABYSS_RELIC_POOLS) {
            container.innerHTML = '<div style="color:#f87171;grid-column:1/-1;text-align:center;">数据加载失败</div>';
            return;
        }
        
        // 渲染总体进度
        this.renderTotalProgress();
        
        // 渲染5列
        container.innerHTML = ABYSS_BOSSES.map(boss => this.renderBossColumn(boss)).join('');
    }
    
    /**
     * 渲染单个BOSS列
     */
    renderBossColumn(boss) {
        const pool = ABYSS_RELIC_POOLS[boss.id];
        if (!pool) return '';
        
        const progress = this.abyssRelic.getBossCollectionProgress(boss.id);
        const fragments = this.abyssRelic.fragments[boss.id] || 0;
        
        // 按品质分组显示（UR/SSR/SR/R/N）
        const qualityOrder = ['UR', 'SSR', 'SR', 'R', 'N'];
        
        return `
            <div class="boss-relic-column" style="
                background: rgba(0,0,0,0.3);
                border-radius: 10px;
                border: 1px solid #333;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            ">
                <!-- BOSS头部 -->
                <div style="
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    padding: 10px;
                    text-align: center;
                    border-bottom: 2px solid #444;
                ">
                    <div style="font-size: 1.5rem; margin-bottom: 3px;">${boss.emoji}</div>
                    <div style="color: #fbbf24; font-weight: bold; font-size: 0.85rem;">${boss.name}</div>
                    <div style="color: #888; font-size: 0.7rem; margin-top: 3px;">
                        ${progress.collected}/${progress.total} (${progress.percentage}%)
                    </div>
                    <div style="color: #a78bfa; font-size: 0.75rem; margin-top: 5px;">
                        🧩 ${fragments} 碎片
                    </div>
                </div>
                
                <!-- 遗宝列表 -->
                <div style="flex:1; padding: 8px; overflow-y:auto; display:flex; flex-direction:column; gap:6px;">
                    ${qualityOrder.map(quality => {
                        const qualityRelics = pool.filter(r => r.quality === quality);
                        if (qualityRelics.length === 0) return '';
                        
                        const qualityConf = RELIC_QUALITIES[quality];
                        return `
                            <div style="margin-bottom: 4px;">
                                <div style="color: ${qualityConf.color}; font-size: 0.7rem; font-weight: bold; 
                                            border-bottom: 1px solid ${qualityConf.color}40; padding-bottom: 2px; margin-bottom: 4px;">
                                    ${quality} (${qualityRelics.length})
                                </div>
                                <div style="display:flex; flex-direction:column; gap:4px;">
                                    ${qualityRelics.map(relic => this.renderRelicItem(relic, boss.id)).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <!-- 兑换按钮 -->
                <div style="padding: 8px; border-top: 1px solid #333; background: rgba(0,0,0,0.2);">
                    <button onclick="game.abyssDungeon.showExchangeModal('${boss.id}')" 
                            style="width:100%; padding:6px; background:#8b5cf6; color:#fff; border:none; 
                                   border-radius:5px; cursor:pointer; font-size:0.8rem;">
                        🔮 兑换遗宝
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * 渲染单个遗宝项（小尺寸）
     */
    renderRelicItem(relic, bossId) {
        const owned = this.abyssRelic.collectedRelics[relic.id];
        const qualityConf = RELIC_QUALITIES?.[relic.quality];
        const attrType = RELIC_ATTR_TYPES?.find(t => t.id === relic.attrType);
        
        let attrDisplay = '';
        if (owned) {
            const attrInfo = this.abyssRelic.getRelicAttrInfo(owned);
            if (attrInfo) {
                const prefix = attrInfo.calcType === 'multiplicative' ? '×' : '+';
                attrDisplay = `${prefix}${attrInfo.value.toFixed(2)}`;
            }
        } else if (attrType) {
            const baseValue = RELIC_BASE_VALUES?.[relic.attrType] || 0;
            const qualityMult = qualityConf?.multiplier || 1;
            const perLevelValue = baseValue * qualityMult;
            const prefix = attrType.calcType === 'multiplicative' ? '×' : '+';
            attrDisplay = `${prefix}${perLevelValue.toFixed(2)}/级`;
        }
        
        return `
            <div class="relic-item ${owned ? 'owned' : ''}" 
                 onclick="game.abyssDungeon.showRelicDetail('${relic.id}', '${bossId}')"
                 style="
                    border: 1px solid ${qualityConf?.color || '#666'}; 
                    ${owned ? `background: ${qualityConf?.color}15` : 'background: rgba(0,0,0,0.2); opacity: 0.5'};
                    padding: 6px 8px;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                 "
                 onmouseover="this.style.transform='translateX(3px)'; this.style.opacity='1';"
                 onmouseout="this.style.transform='translateX(0)'; ${owned ? '' : 'this.style.opacity=\'0.5\''}">
                <div style="font-size: 1.5rem;">${relic.icon}</div>
                <div style="flex:1; min-width:0;">
                    <div style="color: ${qualityConf?.color || '#888'}; font-size: 0.7rem; font-weight: bold; 
                                white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                        ${relic.name}
                    </div>
                    <div style="font-size: 0.6rem; color: #888;">
                        ${owned ? `Lv.${owned.level} ${attrDisplay}` : attrDisplay}
                    </div>
                </div>
                ${owned ? '<div style="color:#4ade80; font-size:0.7rem;">✓</div>' : ''}
            </div>
        `;
    }
    
    /**
     * 渲染总体收集进度
     */
    renderTotalProgress() {
        const progressEl = document.getElementById('collection-progress');
        if (!progressEl) return;
        
        const totalProgress = this.abyssRelic.getTotalProgress();
        const totalFragments = Object.values(this.abyssRelic.fragments).reduce((a, b) => a + b, 0);
        
        progressEl.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="color: #fbbf24; font-size: 1rem; font-weight: bold;">
                    📚 总体收集: ${totalProgress.collected}/${totalProgress.total} (${totalProgress.percentage}%)
                </div>
                <div style="color: #a78bfa; font-size: 0.9rem;">
                    🧩 总碎片: ${totalFragments}
                </div>
            </div>
            <div style="color: #888; font-size: 0.75rem; margin-top: 5px;">
                每个BOSS的碎片只能兑换该BOSS的遗宝 | 点击遗宝查看详情
            </div>
        `;
    }
    
    /**
     * 显示兑换弹窗
     */
    showExchangeModal(bossId) {
        const pool = ABYSS_RELIC_POOLS[bossId];
        const boss = ABYSS_BOSSES.find(b => b.id === bossId);
        const fragments = this.abyssRelic.fragments[bossId] || 0;
        
        if (!pool || !boss) return;
        
        // 获取未拥有的遗宝
        const unownedRelics = pool.filter(r => !this.abyssRelic.collectedRelics[r.id]);
        
        if (unownedRelics.length === 0) {
            alert(`${boss.name}的遗宝已收集齐！`);
            return;
        }
        
        // 创建兑换弹窗
        const modalHtml = `
            <div id="relic-exchange-modal" class="modal-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 12000;
                cursor: pointer;
            " onclick="this.remove()">
                <div style="
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border: 2px solid #8b5cf6;
                    border-radius: 16px;
                    padding: 25px;
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                    cursor: default;
                " onclick="event.stopPropagation()">
                    <div style="font-size: 2rem; margin-bottom: 10px;">${boss.emoji}</div>
                    <div style="color: #fbbf24; font-size: 1.2rem; font-weight: bold; margin-bottom: 5px;">
                        兑换 ${boss.name} 遗宝
                    </div>
                    <div style="color: #a78bfa; font-size: 1rem; margin-bottom: 15px;">
                        🧩 拥有碎片: ${fragments}
                    </div>
                    
                    <div style="max-height: 300px; overflow-y: auto; margin-bottom: 15px;">
                        ${unownedRelics.map(relic => {
                            const qualityConf = RELIC_QUALITIES[relic.quality];
                            const cost = qualityConf?.exchangeCost || 100;
                            const canAfford = fragments >= cost;
                            return `
                                <div onclick="game.abyssDungeon.exchangeRelic('${relic.id}', '${bossId}')"
                                     style="
                                        display: flex;
                                        align-items: center;
                                        gap: 10px;
                                        padding: 10px;
                                        margin-bottom: 8px;
                                        background: ${canAfford ? 'rgba(139,92,246,0.2)' : 'rgba(100,100,100,0.2)'};
                                        border: 1px solid ${canAfford ? qualityConf.color : '#666'};
                                        border-radius: 8px;
                                        cursor: ${canAfford ? 'pointer' : 'not-allowed'};
                                        opacity: ${canAfford ? 1 : 0.5};
                                     ">
                                    <div style="font-size: 1.8rem;">${relic.icon}</div>
                                    <div style="flex:1; text-align: left;">
                                        <div style="color: ${qualityConf.color}; font-weight: bold; font-size: 0.85rem;">
                                            ${relic.name}
                                        </div>
                                        <div style="color: #888; font-size: 0.7rem;">
                                            需要 ${cost} 碎片
                                        </div>
                                    </div>
                                    ${canAfford ? '<div style="color:#4ade80;">可兑换</div>' : '<div style="color:#666;">不足</div>'}
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    <button onclick="document.getElementById('relic-exchange-modal').remove()" 
                            style="padding: 8px 25px; background: #666; color: #fff; border: none; border-radius: 6px; cursor: pointer;">
                        关闭
                    </button>
                </div>
            </div>
        `;
        
        // 移除已有的弹窗
        const existingModal = document.getElementById('relic-exchange-modal');
        if (existingModal) existingModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
    
    /**
     * 兑换遗宝
     */
    exchangeRelic(relicId, bossId) {
        const result = this.abyssRelic.exchangeRelic(relicId);
        
        if (result.success) {
            this.game.log('GAIN', `兑换成功: ${result.relic.name}`);
            this.game.updateAbyssOverview();
            this.renderAllBossRelics(); // 刷新图鉴
            document.getElementById('relic-exchange-modal')?.remove();
        } else {
            alert(result.message);
        }
    }
    
    /**
     * 显示遗宝详情弹窗
     */
    showRelicDetail(relicId, bossId) {
        const pool = ABYSS_RELIC_POOLS?.[bossId];
        if (!pool) return;
        
        const relicConfig = pool.find(r => r.id === relicId);
        if (!relicConfig) return;
        
        const owned = this.abyssRelic.collectedRelics[relicId];
        const qualityConf = RELIC_QUALITIES?.[relicConfig.quality];
        const attrType = RELIC_ATTR_TYPES?.find(t => t.id === relicConfig.attrType);
        
        // 计算属性信息
        const baseValue = RELIC_BASE_VALUES?.[relicConfig.attrType] || 0.02;
        const qualityMult = qualityConf?.multiplier || 1;
        const perLevelValue = baseValue * qualityMult;
        const maxLevel = qualityConf?.maxLevel || 1;
        
        // 当前属性值
        let currentValue = perLevelValue;
        let currentLevel = 0;
        if (owned) {
            currentLevel = owned.level;
            const attrInfo = this.abyssRelic.getRelicAttrInfo(owned);
            if (attrInfo) {
                currentValue = attrInfo.value;
            }
        }
        
        // 满级属性值
        const maxValue = perLevelValue * maxLevel;
        
        // 计算类型标识
        const isMultiplicative = attrType?.calcType === 'multiplicative';
        const prefix = isMultiplicative ? '×' : '+';
        const calcTypeText = isMultiplicative ? '乘算（指数级）' : '加算（线性）';
        const calcTypeColor = isMultiplicative ? '#ef4444' : '#f59f0b';
        
        // 进度百分比
        const progressPct = owned ? Math.min(100, (currentLevel / maxLevel) * 100) : 0;
        
        // 创建弹窗HTML
        const modalHtml = `
            <div id="relic-detail-modal" class="modal-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 11000;
                cursor: pointer;
            " onclick="this.remove()">
                <div style="
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border: 3px solid ${qualityConf?.color || '#666'};
                    border-radius: 16px;
                    padding: 25px 30px;
                    text-align: center;
                    max-width: 380px;
                    width: 90%;
                    animation: relicDetailAppear 0.3s ease-out;
                    cursor: default;
                " onclick="event.stopPropagation()">
                    <!-- 头部：图标和名称 -->
                    <div style="margin-bottom: 15px;">
                        <div style="font-size: 4rem; margin-bottom: 10px;">${relicConfig.icon}</div>
                        <div style="color: ${qualityConf?.color || '#888'}; font-size: 1.3rem; font-weight: bold;">
                            ${relicConfig.name}
                        </div>
                        <div style="color: ${qualityConf?.color || '#888'}; font-size: 0.9rem; margin-top: 5px;">
                            ${qualityConf?.name || '?'} 品质
                        </div>
                    </div>
                    
                    <!-- 属性类型 -->
                    <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 15px; margin-bottom: 15px;">
                        <div style="color: #888; font-size: 0.8rem; margin-bottom: 8px;">属性类型</div>
                        <div style="color: ${calcTypeColor}; font-size: 1rem; font-weight: bold;">
                            ${attrType?.name || '未知'}
                        </div>
                        <div style="color: #666; font-size: 0.75rem; margin-top: 3px;">
                            ${calcTypeText} | ${attrType?.desc || ''}
                        </div>
                    </div>
                    
                    <!-- 等级信息 -->
                    <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 15px; margin-bottom: 15px;">
                        <div style="color: #888; font-size: 0.8rem; margin-bottom: 8px;">等级状态</div>
                        <div style="display: flex; justify-content: space-around; font-size: 0.85rem;">
                            <div>
                                <div style="color: #666;">当前等级</div>
                                <div style="color: ${owned ? qualityConf?.color : '#666'}; font-weight: bold; font-size: 1.1rem;">
                                    ${owned ? `Lv.${currentLevel}` : '未获得'}
                                </div>
                            </div>
                            <div>
                                <div style="color: #666;">等级上限</div>
                                <div style="color: #fbbf24; font-weight: bold; font-size: 1.1rem;">
                                    Lv.${maxLevel}
                                </div>
                            </div>
                        </div>
                        
                        ${owned ? `
                        <!-- 进度条 -->
                        <div style="margin-top: 12px;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #888; margin-bottom: 3px;">
                                <span>升级进度</span>
                                <span>${progressPct.toFixed(1)}%</span>
                            </div>
                            <div style="background: rgba(0,0,0,0.3); height: 8px; border-radius: 4px; overflow: hidden;">
                                <div style="background: linear-gradient(90deg, ${qualityConf?.color || '#666'}, ${qualityConf?.color || '#666'}aa); 
                                            width: ${progressPct}%; height: 100%; border-radius: 4px;
                                            transition: width 0.3s;"></div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    
                    <!-- 属性数值 -->
                    <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 15px; margin-bottom: 15px;">
                        <div style="color: #888; font-size: 0.8rem; margin-bottom: 10px;">属性数值</div>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 0.8rem;">
                            <div>
                                <div style="color: #666; font-size: 0.7rem;">每级加成</div>
                                <div style="color: #aaa;">${prefix}${perLevelValue.toFixed(3)}</div>
                            </div>
                            <div>
                                <div style="color: #666; font-size: 0.7rem;">当前效果</div>
                                <div style="color: ${owned ? '#4ade80' : '#666'}; font-weight: bold;">
                                    ${owned ? prefix + currentValue.toFixed(2) : '-'}
                                </div>
                            </div>
                            <div>
                                <div style="color: #666; font-size: 0.7rem;">满级效果</div>
                                <div style="color: #fbbf24; font-weight: bold;">${prefix}${maxValue.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 获取时间 -->
                    ${owned ? `
                    <div style="color: #666; font-size: 0.7rem; margin-bottom: 10px;">
                        获得时间: ${new Date(owned.acquiredAt).toLocaleString()}
                        ${owned.level > 1 ? `<br>最后升级: ${new Date(owned.upgradedAt).toLocaleString()}` : ''}
                    </div>
                    ` : '<div style="color: #666; font-size: 0.8rem; margin-bottom: 10px;">💡 点击遗宝图标可查看详情</div>'}
                    
                    <!-- 关闭按钮 -->
                    <button onclick="document.getElementById('relic-detail-modal').remove()" style="
                        background: ${qualityConf?.color || '#666'};
                        color: #000;
                        border: none;
                        padding: 8px 25px;
                        border-radius: 6px;
                        font-weight: bold;
                        cursor: pointer;
                        font-size: 0.9rem;
                    ">关闭</button>
                </div>
            </div>
            <style>
                @keyframes relicDetailAppear {
                    0% { transform: scale(0.9); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
            </style>
        `;
        
        // 移除已有的弹窗
        const existingModal = document.getElementById('relic-detail-modal');
        if (existingModal) existingModal.remove();
        
        // 添加到页面
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
}
