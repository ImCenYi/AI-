# 《点击英雄》(Clicker Heroes) 完整内容系统设计

---

## 一、英雄角色系统

### 1.1 英雄基础属性说明

| 属性 | 说明 |
|------|------|
| 基础DPS | 英雄1级时的每秒伤害 |
| 基础成本 | 购买英雄1级的金币成本 |
| 成本增长系数 | 每升1级，成本乘以该系数（通常1.07-1.15） |
| 特殊能力解锁等级 | 达到该等级后解锁特殊能力 |

### 1.2 英雄详细设计（15位英雄）

#### 英雄1：Cid, the Helpful Adventurer（热心冒险者希德）
| 属性 | 数值 |
|------|------|
| 基础DPS | 0（不自动攻击，增强点击伤害） |
| 基础成本 | 5 金币 |
| 成本增长系数 | 1.07 |
| 类型 | 点击伤害型 |

**特殊能力：**
| 等级 | 能力名称 | 效果 |
|------|----------|------|
| 10 | 点击强化 | 点击伤害 +100% |
| 25 | 精准打击 | 点击伤害 +100% |
| 50 | 暴击训练 | 点击伤害 +100% |
| 75 | 力量爆发 | 点击伤害 +150% |
| 100 | 终极点击 | 点击伤害 +200% |

---

#### 英雄2：Treebeast（树兽）
| 属性 | 数值 |
|------|------|
| 基础DPS | 5 |
| 基础成本 | 50 金币 |
| 成本增长系数 | 1.07 |
| 类型 | 基础DPS型 |

**特殊能力：**
| 等级 | 能力名称 | 效果 |
|------|----------|------|
| 10 | 树皮硬化 | DPS +100% |
| 25 | 根系蔓延 | DPS +100% |
| 50 | 自然之力 | DPS +100% |
| 75 | 森林守护 | DPS +150% |
| 100 | 远古树人 | DPS +200% |

---

#### 英雄3：Ivan, the Drunken Brawler（醉拳伊万）
| 属性 | 数值 |
|------|------|
| 基础DPS | 22 |
| 基础成本 | 250 金币 |
| 成本增长系数 | 1.07 |
| 类型 | DPS型 |

**特殊能力：**
| 等级 | 能力名称 | 效果 |
|------|----------|------|
| 10 | 醉拳奥义 | DPS +100% |
| 25 | 酒瓶乱舞 | DPS +100% |
| 50 | 狂暴模式 | DPS +100% |
| 75 | 千杯不醉 | DPS +150% |
| 100 | 酒神附体 | DPS +200% |

---

#### 英雄4：Brittany, Beach Princess（海滩公主布列塔尼）
| 属性 | 数值 |
|------|------|
| 基础DPS | 74 |
| 基础成本 | 1,000 金币 |
| 成本增长系数 | 1.07 |
| 类型 | DPS型 |

**特殊能力：**
| 等级 | 能力名称 | 效果 |
|------|----------|------|
| 10 | 海浪之力 | DPS +100% |
| 25 | 贝壳护盾 | DPS +100% |
| 50 | 潮汐召唤 | DPS +100% |
| 75 | 海洋之心 | DPS +150% |
| 100 | 海皇祝福 | DPS +200% |

---

#### 英雄5：The Wandering Fisherman（流浪渔夫）
| 属性 | 数值 |
|------|------|
| 基础DPS | 245 |
| 基础成本 | 4,000 金币 |
| 成本增长系数 | 1.07 |
| 类型 | DPS型 |

**特殊能力：**
| 等级 | 能力名称 | 效果 |
|------|----------|------|
| 10 | 大鱼上钩 | DPS +100% |
| 25 | 渔网捕捉 | DPS +100% |
| 50 | 深海猎手 | DPS +100% |
| 75 | 传奇钓竿 | DPS +150% |
| 100 | 海神之怒 | DPS +200% |

---

#### 英雄6：Betty Clicker（贝蒂点击者）
| 属性 | 数值 |
|------|------|
| 基础DPS | 976 |
| 基础成本 | 20,000 金币 |
| 成本增长系数 | 1.07 |
| 类型 | DPS型 |

**特殊能力：**
| 等级 | 能力名称 | 效果 |
|------|----------|------|
| 10 | 快速点击 | DPS +100% |
| 25 | 连击大师 | DPS +100% |
| 50 | 点击风暴 | DPS +100% |
| 75 | 极限手速 | DPS +150% |
| 100 | 点击之神 | DPS +200% |

---

#### 英雄7：The Masked Samurai（蒙面武士）
| 属性 | 数值 |
|------|------|
| 基础DPS | 3,725 |
| 基础成本 | 100,000 金币 |
| 成本增长系数 | 1.07 |
| 类型 | 高DPS型 |

**特殊能力：**
| 等级 | 能力名称 | 效果 |
|------|----------|------|
| 10 | 居合斩 | DPS +100% |
| 25 | 二刀流 | DPS +100% |
| 50 | 剑气纵横 | DPS +100% |
| 75 | 无我境界 | DPS +150% |
| 100 | 剑圣之道 | DPS +200% |

---

#### 英雄8：Leon（里昂）
| 属性 | 数值 |
|------|------|
| 基础DPS | 10,859 |
| 基础成本 | 400,000 金币 |
| 成本增长系数 | 1.07 |
| 类型 | DPS型 |

**特殊能力：**
| 等级 | 能力名称 | 效果 |
|------|----------|------|
| 10 | 狮心勇气 | DPS +100% |
| 25 | 王者咆哮 | DPS +100% |
| 50 | 百兽之王 | DPS +100% |
| 75 | 狮鹫召唤 | DPS +150% |
| 100 | 万兽臣服 | DPS +200% |

---

#### 英雄9：The Great Forest Seer（大森林先知）
| 属性 | 数值 |
|------|------|
| 基础DPS | 47,143 |
| 基础成本 | 2,000,000 金币 |
| 成本增长系数 | 1.07 |
| 类型 | 魔法DPS型 |

**特殊能力：**
| 等级 | 能力名称 | 效果 |
|------|----------|------|
| 10 | 自然预言 | DPS +100% |
| 25 | 精灵召唤 | DPS +100% |
| 50 | 生命绽放 | DPS +100% |
| 75 | 远古智慧 | DPS +150% |
| 100 | 世界之树 | DPS +200% |

---

#### 英雄10：Alexa, Assassin（刺客艾莉克莎）
| 属性 | 数值 |
|------|------|
| 基础DPS | 186,871 |
| 基础成本 | 10,000,000 金币 |
| 成本增长系数 | 1.07 |
| 类型 | 暴击型 |

**特殊能力：**
| 等级 | 能力名称 | 效果 |
|------|----------|------|
| 10 | 暗影步 | DPS +100% |
| 25 | 背刺精通 | DPS +100% |
| 50 | 毒刃涂毒 | DPS +100% |
| 75 | 死亡标记 | DPS +150% |
| 100 | 暗影女王 | DPS +200% |

---

#### 英雄11：Natalia, Ice Apprentice（冰霜学徒娜塔莉亚）
| 属性 | 数值 |
|------|------|
| 基础DPS | 782,865 |
| 基础成本 | 50,000,000 金币 |
| 成本增长系数 | 1.07 |
| 类型 | 元素魔法型 |

