const { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain, clipboard, screen } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Configure Logger
log.transports.file.level = 'info';
autoUpdater.logger = log;
autoUpdater.autoDownload = true; // Auto-download updates
const {
    saveApiKey, getApiKey,
    getHotkey, saveHotkey,
    getAudioDevice, saveAudioDevice,
    getTranscriptionMode, saveTranscriptionMode,
    getCustomModes, saveCustomModes,
    getHistory, addToHistory, clearHistory,
    getLaunchSettings, saveLaunchSettings,
    getOverlayPositionSettings, saveOverlayPositionSettings,
    getIsFirstRun, setFirstRunComplete
} = require('./config/store');

let dashboardWindow = null;
let overlayWindow = null;
let tray = null;
let isRecording = false;

// Initialize critical startup flags
if (require('electron-squirrel-startup')) app.quit();

// --- Window Creation ---
function createDashboardWindow() {
    dashboardWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: 'VoiceFlow Dashboard',
        icon: path.join(__dirname, 'assets/icons/icon.png'),
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    dashboardWindow.setMenuBarVisibility(false); // Hide default menu

    dashboardWindow.loadFile(path.join(__dirname, 'renderer/dashboard.html'));

    dashboardWindow.on('close', (e) => {
        if (!app.isQuitting) {
            e.preventDefault();
            dashboardWindow.hide();
        }
    });
}

function createOverlayWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    overlayWindow = new BrowserWindow({
        width: 460, // Increased width to prevent clipping
        height: 140,
        x: width - 480,
        y: height - 160,
        frame: false,
        transparent: true,
        resizable: false,
        alwaysOnTop: true,
        show: false,
        skipTaskbar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    overlayWindow.loadFile(path.join(__dirname, 'renderer/overlay.html'));
}

function createTray() {
    const iconPath = path.join(__dirname, 'assets/icons/tray-icon.png');
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Dashboard öffnen', click: () => showDashboard() },
        { type: 'separator' },
        {
            label: 'Beenden', click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('VoiceFlow');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => showDashboard());
}

function showDashboard() {
    if (dashboardWindow) {
        dashboardWindow.show();
        dashboardWindow.focus();
    }
}

// --- Overlay Positioning ---
const WINDOW_WIDTH = 400;
const PADDING = 50;

function getOverlayPosition() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { x, y, width, height } = primaryDisplay.workArea;
    const posSetting = getOverlayPositionSettings() || 'bottom-right';

    let destX, destY;

    switch (posSetting) {
        case 'bottom-center':
            destX = x + (width / 2) - (WINDOW_WIDTH / 2);
            destY = y + height - 100 - PADDING;
            break;
        case 'top-center':
            destX = x + (width / 2) - (WINDOW_WIDTH / 2);
            destY = y + PADDING;
            break;
        case 'top-right':
            destX = x + width - WINDOW_WIDTH - 20;
            destY = y + PADDING;
            break;
        case 'bottom-right':
        default:
            destX = x + width - WINDOW_WIDTH - 20;
            destY = y + height - 100 - PADDING;
            break;
    }

    return { x: destX, y: destY };
}

// --- Recording ---
function toggleRecording() {
    if (!overlayWindow) return;

    if (!isRecording) {
        isRecording = true;
        const { x, y } = getOverlayPosition();
        overlayWindow.setSize(460, 140); // Match new width
        overlayWindow.setPosition(Math.round(x), Math.round(y));
        overlayWindow.setAlwaysOnTop(true, 'screen-saver');
        overlayWindow.show();
        overlayWindow.webContents.send('start-recording');
        if (tray) tray.setImage(path.join(__dirname, 'assets/icons/tray-recording.png'));
    } else {
        isRecording = false;
        overlayWindow.webContents.send('stop-recording');
        if (tray) tray.setImage(path.join(__dirname, 'assets/icons/tray-icon.png'));
    }
}

// --- Hotkey Registration ---
function registerAllHotkeys() {
    globalShortcut.unregisterAll();

    // Global Record Hotkey
    const stored = getHotkey() || 'CommandOrControl+Shift+D';
    try {
        globalShortcut.register(stored, () => toggleRecording());
    } catch (e) { console.error('Global Hotkey registration failed', e); }

    // Custom Mode Hotkeys
    const modes = getCustomModes() || [];
    modes.forEach(mode => {
        if (mode.hotkey && mode.hotkey.trim().length > 0) {
            try {
                globalShortcut.register(mode.hotkey, () => {
                    saveTranscriptionMode(mode.id);
                    if (dashboardWindow) dashboardWindow.webContents.send('mode-changed', mode.id);
                    if (tray) tray.setToolTip(`VoiceFlow: ${mode.name}`);
                });
            } catch (e) { console.error(`Mode Hotkey failed for ${mode.name}`, e); }
        }
    });
}

