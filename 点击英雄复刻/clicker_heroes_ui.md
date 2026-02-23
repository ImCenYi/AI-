# 《点击英雄》(Clicker Heroes) UI/UX 设计方案

## 目录
1. [整体布局设计](#1-整体布局设计)
2. [怪物区域设计](#2-怪物区域设计)
3. [英雄面板设计](#3-英雄面板设计)
4. [统计信息区域](#4-统计信息区域)
5. [视觉设计规范](#5-视觉设计规范)
6. [HTML/CSS代码实现](#6-htmlcss代码实现)

---

## 1. 整体布局设计

### 1.1 界面分区结构

```
┌─────────────────────────────────────────────────────────────────┐
│                     【顶部统计栏】                                │
│   💰 金币: 1.5M    ⚔️ DPS: 2.3K    🎯 区域: 5-3                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                     【中央怪物区域】                              │
│                                                                 │
│                         ┌─────────┐                            │
│                         │  👹    │  ← 大型怪物图像              │
│                         │ 怪物   │                            │
│                         └─────────┘                            │
│                    ████████████░░░░  HP: 45%                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  【左侧英雄面板】              │  【右侧升级/详情面板】           │
│  ┌─────────────────────┐     │  ┌─────────────────────┐        │
│  │ ⚔️ 骑士 Lv.25      │     │ │ 英雄详情/升级选项    │        │
│  │ 🏹 弓箭手 Lv.18    │     │ └─────────────────────┘        │
│  │ 🔮 法师 Lv.12      │     │                                 │
│  │ ...                │     │                                 │
│  └─────────────────────┘     │                                 │
│                              │                                 │
└──────────────────────────────┴─────────────────────────────────┘
```

### 1.2 响应式布局断点

| 断点 | 宽度 | 布局调整 |
|------|------|----------|
| 移动端 | < 768px | 单列布局，英雄面板折叠为底部抽屉 |
| 平板 | 768px - 1024px | 双列布局，怪物区域缩小 |
| 桌面 | > 1024px | 三列布局，完整显示所有面板 |

### 1.3 视觉层次设计

```
Z-Index 层级:
├── 100: 浮动伤害数字 (Damage Numbers)
├── 90:  点击特效 (Click Effects)
├── 80:  弹窗/模态框 (Modals)
├── 70:  下拉菜单 (Dropdowns)
├── 50:  导航栏 (Navigation)
├── 40:  英雄卡片 (Hero Cards)
├── 30:  怪物区域 (Monster Area)
├── 20:  背景装饰 (Background)
└── 10:  基础背景 (Base)
```

---

## 2. 怪物区域设计

### 2.1 怪物显示区域规格

```css
.monster-area {
  /* 尺寸 */
  width: 100%;
  height: 50vh;
  min-height: 400px;
  
  /* 定位 */
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
  /* 视觉 */
  background: radial-gradient(ellipse at center, #2a1f3d 0%, #1a1225 100%);
  border-radius: 16px;
  overflow: hidden;
}

.monster-sprite {
  /* 尺寸 */
  width: 280px;
  height: 280px;
  
  /* 交互 */
  cursor: pointer;
  user-select: none;
  
  /* 动画 */
  transition: transform 0.1s ease;
}

.monster-sprite:active {
  transform: scale(0.95);
}

.monster-sprite:hover {
  filter: brightness(1.1);
}
```

### 2.2 HP血条设计

```css
.hp-bar-container {
  /* 尺寸 */
  width: 60%;
  max-width: 500px;
  height: 24px;
  
  /* 视觉 */
  background: rgba(0, 0, 0, 0.5);
  border-radius: 12px;
  border: 2px solid #4a4a4a;
  overflow: hidden;
  
  /* 位置 */
  margin-top: 20px;
  position: relative;
}

.hp-bar-fill {
  /* 尺寸 */
  height: 100%;
  width: var(--hp-percentage, 100%);
  
  /* 渐变背景 - 根据血量变化颜色 */
  background: linear-gradient(90deg, 
    var(--hp-color-high, #4ade80) 0%,
    var(--hp-color-mid, #fbbf24) 50%,
    var(--hp-color-low, #ef4444) 100%
  );
  
  /* 动画 */
  transition: width 0.2s ease-out, background-color 0.3s ease;
  
  /* 光泽效果 */
  position: relative;
}

.hp-bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 0.3) 0%,
    transparent 100%
  );
}

.hp-text {
  /* 居中显示 */
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  
  /* 字体 */
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}
```

### 2.3 伤害数字浮动效果

```css
.damage-number {
  /* 定位 */
  position: absolute;
  pointer-events: none;
  
  /* 字体 */
  font-family: 'Roboto', sans-serif;
  font-size: 24px;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 
    2px 2px 0 #000,
    -1px -1px 0 #000,
    1px -1px 0 #000,
    -1px 1px 0 #000;
  
  /* 动画 */
  animation: damageFloat 1s ease-out forwards;
}

/* 暴击伤害样式 */
.damage-number.critical {
  font-size: 36px;
  color: #fbbf24;
  animation: damageFloatCritical 1.2s ease-out forwards;
}

@keyframes damageFloat {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  20% {
    transform: translateY(-30px) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translateY(-80px) scale(0.8);
  }
}

@keyframes damageFloatCritical {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1.5);
  }
  10% {
    transform: translateY(-20px) scale(2);
  }
  30% {
    transform: translateY(-40px) scale(1.8);
  }
  100% {
    opacity: 0;
    transform: translateY(-100px) scale(1);
  }
}
```

### 2.4 点击反馈效果

```css
.click-effect {
  /* 定位 */
  position: absolute;
  pointer-events: none;
  
  /* 尺寸 */
  width: 60px;
  height: 60px;
  
  /* 视觉 */
  border-radius: 50%;
  background: radial-gradient(circle, 
    rgba(255, 255, 255, 0.8) 0%,
    rgba(255, 200, 100, 0.4) 40%,
    transparent 70%
  );
  
  /* 动画 */
  animation: clickRipple 0.4s ease-out forwards;
}

@keyframes clickRipple {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(3);
    opacity: 0;
  }
}

/* 怪物受击震动 */
.monster-hit {
  animation: monsterShake 0.15s ease-in-out;
}

@keyframes monsterShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px) rotate(-2deg); }
  75% { transform: translateX(8px) rotate(2deg); }
}
```

---

## 3. 英雄面板设计

### 3.1 英雄列表布局

```css
.hero-panel {
  /* 尺寸 */
  width: 100%;
  max-width: 400px;
  height: calc(100vh - 200px);
  
  /* 布局 */
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  /* 视觉 */
  background: rgba(30, 25, 45, 0.8);
  border-radius: 12px;
  padding: 16px;
  
  /* 滚动 */
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #4a4a6a #1a1a2e;
}

.hero-panel::-webkit-scrollbar {
  width: 8px;
}

.hero-panel::-webkit-scrollbar-track {
  background: #1a1a2e;
  border-radius: 4px;
}

.hero-panel::-webkit-scrollbar-thumb {
  background: #4a4a6a;
  border-radius: 4px;
}
```

### 3.2 英雄卡片设计

```css
.hero-card {
  /* 尺寸 */
  width: 100%;
  padding: 12px 16px;
  
  /* 布局 */
  display: grid;
  grid-template-columns: 48px 1fr auto;
  gap: 12px;
  align-items: center;
  
  /* 视觉 */
  background: linear-gradient(135deg, #2d2640 0%, #252038 100%);
  border-radius: 10px;
  border: 2px solid transparent;
  
  /* 交互 */
  cursor: pointer;
  transition: all 0.2s ease;
}

.hero-card:hover {
  border-color: #6366f1;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.hero-card.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.hero-card.locked:hover {
  border-color: transparent;
  transform: none;
  box-shadow: none;
}

/* 英雄头像 */
.hero-avatar {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

/* 英雄信息 */
.hero-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero-name {
  font-family: 'Roboto', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
}

.hero-level {
  font-family: 'Roboto', sans-serif;
  font-size: 12px;
  color: #a0a0b0;
}

.hero-dps {
  font-family: 'Roboto', sans-serif;
  font-size: 13px;
  color: #4ade80;
  font-weight: 600;
}

/* 升级按钮 */
.hero-upgrade-btn {
  /* 尺寸 */
  padding: 8px 16px;
  min-width: 80px;
  
  /* 视觉 */
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: none;
  border-radius: 8px;
  
  /* 字体 */
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  
  /* 交互 */
  cursor: pointer;
  transition: all 0.15s ease;
}

.hero-upgrade-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

.hero-upgrade-btn:active {
  transform: scale(0.95);
}

.hero-upgrade-btn:disabled {
  background: linear-gradient(135deg, #4a4a5a 0%, #3a3a4a 100%);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.hero-upgrade-btn:disabled:hover {
  transform: none;
  box-shadow: none;
}

/* 升级成本显示 */
.upgrade-cost {
  font-size: 11px;
  color: #fbbf24;
  margin-top: 2px;
  text-align: center;
}
```

### 3.3 批量升级按钮

```css
.batch-upgrade-bar {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: rgba(40, 35, 55, 0.9);
  border-radius: 10px;
  margin-bottom: 12px;
}

.batch-btn {
  flex: 1;
  padding: 10px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-family: 'Roboto', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.batch-btn:hover {
  background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
  transform: translateY(-2px);
}

.batch-btn.active {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #1a1a2e;
}
```

---

## 4. 统计信息区域

### 4.1 顶部统计栏

```css
.stats-bar {
  /* 尺寸 */
  width: 100%;
  height: 64px;
  padding: 0 24px;
  
  /* 布局 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  
  /* 视觉 */
  background: linear-gradient(180deg, #1a1225 0%, #251a35 100%);
  border-bottom: 2px solid #3d3050;
}

.stat-item {
  /* 布局 */
  display: flex;
  align-items: center;
  gap: 10px;
  
  /* 视觉 */
  padding: 8px 16px;
  background: rgba(60, 50, 80, 0.5);
  border-radius: 10px;
}

.stat-icon {
  font-size: 24px;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-family: 'Roboto', sans-serif;
  font-size: 11px;
  color: #8888a0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-family: 'Roboto', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
}

/* 金币特殊样式 */
.stat-item.gold .stat-value {
  color: #fbbf24;
  text-shadow: 0 0 10px rgba(251, 191, 36, 0.3);
}

/* DPS特殊样式 */
.stat-item.dps .stat-value {
  color: #4ade80;
}

/* 区域特殊样式 */
.stat-item.zone .stat-value {
  color: #a78bfa;
}
```

### 4.2 金币增长动画

```css
.gold-increase {
  animation: goldPulse 0.3s ease-out;
}

@keyframes goldPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
    color: #fcd34d;
  }
  100% {
    transform: scale(1);
  }
}

/* 金币获得浮动文字 */
.gold-popup {
  position: absolute;
  font-family: 'Roboto', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #fbbf24;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  pointer-events: none;
  animation: goldFloat 1.5s ease-out forwards;
}

@keyframes goldFloat {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-60px);
  }
}
```

---

## 5. 视觉设计规范

### 5.1 颜色方案

```css
:root {
  /* 主色调 - 深紫主题 */
  --color-primary: #6366f1;
  --color-primary-dark: #4f46e5;
  --color-primary-light: #818cf8;
  
  /* 辅助色 */
  --color-secondary: #a78bfa;
  --color-secondary-dark: #8b5cf6;
  
  /* 强调色 */
  --color-accent-gold: #fbbf24;
  --color-accent-green: #4ade80;
  --color-accent-red: #ef4444;
  --color-accent-blue: #60a5fa;
  
  /* 背景色 */
  --color-bg-primary: #1a1225;
  --color-bg-secondary: #251a35;
  --color-bg-tertiary: #2d2640;
  --color-bg-card: #252038;
  
  /* 文字色 */
  --color-text-primary: #ffffff;
  --color-text-secondary: #a0a0b0;
  --color-text-muted: #6b6b7b;
  
  /* 边框色 */
  --color-border: #3d3050;
  --color-border-light: #4a4a6a;
  
  /* 状态色 */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
}
```

### 5.2 字体选择

```css
/* 导入字体 */
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap');

/* 字体变量 */
:root {
  --font-primary: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'Courier New', monospace;
}

/* 字体规格 */
.font-display {
  font-family: var(--font-primary);
  font-weight: 900;
  font-size: 32px;
}

.font-title {
  font-family: var(--font-primary);
  font-weight: 700;
  font-size: 24px;
}

.font-heading {
  font-family: var(--font-primary);
  font-weight: 700;
  font-size: 18px;
}

.font-body {
  font-family: var(--font-primary);
  font-weight: 400;
  font-size: 14px;
}

.font-caption {
  font-family: var(--font-primary);
  font-weight: 500;
  font-size: 12px;
}

.font-number {
  font-family: var(--font-primary);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
```

### 5.3 按钮样式系统

```css
/* 基础按钮 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  font-family: var(--font-primary);
  font-size: 14px;
  font-weight: 700;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn:hover {
  transform: translateY(-2px);
}

.btn:active {
  transform: translateY(0) scale(0.98);
}

/* 主要按钮 */
.btn-primary {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
}

.btn-primary:hover {
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
}

/* 成功按钮 */
.btn-success {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(34, 197, 94, 0.4);
}

/* 危险按钮 */
.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
}

/* 幽灵按钮 */
.btn-ghost {
  background: transparent;
  border: 2px solid var(--color-border-light);
  color: var(--color-text-secondary);
}

.btn-ghost:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* 禁用状态 */
.btn:disabled {
  background: linear-gradient(135deg, #4a4a5a 0%, #3a3a4a 100%);
  color: #6b6b7b;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
```

### 5.4 动画效果规格

```css
/* 入场动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 脉冲动画 */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* 发光动画 */
@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 5px var(--color-primary);
  }
  50% {
    box-shadow: 0 0 20px var(--color-primary), 0 0 40px var(--color-primary);
  }
}

/* 旋转动画 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 弹跳动画 */
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* 闪烁动画 */
@keyframes flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 震动动画 */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

/* 应用类 */
.animate-fadeIn { animation: fadeIn 0.3s ease-out; }
.animate-slideInUp { animation: slideInUp 0.4s ease-out; }
.animate-pulse { animation: pulse 2s infinite; }
.animate-glow { animation: glow 2s infinite; }
.animate-bounce { animation: bounce 1s infinite; }
```

---

## 6. HTML/CSS代码实现

### 6.1 完整HTML结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>点击英雄 - Clicker Heroes</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <!-- 游戏主容器 -->
  <div class="game-container">
    
    <!-- 顶部统计栏 -->
    <header class="stats-bar">
      <div class="stat-item gold">
        <span class="stat-icon">💰</span>
        <div class="stat-content">
          <span class="stat-label">金币</span>
          <span class="stat-value" id="gold-display">1.5M</span>
        </div>
      </div>
      
      <div class="stat-item dps">
        <span class="stat-icon">⚔️</span>
        <div class="stat-content">
          <span class="stat-label">每秒伤害</span>
          <span class="stat-value" id="dps-display">2.3K</span>
        </div>
      </div>
      
      <div class="stat-item click">
        <span class="stat-icon">👆</span>
        <div class="stat-content">
          <span class="stat-label">点击伤害</span>
          <span class="stat-value" id="click-damage-display">156</span>
        </div>
      </div>
      
      <div class="stat-item zone">
        <span class="stat-icon">🎯</span>
        <div class="stat-content">
          <span class="stat-label">当前区域</span>
          <span class="stat-value" id="zone-display">5-3</span>
        </div>
      </div>
    </header>
    
    <!-- 主游戏区域 -->
    <main class="game-main">
      
      <!-- 左侧英雄面板 -->
      <aside class="hero-panel-container">
        <!-- 批量升级栏 -->
        <div class="batch-upgrade-bar">
          <button class="batch-btn active" data-amount="1">x1</button>
          <button class="batch-btn" data-amount="10">x10</button>
          <button class="batch-btn" data-amount="100">x100</button>
          <button class="batch-btn" data-amount="max">MAX</button>
        </div>
        
        <!-- 英雄列表 -->
        <div class="hero-panel" id="hero-panel">
          <!-- 英雄卡片示例 -->
          <div class="hero-card" data-hero-id="1">
            <div class="hero-avatar">⚔️</div>
            <div class="hero-info">
              <span class="hero-name">见习骑士</span>
              <span class="hero-level">等级 25</span>
              <span class="hero-dps">DPS: 156</span>
            </div>
            <div class="hero-actions">
              <button class="hero-upgrade-btn">
                升级
                <span class="upgrade-cost">💰 1.2K</span>
              </button>
            </div>
          </div>
          
          <div class="hero-card" data-hero-id="2">
            <div class="hero-avatar">🏹</div>
            <div class="hero-info">
              <span class="hero-name">精灵弓箭手</span>
              <span class="hero-level">等级 18</span>
              <span class="hero-dps">DPS: 423</span>
            </div>
            <div class="hero-actions">
              <button class="hero-upgrade-btn">
                升级
                <span class="upgrade-cost">💰 5.6K</span>
              </button>
            </div>
          </div>
          
          <div class="hero-card locked" data-hero-id="3">
            <div class="hero-avatar">🔮</div>
            <div class="hero-info">
              <span class="hero-name">神秘法师</span>
              <span class="hero-level">未解锁</span>
              <span class="hero-dps">解锁需要: 💰 50K</span>
            </div>
            <div class="hero-actions">
              <button class="hero-upgrade-btn" disabled>
                解锁
              </button>
            </div>
          </div>
        </div>
      </aside>
      
      <!-- 中央怪物区域 -->
      <section class="monster-area" id="monster-area">
        <!-- 怪物名称 -->
        <div class="monster-name">史莱姆王</div>
        
        <!-- 怪物精灵 -->
        <div class="monster-sprite-container">
          <div class="monster-sprite" id="monster-sprite">
            <!-- 怪物图像/动画 -->
            <svg viewBox="0 0 200 200" class="monster-svg">
              <!-- 简化的怪物SVG -->
              <circle cx="100" cy="100" r="80" fill="#7c3aed" opacity="0.8"/>
              <circle cx="70" cy="80" r="15" fill="#fff"/>
              <circle cx="130" cy="80" r="15" fill="#fff"/>
              <circle cx="70" cy="80" r="8" fill="#000"/>
              <circle cx="130" cy="80" r="8" fill="#000"/>
              <ellipse cx="100" cy="130" rx="30" ry="20" fill="#4c1d95"/>
            </svg>
          </div>
        </div>
        
        <!-- HP血条 -->
        <div class="hp-bar-container">
          <div class="hp-bar-fill" id="hp-bar" style="--hp-percentage: 65%;"></div>
          <span class="hp-text" id="hp-text">6,500 / 10,000</span>
        </div>
        
        <!-- 伤害数字容器 -->
        <div class="damage-numbers-container" id="damage-container"></div>
      </section>
      
      <!-- 右侧详情面板 -->
      <aside class="detail-panel">
        <div class="detail-card">
          <h3>英雄详情</h3>
          <div class="detail-content">
            <p>选择一个英雄查看详细信息</p>
          </div>
        </div>
        
        <div class="detail-card">
          <h3>成就进度</h3>
          <div class="achievement-list">
            <div class="achievement-item">
              <span class="achievement-icon">🏆</span>
              <span class="achievement-name">首次击杀</span>
              <span class="achievement-progress">1/1</span>
            </div>
            <div class="achievement-item">
              <span class="achievement-icon">💎</span>
              <span class="achievement-name">百万富翁</span>
              <span class="achievement-progress">1.5M/1M</span>
            </div>
          </div>
        </div>
      </aside>
      
    </main>
  </div>
  
  <!-- 游戏脚本 -->
  <script src="game.js"></script>
</body>
</html>
```

### 6.2 完整CSS样式

```css
/* ===== 基础重置和变量 ===== */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap');

:root {
  /* 颜色变量 */
  --color-primary: #6366f1;
  --color-primary-dark: #4f46e5;
  --color-primary-light: #818cf8;
  --color-secondary: #a78bfa;
  --color-accent-gold: #fbbf24;
  --color-accent-green: #4ade80;
  --color-accent-red: #ef4444;
  --color-bg-primary: #1a1225;
  --color-bg-secondary: #251a35;
  --color-bg-card: #252038;
  --color-text-primary: #ffffff;
  --color-text-secondary: #a0a0b0;
  --color-border: #3d3050;
  
  /* 字体 */
  --font-primary: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
  
  /* 间距 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* 圆角 */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
}

/* ===== 基础样式 ===== */
body {
  font-family: var(--font-primary);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  min-height: 100vh;
  overflow-x: hidden;
}

/* ===== 游戏容器 ===== */
.game-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ===== 统计栏 ===== */
.stats-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  background: linear-gradient(180deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);
  border-bottom: 2px solid var(--color-border);
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(60, 50, 80, 0.5);
  border-radius: var(--radius-md);
  min-width: 140px;
}

.stat-icon {
  font-size: 24px;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 11px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.stat-item.gold .stat-value {
  color: var(--color-accent-gold);
}

.stat-item.dps .stat-value {
  color: var(--color-accent-green);
}

.stat-item.zone .stat-value {
  color: var(--color-secondary);
}

/* ===== 主游戏区域 ===== */
.game-main {
  display: grid;
  grid-template-columns: 320px 1fr 280px;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  flex: 1;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

/* ===== 英雄面板 ===== */
.hero-panel-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.batch-upgrade-bar {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: rgba(40, 35, 55, 0.9);
  border-radius: var(--radius-md);
}

.batch-btn {
  flex: 1;
  padding: 10px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-family: var(--font-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.batch-btn:hover {
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 100%);
  transform: translateY(-2px);
}

.batch-btn.active {
  background: linear-gradient(135deg, var(--color-accent-gold) 0%, #f59e0b 100%);
  color: var(--color-bg-primary);
}

.hero-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  padding-right: var(--spacing-sm);
}

.hero-card {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  gap: var(--spacing-md);
  align-items: center;
  padding: var(--spacing-md);
  background: linear-gradient(135deg, #2d2640 0%, var(--color-bg-card) 100%);
  border-radius: var(--radius-md);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.hero-card:hover {
  border-color: var(--color-primary);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.hero-card.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.hero-card.locked:hover {
  border-color: transparent;
  transform: none;
  box-shadow: none;
}

.hero-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, var(--color-primary-dark) 0%, #7c3aed 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.hero-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hero-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.hero-level {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.hero-dps {
  font-size: 13px;
  color: var(--color-accent-green);
  font-weight: 600;
}

.hero-upgrade-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 14px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font-primary);
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.hero-upgrade-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

.hero-upgrade-btn:disabled {
  background: linear-gradient(135deg, #4a4a5a 0%, #3a3a4a 100%);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.upgrade-cost {
  font-size: 10px;
  color: var(--color-accent-gold);
  margin-top: 2px;
}

/* ===== 怪物区域 ===== */
.monster-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
  background: radial-gradient(ellipse at center, #2a1f3d 0%, var(--color-bg-primary) 100%);
  border-radius: var(--radius-lg);
  position: relative;
  min-height: 500px;
}

.monster-name {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.monster-sprite-container {
  position: relative;
}

.monster-sprite {
  width: 240px;
  height: 240px;
  cursor: pointer;
  user-select: none;
  transition: transform 0.1s ease;
}

.monster-sprite:active {
  transform: scale(0.95);
}

.monster-sprite:hover {
  filter: brightness(1.1);
}

.monster-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.5));
}

.hp-bar-container {
  width: 70%;
  max-width: 450px;
  height: 28px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 14px;
  border: 2px solid #4a4a4a;
  overflow: hidden;
  position: relative;
}

.hp-bar-fill {
  height: 100%;
  width: var(--hp-percentage, 100%);
  background: linear-gradient(90deg, 
    var(--color-accent-green) 0%,
    #fbbf24 50%,
    var(--color-accent-red) 100%
  );
  transition: width 0.2s ease-out;
  position: relative;
}

.hp-bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 0.3) 0%,
    transparent 100%
  );
}

.hp-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
}

.damage-numbers-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

/* ===== 详情面板 ===== */
.detail-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.detail-card {
  background: linear-gradient(135deg, #2d2640 0%, var(--color-bg-card) 100%);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
}

.detail-card h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
}

.achievement-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: rgba(60, 50, 80, 0.3);
  border-radius: var(--radius-sm);
}

.achievement-icon {
  font-size: 20px;
}

.achievement-name {
  flex: 1;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.achievement-progress {
  font-size: 12px;
  color: var(--color-accent-gold);
  font-weight: 600;
}

/* ===== 动画 ===== */
.damage-number {
  position: absolute;
  font-size: 22px;
  font-weight: 900;
  color: var(--color-text-primary);
  text-shadow: 
    2px 2px 0 #000,
    -1px -1px 0 #000,
    1px -1px 0 #000,
    -1px 1px 0 #000;
  pointer-events: none;
  animation: damageFloat 1s ease-out forwards;
}

.damage-number.critical {
  font-size: 32px;
  color: var(--color-accent-gold);
  animation: damageFloatCritical 1.2s ease-out forwards;
}

@keyframes damageFloat {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  20% {
    transform: translateY(-30px) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translateY(-80px) scale(0.8);
  }
}

@keyframes damageFloatCritical {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1.5);
  }
  10% {
    transform: translateY(-20px) scale(2);
  }
  30% {
    transform: translateY(-40px) scale(1.8);
  }
  100% {
    opacity: 0;
    transform: translateY(-100px) scale(1);
  }
}

.click-effect {
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: radial-gradient(circle, 
    rgba(255, 255, 255, 0.8) 0%,
    rgba(255, 200, 100, 0.4) 40%,
    transparent 70%
  );
  pointer-events: none;
  animation: clickRipple 0.4s ease-out forwards;
}

@keyframes clickRipple {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(3);
    opacity: 0;
  }
}

.monster-hit {
  animation: monsterShake 0.15s ease-in-out;
}

@keyframes monsterShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px) rotate(-2deg); }
  75% { transform: translateX(8px) rotate(2deg); }
}

