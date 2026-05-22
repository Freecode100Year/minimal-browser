# MinimalBrowser

极简 Electron 浏览器 — 无菜单、无按钮、只有地址栏。

---

## 项目简介

MinimalBrowser 是一款基于 Electron 28 构建的极简桌面浏览器。设计理念是**去除一切干扰**，只保留最核心的浏览功能：一个地址栏、一个网页视图、一个状态栏。

适合以下场景：
- 需要一个干净无干扰的浏览窗口
- 用作嵌入式展示终端 / Kiosk 模式原型
- 学习 Electron 的 BrowserView、IPC、安全沙箱等核心概念

---

## 功能特性

| 功能 | 说明 |
|------|------|
| 无边框窗口 | 自定义标题栏，去除系统原生边框 |
| 地址栏导航 | 输入网址按 Enter 即可跳转，自动补全 `https://` |
| 页面历史 | 支持前进 / 后退 / 刷新 |
| 加载状态 | 状态指示灯（蓝色加载中 / 绿色成功 / 红色失败） |
| 状态栏 | 显示加载耗时和请求次数 |
| 页面标题 | 标题栏实时显示当前页面标题 |
| 安全沙箱 | 网页内容在独立沙箱进程中运行 |
| 权限控制 | 仅允许剪贴板读取，拒绝所有其他权限请求 |

---

## 运行要求

- **操作系统**：Windows 10 / 11 x64
- **Node.js**：18 或更高版本（[下载地址](https://nodejs.org)）

---

## 快速启动

```bash
# 1. 进入项目目录
cd minimal-browser

# 2. 安装依赖（首次约 200MB）
npm install

# 3. 启动浏览器
npm start
```

---

## 打包为安装程序

```bash
npm run build
```

打包完成后，生成的 `.exe` 安装包位于 `dist/` 目录。

打包配置（在 `package.json` 中）：
- 格式：NSIS 一键安装
- 目标平台：Windows x64
- 应用 ID：`com.minimal.browser`

---

## 键盘快捷键

| 按键 | 功能 |
|------|------|
| `Enter` | 跳转到地址栏中的网址 |
| `Ctrl + L` | 聚焦地址栏并全选文本 |
| `Alt + ←` | 后退 |
| `Alt + →` | 前进 |
| `F5` | 刷新当前页面 |

---

## 界面布局

```
┌──────────────────────────────────────────────┐
│  ● ● ●          页面标题          (28px)     │  ← 标题栏（可拖动窗口）
├──────────────────────────────────────────────┤
│  ◉  [ 地址栏                    ] 快捷键提示 │  ← 地址栏 (36px)
├──────────────────────────────────────────────┤
│                                              │
│                                              │
│               网页内容区域                     │  ← BrowserView
│            （独立沙箱进程渲染）                  │
│                                              │
│                                              │
├──────────────────────────────────────────────┤
│  就绪              TIME 0.42s    REQ 3       │  ← 状态栏 (18px)
└──────────────────────────────────────────────┘
```

---

## 架构说明

### 文件结构

```
minimal-browser/
├── main.js          主进程 — 窗口管理、BrowserView、IPC 消息处理
├── preload.js       预加载脚本 — 安全桥接 renderer ↔ main
├── index.html       渲染进程 — 浏览器 UI（标题栏 + 地址栏 + 状态栏）
├── package.json     项目配置与依赖
└── .gitignore       Git 忽略规则
```

### 进程模型

```
┌─────────────┐    IPC     ┌─────────────────┐
│  主进程       │ ◄═══════► │  渲染进程 (UI)    │
│  main.js     │           │  index.html      │
│              │           │  preload.js      │
│  BrowserView │           └─────────────────┘
│  (网页沙箱)   │
└─────────────┘
```

- **主进程 (`main.js`)**：创建无边框窗口，管理 BrowserView 生命周期，处理导航/窗口控制等 IPC 消息
- **渲染进程 (`index.html`)**：浏览器 UI 界面，包含地址栏、标题栏、状态栏和键盘快捷键处理
- **预加载脚本 (`preload.js`)**：通过 `contextBridge` 暴露安全的 API 到 `window.browser`，隔离 Node.js 能力

### IPC 消息一览

| 方向 | 消息名 | 用途 |
|------|--------|------|
| UI → 主进程 | `navigate` | 导航到指定 URL |
| UI → 主进程 | `go-back` / `go-forward` | 历史前进后退 |
| UI → 主进程 | `reload` | 刷新页面 |
| UI → 主进程 | `window-minimize` / `window-maximize` / `window-close` | 窗口控制 |
| 主进程 → UI | `nav-loading` | 通知开始加载 |
| 主进程 → UI | `nav-loaded` | 通知加载完成（含 URL 和标题） |
| 主进程 → UI | `nav-error` | 通知加载失败（含错误码和描述） |
| 主进程 → UI | `title-updated` | 页面标题变更 |

---

## 安全机制

1. **contextIsolation: true** — 渲染进程和预加载脚本在隔离的上下文中运行
2. **nodeIntegration: false** — 网页无法访问 Node.js API
3. **sandbox: true** — BrowserView 中的网页运行在沙箱进程中
4. **权限管控** — 仅允许 `clipboard-read`，所有其他浏览器权限请求（摄像头、麦克风、通知等）均被拒绝
5. **CSP** — Content-Security-Policy 限制资源加载来源为 `self` 和 Google Fonts

---

## 自定义

### 修改默认行为

**修改 URL 自动补全规则：**
在 `main.js` 第 88 行修改正则匹配逻辑：
```js
if (!/^https?:\/\//i.test(target)) {
  target = 'https://' + target;   // 改为 'http://' 或其他协议
}
```

**修改窗口默认尺寸：**
在 `main.js` 第 13–14 行：
```js
width: 1280,    // 默认宽度
height: 800,    // 默认高度
```

### 修改 UI 外观

在 `index.html` 的 `:root` CSS 变量中修改颜色主题：
```css
:root {
  --bg:        #0a0a0a;    /* 背景色 */
  --surface:   #0f0f0f;    /* 地址栏背景 */
  --border:    #1a1a1a;    /* 边框色 */
  --text:      #b0b0b0;    /* 主文本色 */
  --text-url:  #6b8ccc;    /* 地址栏文本色 */
  --ok:        #3a7a3a;    /* 加载成功指示灯 */
  --err:       #7a3a3a;    /* 加载失败指示灯 */
  --load:      #3a5a8a;    /* 加载中指示灯 */
}
```

### 修改字体

默认使用 JetBrains Mono 等宽字体（通过 Google Fonts 加载）。如需更换，修改 `index.html` 第 8 行的 `@import` 和 `--mono` 变量。

---

## 许可

MIT
