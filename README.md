# What's the time

一个使用 Bun、TypeScript、React 与 Vite 开发的多周目文字冒险游戏。

## 开发

```bash
bun install
bun run dev
```

开发服务器默认运行在 `http://localhost:3000`。

```bash
bun test
bun run lint
bun run build
```

## 项目结构

```text
src/
├── data/       # Markdown 剧本加载
├── engine/     # 框架无关的游戏状态与业务服务
├── hooks/      # React 状态、时间、音效和交互 Hook
├── parser/     # 剧本解析器及测试
├── types/      # 共享类型
├── ui/         # React 游戏组件
├── App.tsx
└── main.tsx
```

游戏代码以 `src/` 为唯一事实来源，剧本格式说明见
`docs/wiki-docs/技术/剧本格式.md`。

## Agentation

Agentation 已作为开发依赖接入根组件，只会在 Vite 开发模式加载，不会进入生产构建。

运行 `bun run dev` 后，桌面浏览器右下角会出现 Agentation 工具栏。启用工具栏并点击页面元素即可添加批注；复制生成的结构化 Markdown 后，可以直接交给编码 Agent 定位组件、选择器和页面区域。

Agentation 要求 React 18+，不支持移动端浏览器。