**特殊能力：**
| 等级 | 能力名称 | 效果 |
|------|----------|------|
| 10 | 冰箭术 | DPS +100% |
| 25 | 冰霜新星 | DPS +100% |
| 50 | 暴风雪 | DPS +100% |
| 75 | 绝对零度 | DPS +150% |
| 100 | 冰雪女王 | DPS +200% |

---

#### 英雄12：Mercedes, Duchess of Blades（刀锋女公爵梅赛德斯）
| 属性 | 数值 |
|------|------|
| 基础DPS | 3,721,361 |
| 基础成本 | 250,000,000 金币 |
| 成本增长系数 | 1.07 |
| 类型 | 高DPS型 |

**特殊能力：**
| 等级 | 能力名称 | 效果 |
|------|----------|------|
| 10 | 双刃舞 | DPS +100% |
| 25 | 刀锋风暴 | DPS +100% |
| 50 | 血刃觉醒 | DPS +100% |
| 75 | 死亡华尔兹 | DPS +150% |
| 100 | 刀锋女皇 | DPS +200% |

---

#### 英雄13：Bobby, Bounty Hunter（赏金猎人波比）
| 属性 | 数值 |
|------|------|
| 基础DPS | 17,010,291 |
| 基础成本 | 1,500,000,000 金币 |
| 成本增长系数 | 1.07 |
| 类型 | DPS型 |

**特殊能力：**
| 等级 | 能力名称 | 效果 |
|------|----------|------|
| 10 | 悬赏令 | DPS +100% |
| 25 | 追踪术 | DPS +100% |
| 50 | 致命陷阱 | DPS +100% |
| 75 | 神射手 | DPS +150% |
| 100 | 传奇猎人 | DPS +200% |

---

#### 英雄14：Broyle Lindeoven, Fire Mage（火焰法师布罗伊尔）
| 属性 | 数值 |
|------|------|
| 基础DPS | 69,483,156 |
| 基础成本 | 10,000,000,000 金币 |
| 成本增长系数 | 1.07 |
| 类型 | 元素魔法型 |

**特殊能力：**
| 等级 | 能力名称 | 效果 |
|------|----------|------|
| 10 | 火球术 | DPS +100% |
| 25 | 烈焰风暴 | DPS +100% |
| 50 | 流星火雨 | DPS +100% |
| 75 | 地狱之火 | DPS +150% |
| 100 | 炎魔化身 | DPS +200% |

---

#### 英雄15：Sir George II, King's Guard（皇家卫士乔治二世）
| 属性 | 数值 |
|------|------|
| 基础DPS | 460,340,193 |
| 基础成本 | 100,000,000,000 金币 |
| 成本增长系数 | 1.07 |
| 类型 | 坦克DPS型 |

**特殊能力：**
| 等级 | 能力名称 | 效果 |
|------|----------|------|
| 10 | 皇家训练 | DPS +100% |
| 25 | 盾墙防御 | DPS +100% |
| 50 | 骑士冲锋 | DPS +100% |
| 75 | 王者守护 | DPS +150% |
| 100 | 皇家统帅 | DPS +200% |

---

### 1.3 英雄DPS成长曲线

```
等级 → DPS倍数
1 → 1x
10 → 4x (含第一次能力)
25 → 12x
50 → 48x
75 → 192x
100 → 768x
125 → 3072x
150 → 12288x
200 → 196608x
```

---

## 二、怪物设计系统

### 2.1 普通怪物类型（15种）

| 编号 | 名称 | 外观描述 | 基础生命值 | 金币奖励 |
|------|------|----------|------------|----------|
| 1 | Mud Golem（泥魔像） | 由湿泥和石头组成的笨拙人形生物 | 10 | 1 |
| 2 | Forest Sprite（森林精灵） | 绿色发光的小型飞行生物 | 15 | 2 |
| 3 | Stone Crab（石蟹） | 背着岩石外壳的巨大螃蟹 | 25 | 3 |
| 4 | Venomous Snake（毒蛇） | 带有紫色条纹的致命毒蛇 | 40 | 4 |
| 5 | Skeleton Warrior（骷髅战士） | 手持锈剑的不死骷髅 | 60 | 5 |
| 6 | Dark Bat（黑暗蝙蝠） | 红色眼睛的巨型蝙蝠 | 90 | 6 |
| 7 | Flame Imp（火焰小恶魔） | 燃烧着的小恶魔 | 130 | 8 |
| 8 | Ice Wolf（冰狼） | 散发着寒气的白色巨狼 | 180 | 10 |
| 9 | Shadow Spider（暗影蜘蛛） | 半透明的幽灵蜘蛛 | 250 | 12 |
| 10 | Thunder Lizard（雷霆蜥蜴） | 身上带有闪电纹路的蜥蜴 | 350 | 15 |
| 11 | Poisonous Mushroom（毒蘑菇怪） | 会行走的巨型毒蘑菇 | 480 | 18 |
| 12 | Crystal Golem（水晶魔像） | 由紫色水晶构成的魔像 | 650 | 22 |
| 13 | Void Walker（虚空行者） | 来自异次元的黑色人影 | 880 | 26 |
| 14 | Plague Rat（瘟疫老鼠） | 携带疾病的巨大老鼠 | 1,200 | 30 |
| 15 | Ancient Guardian（远古守卫） | 身披铠甲的石像守卫 | 1,600 | 35 |

### 2.2 Boss怪物设计（12种）

| 编号 | 名称 | 外观描述 | 生命值倍数 | 计时器 | 特殊机制 |
|------|------|----------|------------|--------|----------|
| 1 | Big Mud Monster（大泥怪） | 巨型泥怪，身上长满苔藓 | 10x | 30秒 | 无 |
| 2 | Treant Elder（树人长老） | 古老的树人，眼睛发出绿光 | 12x | 30秒 | 无 |
| 3 | King Crab（蟹王） | 巨大的金色螃蟹 | 14x | 30秒 | 无 |
| 4 | Basilisk（蛇怪） | 有着致命目光的巨型蛇怪 | 16x | 30秒 | 无 |
| 5 | Lich（巫妖） | 手持法杖的不死法师 | 18x | 30秒 | 无 |
| 6 | Vampire Lord（吸血鬼领主） | 穿着贵族服饰的吸血鬼 | 20x | 30秒 | 无 |
| 7 | Fire Dragon（火龙） | 喷吐烈焰的成年龙 | 22x | 30秒 | 无 |
| 8 | Frost Giant（冰霜巨人） | 数十米高的蓝色巨人 | 24x | 30秒 | 无 |
| 9 | Shadow Demon（暗影恶魔） | 从黑暗中诞生的恶魔 | 26x | 30秒 | 无 |
| 10 | Thunder Behemoth（雷霆巨兽） | 被闪电包围的巨兽 | 28x | 30秒 | 无 |
| 11 | Plague Bringer（瘟疫使者） | 散播疾病的恐怖生物 | 30x | 30秒 | 无 |
| 12 | Void Titan（虚空泰坦） | 来自虚空的终极存在 | 35x | 30秒 | 无 |

### 2.3 怪物生命值计算公式

