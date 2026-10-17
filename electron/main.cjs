const { app, BrowserWindow, Tray, Menu, nativeImage, Notification, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let tray = null;
let isQuiting = false;

function logDebug(msg) {
  try {
    fs.appendFileSync(path.join(__dirname, '../electron-debug.log'), `[${new Date().toISOString()}] ${msg}\n`);
  } catch {}
}

// Create a valid 16x16 RGBA bitmap icon programmatically for Windows System Tray
function createTrayIcon() {
  const size = 16;
  const buf = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const isBorder = x === 0 || x === size - 1 || y === 0 || y === size - 1;
      const isCenter = x >= 4 && x <= 11 && y >= 4 && y <= 11;
      // BGRA format for Windows nativeImage.createFromBitmap
      if (isBorder) {
        buf[idx] = 241;     // B
        buf[idx + 1] = 102; // G
        buf[idx + 2] = 99;  // R (#6366f1 Indigo)
        buf[idx + 3] = 255; // A
      } else if (isCenter) {
        buf[idx] = 153;     // B
        buf[idx + 1] = 211; // G
        buf[idx + 2] = 52;  // R (#34d399 Emerald)
        buf[idx + 3] = 255; // A
      } else {
        buf[idx] = 75;      // B
        buf[idx + 1] = 27;  // G
        buf[idx + 2] = 30;  // R (#1e1b4b Dark Indigo)
        buf[idx + 3] = 255; // A
      }
    }
  }
  return nativeImage.createFromBitmap(buf, { width: size, height: size });
}

let firstShowDone = false;
function showAndFocusWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  if (!firstShowDone) {
    // First show() in Chromium on Windows consumes STARTUPINFO.wShowWindow (which may be SW_HIDE from background shell)
    mainWindow.show();
    mainWindow.hide();
    firstShowDone = true;
  }
  mainWindow.show();
  mainWindow.focus();
  mainWindow.setAlwaysOnTop(true);
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setAlwaysOnTop(false);
      mainWindow.focus();
    }
  }, 600);
}

function createWindow() {
  logDebug('Creating BrowserWindow...');
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    show: false, // We will explicitly show() so Windows SW_HIDE from parent shell is overridden
    title: 'LifeOS — Yaşam ve Zaman Organizatörü',
    backgroundColor: '#020617',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false, // Keep timers accurate in background!
    },
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(distPath)) {
    logDebug(`Loading file: ${distPath}`);
    mainWindow.loadFile(distPath);
  } else {
    logDebug('Loading URL: http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173').catch((err) => {
      logDebug(`Load URL error: ${err.message}`);
    });
  }

  mainWindow.once('ready-to-show', () => {
    logDebug(`Window ready-to-show fired. isVisible before=${mainWindow.isVisible()}`);
    showAndFocusWindow();
    logDebug(`Window after showAndFocusWindow: isVisible=${mainWindow.isVisible()}, bounds=${JSON.stringify(mainWindow.getBounds())}`);
  });

  mainWindow.on('hide', () => logDebug('EVENT: mainWindow hide'));
  mainWindow.on('show', () => logDebug('EVENT: mainWindow show'));
  mainWindow.on('minimize', () => logDebug('EVENT: mainWindow minimize'));
  mainWindow.on('closed', () => logDebug('EVENT: mainWindow closed'));
  mainWindow.webContents.on('did-fail-load', (e, code, desc) => logDebug(`EVENT: did-fail-load ${code} ${desc}`));
  mainWindow.webContents.on('render-process-gone', (e, details) => logDebug(`EVENT: render-process-gone ${JSON.stringify(details)}`));

  // Fallback show in case ready-to-show already passed
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      logDebug(`Status at 2000ms: isVisible=${mainWindow.isVisible()}, isMinimized=${mainWindow.isMinimized()}, title=${mainWindow.getTitle()}`);
      if (!mainWindow.isVisible()) {
        showAndFocusWindow();
      }
    }
  }, 2000);

  // Intercept close so it keeps running in the background (System Tray)
  mainWindow.on('close', (event) => {
    logDebug(`EVENT: mainWindow close (isQuiting=${isQuiting})`);
    if (!isQuiting) {
      event.preventDefault();
      mainWindow.hide();
      if (Notification.isSupported()) {
        new Notification({
          title: 'LifeOS Arka Planda Çalışıyor',
          body: 'Görev takibi, sayaçlar ve onay bildirimleri sistem tepsisinde (saatin yanında) aktif.',
          silent: true,
        }).show();
      }
      return false;
    }
  });
}

