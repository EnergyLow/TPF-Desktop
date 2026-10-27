const { app, BrowserWindow, Menu, shell, ipcMain, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function getWindowStatePath() {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function loadWindowState() {
  const defaultState = { width: 1200, height: 800 };
  try {
    const raw = fs.readFileSync(getWindowStatePath(), 'utf8');
    const s = JSON.parse(raw);
    return {
      width: Number(s.width) || defaultState.width,
      height: Number(s.height) || defaultState.height,
      x: Number.isFinite(s.x) ? s.x : undefined,
      y: Number.isFinite(s.y) ? s.y : undefined,
      isMaximized: Boolean(s.isMaximized)
    };
  } catch (e) {
    return defaultState;
  }
}

function saveWindowState(win) {
  if (!win || win.isDestroyed()) return;
  const bounds = win.getBounds();
  const state = {
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    isMaximized: win.isMaximized()
  };
  try {
    fs.writeFileSync(getWindowStatePath(), JSON.stringify(state), 'utf8');
  } catch (e) {}
}

function openExternalSafe(url) {
  try {
    const parsed = new URL(String(url));
    const allowed = ['http:', 'https:', 'tel:', 'mailto:'];
    if (allowed.includes(parsed.protocol)) {
      shell.openExternal(parsed.href);
    }
  } catch (e) {}
}

function createWindow() {
  const state = loadWindowState();

  // Указываем путь к нашей иконке
  const iconPath = path.join(__dirname, 'assets', 'icon.ico');

  mainWindow = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 900,
    minHeight: 600,
    title: 'TPF Studio',
    backgroundColor: '#FAF9F6',
    show: false,
    icon: iconPath, // Иконка приложения
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });

  if (state.isMaximized) mainWindow.maximize();

  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', () => {
    saveWindowState(mainWindow);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Обработка F11 для полноэкранного режима
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      event.preventDefault();
    }
  });

  // Все новые окна — только во внешний браузер/приложение
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternalSafe(url);
    return { action: 'deny' };
  });

  // Запрещаем навигацию внутри окна на сторонние URL
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const current = mainWindow.webContents.getURL();
    if (url === current) return;
    event.preventDefault();
    openExternalSafe(url);
  });

  mainWindow.webContents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    app.setAppUserModelId('com.tpfstudio.app');

    ipcMain.handle('open-external', async (_event, url) => {
      openExternalSafe(url);
      return true;
    });

    ipcMain.handle('copy-text', async (_event, text) => {
      clipboard.writeText(String(text));
      return true;
    });

    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}