```
怪物基础HP = 10 × (区域编号^1.5) × (1.15^区域编号)
Boss HP = 怪物基础HP × Boss倍数
```

---

## 三、区域设计系统

### 3.1 区域列表（15个区域）

| 区域编号 | 名称 | 主题描述 | 怪物数量 | Boss |
|----------|------|----------|----------|------|
| 1 | 新手村 outskirts | 宁静的村庄外围，适合新手冒险 | 10 | 大泥怪 |
| 2 | 迷雾森林 | 被浓雾笼罩的神秘森林 | 10 | 树人长老 |
| 3 | 海岸线 | 海浪拍打的沙滩和礁石 | 10 | 蟹王 |
| 4 | 毒蛇沼泽 | 充满毒气的危险沼泽 | 10 | 蛇怪 |
| 5 | 古代墓地 | 埋葬着古代战士的墓地 | 10 | 巫妖 |
| 6 | 蝙蝠洞穴 | 黑暗潮湿的地下洞穴 | 10 | 吸血鬼领主 |
| 7 | 火山地带 | 岩浆流淌的危险区域 | 10 | 火龙 |
| 8 | 冰封荒原 | 永冻的冰雪世界 | 10 | 冰霜巨人 |
| 9 | 暗影峡谷 | 阳光无法照到的深渊 | 10 | 暗影恶魔 |
| 10 | 雷霆高原 | 常年雷电交加的高地 | 10 | 雷霆巨兽 |
| 11 | 腐化之地 | 被瘟疫污染的土地 | 10 | 瘟疫使者 |
| 12 | 虚空裂缝 | 连接异世界的裂缝 | 10 | 虚空泰坦 |
| 13 | 深渊入口 | 通往深渊的入口 | 10 | 深渊领主 |
| 14 | 混沌领域 | 秩序崩坏的异空间 | 10 | 混沌之王 |
| 15 | 世界之巅 | 最终决战之地 | 10 | 毁灭之神 |

### 3.2 区域进阶规则

| 条件 | 说明 |
|------|------|
| 解锁条件 | 击败前一区域Boss |
| 怪物刷新 | 击败10个普通怪物后出现Boss |
| Boss计时器 | 30秒内击败Boss，否则失败返回区域开始 |
| 金币倍率 | 每区域金币奖励 ×1.15 |
| 难度跳跃 | 每5个区域难度大幅提升 |

---

## 四、成就系统设计

### 4.1 成就分类

#### A. 点击类成就

| 成就名称 | 条件 | 奖励 |
|----------|------|------|
| 新手点击者 | 点击10次 | 点击伤害 +10% |
| 熟练点击者 | 点击100次 | 点击伤害 +10% |
| 点击大师 | 点击1,000次 | 点击伤害 +10% |
| 点击狂魔 | 点击10,000次 | 点击伤害 +10% |
| 点击之神 | 点击100,000次 | 点击伤害 +25% |
| 百万点击 | 点击1,000,000次 | 点击伤害 +50% |

#### B. 击杀类成就

| 成就名称 | 条件 | 奖励 |
|----------|------|------|
| 初出茅庐 | 击杀10个怪物 | 金币获取 +5% |
| 怪物猎人 | 击杀100个怪物 | 金币获取 +5% |
| 杀戮机器 | 击杀1,000个怪物 | 金币获取 +10% |
| 死亡使者 | 击杀10,000个怪物 | 金币获取 +10% |
| 毁灭者 | 击杀100,000个怪物 | 金币获取 +15% |
| 百万屠杀 | 击杀1,000,000个怪物 | 金币获取 +25% |

#### C. 金币类成就

| 成就名称 | 条件 | 奖励 |
|----------|------|------|
| 第一桶金 | 累计获得100金币 | 金币获取 +5% |
| 小有积蓄 | 累计获得10,000金币 | 金币获取 +5% |
| 富可敌村 | 累计获得1,000,000金币 | 金币获取 +10% |
| 百万富翁 | 累计获得1亿金币 | 金币获取 +10% |
| 亿万富翁 | 累计获得1万亿金币 | 金币获取 +15% |
| 财富之神 | 累计获得1亿亿金币 | 金币获取 +25% |

#### D. 英雄类成就

| 成就名称 | 条件 | 奖励 |
|----------|------|------|
| 招募开始 | 雇佣第一个英雄 | 英雄DPS +5% |
| 小团队 | 雇佣5个英雄 | 英雄DPS +5% |
| 冒险队伍 | 雇佣10个英雄 | 英雄DPS +10% |
| 英雄军团 | 雇佣15个英雄 | 英雄DPS +10% |
| 英雄大师 | 将所有英雄升至100级 | 英雄DPS +15% |
| 英雄传说 | 将所有英雄升至200级 | 英雄DPS +25% |

#### E. 区域类成就

| 成就名称 | 条件 | 奖励 |
|----------|------|------|
| 区域征服者 | 到达区域5 | 金币获取 +10% |
| 深渊探索者 | 到达区域10 | 金币获取 +15% |
| 世界尽头 | 到达区域15 | 金币获取 +25% |
| 转生先驱 | 完成第一次转生 | 转生灵魂 +10% |

---

## 五、进度里程碑系统

### 5.1 关键进度节点

| 里程碑 | 条件 | 解锁内容 |
|--------|------|----------|
| 新手入门 | 游戏开始 | 解锁英雄Cid |
| 首次升级 | 英雄Cid达到10级 | 解锁点击强化能力 |
| 团队组建 | 雇佣3个英雄 | 解锁自动攻击 |
| 区域突破 | 击败第一个Boss | 解锁区域2 |
| 技能觉醒 | 任意英雄达到25级 | 解锁技能系统 |
| 转生解锁 | 到达区域15 | 解锁转生系统 |
| 远古解锁 | 转生5次 | 解锁远古神系统 |
| 公会解锁 | 转生10次 | 解锁公会系统 |

### 5.2 技能系统设计

| 技能名称 | 冷却时间 | 持续时间 | 效果 |
|----------|----------|----------|------|
| 点击风暴 | 30分钟 | 30秒 | 点击伤害 ×10 |
| 金币风暴 | 1小时 | 30秒 | 金币获取 ×10 |
| 能量激增 | 2小时 | 30秒 | DPS ×10 |
| 超级点击 | 4小时 | 30秒 | 点击伤害 ×50 |
| 幸运金币 | 8小时 | 30秒 | 金币获取 ×50 |
| 毁灭之力 | 24小时 | 30秒 | DPS ×50 |

---

## 六、JSON数据配置示例

### 6.1 英雄配置 JSON