/* ===== 响应式布局 ===== */
@media (max-width: 1200px) {
  .game-main {
    grid-template-columns: 280px 1fr;
  }
  
  .detail-panel {
    display: none;
  }
}

@media (max-width: 768px) {
  .game-main {
    grid-template-columns: 1fr;
    padding: var(--spacing-md);
  }
  
  .hero-panel-container {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--color-bg-primary);
    border-top: 2px solid var(--color-border);
    padding: var(--spacing-md);
    z-index: 100;
    max-height: 40vh;
  }
  
  .hero-panel {
    max-height: 30vh;
  }
  
  .monster-area {
    min-height: 350px;
    margin-bottom: 40vh;
  }
  
  .monster-sprite {
    width: 180px;
    height: 180px;
  }
  
  .stats-bar {
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
  }
  
  .stat-item {
    min-width: auto;
    padding: var(--spacing-xs) var(--spacing-sm);
  }
  
  .stat-value {
    font-size: 14px;
  }
}

/* ===== 滚动条样式 ===== */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-primary);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #4a4a6a;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #5a5a7a;
}
```

### 6.3 JavaScript交互示例

```javascript
// 游戏状态
const gameState = {
  gold: 1500000,
  totalDPS: 2300,
  clickDamage: 156,
  currentZone: { world: 5, level: 3 },
  monsterHP: 6500,
  monsterMaxHP: 10000
};

