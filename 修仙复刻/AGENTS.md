# AGENTS.md - 指数修仙：丹药无双 (副本秘宝版)

> 本文档供 AI 编码助手阅读，用于理解本项目架构和开发规范。

## 项目概述

本项目是一个**单机修仙题材的放置/挂机类 HTML5 游戏**。

- **游戏名称**: 指数修仙：丹药无双 (副本秘宝版)
- **核心玩法**: 自动战斗、装备收集、法则修炼、副本挑战、秘宝养成
- **技术特点**: 纯前端实现，支持极大数值（指数级 BigNum 系统）

## 技术栈

| 类型 | 技术 |
|------|------|
| 标记语言 | HTML5 |
| 样式 | CSS3 (原生，无预处理器) |
| 脚本 | JavaScript (ES6+，原生，无框架) |
| 构建工具 | 无（直接运行） |
| 依赖管理 | 无外部依赖 |

## 文件结构

```
e:\AI游戏尝试\修仙复刻/
├── index.html                          # 主入口文件
├── css/
│   └── style.css                       # 样式文件
├── js/
│   ├── core/
│   │   └── BigNum.js                   # 大数值计算类
│   ├── config.js                       # 游戏配置常量
│   ├── utils.js                        # 工具函数
│   ├── classes/
│   │   ├── Item.js                     # 装备/丹药生成类
│   │   ├── Treasure.js                 # 秘宝物品类
│   │   └── Dungeon.js                  # 副本系统管理类
│   └── game/
│       └── Game.js                     # 主游戏控制类
└── AGENTS.md                           # 本文件
```

## 核心系统说明

### 1. 大数值系统 (BigNum)
- 使用 `{m: 尾数, e: 指数}` 结构表示极大数值
- 支持加减乘除、幂运算、对数运算
- 自动格式化显示（小数值直接显示，大值使用科学计数法）

### 2. 游戏模式
| 模式 | 常量 | 说明 |
|------|------|------|
| 荒野 | `wild` | 主线模式，击败BOSS提升难度层级 |
| 通天塔 | `tower` | 无尽挑战，掉落法则真意 |
| 副本 | `dungeon` | 3波敌人挑战，通关获得秘宝宝箱 |

### 3. 养成系统
- **装备系统**: 12个部位，自动替换评分更高的装备
- **法则修炼**: 消耗真意提升攻击/生命倍率（指数增长）
- **秘宝系统**: 6个槽位，提供指数级属性加成

### 4. 战斗系统
- 每秒一个回合（`combatTurn`）
- 玩家自动攻击，30%概率触发群攻技能
- 副本模式有特殊的伤害压缩机制（对数转换）

## 关键配置常量

```javascript
SCALE_ENEMY = 2.155          // 敌人强度成长系数
SCALE_EQUIP = 1.2            // 装备数值成长系数
SCALE_PILL = 1.3             // 丹药数值成长系数
SCALE_TOWER_STR = 10.0       // 通天塔敌人强度系数
SCALE_TOWER_DROP = 2.0       // 通天塔掉落成长系数
```

## 数据结构设计

### 玩家基础属性
```javascript
{
    hp: BigNum,          // 基础生命值
    atk: BigNum,         // 基础攻击力
    crit: number         // 暴击率(%)
}
```

### 装备物品结构
```javascript
{
    id: string,          // 唯一标识
    type: string,        // 部位类型
    name: string,        // 显示名称
    quality: number,     // 品质(1-5)
    level: number,       // 等级
    atk: BigNum,         // 攻击加成
    hp: BigNum,          // 生命加成
    crit: number         // 暴击加成
}
```

### 秘宝结构
```javascript
{
    id: string,
    slot: string,        // 槽位(天/地/玄/黄/宇/宙)
    qKey: string,        // 品质(N/R/SR/SSR/UR)
    level: number,       // 等级
    attrType: object,    // 属性类型
    val: BigNum,         // 主属性值
    hasExtra: boolean,   // 是否有额外属性
    extraVal: BigNum,    // 额外属性值
    isLocked: boolean    // 是否锁定
}
```

## UI 更新约定

- `updateStatsUI()` - 更新左侧面板属性显示
- `updateSystemUI()` - 更新右侧系统面板数据
- `updateCombatUI(force)` - 更新战斗场景（force=true 强制重绘）
- `updateTreasureUI()` - 更新秘宝界面
- `updateEquipUI()` - 更新装备格子
- `log(type, msg)` - 添加战斗日志（type: SYS/GAIN/SKILL）

## 编码规范

### 命名风格
- 类名: `PascalCase` (如 `BigNum`, `Game`)
- 方法/变量: `camelCase`
- 常量: `UPPER_SNAKE_CASE`
- 配置对象键: 根据语义使用中文或英文

### 数值运算约定
- 所有可能变大的数值必须使用 `BigNum` 类
- 比较使用 `.gt()`, `.gte()`, `.lt()`, `.lte()`, `.eq()`
- 显示时使用 `formatNum()` 函数格式化

### 事件处理
- DOM 事件直接绑定到 `game` 实例方法
- 右键菜单使用 `oncontextmenu` + `event.preventDefault()`

## 开发调试

### 金手指系统
点击右上角 🔥 金手指 按钮可打开调试面板，支持：
- 修改基础攻击/生命值
- 恢复当前生命
- 增加法则真意
- 增加秘宝宝箱/碎片/次数

### 兑换码
在秘宝阁输入 `VIP666` 可获得额外开启次数

## 修改注意事项

1. **数值平衡**: 修改 `SCALE_` 开头的常量会显著影响游戏进度节奏
2. **UI 更新**: 修改数据后务必调用对应的 update 方法
3. **BigNum 运算**: 避免直接使用原生数字运算，防止精度丢失
4. **游戏循环**: 核心循环在 `loop()` 方法中，每秒执行 `combatTurn()`

## 运行方式

直接在浏览器中打开 `index.html` 文件即可运行，无需服务器环境。

```bash
# 本地启动（可选）
python -m http.server 8000
# 然后访问 http://localhost:8000/index.html
```

## 浏览器兼容性

- Chrome 60+
- Firefox 60+
- Edge 79+
- Safari 12+

（使用了 ES6 Class、Template Literal、Arrow Function 等现代特性）
