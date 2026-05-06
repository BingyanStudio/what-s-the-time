# What's the time

一个多周目文字冒险游戏，使用 Bun + TypeScript + Vue 开发。

## 项目结构

```
src/
├── components/          # Vue 组件
│   ├── GameView.vue    # 游戏主界面
│   └── FormattedText.vue # 格式化文本渲染组件
├── composables/         # Vue Composables
│   └── useGameState.ts # 游戏状态管理
├── data/               # 剧本数据
│   └── script.ts       # 剧本片段定义
├── types/              # TypeScript 类型定义
│   └── index.ts
├── utils/              # 工具函数
│   └── textParser.ts   # 文本格式解析器
├── img/                # 图片资源
│   └── watch.png       # 手表图片
├── App.vue             # 根组件
├── main.ts             # 入口文件
└── style.css           # 全局样式
```

## 安装和运行

```bash
# 安装依赖
bun install

# 开发模式
bun run dev

# 构建
bun run build
```

## 剧本编写指南

剧本数据定义在 `src/data/script.ts` 中，使用 TypeScript 直接编写。

### 基本结构

每个剧本片段（ScriptSegment）包含：
- `id`: 片段唯一标识
- `time`: 时间点 (HH:MM)
- `secondTime`: 第二问时间（用于两问一锁机制，可选）
- `lines`: 剧本行列表
- `description`: 片段描述（用于开发调试）
- `unlockFlags`: 解锁条件（flag 列表）
- `loop`: Loop 阶段

### 剧本行类型

#### 1. 场景描述 (NarrationLine)

```typescript
{
  type: 'narration',
  text: '早晨的上学路。阳光透过树叶洒下来。'
}
```

#### 2. 对话 (DialogueLine)

```typescript
{
  type: 'dialogue',
  character: 'B',  // 角色名（可选，为空表示内心独白）
  text: '一年前那件事，你现在还好吗？'
}
```

#### 3. 选择分支 (ChoiceLine)

```typescript
{
  type: 'choice',
  choices: [
    {
      text: '选项1',
      targetSegmentId: 'P03-02',
      setFlag: 'choice_1'  // 可选
    },
    {
      text: '选项2',
      targetSegmentId: 'P03-03'
    }
  ]
}
```

### 文本格式标记

支持以下格式标记：
- `{red}红色文本{/red}` - 红色文本
- `{bold}粗体文本{/bold}` - 粗体
- `{italic}斜体文本{/italic}` - 斜体
- `{br}` - 换行

示例：
```typescript
{
  type: 'narration',
  text: '时间戳：{bold}08:20{/bold}'
}
```

### 完整示例

```typescript
{
  id: 'P03-01',
  time: '08:05',
  description: '和 B 一起上学（伪恋爱开场）',
  loop: 'A',
  unlockFlags: [],
  lines: [
    {
      type: 'narration',
      text: '早晨的上学路。阳光透过树叶洒下来。'
    },
    {
      type: 'dialogue',
      character: 'B',
      text: '一年前那件事，你现在还好吗？'
    },
    {
      type: 'dialogue',
      text: '我点点头，没有回答。'
    }
  ]
}
```

## 游戏机制

### 时间输入

玩家输入时间 (HH:MM) 来触发对应的剧本片段。

### 两问一锁

某些关键时间点需要两次输入：
1. 第一次输入主时间（如 `10:37`）
2. 第二次输入辅助时间（如 `08:20`）
3. 系统根据组合匹配对应的片段

### Flag 系统

使用 flag 来控制剧本的解锁和流程：
- `unlockFlags`: 片段解锁所需的条件
- 选择分支可以设置 flag
- 游戏状态中维护已解锁的 flag 集合

## 开发说明

- 使用 Vue 3 Composition API
- TypeScript 严格模式
- 响应式设计，适配不同屏幕尺寸
- 支持文本格式标记（红色、粗体、斜体）

## 待实现功能

- [ ] 选择分支的跳转逻辑
- [ ] 命令行的执行（setFlag、jump 等）
- [ ] 存档/读档功能
- [ ] 文本逐字显示效果
- [ ] 音效和背景音乐支持
- [ ] 更多视觉效果