// DOM元素
const monsterSprite = document.getElementById('monster-sprite');
const monsterArea = document.getElementById('monster-area');
const damageContainer = document.getElementById('damage-container');
const hpBar = document.getElementById('hp-bar');
const hpText = document.getElementById('hp-text');

// 点击怪物
monsterSprite.addEventListener('click', (e) => {
  const rect = monsterSprite.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // 造成伤害
  dealDamage(gameState.clickDamage, x, y, false);
  
  // 怪物受击动画
  monsterSprite.classList.add('monster-hit');
  setTimeout(() => monsterSprite.classList.remove('monster-hit'), 150);
  
  // 点击波纹效果
  createClickEffect(e.clientX, e.clientY);
});

// 造成伤害
function dealDamage(damage, x, y, isCritical) {
  // 显示伤害数字
  showDamageNumber(damage, x, y, isCritical);
  
  // 更新怪物血量
  gameState.monsterHP = Math.max(0, gameState.monsterHP - damage);
  updateHPBar();
  
  // 检查怪物死亡
  if (gameState.monsterHP <= 0) {
    onMonsterDefeated();
  }
}

// 显示伤害数字
function showDamageNumber(damage, x, y, isCritical) {
  const damageEl = document.createElement('div');
  damageEl.className = `damage-number ${isCritical ? 'critical' : ''}`;
  damageEl.textContent = formatNumber(damage);
  
  // 随机偏移
  const offsetX = (Math.random() - 0.5) * 60;
  const offsetY = (Math.random() - 0.5) * 40;
  
  damageEl.style.left = `${x + offsetX}px`;
  damageEl.style.top = `${y + offsetY}px`;
  
  damageContainer.appendChild(damageEl);
  
  // 动画结束后移除
  setTimeout(() => damageEl.remove(), 1200);
}

