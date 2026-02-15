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
        
        // 经脉节点状态（10个节点）- 武侠炼体经脉
        this.meridianNodes = [
            { id: 0, name: '皮膜', icon: '🛡️', unlocked: true, refined: false },
            { id: 1, name: '肌肉', icon: '💪', unlocked: false, refined: false },
            { id: 2, name: '骨骼', icon: '🦴', unlocked: false, refined: false },
            { id: 3, name: '大筋', icon: '🧵', unlocked: false, refined: false },
            { id: 4, name: '骨髓', icon: '⚪', unlocked: false, refined: false },
            { id: 5, name: '气血', icon: '❤️', unlocked: false, refined: false },
            { id: 6, name: '心脉', icon: '🔴', unlocked: false, refined: false },
            { id: 7, name: '肝窍', icon: '🟢', unlocked: false, refined: false },
            { id: 8, name: '肾元', icon: '🔵', unlocked: false, refined: false },
            { id: 9, name: '任督贯通', icon: '⭐', unlocked: false, refined: false, isRare: true }
        ];
        
        // 总加成倍数
        this.totalMultiplier = new BigNum(1);
        
        // 淬炼历史记录
        this.refinementHistory = [];
        
        // 淬炼境界配置（仙侠炼体风格）
        this.realmNames = [
            { round: 0, name: '凡胎', color: '#888', desc: '未曾修炼' },
            { round: 1, name: '铜皮', color: '#d4a574', desc: '皮若铜甲' },
            { round: 2, name: '铁骨', color: '#22c55e', desc: '骨似精铁' },
            { round: 3, name: '玉筋', color: '#3b82f6', desc: '筋韧如玉' },
            { round: 4, name: '银血', color: '#a855f7', desc: '血涌如汞' },
            { round: 5, name: '金髓', color: '#f97316', desc: '髓化金液' },
            { round: 6, name: '玄脏', color: '#14b8a6', desc: '脏蕴玄光' },
            { round: 7, name: '灵窍', color: '#fbbf24', desc: '窍通天地' },
            { round: 8, name: '道体', color: '#ef4444', desc: '体合大道' },
            { round: 9, name: '仙躯', color: '#ffd700', desc: '躯若仙金' }
        ];
    }
    
    /**
     * 获取当前淬炼境界
     * 格式：第X境·境界名
     * 10轮以上：第X冲·Y重
     */
    getCurrentRealm() {
        const round = this.refinementRound;
        if (round < this.realmNames.length) {
            const realm = this.realmNames[round];
            return {
                ...realm,
                displayName: `第${round + 1}境·${realm.name}`
            };
        }
        // 10轮以上：显示为"第十境·仙躯·X重Y层"
        // 每10轮为1重，每1重内有10层
        const extraRounds = round - 9; // 从第10轮开始计算
        const zhong = Math.floor((extraRounds - 1) / 10) + 1; // 第几重
        const ceng = ((extraRounds - 1) % 10) + 1; // 第几层
        
        const baseRealm = this.realmNames[9]; // 仙躯
        return {
            round: round,
            name: `${baseRealm.name}·${zhong}重${ceng}层`,
            displayName: `第十境·${baseRealm.name}·${zhong}重${ceng}层`,
            color: baseRealm.color,
            desc: '肉身成仙，万劫不灭'
        };
    }
    
    /**
     * 获取下一境界信息
     */
    getNextRealm() {
        const nextRound = this.refinementRound + 1;
        if (nextRound < this.realmNames.length) {
            return this.realmNames[nextRound];
        }
        return null; // 已到达最高境界
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
                description: '任督贯通，肉身蜕变！'
            };
        } else {
            return {
                type: 'normal',
                multiplier: 1.1,  // 前9次：×1.1
                description: '锻体强身，气力增长'
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
     * 获取下一级属性预览
     */
    getNextLevelPreview() {
        const bonus = this.getNodeBonusPreview();
        const currentMult = this.totalMultiplier;
        const currentExpBonus = this.getTotalExpBonus();
        
        if (bonus.type === 'rare') {
            // 最后一级：指数加成
            return {
                type: 'exp',
                current: `指数+${(currentExpBonus * 100).toFixed(1)}%`,
                next: `指数+${((currentExpBonus + 0.001) * 100).toFixed(1)}%`,
                gain: '+0.1% 指数'
            };
        } else {
            // 普通等级：乘算加成
            const nextMult = currentMult.mul(1.1);
            return {
                type: 'mult',
                current: `×${formatNum(currentMult)}`,
                next: `×${formatNum(nextMult)}`,
                gain: '×1.1 全属性'
            };
        }
    }
    
    /**
     * 获取经脉图渲染HTML - 星座图风格
     */
    getMeridianMapHTML() {
        // 星座图布局 - 10个节点分布在圆周上，形成星座连线
        // 容器尺寸为 300x300，中心点在正中间
        const containerSize = 300;
        const centerX = containerSize / 2;
        const centerY = containerSize / 2;
        const outerRadius = 100;  // 外圈节点半径，留出边距
        
        let nodesHTML = '';
        let linesHTML = '';
        
        // 计算每个节点的位置（前9个在外圈，第10个在中心）
        const nodePositions = [];
        
        // 前9个节点均匀分布在圆周
        for (let i = 0; i < 9; i++) {
            const angle = (i / 9) * Math.PI * 2 - Math.PI / 2; // 从顶部开始
            nodePositions.push({
                x: centerX + Math.cos(angle) * outerRadius,
                y: centerY + Math.sin(angle) * outerRadius,
                radius: outerRadius,
                angle: angle
            });
        }
        
        // 第10个节点在中心
        nodePositions.push({
            x: centerX,
            y: centerY,
            radius: 0,
            angle: 0
        });
        
        // 先生成连接线（星座连线效果）
        // 外圈节点依次相连
        for (let i = 0; i < 9; i++) {
            const nextIdx = (i + 1) % 9;
            const start = nodePositions[i];
            const end = nodePositions[nextIdx];
            
            const node = this.meridianNodes[i];
            const isConnected = node.refined || node.unlocked;
            
            if (isConnected) {
                linesHTML += `
                    <div style="
                        position: absolute;
                        left: ${start.x}px;
                        top: ${start.y}px;
                        width: ${Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))}px;
                        height: 2px;
                        background: ${node.refined ? 'linear-gradient(90deg, #fbbf24, #f59f0b)' : 'rgba(100,100,100,0.3)'};
                        transform: rotate(${Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI}deg);
                        transform-origin: 0 50%;
                        z-index: 1;
                    "></div>
                `;
            }
        }
        
        // 中心节点连接到外圈（当中心解锁时）
        const centerNode = this.meridianNodes[9];
        if (centerNode.unlocked || centerNode.refined) {
            for (let i = 0; i < 9; i++) {
                const outerNode = this.meridianNodes[i];
                if (outerNode.refined) {
                    const start = nodePositions[i];
                    const end = nodePositions[9];
                    
                    linesHTML += `
                        <div style="
                            position: absolute;
                            left: ${start.x}px;
                            top: ${start.y}px;
                            width: ${Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))}px;
                            height: 1px;
                            background: linear-gradient(90deg, #fbbf24, transparent);
                            transform: rotate(${Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI}deg);
                            transform-origin: 0 50%;
                            z-index: 1;
                            opacity: 0.6;
                        "></div>
                    `;
                }
            }
        }
        
        // 生成节点
        this.meridianNodes.forEach((node, idx) => {
            const pos = nodePositions[idx];
            const isCurrent = idx === this.refinementStep;
            const isRefined = node.refined;
            const isUnlocked = node.unlocked;
            const isCenter = idx === 9;
            
            let nodeColor, nodeSize, glowEffect, borderStyle;
            if (isRefined) {
                nodeColor = isCenter ? '#ffd700' : '#22c55e';
                nodeSize = isCenter ? 36 : 28;
                glowEffect = isCenter ? '0 0 20px #ffd700' : '0 0 10px #22c55e';
                borderStyle = '2px solid #fff';
            } else if (isCurrent) {
                nodeColor = '#fbbf24';
                nodeSize = isCenter ? 40 : 32;
                glowEffect = '0 0 15px #fbbf24';
                borderStyle = '3px solid #fbbf24';
            } else if (isUnlocked) {
                nodeColor = '#666';
                nodeSize = isCenter ? 32 : 24;
                glowEffect = 'none';
                borderStyle = '1px solid #888';
            } else {
                nodeColor = '#333';
                nodeSize = isCenter ? 28 : 20;
                glowEffect = 'none';
                borderStyle = '1px solid #444';
            }
            
            const pulseAnimation = isCurrent ? 'animation: nodePulse 1.5s infinite;' : '';
            
            let bgStyle;
            if (isRefined) {
                bgStyle = `linear-gradient(135deg, ${nodeColor}, ${nodeColor}dd)`;
            } else if (isCurrent) {
                bgStyle = `linear-gradient(135deg, #fbbf24, #f59f0b)'`;
            } else if (isUnlocked) {
                bgStyle = '#262626';
            } else {
                bgStyle = '#1a1a1a';
            }
            
            nodesHTML += `
                <div style="
                    position: absolute;
                    left: ${pos.x - nodeSize/2}px;
                    top: ${pos.y - nodeSize/2}px;
                    width: ${nodeSize}px;
                    height: ${nodeSize}px;
                    background: ${bgStyle};
                    border: ${borderStyle};
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: ${nodeSize * 0.45}px;
                    box-shadow: ${glowEffect};
                    transition: all 0.3s;
                    z-index: ${10 + idx};
                    cursor: ${isUnlocked ? 'pointer' : 'not-allowed'};
                    ${pulseAnimation}
                "
                ${isUnlocked ? `onclick="game.garden.refinement.refineAndUpdate()"` : ''}
                title="${node.name}${isRefined ? ' (已贯通)' : isCurrent ? ' (可突破)' : !isUnlocked ? ' (未解锁)' : ''}"
                >
                    ${node.icon}
                </div>
                ${isCenter ? `<div style="position: absolute; left: ${pos.x - 50}px; top: ${pos.y + 20}px; width: 100px; text-align: center; font-size: 0.65rem; color: ${isRefined ? '#ffd700' : '#888'};">${node.name}</div>` : ''}
            `;
            
            if (!isCenter && (isRefined || isCurrent)) {
                const labelOffset = 18;
                const labelX = pos.x + Math.cos(pos.angle) * labelOffset;
                const labelY = pos.y + Math.sin(pos.angle) * labelOffset;
                nodesHTML += `
                    <div style="
                        position: absolute;
                        left: ${labelX - 30}px;
                        top: ${labelY - 8}px;
                        width: 60px;
                        text-align: center;
                        font-size: 0.6rem;
                        color: ${isRefined ? '#22c55e' : '#fbbf24'};
                        text-shadow: 0 0 3px rgba(0,0,0,0.8);
                        pointer-events: none;
                    ">${node.name}</div>
                `;
            }
        });
        
        const styleHTML = `
            <style>
                @keyframes nodePulse {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 15px #fbbf24; }
                    50% { transform: scale(1.1); box-shadow: 0 0 25px #fbbf24, 0 0 35px #f59f0b; }
                }
            </style>
        `;
        
        return styleHTML + linesHTML + nodesHTML;
    }
    
    /**
     * 执行淬炼并更新UI
     */
    refineAndUpdate() {
        const oldRealm = this.getCurrentRealm();
        const result = this.refine();
        if (result.success) {
            const newRealm = this.getCurrentRealm();
            
            if (newRealm.round > oldRealm.round) {
                this.game.log('SKILL', `⚔️ 境界突破！${oldRealm.name} → ${newRealm.name}！`);
                this.game.log('SKILL', `💪 ${newRealm.desc}！肉身蜕变！`);
            } else if (result.bonus.type === 'rare') {
                this.game.log('SKILL', `⭐ 打通${result.node.name}！肉身升华！`);
            } else {
                this.game.log('GAIN', `🔥 淬炼${result.node.name}！气力暴增×${result.bonus.multiplier}`);
            }
        } else {
            this.game.log('SYS', result.message);
        }
        
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
        let startRealm = this.getCurrentRealm();
        while (true) {
            const result = this.refine();
            if (!result.success) break;
            count++;
            
            if (count >= 100) break;
        }
        
        if (count > 0) {
            let endRealm = this.getCurrentRealm();
            if (endRealm.round > startRealm.round) {
                this.game.log('SKILL', `⚔️ 连续锻体！${startRealm.name} → ${endRealm.name}！`);
            } else {
                this.game.log('SYS', `🔥 连续淬体${count}次，体魄更胜从前`);
            }
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
