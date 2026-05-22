const { app, BrowserWindow, BrowserView, ipcMain, session } = require('electron');
const path = require('path');

let mainWindow = null;
let browserView = null;

const TITLEBAR_HEIGHT = 28;
const URLBAR_HEIGHT   = 36;
const STATUSBAR_HEIGHT = 18;
const CHROME_HEIGHT   = TITLEBAR_HEIGHT + URLBAR_HEIGHT + STATUSBAR_HEIGHT;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    frame: false,          // 无原生标题栏
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // BrowserView 用于承载实际网页
  browserView = new BrowserView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // 禁用不必要功能
      plugins: false,
      webgl: true,
      spellcheck: false,
    },
  });

  mainWindow.setBrowserView(browserView);
  updateViewBounds();

  mainWindow.loadFile('index.html');

  // 监听窗口大小变化
  mainWindow.on('resize', updateViewBounds);

  // BrowserView 事件 → 转发给 renderer
  browserView.webContents.on('did-start-loading', () => {
    mainWindow.webContents.send('nav-loading', browserView.webContents.getURL());
  });

  browserView.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('nav-loaded', {
      url: browserView.webContents.getURL(),
      title: browserView.webContents.getTitle(),
    });
  });

  browserView.webContents.on('did-fail-load', (e, code, desc) => {
    mainWindow.webContents.send('nav-error', { code, desc });
  });

  browserView.webContents.on('page-title-updated', (e, title) => {
    mainWindow.webContents.send('title-updated', title);
  });
}

function updateViewBounds() {
  if (!mainWindow || !browserView) return;
  const [w, h] = mainWindow.getContentSize();
  browserView.setBounds({
    x: 0,
    y: CHROME_HEIGHT,
    width: w,
    height: Math.max(0, h - CHROME_HEIGHT),
  });
}

// ── IPC 处理 ──────────────────────────────────────────

ipcMain.on('navigate', (e, url) => {
  if (!url || url === 'about:blank') {
    browserView.webContents.loadURL('about:blank');
    return;
  }
  let target = url.trim();
  if (!/^https?:\/\//i.test(target)) {
    target = 'https://' + target;
  }
  browserView.webContents.loadURL(target);
});

ipcMain.on('go-back', () => {
  if (browserView.webContents.canGoBack()) browserView.webContents.goBack();
});

ipcMain.on('go-forward', () => {
  if (browserView.webContents.canGoForward()) browserView.webContents.goForward();
});

ipcMain.on('reload', () => {
  browserView.webContents.reload();
});

ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('window-close', () => mainWindow.close());

// ── App 生命周期 ──────────────────────────────────────

app.whenReady().then(() => {
  // 清除多余的 session 功能
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    // 只允许 clipboard-read, 其余全部拒绝
    const allowed = ['clipboard-read'];
    callback(allowed.includes(permission));
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