// --- App Lifecycle ---
app.whenReady().then(() => {
    createDashboardWindow();
    createOverlayWindow();
    createTray();
    registerAllHotkeys();

    // Check start minimized setting
    const { openAsHidden } = getLaunchSettings() || {};
    if (!openAsHidden) {
        showDashboard();
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createDashboardWindow();
            createOverlayWindow();
        } else {
            showDashboard();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

// --- IPC Handlers ---
// API Key
ipcMain.handle('get-api-key', () => getApiKey());
ipcMain.handle('save-api-key', (_, key) => saveApiKey(key));

// Hotkey
ipcMain.handle('get-hotkey', () => getHotkey());
ipcMain.handle('save-hotkey', (_, key) => {
    saveHotkey(key);
    registerAllHotkeys();
    return true;
});

// Audio Device
ipcMain.handle('get-audio-device', () => getAudioDevice());
ipcMain.handle('save-audio-device', (_, id) => saveAudioDevice(id));

// Transcription Mode
ipcMain.handle('get-transcription-mode', () => getTranscriptionMode());
ipcMain.handle('save-transcription-mode', (_, mode) => saveTranscriptionMode(mode));

// Custom Modes
ipcMain.handle('get-custom-modes', () => getCustomModes());
ipcMain.handle('save-custom-modes', (_, modes) => saveCustomModes(modes));

// History
ipcMain.handle('get-history', () => getHistory());
ipcMain.handle('add-history', (_, entry) => {
    addToHistory(entry);
    if (dashboardWindow) dashboardWindow.webContents.send('history-updated');
    return true;
});
ipcMain.handle('clear-history', () => {
    clearHistory();
    if (dashboardWindow) dashboardWindow.webContents.send('history-updated');
    return true;
});

// Launch Settings
ipcMain.handle('get-launch-settings', () => getLaunchSettings() || { openAtLogin: false, openAsHidden: false });
ipcMain.handle('save-launch-settings', (_, settings) => {
    saveLaunchSettings(settings);
    app.setLoginItemSettings({
        openAtLogin: settings.openAtLogin,
        openAsHidden: settings.openAsHidden,
        path: app.getPath('exe'),
        args: settings.openAsHidden ? ['--hidden'] : []
    });
    return true;
});

// Overlay Position
ipcMain.handle('get-overlay-position', () => getOverlayPositionSettings() || 'bottom-right');
ipcMain.handle('save-overlay-position', (_, pos) => saveOverlayPositionSettings(pos));

// First Run / Tutorial
ipcMain.handle('get-is-first-run', () => getIsFirstRun());
ipcMain.handle('set-first-run-complete', () => setFirstRunComplete());

// App Info
ipcMain.handle('get-app-version', () => app.getVersion());

// Mode Hotkeys Refresh
ipcMain.handle('refresh-mode-hotkeys', () => {
    registerAllHotkeys();
    return true;
});

// Clipboard
ipcMain.handle('copy-to-clipboard', (_, text) => {
    clipboard.writeText(text);
    return true;
});

ipcMain.handle('paste-result', () => {
    // Send Ctrl+V using PowerShell (compatible with non-admin/admin)
    const { spawn } = require('child_process');
    const ps = spawn('powershell', [
        '-NoProfile',
        '-Command',
        'Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait("^v")'
    ]);

    ps.on('error', (err) => console.error('Auto-Paste failed:', err));
    return true;
});

ipcMain.handle('process-audio', async (_, audioBuffer) => {
    console.log('Audio buffer received, size:', audioBuffer.length);
    return { success: true };
});

// Recording Control
ipcMain.on('cancel-recording', () => {
    isRecording = false;
    if (overlayWindow) overlayWindow.hide();
    if (tray) tray.setImage(path.join(__dirname, 'assets/icons/tray-icon.png'));
});

ipcMain.on('close-overlay', () => {
    if (overlayWindow) overlayWindow.hide();
});

// --- Updater Logic ---
ipcMain.handle('check-for-updates', () => {
    if (process.env.NODE_ENV === 'development') {
        const mockResult = { updateAvailable: false, version: '0.3.0', message: 'Development mode: Updates disabled.' };
        if (dashboardWindow) dashboardWindow.webContents.send('update-message', 'Development mode: Updates disabled.');
        return mockResult;
    }
    // Check and notify (autoDownload is now TRUE, so it will download automatically)
    autoUpdater.checkForUpdatesAndNotify();
});

ipcMain.handle('quit-and-install', () => {
    autoUpdater.quitAndInstall();
});

// Configure Auto-Updater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Forward updater events
autoUpdater.on('checking-for-update', () => {
    if (dashboardWindow) {
        dashboardWindow.webContents.send('checking-for-update');
        dashboardWindow.webContents.send('update-message', 'Suche nach Updates...');
    }
});

autoUpdater.on('update-available', (info) => {
    if (dashboardWindow) {
        dashboardWindow.webContents.send('update-available', info);
        dashboardWindow.webContents.send('update-message', `Update verfügbar: v${info.version}. Lade herunter...`);
    }
});

autoUpdater.on('update-not-available', (info) => {
    if (dashboardWindow) {
        dashboardWindow.webContents.send('update-not-available', info);
        dashboardWindow.webContents.send('update-message', 'Kein Update verfügbar. Du bist aktuell.');
    }
});

autoUpdater.on('error', (err) => {
    if (dashboardWindow) {
        dashboardWindow.webContents.send('update-error', err.toString());
        dashboardWindow.webContents.send('update-message', 'Fehler beim Update-Check: ' + err.message);
    }
});

autoUpdater.on('download-progress', (progressObj) => {
    if (dashboardWindow) {
        dashboardWindow.webContents.send('update-download-progress', progressObj);
        dashboardWindow.webContents.send('update-message', `Lade herunter... ${Math.round(progressObj.percent)}%`);
    }
});

autoUpdater.on('update-downloaded', (info) => {
    if (dashboardWindow) {
        dashboardWindow.webContents.send('update-downloaded', info);
        dashboardWindow.webContents.send('update-message', `Update v${info.version} bereit zur Installation.`);
    }
});