// 创建点击效果
function createClickEffect(x, y) {
  const effect = document.createElement('div');
  effect.className = 'click-effect';
  
  const rect = monsterArea.getBoundingClientRect();
  effect.style.left = `${x - rect.left - 30}px`;
  effect.style.top = `${y - rect.top - 30}px`;
  
  monsterArea.appendChild(effect);
  
  setTimeout(() => effect.remove(), 400);
}

// 更新血条
function updateHPBar() {
  const percentage = (gameState.monsterHP / gameState.monsterMaxHP) * 100;
  hpBar.style.setProperty('--hp-percentage', `${percentage}%`);
  hpText.textContent = `${formatNumber(gameState.monsterHP)} / ${formatNumber(gameState.monsterMaxHP)}`;
}

// 格式化数字
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// 怪物被击败
function onMonsterDefeated() {
  // 奖励金币
  const reward = Math.floor(gameState.monsterMaxHP * 0.1);
  gameState.gold += reward;
  
  // 刷新怪物
  gameState.monsterMaxHP = Math.floor(gameState.monsterMaxHP * 1.15);
  gameState.monsterHP = gameState.monsterMaxHP;
  updateHPBar();
  
  // 更新UI
  document.getElementById('gold-display').textContent = formatNumber(gameState.gold);
}