```json
{
  "heroes": [
    {
      "id": 1,
      "name": {
        "en": "Cid, the Helpful Adventurer",
        "cn": "热心冒险者希德"
      },
      "description": "一个乐于助人的新手冒险者，擅长增强点击伤害",
      "type": "click_damage",
      "baseStats": {
        "dps": 0,
        "baseCost": 5,
        "costMultiplier": 1.07
      },
      "abilities": [
        {"level": 10, "name": "点击强化", "effect": "click_damage_100"},
        {"level": 25, "name": "精准打击", "effect": "click_damage_100"},
        {"level": 50, "name": "暴击训练", "effect": "click_damage_100"},
        {"level": 75, "name": "力量爆发", "effect": "click_damage_150"},
        {"level": 100, "name": "终极点击", "effect": "click_damage_200"}
      ]
    },
    {
      "id": 2,
      "name": {
        "en": "Treebeast",
        "cn": "树兽"
      },
      "description": "森林中觉醒的古老树人，拥有强大的自然之力",
      "type": "dps",
      "baseStats": {
        "dps": 5,
        "baseCost": 50,
        "costMultiplier": 1.07
      },
      "abilities": [
        {"level": 10, "name": "树皮硬化", "effect": "dps_100"},
        {"level": 25, "name": "根系蔓延", "effect": "dps_100"},
        {"level": 50, "name": "自然之力", "effect": "dps_100"},
        {"level": 75, "name": "森林守护", "effect": "dps_150"},
        {"level": 100, "name": "远古树人", "effect": "dps_200"}
      ]
    },
    {
      "id": 3,
      "name": {
        "en": "Ivan, the Drunken Brawler",
        "cn": "醉拳伊万"
      },
      "description": "醉醺醺的格斗家，醉拳功夫出神入化",
      "type": "dps",
      "baseStats": {
        "dps": 22,
        "baseCost": 250,
        "costMultiplier": 1.07
      },
      "abilities": [
        {"level": 10, "name": "醉拳奥义", "effect": "dps_100"},
        {"level": 25, "name": "酒瓶乱舞", "effect": "dps_100"},
        {"level": 50, "name": "狂暴模式", "effect": "dps_100"},
        {"level": 75, "name": "千杯不醉", "effect": "dps_150"},
        {"level": 100, "name": "酒神附体", "effect": "dps_200"}
      ]
    },
    {
      "id": 4,
      "name": {
        "en": "Brittany, Beach Princess",
        "cn": "海滩公主布列塔尼"
      },
      "description": "来自热带海岛的公主，掌控海洋之力",
      "type": "dps",
      "baseStats": {
        "dps": 74,
        "baseCost": 1000,
        "costMultiplier": 1.07
      },
      "abilities": [
        {"level": 10, "name": "海浪之力", "effect": "dps_100"},
        {"level": 25, "name": "贝壳护盾", "effect": "dps_100"},
        {"level": 50, "name": "潮汐召唤", "effect": "dps_100"},
        {"level": 75, "name": "海洋之心", "effect": "dps_150"},
        {"level": 100, "name": "海皇祝福", "effect": "dps_200"}
      ]
    },
    {
      "id": 5,
      "name": {
        "en": "The Wandering Fisherman",
        "cn": "流浪渔夫"
      },
      "description": "游历四方的渔夫，钓竿也能成为致命武器",
      "type": "dps",
      "baseStats": {
        "dps": 245,
        "baseCost": 4000,
        "costMultiplier": 1.07
      },
      "abilities": [
        {"level": 10, "name": "大鱼上钩", "effect": "dps_100"},
        {"level": 25, "name": "渔网捕捉", "effect": "dps_100"},
        {"level": 50, "name": "深海猎手", "effect": "dps_100"},
        {"level": 75, "name": "传奇钓竿", "effect": "dps_150"},
        {"level": 100, "name": "海神之怒", "effect": "dps_200"}
      ]
    },
    {
      "id": 6,
      "name": {
        "en": "Betty Clicker",
        "cn": "贝蒂点击者"
      },
      "description": "手速惊人的点击专家，手指快到看不见",
      "type": "dps",
      "baseStats": {
        "dps": 976,
        "baseCost": 20000,
        "costMultiplier": 1.07
      },
      "abilities": [
        {"level": 10, "name": "快速点击", "effect": "dps_100"},
        {"level": 25, "name": "连击大师", "effect": "dps_100"},
        {"level": 50, "name": "点击风暴", "effect": "dps_100"},
        {"level": 75, "name": "极限手速", "effect": "dps_150"},
        {"level": 100, "name": "点击之神", "effect": "dps_200"}
      ]
    },
    {
      "id": 7,
      "name": {
        "en": "The Masked Samurai",
        "cn": "蒙面武士"
      },
      "description": "神秘的东方武士，刀法快如闪电",
      "type": "dps",
      "baseStats": {
        "dps": 3725,
        "baseCost": 100000,
        "costMultiplier": 1.07
      },
      "abilities": [
        {"level": 10, "name": "居合斩", "effect": "dps_100"},
        {"level": 25, "name": "二刀流", "effect": "dps_100"},
        {"level": 50, "name": "剑气纵横", "effect": "dps_100"},
        {"level": 75, "name": "无我境界", "effect": "dps_150"},
        {"level": 100, "name": "剑圣之道", "effect": "dps_200"}
      ]
    },
    {
      "id": 8,
      "name": {
        "en": "Leon",
        "cn": "里昂"
      },
      "description": "拥有狮王血脉的勇士，咆哮可震退敌军",
      "type": "dps",
      "baseStats": {
        "dps": 10859,
        "baseCost": 400000,
        "costMultiplier": 1.07
      },
      "abilities": [
        {"level": 10, "name": "狮心勇气", "effect": "dps_100"},
        {"level": 25, "name": "王者咆哮", "effect": "dps_100"},
        {"level": 50, "name": "百兽之王", "effect": "dps_100"},
        {"level": 75, "name": "狮鹫召唤", "effect": "dps_150"},
        {"level": 100, "name": "万兽臣服", "effect": "dps_200"}
      ]
    },
    {
      "id": 9,
      "name": {
        "en": "The Great Forest Seer",
        "cn": "大森林先知"
      },
      "description": "森林的守护者，能预知未来的智者",
      "type": "dps",
      "baseStats": {
        "dps": 47143,
        "baseCost": 2000000,
        "costMultiplier": 1.07
      },
      "abilities": [
        {"level": 10, "name": "自然预言", "effect": "dps_100"},
        {"level": 25, "name": "精灵召唤", "effect": "dps_100"},
        {"level": 50, "name": "生命绽放", "effect": "dps_100"},
        {"level": 75, "name": "远古智慧", "effect": "dps_150"},
        {"level": 100, "name": "世界之树", "effect": "dps_200"}
      ]
    },
    {
      "id": 10,
      "name": {
        "en": "Alexa, Assassin",
        "cn": "刺客艾莉克莎"
      },
      "description": "暗影中的杀手，出手必见血",
      "type": "dps",
      "baseStats": {
        "dps": 186871,
        "baseCost": 10000000,
        "costMultiplier": 1.07
      },
      "abilities": [
        {"level": 10, "name": "暗影步", "effect": "dps_100"},
        {"level": 25, "name": "背刺精通", "effect": "dps_100"},
        {"level": 50, "name": "毒刃涂毒", "effect": "dps_100"},
        {"level": 75, "name": "死亡标记", "effect": "dps_150"},
        {"level": 100, "name": "暗影女王", "effect": "dps_200"}
      ]
    },
    {
      "id": 11,
      "name": {
        "en": "Natalia, Ice Apprentice",
        "cn": "冰霜学徒娜塔莉亚"
      },
      "description": "冰系魔法学徒，能冻结一切敌人",
      "type": "dps",
      "baseStats": {
        "dps": 782865,
        "baseCost": 50000000,
        "costMultiplier": 1.07
      },
      "abilities": [
        {"level": 10, "name": "冰箭术", "effect": "dps_100"},
        {"level": 25, "name": "冰霜新星", "effect": "dps_100"},
        {"level": 50, "name": "暴风雪", "effect": "dps_100"},
        {"level": 75, "name": "绝对零度", "effect": "dps_150"},
        {"level": 100, "name": "冰雪女王", "effect": "dps_200"}
      ]
    },
    {
      "id": 12,
      "name": {
        "en": "Mercedes, Duchess of Blades",
        "cn": "刀锋女公爵梅赛德斯"
      },
      "description": "贵族出身的剑术大师，双刃舞出神入化",
      "type": "dps",
      "baseStats": {
        "dps": 3721361,
        "baseCost": 250000000,
        "costMultiplier": 1.07
      },
      "abilities": [
        {"level": 10, "name": "双刃舞", "effect": "dps_100"},
        {"level": 25, "name": "刀锋风暴", "effect": "dps_100"},
        {"level": 50, "name": "血刃觉醒", "effect": "dps_100"},
        {"level": 75, "name": "死亡华尔兹", "effect": "dps_150"},
        {"level": 100, "name": "刀锋女皇", "effect": "dps_200"}
      ]
    },
    {
      "id": 13,
      "name": {
        "en": "Bobby, Bounty Hunter",
        "cn": "赏金猎人波比"
      },
      "description": "传奇赏金猎人，从未失手",
      "type": "dps",
      "baseStats": {
        "dps": 17010291,
        "baseCost": 1500000000,
        "costMultiplier": 1.07
      },
      "abilities": [
        {"level": 10, "name": "悬赏令", "effect": "dps_100"},
        {"level": 25, "name": "追踪术", "effect": "dps_100"},
        {"level": 50, "name": "致命陷阱", "effect": "dps_100"},
        {"level": 75, "name": "神射手", "effect": "dps_150"},
        {"level": 100, "name": "传奇猎人", "effect": "dps_200"}
      ]
    },
    {
      "id": 14,
      "name": {
        "en": "Broyle Lindeoven, Fire Mage",
        "cn": "火焰法师布罗伊尔"
      },
      "description": "掌控烈焰的大法师，所到之处寸草不生",
      "type": "dps",
      "baseStats": {
        "dps": 69483156,
        "baseCost": 10000000000,
        "costMultiplier": 1.07
      },
      "abilities": [
        {"level": 10, "name": "火球术", "effect": "dps_100"},
        {"level": 25, "name": "烈焰风暴", "effect": "dps_100"},
        {"level": 50, "name": "流星火雨", "effect": "dps_100"},
        {"level": 75, "name": "地狱之火", "effect": "dps_150"},
        {"level": 100, "name": "炎魔化身", "effect": "dps_200"}
      ]
    },
    {
      "id": 15,
      "name": {
        "en": "Sir George II, King's Guard",
        "cn": "皇家卫士乔治二世"
      },
      "description": "国王最忠诚的卫士，守护王国的最后防线",
      "type": "dps",
      "baseStats": {
        "dps": 460340193,
        "baseCost": 100000000000,
        "costMultiplier": 1.07
      },
      "abilities": [
        {"level": 10, "name": "皇家训练", "effect": "dps_100"},
        {"level": 25, "name": "盾墙防御", "effect": "dps_100"},
        {"level": 50, "name": "骑士冲锋", "effect": "dps_100"},
        {"level": 75, "name": "王者守护", "effect": "dps_150"},
        {"level": 100, "name": "皇家统帅", "effect": "dps_200"}
      ]
    }
  ]
}
```