function getStartupVbsPath() {
  const appData = process.env.APPDATA || path.join(require('os').homedir(), 'AppData', 'Roaming');
  return path.join(
    appData,
    'Microsoft',
    'Windows',
    'Start Menu',
    'Programs',
    'Startup',
    'LifeOS-AutoStart.vbs'
  );
}

function isWindowsStartupEnabled() {
  try {
    return fs.existsSync(getStartupVbsPath());
  } catch {
    return false;
  }
}

function setWindowsStartupEnabled(enable) {
  const vbsPath = getStartupVbsPath();
  const projectRoot = path.resolve(__dirname, '..');
  const electronExe = path.join(projectRoot, 'node_modules', 'electron', 'dist', 'electron.exe');
  try {
    if (enable) {
      const vbsContent = [
        'Set WshShell = CreateObject("WScript.Shell")',
        `WshShell.CurrentDirectory = "${projectRoot}"`,
        `WshShell.Run """${electronExe}"" .", 0, False`,
        '',
      ].join('\r\n');
      fs.mkdirSync(path.dirname(vbsPath), { recursive: true });
      fs.writeFileSync(vbsPath, vbsContent, 'utf-8');
    } else if (fs.existsSync(vbsPath)) {
      fs.unlinkSync(vbsPath);
    }
    return isWindowsStartupEnabled();
  } catch (err) {
    logDebug(`Startup toggle error: ${err.message}`);
    return isWindowsStartupEnabled();
  }
}

function getDiskBackupPath() {
  return path.join(path.resolve(__dirname, '..'), 'backups', 'LifeOS-AutoBackup.json');
}

function setupTray() {
  try {
    const icon = createTrayIcon();
    tray = new Tray(icon);
    tray.setToolTip('LifeOS — Yaşam Organizatörü (Aktif)');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'LifeOS Arayüzünü Aç',
        click: () => showAndFocusWindow(),
      },
      {
        label: 'Windows Açılışında Otomatik Başlat',
        type: 'checkbox',
        checked: isWindowsStartupEnabled(),
        click: (menuItem) => {
          setWindowsStartupEnabled(menuItem.checked);
        },
      },
      { type: 'separator' },
      {
        label: 'Tamamen Çıkış Yap',
        click: () => {
          isQuiting = true;
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('click', () => showAndFocusWindow());
    logDebug('System Tray initialized.');
  } catch (err) {
    logDebug(`Tray setup error: ${err.message}`);
  }
}

ipcMain.handle('lifeos-get-system-status', () => {
  const backupPath = getDiskBackupPath();
  let lastDiskBackupAt = null;
  try {
    if (fs.existsSync(backupPath)) {
      const stat = fs.statSync(backupPath);
      lastDiskBackupAt = stat.mtime.toISOString();
    }
  } catch {}
  return {
    startupEnabled: isWindowsStartupEnabled(),
    startupPath: getStartupVbsPath(),
    backupPath,
    lastDiskBackupAt,
  };
});

ipcMain.handle('lifeos-toggle-startup', (_event, enable) => {
  const active = setWindowsStartupEnabled(Boolean(enable));
  return { startupEnabled: active, startupPath: getStartupVbsPath() };
});

ipcMain.handle('lifeos-save-disk-backup', (_event, payloadJson) => {
  try {
    const backupPath = getDiskBackupPath();
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.writeFileSync(backupPath, payloadJson, 'utf-8');
    const stat = fs.statSync(backupPath);
    return { ok: true, backupPath, lastDiskBackupAt: stat.mtime.toISOString() };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('lifeos-load-disk-backup', () => {
  try {
    const backupPath = getDiskBackupPath();
    if (!fs.existsSync(backupPath)) return { ok: false, error: 'Henüz disk yedeği bulunamadı.' };
    const content = fs.readFileSync(backupPath, 'utf-8');
    return { ok: true, content };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.on('notify-task-approval', (event, task) => {
  if (Notification.isSupported()) {
    const notif = new Notification({
      title: `⏰ Süre Doldu: ${task.title}`,
      body: `${task.startTime} - ${task.endTime} (${task.categoryName}) görevi tamamlandı mı? Onaylamak için tıklayın.`,
      urgency: 'critical',
    });

    notif.on('click', () => showAndFocusWindow());
    notif.show();
  }

  if (mainWindow) {
    showAndFocusWindow();
    mainWindow.flashFrame(true);
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.flashFrame(false);
    }, 5000);
  }
});

app.whenReady().then(() => {
  logDebug('App ready.');
  app.setAppUserModelId('com.lifeos.organizator');
  createWindow();
  setupTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Stay alive in tray
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    showAndFocusWindow();
  }
});
