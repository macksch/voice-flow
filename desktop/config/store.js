const { safeStorage } = require('electron');
const Store = require('electron-store');

const store = new Store();

function saveApiKey(key) {
    if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(key);
        store.set('groq_api_key', encrypted.toString('base64'));
        return true;
    }
    return false;
}

function getApiKey() {
    const encrypted = store.get('groq_api_key');
    if (encrypted && safeStorage.isEncryptionAvailable()) {
        try {
            const buffer = Buffer.from(encrypted, 'base64');
            return safeStorage.decryptString(buffer);
        } catch (error) {
            console.error('Failed to decrypt API key:', error);
            return null;
        }
    }
    return null;
}

function getHotkey() {
    return store.get('global_hotkey', 'CommandOrControl+Shift+D');
}

function saveHotkey(hotkey) {
    store.set('global_hotkey', hotkey);
    return true;
}

function getAudioDevice() {
    return store.get('audio_device_id', 'default');
}

function saveAudioDevice(deviceId) {
    store.set('audio_device_id', deviceId);
    return true;
}

function getTranscriptionMode() {
    return store.get('transcription_mode', 'standard');
}

function saveTranscriptionMode(mode) {
    store.set('transcription_mode', mode);
    return true;
}

function getCustomModes() {
    return store.get('custom_modes', []);
}

function saveCustomModes(modes) {
    store.set('custom_modes', modes);
    return true;
}

function getHistory() {
    return store.get('transcription_history', []);
}

function addToHistory(entry) {
    const history = getHistory();
    history.unshift({
        id: Date.now().toString(),
        timestamp: Date.now(),
        ...entry
    });
    if (history.length > 100) history.length = 100;
    store.set('transcription_history', history);
    return true;
}

function clearHistory() {
    store.set('transcription_history', []);
    return true;
}

// Launch Settings (Auto-Start)
function getLaunchSettings() {
    return {
        openAtLogin: store.get('openAtLogin', false),
        openAsHidden: store.get('openAsHidden', false)
    };
}

function saveLaunchSettings(settings) {
    if (typeof settings.openAtLogin !== 'undefined') store.set('openAtLogin', settings.openAtLogin);
    if (typeof settings.openAsHidden !== 'undefined') store.set('openAsHidden', settings.openAsHidden);
    return true;
}

// Overlay Position
function getOverlayPositionSettings() {
    return store.get('overlayPosition', 'bottom-right');
}

function saveOverlayPositionSettings(pos) {
    store.set('overlayPosition', pos);
    return true;
}

// First Run Check
function getIsFirstRun() {
    return store.get('isFirstRun', true);
}

function setFirstRunComplete() {
    store.set('isFirstRun', false);
    return true;
}

module.exports = {
    saveApiKey, getApiKey,
    getHotkey, saveHotkey,
    getAudioDevice, saveAudioDevice,
    getTranscriptionMode, saveTranscriptionMode,
    getCustomModes, saveCustomModes,
    getHistory, addToHistory, clearHistory,
    getLaunchSettings, saveLaunchSettings,
    getOverlayPositionSettings, saveOverlayPositionSettings,
    getIsFirstRun, setFirstRunComplete
};
