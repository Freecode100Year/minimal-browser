# MinimalBrowser

极简 Electron 浏览器。无菜单、无按钮、只有地址栏。

---

## 运行要求

- Windows 10 / 11 x64
- Node.js 18 或更高版本（https://nodejs.org）

---

## 快速启动

```bash
# 1. 进入项目目录
cd minimal-browser

# 2. 安装依赖（只需要一次，约 200MB）
npm install

# 3. 启动
npm start
```

---

## 打包成 .exe 安装程序

```bash
npm run build
```

打包完成后，`.exe` 在 `dist/` 目录里。

---

## 键盘快捷键

| 按键         | 功能         |
|--------------|--------------|
| Enter        | 跳转网址     |
| Ctrl + L     | 聚焦地址栏   |
| Alt + ←      | 后退         |
| Alt + →      | 前进         |
| F5           | 刷新         |

---

## 文件结构

```
minimal-browser/
├── main.js        ← 主进程（窗口、BrowserView、IPC）
├── preload.js     ← 安全桥接层
├── index.html     ← 浏览器 UI（标题栏 + 地址栏 + 状态栏）
├── package.json   ← 依赖配置
└── README.md
```

---

## 自定义

**修改默认主页：**
在 `main.js` 第 `ipcMain.on('navigate', ...)` 部分修改默认 URL。

**修改 UI 颜色：**
在 `index.html` 的 `:root { }` CSS 变量区域修改。

**禁用 WebGL / 其他功能：**
在 `main.js` 的 `BrowserView` webPreferences 中添加：
```js
webgl: false,
webSecurity: true,
```