### 6.2 怪物配置 JSON

```json
{
  "monsters": {
    "normal": [
      {
        "id": 1,
        "name": {"en": "Mud Golem", "cn": "泥魔像"},
        "description": "由湿泥和石头组成的笨拙人形生物",
        "baseHealth": 10,
        "goldReward": 1,
        "appearance": "brown_muddy_humanoid"
      },
      {
        "id": 2,
        "name": {"en": "Forest Sprite", "cn": "森林精灵"},
        "description": "绿色发光的小型飞行生物",
        "baseHealth": 15,
        "goldReward": 2,
        "appearance": "green_glowing_fairy"
      },
      {
        "id": 3,
        "name": {"en": "Stone Crab", "cn": "石蟹"},
        "description": "背着岩石外壳的巨大螃蟹",
        "baseHealth": 25,
        "goldReward": 3,
        "appearance": "rock_shell_crab"
      },
      {
        "id": 4,
        "name": {"en": "Venomous Snake", "cn": "毒蛇"},
        "description": "带有紫色条纹的致命毒蛇",
        "baseHealth": 40,
        "goldReward": 4,
        "appearance": "purple_striped_snake"
      },
      {
        "id": 5,
        "name": {"en": "Skeleton Warrior", "cn": "骷髅战士"},
        "description": "手持锈剑的不死骷髅",
        "baseHealth": 60,
        "goldReward": 5,
        "appearance": "rusty_sword_skeleton"
      },
      {
        "id": 6,
        "name": {"en": "Dark Bat", "cn": "黑暗蝙蝠"},
        "description": "红色眼睛的巨型蝙蝠",
        "baseHealth": 90,
        "goldReward": 6,
        "appearance": "red_eyed_giant_bat"
      },
      {
        "id": 7,
        "name": {"en": "Flame Imp", "cn": "火焰小恶魔"},
        "description": "燃烧着的小恶魔",
        "baseHealth": 130,
        "goldReward": 8,
        "appearance": "burning_small_demon"
      },
      {
        "id": 8,
        "name": {"en": "Ice Wolf", "cn": "冰狼"},
        "description": "散发着寒气的白色巨狼",
        "baseHealth": 180,
        "goldReward": 10,
        "appearance": "white_frost_wolf"
      },
      {
        "id": 9,
        "name": {"en": "Shadow Spider", "cn": "暗影蜘蛛"},
        "description": "半透明的幽灵蜘蛛",
        "baseHealth": 250,
        "goldReward": 12,
        "appearance": "translucent_ghost_spider"
      },
      {
        "id": 10,
        "name": {"en": "Thunder Lizard", "cn": "雷霆蜥蜴"},
        "description": "身上带有闪电纹路的蜥蜴",
        "baseHealth": 350,
        "goldReward": 15,
        "appearance": "lightning_pattern_lizard"
      },
      {
        "id": 11,
        "name": {"en": "Poisonous Mushroom", "cn": "毒蘑菇怪"},
        "description": "会行走的巨型毒蘑菇",
        "baseHealth": 480,
        "goldReward": 18,
        "appearance": "walking_giant_mushroom"
      },
      {
        "id": 12,
        "name": {"en": "Crystal Golem", "cn": "水晶魔像"},
        "description": "由紫色水晶构成的魔像",
        "baseHealth": 650,
        "goldReward": 22,
        "appearance": "purple_crystal_construct"
      },
      {
        "id": 13,
        "name": {"en": "Void Walker", "cn": "虚空行者"},
        "description": "来自异次元的黑色人影",
        "baseHealth": 880,
        "goldReward": 26,
        "appearance": "black_dimensional_shadow"
      },
      {
        "id": 14,
        "name": {"en": "Plague Rat", "cn": "瘟疫老鼠"},
        "description": "携带疾病的巨大老鼠",
        "baseHealth": 1200,
        "goldReward": 30,
        "appearance": "diseased_giant_rat"
      },
      {
        "id": 15,
        "name": {"en": "Ancient Guardian", "cn": "远古守卫"},
        "description": "身披铠甲的石像守卫",
        "baseHealth": 1600,
        "goldReward": 35,
        "appearance": "armored_stone_sentinel"
      }
    ],
    "bosses": [
      {
        "id": 1,
        "name": {"en": "Big Mud Monster", "cn": "大泥怪"},
        "description": "巨型泥怪，身上长满苔藓",
        "healthMultiplier": 10,
        "timer": 30,
        "specialMechanic": "none",
        "appearance": "giant_mossy_mud_creature"
      },
      {
        "id": 2,
        "name": {"en": "Treant Elder", "cn": "树人长老"},
        "description": "古老的树人，眼睛发出绿光",
        "healthMultiplier": 12,
        "timer": 30,
        "specialMechanic": "none",
        "appearance": "ancient_glowing_treant"
      },
      {
        "id": 3,
        "name": {"en": "King Crab", "cn": "蟹王"},
        "description": "巨大的金色螃蟹",
        "healthMultiplier": 14,
        "timer": 30,
        "specialMechanic": "none",
        "appearance": "giant_golden_crab"
      },
      {
        "id": 4,
        "name": {"en": "Basilisk", "cn": "蛇怪"},
        "description": "有着致命目光的巨型蛇怪",
        "healthMultiplier": 16,
        "timer": 30,
        "specialMechanic": "none",
        "appearance": "deadly_gaze_serpent"
      },
      {
        "id": 5,
        "name": {"en": "Lich", "cn": "巫妖"},
        "description": "手持法杖的不死法师",
        "healthMultiplier": 18,
        "timer": 30,
        "specialMechanic": "none",
        "appearance": "staff_wielding_undead_mage"
      },
      {
        "id": 6,
        "name": {"en": "Vampire Lord", "cn": "吸血鬼领主"},
        "description": "穿着贵族服饰的吸血鬼",
        "healthMultiplier": 20,
        "timer": 30,
        "specialMechanic": "none",
        "appearance": "noble_attired_vampire"
      },
      {
        "id": 7,
        "name": {"en": "Fire Dragon", "cn": "火龙"},
        "description": "喷吐烈焰的成年龙",
        "healthMultiplier": 22,
        "timer": 30,
        "specialMechanic": "none",
        "appearance": "flame_breathing_dragon"
      },
      {
        "id": 8,
        "name": {"en": "Frost Giant", "cn": "冰霜巨人"},
        "description": "数十米高的蓝色巨人",
        "healthMultiplier": 24,
        "timer": 30,
        "specialMechanic": "none",
        "appearance": "towering_blue_giant"
      },
      {
        "id": 9,
        "name": {"en": "Shadow Demon", "cn": "暗影恶魔"},
        "description": "从黑暗中诞生的恶魔",
        "healthMultiplier": 26,
        "timer": 30,
        "specialMechanic": "none",
        "appearance": "darkness_spawned_demon"
      },
      {
        "id": 10,
        "name": {"en": "Thunder Behemoth", "cn": "雷霆巨兽"},
        "description": "被闪电包围的巨兽",
        "healthMultiplier": 28,
        "timer": 30,
        "specialMechanic": "none",
        "appearance": "lightning_wrapped_beast"
      },
      {
        "id": 11,
        "name": {"en": "Plague Bringer", "cn": "瘟疫使者"},
        "description": "散播疾病的恐怖生物",
        "healthMultiplier": 30,
        "timer": 30,
        "specialMechanic": "none",
        "appearance": "disease_spreading_horror"
      },
      {
        "id": 12,
        "name": {"en": "Void Titan", "cn": "虚空泰坦"},
        "description": "来自虚空的终极存在",
        "healthMultiplier": 35,
        "timer": 30,
        "specialMechanic": "none",
        "appearance": "void_dimension_titan"
      }
    ]
  }
}
```

