/**
 * StarBeastDungeon Class - 星空巨兽副本
 *
 * 数值压缩逻辑：
 * - 玩家有效攻击 = (log10(ATK))^2
 * - 玩家有效生命 = (log10(maxHP))^2 * 5
 * - 巨兽属性基于难度等级二次方缩放
 *
 * 7个难度，产出星髓
 */

class StarBeastDungeon {
    constructor(game) {
        this.game = game;

        // 当前选中的难度
        this.selectedDifficulty = 1;

        // 战斗状态
        this.active = false;
        this.currentBeast = null;

        // 今日已挑战次数
        this.dailyAttempts = 0;
        this.maxDailyAttempts = 10;

        // 上次重置时间
        this.lastResetDate = new Date().toDateString();

        // 初始化
        this.resetDailyAttempts();
    }

    /**
     * 重置每日挑战次数
     */
    resetDailyAttempts() {
        const today = new Date().toDateString();
        if (this.lastResetDate !== today) {
            this.dailyAttempts = 0;
            this.lastResetDate = today;
        }
    }

    /**
     * 获取指定难度的巨兽数据
     */
    getBeastData(difficultyLevel) {
        const config = STAR_BEAST_DIFFICULTIES.find(d => d.level === difficultyLevel);
        if (!config) return null;

        const stats = STAR_BEAST_STATS;

        // 巨兽属性（数值压缩后的有效值）
        return {
            name: config.name,
            fullName: `${config.icon} ${config.name}`,
            rank: config.rank,
            level: difficultyLevel,
            maxHp: stats.hpMult(difficultyLevel),
            atk: stats.atkMult(difficultyLevel),
            reward: config.marrowBase + Math.floor(Math.random() * config.marrowBonus),
            config: config
        };
    }

    /**
     * 检查是否可以挑战指定难度
     */
    canChallenge(difficultyLevel) {
        this.resetDailyAttempts();

        const config = STAR_BEAST_DIFFICULTIES.find(d => d.level === difficultyLevel);
        if (!config) return { can: false, reason: '难度不存在' };

        // 检查次数
        if (this.dailyAttempts >= this.maxDailyAttempts) {
            return { can: false, reason: '今日挑战次数已用完' };
        }

        // 检查解锁难度
        if (this.game.difficulty < config.unlockDifficulty) {
            return { can: false, reason: `N${config.unlockDifficulty}解锁` };
        }

        return { can: true };
    }

    /**
     * 选择难度并开始战斗
     */
    selectDifficulty(level) {
        const check = this.canChallenge(level);
        if (!check.can) {
            this.game.log('SYS', `无法挑战：${check.reason}`);
            return false;
        }

        this.selectedDifficulty = level;
        this.currentBeast = this.getBeastData(level);

        // 关闭选择界面，开始战斗
        this.closeSelectionModal();
        this.startBattle();

        return true;
    }

    /**
     * 开始战斗
     */
    startBattle() {
        if (!this.currentBeast) return false;

        this.active = true;

        // 切换到星空巨兽战斗模式
        this.game.changeMode('starbeast');

        // 生成巨兽敌人
        this.spawnBeast();

        // 消耗挑战次数
        this.dailyAttempts++;

        this.game.log('SYS', `🌟 遭遇${this.currentBeast.fullName}！`);

        return true;
    }

    /**
     * 生成巨兽敌人
     */
    spawnBeast() {
        const beast = this.currentBeast;

        // 创建巨兽敌人对象（使用数值压缩后的属性）
        const enemy = {
            name: beast.fullName,
            maxHp: new BigNum(beast.maxHp),
            currentHp: new BigNum(beast.maxHp),
            atk: new BigNum(beast.atk),
            level: beast.level * 100,
            isBoss: true,
            // 巨兽的特殊属性
            beastReward: beast.reward
        };

        this.game.enemies = [enemy];
        this.game.updateCombatUI();
    }

    /**
     * 处理战斗结束（击败巨兽）
     */
    handleVictory() {
        if (!this.active || !this.currentBeast) return;

        const reward = this.currentBeast.reward;

        // 给予星髓奖励
        const actualReward = this.game.zhouTian.addMarrow(reward);

        this.game.log('SYS', `🎉 击败${this.currentBeast.fullName}！获得 ${actualReward} 星髓`);

        // 显示奖励弹窗
        this.showRewardModal(actualReward);

        // 清理战斗状态
        this.endBattle();
    }