// DPS自动伤害
setInterval(() => {
  if (gameState.monsterHP > 0 && gameState.totalDPS > 0) {
    const dpsDamage = gameState.totalDPS / 10; // 每100ms计算一次
    const rect = monsterSprite.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    dealDamage(dpsDamage, centerX, centerY, false);
  }
}, 100);

// 批量升级按钮
document.querySelectorAll('.batch-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.batch-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// 英雄升级
document.querySelectorAll('.hero-upgrade-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const card = btn.closest('.hero-card');
    if (!card.classList.contains('locked')) {
      // 执行升级逻辑
      console.log('升级英雄:', card.dataset.heroId);
    }
  });
});
```

---

## 7. 设计总结

### 7.1 核心设计原则

1. **清晰的信息层次**: 金币、DPS等关键数据始终可见
2. **即时反馈**: 每次点击都有视觉和数值反馈
3. **渐进式复杂度**: 新玩家容易上手，老玩家有深度内容
4. **视觉吸引力**: 深紫主题配合金色强调，营造奇幻氛围

### 7.2 交互设计亮点

- 怪物受击震动 + 点击波纹效果
- 浮动伤害数字（普通/暴击区分）
- 批量升级快速操作
- 英雄卡片悬停效果
- 金币增长脉冲动画

### 7.3 响应式策略

- 桌面端：三列布局，完整功能
- 平板端：隐藏详情面板，保持核心玩法
- 移动端：英雄面板变为底部抽屉，优化触摸操作

---

*文档版本: 1.0*  
*最后更新: 2024年*