### 6.3 区域配置 JSON

```json
{
  "zones": [
    {
      "id": 1,
      "name": {"en": "Village Outskirts", "cn": "新手村外围"},
      "description": "宁静的村庄外围，适合新手冒险",
      "theme": "peaceful_countryside",
      "monsterCount": 10,
      "bossId": 1,
      "goldMultiplier": 1.0,
      "healthMultiplier": 1.0,
      "unlockRequirement": "none"
    },
    {
      "id": 2,
      "name": {"en": "Misty Forest", "cn": "迷雾森林"},
      "description": "被浓雾笼罩的神秘森林",
      "theme": "mystical_forest",
      "monsterCount": 10,
      "bossId": 2,
      "goldMultiplier": 1.15,
      "healthMultiplier": 1.2,
      "unlockRequirement": "defeat_zone_1_boss"
    },
    {
      "id": 3,
      "name": {"en": "Coastline", "cn": "海岸线"},
      "description": "海浪拍打的沙滩和礁石",
      "theme": "sunny_beach",
      "monsterCount": 10,
      "bossId": 3,
      "goldMultiplier": 1.32,
      "healthMultiplier": 1.44,
      "unlockRequirement": "defeat_zone_2_boss"
    },
    {
      "id": 4,
      "name": {"en": "Venomous Swamp", "cn": "毒蛇沼泽"},
      "description": "充满毒气的危险沼泽",
      "theme": "poisonous_swamp",
      "monsterCount": 10,
      "bossId": 4,
      "goldMultiplier": 1.52,
      "healthMultiplier": 1.73,
      "unlockRequirement": "defeat_zone_3_boss"
    },
    {
      "id": 5,
      "name": {"en": "Ancient Graveyard", "cn": "古代墓地"},
      "description": "埋葬着古代战士的墓地",
      "theme": "haunted_cemetery",
      "monsterCount": 10,
      "bossId": 5,
      "goldMultiplier": 1.75,
      "healthMultiplier": 2.07,
      "unlockRequirement": "defeat_zone_4_boss"
    },
    {
      "id": 6,
      "name": {"en": "Bat Cave", "cn": "蝙蝠洞穴"},
      "description": "黑暗潮湿的地下洞穴",
      "theme": "dark_cave",
      "monsterCount": 10,
      "bossId": 6,
      "goldMultiplier": 2.01,
      "healthMultiplier": 2.49,
      "unlockRequirement": "defeat_zone_5_boss"
    },
    {
      "id": 7,
      "name": {"en": "Volcanic Zone", "cn": "火山地带"},
      "description": "岩浆流淌的危险区域",
      "theme": "volcanic_landscape",
      "monsterCount": 10,
      "bossId": 7,
      "goldMultiplier": 2.31,
      "healthMultiplier": 2.99,
      "unlockRequirement": "defeat_zone_6_boss"
    },
    {
      "id": 8,
      "name": {"en": "Frozen Wasteland", "cn": "冰封荒原"},
      "description": "永冻的冰雪世界",
      "theme": "frozen_tundra",
      "monsterCount": 10,
      "bossId": 8,
      "goldMultiplier": 2.66,
      "healthMultiplier": 3.58,
      "unlockRequirement": "defeat_zone_7_boss"
    },
    {
      "id": 9,
      "name": {"en": "Shadow Canyon", "cn": "暗影峡谷"},
      "description": "阳光无法照到的深渊",
      "theme": "shadowy_abyss",
      "monsterCount": 10,
      "bossId": 9,
      "goldMultiplier": 3.06,
      "healthMultiplier": 4.30,
      "unlockRequirement": "defeat_zone_8_boss"
    },
    {
      "id": 10,
      "name": {"en": "Thunder Plateau", "cn": "雷霆高原"},
      "description": "常年雷电交加的高地",
      "theme": "stormy_highlands",
      "monsterCount": 10,
      "bossId": 10,
      "goldMultiplier": 3.52,
      "healthMultiplier": 5.16,
      "unlockRequirement": "defeat_zone_9_boss"
    },
    {
      "id": 11,
      "name": {"en": "Corrupted Lands", "cn": "腐化之地"},
      "description": "被瘟疫污染的土地",
      "theme": "corrupted_plague_land",
      "monsterCount": 10,
      "bossId": 11,
      "goldMultiplier": 4.05,
      "healthMultiplier": 6.19,
      "unlockRequirement": "defeat_zone_10_boss"
    },
    {
      "id": 12,
      "name": {"en": "Void Rift", "cn": "虚空裂缝"},
      "description": "连接异世界的裂缝",
      "theme": "dimensional_rift",
      "monsterCount": 10,
      "bossId": 12,
      "goldMultiplier": 4.65,
      "healthMultiplier": 7.43,
      "unlockRequirement": "defeat_zone_11_boss"
    },
    {
      "id": 13,
      "name": {"en": "Abyss Entrance", "cn": "深渊入口"},
      "description": "通往深渊的入口",
      "theme": "abyssal_gateway",
      "monsterCount": 10,
      "bossId": 13,
      "goldMultiplier": 5.35,
      "healthMultiplier": 8.92,
      "unlockRequirement": "defeat_zone_12_boss"
    },
    {
      "id": 14,
      "name": {"en": "Chaos Realm", "cn": "混沌领域"},
      "description": "秩序崩坏的异空间",
      "theme": "chaotic_dimension",
      "monsterCount": 10,
      "bossId": 14,
      "goldMultiplier": 6.15,
      "healthMultiplier": 10.70,
      "unlockRequirement": "defeat_zone_13_boss"
    },
    {
      "id": 15,
      "name": {"en": "World's Peak", "cn": "世界之巅"},
      "description": "最终决战之地",
      "theme": "apocalyptic_summit",
      "monsterCount": 10,
      "bossId": 15,
      "goldMultiplier": 7.08,
      "healthMultiplier": 12.84,
      "unlockRequirement": "defeat_zone_14_boss"
    }
  ]
}
```

