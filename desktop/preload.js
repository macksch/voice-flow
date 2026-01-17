const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    // Window controls
    closeOverlay: () => ipcRenderer.send('close-overlay'),
    cancelRecording: () => ipcRenderer.send('cancel-recording'),

    // Recording controls
    onStartRecording: (callback) => ipcRenderer.on('start-recording', callback),
    onStopRecording: (callback) => ipcRenderer.on('stop-recording', callback),
    sendAudioData: (buffer) => ipcRenderer.invoke('process-audio', buffer),

    // API Key Management
    getApiKey: () => ipcRenderer.invoke('get-api-key'),
    saveApiKey: (key) => ipcRenderer.invoke('save-api-key', key),
    getHotkey: () => ipcRenderer.invoke('get-hotkey'),
    saveHotkey: (key) => ipcRenderer.invoke('save-hotkey', key),
    getAudioDevice: () => ipcRenderer.invoke('get-audio-device'),
    saveAudioDevice: (id) => ipcRenderer.invoke('save-audio-device', id),

    // Transcription Mode
    getTranscriptionMode: () => ipcRenderer.invoke('get-transcription-mode'),
    saveTranscriptionMode: (mode) => ipcRenderer.invoke('save-transcription-mode', mode),
    getCustomModes: () => ipcRenderer.invoke('get-custom-modes'),
    saveCustomModes: (modes) => ipcRenderer.invoke('save-custom-modes', modes),

    // History
    getHistory: () => ipcRenderer.invoke('get-history'),
    addHistory: (entry) => ipcRenderer.invoke('add-history', entry),
    clearHistory: () => ipcRenderer.invoke('clear-history'),

    // Launch Settings (Auto-Start)
    getLaunchSettings: () => ipcRenderer.invoke('get-launch-settings'),
    saveLaunchSettings: (settings) => ipcRenderer.invoke('save-launch-settings', settings),

    // Overlay Position
    getOverlayPosition: () => ipcRenderer.invoke('get-overlay-position'),
    saveOverlayPosition: (pos) => ipcRenderer.invoke('save-overlay-position', pos),

    // System Integration
    copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
    pasteResult: () => ipcRenderer.invoke('paste-result'),

    // Notifications
    showToast: (message, type) => ipcRenderer.invoke('show-toast', { message, type }),
    onShowSettings: (callback) => ipcRenderer.on('show-settings', callback),
    onHistoryUpdated: (callback) => ipcRenderer.on('history-updated', callback),

    // Tutorial / First Run
    getIsFirstRun: () => ipcRenderer.invoke('get-is-first-run'),
    setFirstRunComplete: () => ipcRenderer.invoke('set-first-run-complete'),

    // Updater
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
    onUpdateMessage: (callback) => ipcRenderer.on('update-message', (event, text) => callback(text)),
    onUpdateProgress: (callback) => ipcRenderer.on('update-download-progress', (event, progressObj) => callback(progressObj.percent)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (event, info) => callback(info)),

    // App Info
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    checkApiConnection: (apiKey) => ipcRenderer.invoke('check-api-connection', apiKey)
});

