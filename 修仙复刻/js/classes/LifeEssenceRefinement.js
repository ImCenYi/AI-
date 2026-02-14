/**
 * LifeEssenceRefinement Class - 生灵精华淬炼系统
 * 
 * 经脉淬炼机制：
 * - 10个节点为一轮（对应10条经脉）
 * - 每轮前9次：乘算全属性加成（×1.1）
 * - 第10次：指数级稀有加成（×10）
 * - 消耗：指数级增长的生灵精华
 */

class LifeEssenceRefinement {
    constructor(game) {
        this.game = game;
        
        // 生灵精华资源
        this.lifeEssence = new BigNum(0);
        
        // 淬炼进度
        this.refinementRound = 0;  // 当前轮数
        this.refinementStep = 0;   // 当前轮次进度 (0-9)
        
        // 经脉节点状态（10个节点）
        this.meridianNodes = [
            { id: 0, name: '手太阴肺经', icon: '🫁', unlocked: true, refined: false },
            { id: 1, name: '手阳明大肠经', icon: '💩', unlocked: false, refined: false },
            { id: 2, name: '足阳明胃经', icon: '🍚', unlocked: false, refined: false },
            { id: 3, name: '足太阴脾经', icon: '🔶', unlocked: false, refined: false },
            { id: 4, name: '手少阴心经', icon: '❤️', unlocked: false, refined: false },
            { id: 5, name: '手太阳小肠经', icon: '🌀', unlocked: false, refined: false },
            { id: 6, name: '足太阳膀胱经', icon: '💧', unlocked: false, refined: false },
            { id: 7, name: '足少阴肾经', icon: '⚫', unlocked: false, refined: false },
            { id: 8, name: '手厥阴心包经', icon: '🛡️', unlocked: false, refined: false },
            { id: 9, name: '任督二脉', icon: '✨', unlocked: false, refined: false, isRare: true }
        ];
        
        // 总加成倍数
        this.totalMultiplier = new BigNum(1);
        
        // 淬炼历史记录
        this.refinementHistory = [];
    }
    
    /**
     * 获取当前淬炼消耗
     */
    getRefinementCost() {
        // 基础消耗 100，每轮 ×10，每步 ×1.5
        const baseCost = new BigNum(100);
        const roundMult = new BigNum(10).pow(this.refinementRound);
        const stepMult = new BigNum(1.5).pow(this.refinementStep);
        return baseCost.mul(roundMult).mul(stepMult);
    }
    
    /**
     * 获取当前节点的加成预览
     * 前9次：乘算 ×1.1
     * 第10次：指数 +0.1%
     */
    getNodeBonusPreview() {
        const isLastNode = this.refinementStep === 9;
        if (isLastNode) {
            return {
                type: 'rare',
                expBonus: 0.001,  // 第10次：+0.1%指数
                description: '突破任督二脉，指数+0.1%！'
            };
        } else {
            return {
                type: 'normal',
                multiplier: 1.1,  // 前9次：×1.1
                description: '淬炼经脉，全属性×1.1'
            };
        }
    }
    
    /**
     * 获取总指数加成百分比（只计算已完成的轮数）
     */
    getTotalExpBonus() {
        // 每轮最后1次提供 +0.1% 指数加成
        return this.refinementRound * 0.001;
    }
    
    /**
     * 执行淬炼
     */
    refine() {
        const cost = this.getRefinementCost();
        
        if (this.lifeEssence.lt(cost)) {
            return {
                success: false,
                message: `生灵精华不足，需要 ${formatNum(cost)}，当前 ${formatNum(this.lifeEssence)}`
            };
        }
        
        // 扣除精华
        this.lifeEssence = this.lifeEssence.sub(cost);
        
        // 获取当前节点
        const currentNode = this.meridianNodes[this.refinementStep];
        const bonus = this.getNodeBonusPreview();
        
        // 获取旧的加成值用于显示
        const oldMultiplier = this.totalMultiplier;
        const oldExpBonus = this.getTotalExpBonus();
        
        // 应用对应的加成
        if (bonus.type === 'normal') {
            // 前9次：乘算加成
            this.totalMultiplier = this.totalMultiplier.mul(bonus.multiplier);
        }
        // 第10次的指数加成在 getTotalExpBonus() 中通过 refinementRound 计算
        
        // 标记节点为已淬炼
        currentNode.refined = true;
        
        // 记录历史
        this.refinementHistory.push({
            round: this.refinementRound,
            step: this.refinementStep,
            nodeName: currentNode.name,
            multiplier: bonus.multiplier || 1,
            expBonus: bonus.expBonus || 0,
            timestamp: Date.now()
        });
        
        // 推进进度
        this.refinementStep++;
        if (this.refinementStep >= 10) {
            this.refinementStep = 0;
            this.refinementRound++;
            // 重置节点状态，但保持解锁
            this.meridianNodes.forEach((node, idx) => {
                node.refined = false;
                node.unlocked = idx <= this.refinementRound;
            });
        } else {
            // 解锁下一个节点
            if (this.refinementStep < 10) {
                this.meridianNodes[this.refinementStep].unlocked = true;
            }
        }
        
        // 获取新的加成值
        const newMultiplier = this.totalMultiplier;
        const newExpBonus = this.getTotalExpBonus();
        
        // 更新游戏属性
        this.applyMultiplierToGame();
        
        return {
            success: true,
            node: currentNode,
            bonus: bonus,
            oldMultiplier: oldMultiplier,
            newMultiplier: newMultiplier,
            oldExpBonus: oldExpBonus,
            newExpBonus: newExpBonus,
            nextCost: this.getRefinementCost()
        };
    }
    