### 6.4 成就配置 JSON

```json
{
  "achievements": {
    "clicking": [
      {
        "id": "click_10",
        "name": "新手点击者",
        "requirement": {"type": "total_clicks", "value": 10},
        "reward": {"type": "click_damage", "value": 0.10}
      },
      {
        "id": "click_100",
        "name": "熟练点击者",
        "requirement": {"type": "total_clicks", "value": 100},
        "reward": {"type": "click_damage", "value": 0.10}
      },
      {
        "id": "click_1000",
        "name": "点击大师",
        "requirement": {"type": "total_clicks", "value": 1000},
        "reward": {"type": "click_damage", "value": 0.10}
      },
      {
        "id": "click_10000",
        "name": "点击狂魔",
        "requirement": {"type": "total_clicks", "value": 10000},
        "reward": {"type": "click_damage", "value": 0.10}
      },
      {
        "id": "click_100000",
        "name": "点击之神",
        "requirement": {"type": "total_clicks", "value": 100000},
        "reward": {"type": "click_damage", "value": 0.25}
      },
      {
        "id": "click_1000000",
        "name": "百万点击",
        "requirement": {"type": "total_clicks", "value": 1000000},
        "reward": {"type": "click_damage", "value": 0.50}
      }
    ],
    "kills": [
      {
        "id": "kill_10",
        "name": "初出茅庐",
        "requirement": {"type": "total_kills", "value": 10},
        "reward": {"type": "gold_multiplier", "value": 0.05}
      },
      {
        "id": "kill_100",
        "name": "怪物猎人",
        "requirement": {"type": "total_kills", "value": 100},
        "reward": {"type": "gold_multiplier", "value": 0.05}
      },
      {
        "id": "kill_1000",
        "name": "杀戮机器",
        "requirement": {"type": "total_kills", "value": 1000},
        "reward": {"type": "gold_multiplier", "value": 0.10}
      },
      {
        "id": "kill_10000",
        "name": "死亡使者",
        "requirement": {"type": "total_kills", "value": 10000},
        "reward": {"type": "gold_multiplier", "value": 0.10}
      },
      {
        "id": "kill_100000",
        "name": "毁灭者",
        "requirement": {"type": "total_kills", "value": 100000},
        "reward": {"type": "gold_multiplier", "value": 0.15}
      },
      {
        "id": "kill_1000000",
        "name": "百万屠杀",
        "requirement": {"type": "total_kills", "value": 1000000},
        "reward": {"type": "gold_multiplier", "value": 0.25}
      }
    ],
    "gold": [
      {
        "id": "gold_100",
        "name": "第一桶金",
        "requirement": {"type": "total_gold", "value": 100},
        "reward": {"type": "gold_multiplier", "value": 0.05}
      },
      {
        "id": "gold_10000",
        "name": "小有积蓄",
        "requirement": {"type": "total_gold", "value": 10000},
        "reward": {"type": "gold_multiplier", "value": 0.05}
      },
      {
        "id": "gold_1000000",
        "name": "富可敌村",
        "requirement": {"type": "total_gold", "value": 1000000},
        "reward": {"type": "gold_multiplier", "value": 0.10}
      },
      {
        "id": "gold_100000000",
        "name": "百万富翁",
        "requirement": {"type": "total_gold", "value": 100000000},
        "reward": {"type": "gold_multiplier", "value": 0.10}
      },
      {
        "id": "gold_1000000000000",
        "name": "亿万富翁",
        "requirement": {"type": "total_gold", "value": 1000000000000},
        "reward": {"type": "gold_multiplier", "value": 0.15}
      },
      {
        "id": "gold_10000000000000000",
        "name": "财富之神",
        "requirement": {"type": "total_gold", "value": 10000000000000000},
        "reward": {"type": "gold_multiplier", "value": 0.25}
      }
    ],
    "heroes": [
      {
        "id": "hero_1",
        "name": "招募开始",
        "requirement": {"type": "heroes_hired", "value": 1},
        "reward": {"type": "hero_dps", "value": 0.05}
      },
      {
        "id": "hero_5",
        "name": "小团队",
        "requirement": {"type": "heroes_hired", "value": 5},
        "reward": {"type": "hero_dps", "value": 0.05}
      },
      {
        "id": "hero_10",
        "name": "冒险队伍",
        "requirement": {"type": "heroes_hired", "value": 10},
        "reward": {"type": "hero_dps", "value": 0.10}
      },
      {
        "id": "hero_15",
        "name": "英雄军团",
        "requirement": {"type": "heroes_hired", "value": 15},
        "reward": {"type": "hero_dps", "value": 0.10}
      },
      {
        "id": "hero_all_100",
        "name": "英雄大师",
        "requirement": {"type": "all_heroes_level", "value": 100},
        "reward": {"type": "hero_dps", "value": 0.15}
      },
      {
        "id": "hero_all_200",
        "name": "英雄传说",
        "requirement": {"type": "all_heroes_level", "value": 200},
        "reward": {"type": "hero_dps", "value": 0.25}
      }
    ],
    "zones": [
      {
        "id": "zone_5",
        "name": "区域征服者",
        "requirement": {"type": "reach_zone", "value": 5},
        "reward": {"type": "gold_multiplier", "value": 0.10}
      },
      {
        "id": "zone_10",
        "name": "深渊探索者",
        "requirement": {"type": "reach_zone", "value": 10},
        "reward": {"type": "gold_multiplier", "value": 0.15}
      },
      {
        "id": "zone_15",
        "name": "世界尽头",
        "requirement": {"type": "reach_zone", "value": 15},
        "reward": {"type": "gold_multiplier", "value": 0.25}
      },
      {
        "id": "ascend_1",
        "name": "转生先驱",
        "requirement": {"type": "ascend_count", "value": 1},
        "reward": {"type": "souls_multiplier", "value": 0.10}
      }
    ]
  }
}
```

