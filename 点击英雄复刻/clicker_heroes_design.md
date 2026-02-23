# 《点击英雄》综合设计文档

## 项目概述
复刻经典放置类游戏《Clicker Heroes》，实现核心玩法：点击杀怪、获得金币、升级英雄、推进区域。

## 核心机制摘要

### 数值公式
```javascript
// 怪物HP = 10 × (1.6 ^ (zone - 1))
// 金币掉落 = 1 × (1.15 ^ (zone - 1)) × (Boss?×10:1)
// 英雄升级成本 = baseCost × (1.07 ^ (level - 1))
```

### 游戏循环
1. 点击/自动攻击怪物 → 造成伤害
2. 怪物死亡 → 获得金币
3. 使用金币 → 升级英雄
4. 击杀10个怪物 → 推进到下一区域
5. 每5区域 → Boss战（30秒限时）

## 技术架构
- **渲染**: DOM + Canvas混合（DOM用于UI，Canvas用于怪物和特效）
- **状态**: 中心化GameState + 观察者模式
- **循环**: requestAnimationFrame，60fps
- **存储**: localStorage自动保存

## UI布局
- 顶部: 统计栏（金币、DPS、区域、点击伤害）
- 中央: 怪物区域（大怪物、HP条、伤害数字）
- 左侧: 英雄列表面板
- 右侧: 升级详情面板

## 文件结构
```
clicker-heroes/
├── index.html
├── css/main.css
├── js/
│   ├── core/Game.js
│   ├── core/GameState.js
│   ├── entities/Monster.js
│   ├── entities/Hero.js
│   ├── systems/CombatSystem.js
│   ├── utils/SaveManager.js
│   └── data/heroes.js
└── assets/
```

## 实现优先级
1. 核心游戏循环（点击、伤害、金币）
2. 英雄系统和升级
3. 区域推进和Boss战
4. 视觉特效和动画
5. 存档系统
