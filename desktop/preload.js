const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    // Window controls
    closeOverlay: () => ipcRenderer.send('close-overlay'),
    cancelRecording: () => ipcRenderer.send('cancel-recording'),

    // Recording controls
    onStartRecording: (callback) => {
        ipcRenderer.removeAllListeners('start-recording');
        ipcRenderer.on('start-recording', callback);
    },
    onStopRecording: (callback) => {
        ipcRenderer.removeAllListeners('stop-recording');
        ipcRenderer.on('stop-recording', callback);
    },
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
    // History
    getHistory: () => ipcRenderer.invoke('get-history'),
    addHistory: (entry) => ipcRenderer.invoke('add-history', entry),
    clearHistory: () => ipcRenderer.invoke('clear-history'),
    deleteHistoryEntry: (id) => ipcRenderer.invoke('delete-history-entry', id),

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
    onShowSettings: (callback) => {
        ipcRenderer.removeAllListeners('show-settings');
        ipcRenderer.on('show-settings', callback);
    },
    onHistoryUpdated: (callback) => {
        ipcRenderer.removeAllListeners('history-updated');
        ipcRenderer.on('history-updated', callback);
    },

    // Tutorial / First Run
    getIsFirstRun: () => ipcRenderer.invoke('get-is-first-run'),
    setFirstRunComplete: () => ipcRenderer.invoke('set-first-run-complete'),

    // Updater
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
    onUpdateMessage: (callback) => {
        ipcRenderer.removeAllListeners('update-message');
        ipcRenderer.on('update-message', (event, text) => callback(text));
    },
    onUpdateProgress: (callback) => {
        ipcRenderer.removeAllListeners('update-download-progress');
        ipcRenderer.on('update-download-progress', (event, progressObj) => callback(progressObj.percent));
    },
    onUpdateDownloaded: (callback) => {
        ipcRenderer.removeAllListeners('update-downloaded');
        ipcRenderer.on('update-downloaded', (event, info) => callback(info));
    },

    // App Info
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    checkApiConnection: (apiKey) => ipcRenderer.invoke('check-api-connection', apiKey),

    // Dictionary
    getDictionary: () => ipcRenderer.invoke('get-dictionary'),
    saveDictionary: (entries) => ipcRenderer.invoke('save-dictionary', entries),
    addDictionaryEntry: (entry) => ipcRenderer.invoke('add-dictionary-entry', entry),
    removeDictionaryEntry: (id) => ipcRenderer.invoke('remove-dictionary-entry', id),

    // Models
    getModels: () => ipcRenderer.invoke('get-models'),
    saveModels: (models) => ipcRenderer.invoke('save-models', models),

    // Language
    getLanguage: () => ipcRenderer.invoke('get-language'),
    saveLanguage: (lang) => ipcRenderer.invoke('save-language', lang),

    // User Initials
    getUserInitials: () => ipcRenderer.invoke('get-user-initials'),
    saveUserInitials: (initials) => ipcRenderer.invoke('save-user-initials', initials),

    getAutoPaste: () => ipcRenderer.invoke('get-auto-paste'),
    saveAutoPaste: (enabled) => ipcRenderer.invoke('save-auto-paste', enabled),

    // Stats
    getStats: () => ipcRenderer.invoke('get-stats'),
    updateStats: (charCount) => ipcRenderer.invoke('update-stats', charCount),

    // Switcher
    switchMode: (modeId) => ipcRenderer.send('switch-mode', modeId),
    hideSwitcher: () => ipcRenderer.send('hide-switcher'),
    onUpdateModes: (callback) => {
        ipcRenderer.removeAllListeners('update-modes');
        ipcRenderer.on('update-modes', (event, data) => callback(data));
    },

    // Mode Changed (Dashboard)
    onModeChanged: (callback) => {
        ipcRenderer.removeAllListeners('mode-changed');
        ipcRenderer.on('mode-changed', (event, modeId) => callback(modeId));
    }
});