### 6.5 技能配置 JSON

```json
{
  "skills": [
    {
      "id": "click_storm",
      "name": "点击风暴",
      "cooldown": 1800,
      "duration": 30,
      "effect": {"type": "click_damage", "multiplier": 10},
      "description": "30秒内点击伤害提升10倍"
    },
    {
      "id": "gold_storm",
      "name": "金币风暴",
      "cooldown": 3600,
      "duration": 30,
      "effect": {"type": "gold_multiplier", "multiplier": 10},
      "description": "30秒内金币获取提升10倍"
    },
    {
      "id": "power_surge",
      "name": "能量激增",
      "cooldown": 7200,
      "duration": 30,
      "effect": {"type": "dps_multiplier", "multiplier": 10},
      "description": "30秒内DPS提升10倍"
    },
    {
      "id": "super_clicks",
      "name": "超级点击",
      "cooldown": 14400,
      "duration": 30,
      "effect": {"type": "click_damage", "multiplier": 50},
      "description": "30秒内点击伤害提升50倍"
    },
    {
      "id": "lucky_gold",
      "name": "幸运金币",
      "cooldown": 28800,
      "duration": 30,
      "effect": {"type": "gold_multiplier", "multiplier": 50},
      "description": "30秒内金币获取提升50倍"
    },
    {
      "id": "destructive_force",
      "name": "毁灭之力",
      "cooldown": 86400,
      "duration": 30,
      "effect": {"type": "dps_multiplier", "multiplier": 50},
      "description": "30秒内DPS提升50倍"
    }
  ]
}
```

### 6.6 里程碑配置 JSON

```json
{
  "milestones": [
    {
      "id": "start_game",
      "name": "新手入门",
      "condition": {"type": "game_start"},
      "unlock": "hero_cid"
    },
    {
      "id": "cid_level_10",
      "name": "首次升级",
      "condition": {"type": "hero_level", "heroId": 1, "level": 10},
      "unlock": "click_damage_ability"
    },
    {
      "id": "hire_3_heroes",
      "name": "团队组建",
      "condition": {"type": "heroes_count", "count": 3},
      "unlock": "auto_attack"
    },
    {
      "id": "defeat_first_boss",
      "name": "区域突破",
      "condition": {"type": "defeat_boss", "bossId": 1},
      "unlock": "zone_2"
    },
    {
      "id": "any_hero_25",
      "name": "技能觉醒",
      "condition": {"type": "any_hero_level", "level": 25},
      "unlock": "skill_system"
    },
    {
      "id": "reach_zone_15",
      "name": "转生解锁",
      "condition": {"type": "reach_zone", "zoneId": 15},
      "unlock": "ascension_system"
    },
    {
      "id": "ascend_5_times",
      "name": "远古解锁",
      "condition": {"type": "ascend_count", "count": 5},
      "unlock": "ancient_system"
    },
    {
      "id": "ascend_10_times",
      "name": "公会解锁",
      "condition": {"type": "ascend_count", "count": 10},
      "unlock": "guild_system"
    }
  ]
}
```

---

## 七、数值平衡参考表

### 7.1 英雄成本与DPS比例

| 英雄序号 | 基础成本 | 基础DPS | 成本/DPS比 |
|----------|----------|---------|------------|
| 1 | 5 | 0(点击) | - |
| 2 | 50 | 5 | 10 |
| 3 | 250 | 22 | 11.4 |
| 4 | 1,000 | 74 | 13.5 |
| 5 | 4,000 | 245 | 16.3 |
| 6 | 20,000 | 976 | 20.5 |
| 7 | 100,000 | 3,725 | 26.8 |
| 8 | 400,000 | 10,859 | 36.8 |
| 9 | 2,000,000 | 47,143 | 42.4 |
| 10 | 10,000,000 | 186,871 | 53.5 |
| 11 | 50,000,000 | 782,865 | 63.9 |
| 12 | 250,000,000 | 3,721,361 | 67.2 |
| 13 | 1,500,000,000 | 17,010,291 | 88.2 |
| 14 | 10,000,000,000 | 69,483,156 | 143.9 |
| 15 | 100,000,000,000 | 460,340,193 | 217.2 |

### 7.2 游戏进度时间估算

| 进度节点 | 预计时间 | 主要活动 |
|----------|----------|----------|
| 第一个英雄100级 | 10分钟 | 点击为主 |
| 击败区域1 Boss | 30分钟 | 升级英雄 |
| 到达区域5 | 2小时 | 组建英雄队伍 |
| 到达区域10 | 8小时 | 深度升级 |
| 到达区域15 | 24小时 | 准备转生 |
| 第一次转生 | 1-3天 | 积累灵魂 |

### 7.3 核心数值公式

```javascript
// 英雄升级成本
function getHeroCost(heroId, level) {
    const baseCost = heroes[heroId].baseCost;
    const multiplier = heroes[heroId].costMultiplier;
    return baseCost * Math.pow(multiplier, level - 1);
}

// 英雄DPS计算
function getHeroDPS(heroId, level) {
    const baseDPS = heroes[heroId].baseDPS;
    const abilityMultiplier = getAbilityMultiplier(heroId, level);
    return baseDPS * level * abilityMultiplier;
}

// 怪物生命值
function getMonsterHealth(zone, isBoss = false) {
    const baseHealth = 10 * Math.pow(zone, 1.5) * Math.pow(1.15, zone);
    if (isBoss) {
        return baseHealth * getBossMultiplier(zone);
    }
    return baseHealth;
}

// 金币奖励
function getGoldReward(zone, monsterGold) {
    return monsterGold * Math.pow(1.15, zone - 1);
}
```

---

*文档版本: 1.0*
*设计日期: 2024*
*适用于: Clicker Heroes 类型增量游戏*