    /**
     * 处理战斗失败
     */
    handleDefeat() {
        if (!this.active) return;

        this.game.log('SYS', `💀 挑战${this.currentBeast?.fullName || '星空巨兽'}失败`);

        this.endBattle();
    }

    /**
     * 结束战斗
     */
    endBattle() {
        this.active = false;
        this.currentBeast = null;

        // 返回普通模式
        this.game.changeMode('wild');

        // 刷新UI
        this.updateUI();
    }

    /**
     * 显示奖励弹窗
     */
    showRewardModal(reward) {
        const modal = document.getElementById('starbeast-reward-modal');
        if (modal) {
            document.getElementById('starbeast-reward-amount').innerText = reward;
            modal.style.display = 'flex';
        }
    }

    /**
     * 关闭奖励弹窗
     */
    closeRewardModal() {
        const modal = document.getElementById('starbeast-reward-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * 打开难度选择界面
     */
    openSelectionModal() {
        this.resetDailyAttempts();
        this.updateUI();

        const modal = document.getElementById('starbeast-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    /**
     * 关闭难度选择界面
     */
    closeSelectionModal() {
        const modal = document.getElementById('starbeast-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * 渲染难度列表
     */
    renderDifficultyList() {
        const container = document.getElementById('starbeast-difficulty-list');
        if (!container) return;

        container.innerHTML = '';

        STAR_BEAST_DIFFICULTIES.forEach(diff => {
            const check = this.canChallenge(diff.level);
            const isLocked = !check.can && check.reason.includes('解锁');
            const isCompleted = this.selectedDifficulty > diff.level;

            const item = document.createElement('div');
            item.style.cssText = `
                padding: 12px;
                background: ${isLocked ? '#1a1a1a' : isCompleted ? '#0f1f0f' : '#1a1a2e'};
                border: 1px solid ${isLocked ? '#333' : isCompleted ? '#22c55e' : '#4a4a6e'};
                border-radius: 8px;
                margin-bottom: 8px;
                cursor: ${check.can ? 'pointer' : 'default'};
                opacity: ${isLocked ? 0.5 : 1};
                transition: all 0.2s;
            `;

            if (check.can) {
                item.onclick = () => this.selectDifficulty(diff.level);
                item.onmouseenter = () => item.style.borderColor = '#a855f7';
                item.onmouseleave = () => item.style.borderColor = isCompleted ? '#22c55e' : '#4a4a6e';
            }

            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-weight:bold; color:${isLocked ? '#666' : '#fbbf24'}; font-size:0.9rem;">
                            ${isCompleted ? '✓ ' : ''}${diff.icon} ${diff.name}
                            <span style="font-size:0.75rem; color:${isLocked ? '#666' : '#a855f7'}; margin-left:4px;">[${diff.rank}]</span>
                        </div>
                        <div style="font-size:0.7rem; color:#888; margin-top:4px;">
                            ${isLocked ? `🔒 需N${diff.unlockDifficulty}解锁` : `💎 星髓 ${diff.marrowBase}~${diff.marrowBase + diff.marrowBonus} | 📜 ${diff.description}`}
                        </div>
                    </div>
                    ${check.can ? '<span style="color:#a855f7;">▶</span>' : ''}
                </div>
            `;

            container.appendChild(item);
        });
    }

    /**
     * 更新UI
     */
    updateUI() {
        this.renderDifficultyList();

        // 更新剩余次数
        const attemptsEl = document.getElementById('starbeast-attempts');
        if (attemptsEl) {
            attemptsEl.innerText = `${this.maxDailyAttempts - this.dailyAttempts}/${this.maxDailyAttempts}`;
        }

        // 更新今日已获得
        const totalEl = document.getElementById('starbeast-total-marrow');
        if (totalEl) {
            totalEl.innerText = this.game.zhouTian?.state?.marrow.toLocaleString() || '0';
        }
    }

    /**
     * 序列化
     */
    serialize() {
        return {
            dailyAttempts: this.dailyAttempts,
            lastResetDate: this.lastResetDate
        };
    }

    /**
     * 加载
     */
    load(data) {
        if (!data) return;
        if (data.dailyAttempts !== undefined) this.dailyAttempts = data.dailyAttempts;
        if (data.lastResetDate) this.lastResetDate = data.lastResetDate;
        this.resetDailyAttempts();
    }
}

// Export
try {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { StarBeastDungeon };
    }
} catch (e) {}