    /**
     * 应用加成到游戏属性
     * 混合加成：
     * - 乘算部分：前9次 ×1.1 累积到 totalMultiplier
     * - 指数部分：每轮最后1次 +0.1% 指数加成
     */
    applyMultiplierToGame() {
        // 存储乘算倍数
        this.game.gardenMeridianMultiplier = this.totalMultiplier;
        // 存储指数加成百分比 (如 0.001 表示 +0.1%)
        this.game.gardenMeridianExpBonus = this.getTotalExpBonus();
        
        // 通知游戏更新属性
        this.game.updateStatsUI();
    }
    
    /**
     * 添加生灵精华
     */
    addLifeEssence(amount) {
        this.lifeEssence = this.lifeEssence.add(amount);
    }
    
    /**
     * 获取经脉图渲染HTML
     */
    getMeridianMapHTML() {
        // 创建经脉图 - 螺旋状布局
        const centerX = 150;
        const centerY = 150;
        const radius = 100;
        
        let nodesHTML = '';
        this.meridianNodes.forEach((node, idx) => {
            // 计算位置（螺旋状）
            const angle = (idx / 10) * Math.PI * 2 - Math.PI / 2;
            const r = radius - (idx * 8); // 逐渐向内
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            
            const isCurrent = idx === this.refinementStep;
            const isRefined = node.refined;
            const isUnlocked = node.unlocked;
            
            let nodeColor, nodeSize, glowEffect;
            if (isRefined) {
                nodeColor = '#22c55e';  // 已淬炼：绿色
                nodeSize = 28;
                glowEffect = '0 0 10px #22c55e';
            } else if (isCurrent) {
                nodeColor = '#fbbf24';  // 当前：金色
                nodeSize = 32;
                glowEffect = '0 0 15px #fbbf24';
            } else if (isUnlocked) {
                nodeColor = '#666';  // 已解锁但未淬炼：灰色
                nodeSize = 24;
                glowEffect = 'none';
            } else {
                nodeColor = '#333';  // 未解锁：暗色
                nodeSize = 20;
                glowEffect = 'none';
            }
            
            const specialBorder = node.isRare ? '3px solid #ef4444' : '2px solid ' + nodeColor;
            
            nodesHTML += `
                <div style="
                    position: absolute;
                    left: ${x - nodeSize/2}px;
                    top: ${y - nodeSize/2}px;
                    width: ${nodeSize}px;
                    height: ${nodeSize}px;
                    background: ${isRefined ? 'linear-gradient(135deg, #22c55e, #16a34a)' : isCurrent ? 'linear-gradient(135deg, #fbbf24, #f59f0b)' : '#1a1a1a'};
                    border: ${specialBorder};
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: ${nodeSize * 0.5}px;
                    box-shadow: ${glowEffect};
                    transition: all 0.3s;
                    z-index: ${10 - idx};
                    cursor: ${isUnlocked ? 'pointer' : 'not-allowed'};
                "
                ${isUnlocked ? `onclick="game.garden.refinement.refineAndUpdate()"` : ''}
                title="${node.name}${isRefined ? ' (已淬炼)' : isCurrent ? ' (当前可淬炼)' : !isUnlocked ? ' (未解锁)' : ''}"
                >
                    ${node.icon}
                </div>
            `;
            
            // 添加连接线
            if (idx < 9 && (this.meridianNodes[idx + 1].unlocked || node.refined)) {
                const nextAngle = ((idx + 1) / 10) * Math.PI * 2 - Math.PI / 2;
                const nextR = radius - ((idx + 1) * 8);
                const nextX = centerX + Math.cos(nextAngle) * nextR;
                const nextY = centerY + Math.sin(nextAngle) * nextR;
                
                const lineLength = Math.sqrt(Math.pow(nextX - x, 2) + Math.pow(nextY - y, 2));
                const lineAngle = Math.atan2(nextY - y, nextX - x) * 180 / Math.PI;
                
                nodesHTML += `
                    <div style="
                        position: absolute;
                        left: ${x}px;
                        top: ${y}px;
                        width: ${lineLength}px;
                        height: 2px;
                        background: ${node.refined ? 'linear-gradient(90deg, #22c55e, #fbbf24)' : '#444'};
                        transform: rotate(${lineAngle}deg);
                        transform-origin: 0 50%;
                        z-index: 1;
                    "></div>
                `;
            }
        });
        
        return nodesHTML;
    }
    
    /**
     * 执行淬炼并更新UI
     */
    refineAndUpdate() {
        const result = this.refine();
        if (result.success) {
            if (result.bonus.type === 'rare') {
                this.game.log('SKILL', `✨ 突破${result.node.name}！指数+0.1%！`);
            } else {
                this.game.log('GAIN', `🌿 淬炼${result.node.name}成功！全属性×${result.bonus.multiplier}`);
            }
        } else {
            this.game.log('SYS', result.message);
        }
        
        // 更新UI
        if (this.game.isGardenModalOpen) {
            this.game.updateGardenUI();
        }
        this.game.updateGardenOverview();
        
        return result;
    }
    
    /**
     * 一键淬炼（自动淬炼到资源耗尽或完成当前轮）
     */
    refineAll() {
        let count = 0;
        while (true) {
            const result = this.refine();
            if (!result.success) break;
            count++;
            
            // 防止卡顿，最多一次淬炼100次
            if (count >= 100) break;
        }
        
        if (count > 0) {
            this.game.log('SYS', `🌿 一键淬炼完成，共淬炼 ${count} 次`);
            if (this.game.isGardenModalOpen) {
                this.game.updateGardenUI();
            }
            this.game.updateGardenOverview();
        } else {
            this.game.log('SYS', '生灵精华不足');
        }
        
        return count;
    }
}

// Export for module systems if needed
try {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { LifeEssenceRefinement };
    }
} catch (e) {}
