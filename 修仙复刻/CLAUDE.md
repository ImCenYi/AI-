# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目简介

「指数修仙：丹药无双 (副本秘宝版)」— 纯前端修仙放置类 HTML5 游戏。零依赖、零构建工具，vanilla JS + ES6 Class。

详细的数据结构、配置常量、编码规范等参见 `AGENTS.md`。

## 运行方式

直接浏览器打开 `index.html`，或：
```bash
python -m http.server 8000
# 访问 http://localhost:8000/index.html
```

无 package.json、无构建流程、无测试框架、无 linter。

## 脚本加载顺序（严格依赖）

`index.html` 中按以下顺序加载，**顺序不可调换**：

1. `js/core/BigNum.js` — 大数值基础库，无依赖
2. `js/config.js` — 常量定义，无依赖
3. `js/utils.js` — 工具函数，依赖 BigNum
4. `js/classes/Item.js` — 装备/丹药，依赖 BigNum + config + utils
5. `js/classes/Treasure.js` — 秘宝，依赖 BigNum + config + utils
6. `js/classes/Dungeon.js` — 副本系统，依赖 config，运行时持有 Game 引用
7. `js/classes/LifeEssenceRefinement.js` — 炼体系统
8. `js/classes/SpiritGarden.js` — 百草灵园系统
9. `js/classes/AncientTreasure.js` — 大千宝录古宝系统
10. `js/classes/AbyssRelic.js` — 深渊遗宝系统
11. `js/classes/AbyssDungeon.js` — 深渊战场系统
12. `js/game/Game.js` — 主控制器，依赖以上全部

初始化入口：`index.html` 底部 `const game = new Game()`，创建全局单例。

## 核心架构要点

### Game 主循环

- `loop()` 通过 `requestAnimationFrame` 持续运行
- 每帧执行 5% 最大生命值回复（注意：是每帧而非每秒，回复速度极快）
- 每秒触发一次 `combatTurn()`（通过时间差判断）
- 战斗流程：玩家攻击第一个敌人 → 30% 概率群攻 → 所有敌人反击

### BigNum 精度策略

- 内部表示：`{m: 尾数, e: 指数}`，尾数始终归一化到 [1, 10)
- 加法精度截断：指数差 > 15 时忽略小数（不影响游戏体验）
- 幂运算使用对数转换：`(m*10^e)^p = 10^(p*(log10(m)+e))`
- `toNumber()` 在指数 > 308 时返回 Infinity
- 显示阈值：指数 < 6 显示原数，≥ 6 用科学计数法
- **指数加成**: `expBonus()` 方法用于炼体加成，直接对指数部分进行百分比加成

### 副本伤害压缩

副本模式使用对数压缩避免数值膨胀碾压：
- 玩家有效攻击力 = `(log10(ATK))^2`
- 玩家有效生命值 = `(log10(maxHP))^2 * 5`
- 敌人数值基于 `(level * 100)^2` 二次方缩放

### 五模式切换

`game.mode` 取值 `'wild'` | `'tower'` | `'dungeon'` | `'abyss'`，通过 `changeMode()` 切换。切换时重置敌人列表和战斗状态。

### 属性计算链（重要！）

最终属性 = ((基础值 + 装备值) × 法则倍率 × 秘宝全属性倍率 × 遗宝全属性倍率 × 境界加成 × 古宝倍率 × 肉身乘算) 然后指数+肉身蜕变%

各系统加成类型：
- **法则修炼**: 攻击/生命独立倍率 (乘算)
- **秘宝**: 全属性倍率 (乘算)、爬塔掉率、丹药倍率
- **深渊遗宝**: 全属性倍率 (乘算)、爬塔掉率 (乘算)、丹药倍率 (乘算)、装备/秘宝等级 (加算)
- **境界**: 全属性倍率 1.05^境界等级
- **炼体锻身**: 前9次×1.1乘算，最后1次指数+0.1%
- **大千宝录**: 全属性倍率 (乘算)

### DOM 事件绑定

所有交互通过 HTML 内联 `onclick`/`oncontextmenu` 绑定到全局 `game` 实例方法，不使用 addEventListener。

## 子系统架构

### 百草灵园 (SpiritGarden)

- 16块土地，初始解锁4块，灵石解锁后续
- 70种灵植 (7基础类型 × 10转)，每转数值100倍增长
- 灵植经验自动转化为法则真意 (10%转化率)
- 炼体锻身使用生灵精华，独立循环成长系统

### 深渊遗宝 (AbyssRelic)

- 5个BOSS，每个BOSS有独立的22件遗宝池
- 品质 N/R/SR/SSR/UR，各有等级上限和碎片价值
- 重复获得自动升级，满级自动分解
- 碎片可兑换任意遗宝
- 每日掉落上限21次，每次掉落3个，有保底品质

### 大千宝录 (AncientTreasure)

- 6个界域标签，每个界域有多品质古宝
- 古宝可升级，消耗碎片
- 总倍率 = 所有古宝倍率相乘
- 寻宝令抽卡，UR保底40抽

### 炼体锻身 (LifeEssenceRefinement)

- 轮次制，每轮10次淬炼
- 前9次：肉身乘算 ×1.1
- 第10次：肉身蜕变，指数+0.1%
- 消耗生灵精华（来自灵植收获）

## 修改代码时的关键注意

- 所有可能增长到大数的值必须用 `BigNum`，不能用原生 Number
- 修改数据后必须调用对应的 `updateXxxUI()` 方法刷新界面
- `config.js` 中 `SCALE_` 开头的常量直接影响游戏数值平衡，改动需谨慎
- 新增脚本文件需在 `index.html` 中按依赖顺序插入 `<script>` 标签
- CSS 品质颜色类：装备用 `.q-1` 到 `.q-5`，秘宝用 `.t-n/.t-r/.t-sr/.t-ssr/.t-ur`
- 深渊遗宝配置在 `config.js` 底部，包含 `ABYSS_BOSSES`、`RELIC_QUALITIES`、`ABYSS_RELIC_POOLS`
