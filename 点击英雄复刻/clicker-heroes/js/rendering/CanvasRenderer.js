/**
 * Canvas渲染器类
 * 负责游戏画面的渲染，包括怪物绘制、伤害数字、粒子效果等
 * @file js/rendering/CanvasRenderer.js
 */

class CanvasRenderer {
    /**
     * 创建Canvas渲染器实例
     * @param {string} canvasId - Canvas元素的ID
     */
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // 伤害数字数组
        this.damageNumbers = [];
        
        // 粒子效果数组
        this.particles = [];
        
        // 动画帧ID
        this.animationId = null;
        
        // 怪物动画状态
        this.monsterScale = 1;
        this.monsterScaleDirection = -1;
        
        // 怪物颜色配置（用于绘制简单怪物图形）
        this.monsterColors = [
            '#e74c3c', // 红色
            '#9b59b6', // 紫色
            '#3498db', // 蓝色
            '#2ecc71', // 绿色
            '#f39c12', // 橙色
            '#1abc9c', // 青色
            '#e91e63', // 粉色
            '#795548'  // 棕色
        ];
        
        // 当前怪物颜色索引
        this.currentMonsterColorIndex = 0;
    }

    /**
     * 初始化Canvas
     * 设置Canvas尺寸并绑定窗口大小变化事件
     */
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    /**
     * 调整Canvas大小以适应容器
     */
    resize() {
        const container = this.canvas.parentElement;
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        }
    }

    /**
     * 主渲染函数
     * @param {Object} game - 游戏状态对象
     */
    render(game) {
        // 清空画布
        this.clear();
        
        // 绘制背景
        this.renderBackground();
        
        // 如果有怪物，绘制怪物
        if (game && game.currentMonster) {
            this.renderMonster(game.currentMonster);
            this.renderHPBar(game.currentMonster);
            // 如果是BOSS，绘制计时器
            if (game.currentMonster.isBoss && game.currentMonster.timeRemaining !== null) {
                this.renderBossTimer(game.currentMonster);
            }
        }
        
        // 更新并绘制伤害数字
        this.updateAndRenderDamageNumbers();
        
        // 更新并绘制粒子效果
        this.updateAndRenderParticles();
        
        // 继续下一帧动画
        this.animationId = requestAnimationFrame(() => this.render(game));
    }

    /**
     * 绘制背景
     */
    renderBackground() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 创建径向渐变背景
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, Math.max(width, height) / 2
        );
        gradient.addColorStop(0, '#2d1b4e');
        gradient.addColorStop(0.5, '#1a1225');
        gradient.addColorStop(1, '#0d0814');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // 绘制装饰性圆圈
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.35, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.25, 0, Math.PI * 2);
        ctx.stroke();
    }

    /**
     * 绘制怪物
     * @param {Object} monster - 怪物对象
     */
    renderMonster(monster) {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // 更新怪物呼吸动画
        this.monsterScale += this.monsterScaleDirection * 0.002;
        if (this.monsterScale <= 0.95 || this.monsterScale >= 1.05) {
            this.monsterScaleDirection *= -1;
        }
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(this.monsterScale, this.monsterScale);
        
        // 获取怪物颜色
        const monsterColor = this.monsterColors[this.currentMonsterColorIndex % this.monsterColors.length];
        
        // 绘制怪物阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 80, 60, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制怪物身体（使用简单的几何图形组合）
        ctx.fillStyle = monsterColor;
        
        // 身体
        ctx.beginPath();
        ctx.arc(0, 0, 50, 0, Math.PI * 2);
        ctx.fill();
        
        // 身体高光
        const bodyGradient = ctx.createRadialGradient(-15, -15, 0, 0, 0, 50);
        bodyGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        bodyGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(0, 0, 50, 0, Math.PI * 2);
        ctx.fill();
        
        // 眼睛
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-18, -10, 12, 0, Math.PI * 2);
        ctx.arc(18, -10, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // 瞳孔
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-18, -10, 6, 0, Math.PI * 2);
        ctx.arc(18, -10, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // 眼睛高光
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-15, -13, 3, 0, Math.PI * 2);
        ctx.arc(21, -13, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 嘴巴
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 15, 20, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        
        // 牙齿
        ctx.fillStyle = '#fff';
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 8, 20);
            ctx.lineTo(i * 8 + 4, 28);
            ctx.lineTo(i * 8 + 8, 20);
            ctx.fill();
        }
        
        // 角
        ctx.fillStyle = monsterColor;
        ctx.beginPath();
        ctx.moveTo(-35, -35);
        ctx.lineTo(-50, -70);
        ctx.lineTo(-20, -45);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(35, -35);
        ctx.lineTo(50, -70);
        ctx.lineTo(20, -45);
        ctx.fill();
        
        // 角的高光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(-40, -45);
        ctx.lineTo(-48, -62);
        ctx.lineTo(-30, -48);
        ctx.fill();
        
        ctx.restore();
    }

    /**
     * 绘制HP条
     * @param {Object} monster - 怪物对象
     */
    renderHPBar(monster) {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const barY = this.canvas.height - 80;
        
        const barWidth = 300;
        const barHeight = 20;
        const currentHP = monster.currentHP !== undefined ? monster.currentHP : monster.hp;
        const maxHP = monster.maxHP !== undefined ? monster.maxHP : monster.maxHP;
        const hpPercent = currentHP / maxHP;
        
        // 绘制HP条背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(centerX - barWidth / 2 - 4, barY - 4, barWidth + 8, barHeight + 8);
        
        // 绘制HP条边框
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - barWidth / 2 - 4, barY - 4, barWidth + 8, barHeight + 8);
        
        // 根据HP百分比选择颜色
        let hpColor;
        if (hpPercent > 0.6) {
            hpColor = '#2ecc71'; // 绿色
        } else if (hpPercent > 0.3) {
            hpColor = '#f1c40f'; // 黄色
        } else {
            hpColor = '#e74c3c'; // 红色
        }
        
        // 绘制HP条填充
        const hpGradient = ctx.createLinearGradient(
            centerX - barWidth / 2, barY,
            centerX + barWidth / 2, barY
        );
        hpGradient.addColorStop(0, hpColor);
        hpGradient.addColorStop(1, this.lightenColor(hpColor, 30));
        
        ctx.fillStyle = hpGradient;
        ctx.fillRect(centerX - barWidth / 2, barY, barWidth * hpPercent, barHeight);
        
        // 绘制HP文字
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const displayCurrentHP = monster.currentHP !== undefined ? monster.currentHP : monster.hp;
        const displayMaxHP = monster.maxHP !== undefined ? monster.maxHP : monster.maxHP;
        ctx.fillText(
            `${this.formatNumber(displayCurrentHP)} / ${this.formatNumber(displayMaxHP)}`,
            centerX,
            barY + barHeight / 2
        );
    }

    /**
     * 绘制BOSS计时器
     * @param {Object} monster - 怪物对象
     */
    renderBossTimer(monster) {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const timerY = 50;

        const timePercent = monster.timeRemaining / monster.timeLimit;
        const timeText = Math.ceil(monster.timeRemaining);

        // 根据剩余时间选择颜色
        let timerColor;
        if (timePercent > 0.5) {
            timerColor = '#2ecc71'; // 绿色
        } else if (timePercent > 0.25) {
            timerColor = '#f1c40f'; // 黄色
        } else {
            timerColor = '#e74c3c'; // 红色
        }

        // 绘制计时器背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(centerX - 60, timerY - 20, 120, 40);

        // 绘制计时器边框
        ctx.strokeStyle = timerColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - 60, timerY - 20, 120, 40);

        // 绘制倒计时文字
        ctx.fillStyle = timerColor;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${timeText}s`, centerX, timerY);

        // 绘制"BOSS"标签
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('BOSS', centerX, timerY - 35);
    }

    /**
     * 生成伤害数字
     * @param {number} damage - 伤害值
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {boolean} isCrit - 是否为暴击
     */
    spawnDamageNumber(damage, x, y, isCrit = false) {
        this.damageNumbers.push({
            damage: damage,
            x: x,
            y: y,
            startY: y,
            opacity: 1,
            scale: isCrit ? 1.5 : 1,
            isCrit: isCrit,
            life: 60, // 存活帧数
            maxLife: 60,
            velocityX: (Math.random() - 0.5) * 2,
            velocityY: -2 - Math.random() * 2
        });
    }

    /**
     * 更新并绘制伤害数字
     */
    updateAndRenderDamageNumbers() {
        const ctx = this.ctx;
        
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const dn = this.damageNumbers[i];
            
            // 更新位置
            dn.x += dn.velocityX;
            dn.y += dn.velocityY;
            dn.velocityY += 0.05; // 重力效果
            
            // 更新生命周期
            dn.life--;
            dn.opacity = dn.life / dn.maxLife;
            
            // 如果生命周期结束，移除
            if (dn.life <= 0) {
                this.damageNumbers.splice(i, 1);
                continue;
            }
            
            // 绘制伤害数字
            ctx.save();
            ctx.globalAlpha = dn.opacity;
            ctx.translate(dn.x, dn.y);
            ctx.scale(dn.scale, dn.scale);
            
            // 文字颜色（暴击为金色，普通为白色）
            const textColor = dn.isCrit ? '#ffd700' : '#fff';
            const fontSize = dn.isCrit ? 28 : 20;
            
            // 绘制文字描边
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeText(this.formatNumber(dn.damage), 0, 0);
            
            // 绘制文字填充
            ctx.fillStyle = textColor;
            ctx.fillText(this.formatNumber(dn.damage), 0, 0);
            
            // 暴击时添加额外效果
            if (dn.isCrit) {
                ctx.strokeStyle = '#ff6b6b';
                ctx.lineWidth = 1;
                ctx.strokeText(this.formatNumber(dn.damage), 0, 0);
            }
            
            ctx.restore();
        }
    }

    /**
     * 生成粒子效果
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} count - 粒子数量
     * @param {string} color - 粒子颜色
     */
    spawnParticles(x, y, count = 8, color = null) {
        const colors = ['#ffd700', '#ff6b6b', '#fff', '#ffeb3b', '#ff9800'];
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed = 2 + Math.random() * 4;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 5,
                color: color || colors[Math.floor(Math.random() * colors.length)],
                life: 30 + Math.random() * 20,
                maxLife: 50,
                opacity: 1
            });
        }
    }

    /**
     * 更新并绘制粒子效果
     */
    updateAndRenderParticles() {
        const ctx = this.ctx;
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // 更新位置
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15; // 重力
            p.vx *= 0.98; // 阻力
            
            // 更新生命周期
            p.life--;
            p.opacity = p.life / p.maxLife;
            p.size *= 0.97;
            
            // 如果生命周期结束，移除
            if (p.life <= 0 || p.size < 0.5) {
                this.particles.splice(i, 1);
                continue;
            }
            
            // 绘制粒子
            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    /**
     * 怪物被点击时的动画效果
     * @param {number} x - 点击X坐标
     * @param {number} y - 点击Y坐标
     */
    onMonsterClick(x, y) {
        // 生成粒子效果
        this.spawnParticles(x, y, 10);
        
        // 短暂缩放怪物
        this.monsterScale = 0.9;
    }

    /**
     * 怪物死亡时的动画效果
     */
    onMonsterDeath() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // 大量粒子效果
        this.spawnParticles(centerX, centerY, 30);
        
        // 切换下一个怪物颜色
        this.currentMonsterColorIndex++;
    }

    /**
     * 清空画布
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 停止渲染
     */
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * 格式化数字显示
     * @param {number} num - 要格式化的数字
     * @returns {string} 格式化后的字符串
     */
    formatNumber(num) {
        if (num >= 1e15) return (num / 1e15).toFixed(2) + 'Q';
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return Math.floor(num).toString();
    }

    /**
     * 颜色变亮
     * @param {string} color - 十六进制颜色
     * @param {number} percent - 变亮百分比
     * @returns {string} 变亮后的颜色
     */
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (
            0x1000000 +
            (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
            (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
            (B < 255 ? (B < 1 ? 0 : B) : 255)
        ).toString(16).slice(1);
    }
}

// 导出模块（如果在模块环境中使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanvasRenderer;
}
