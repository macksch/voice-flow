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

function getLanguage() {
    return store.get('language', 'auto');
}

function saveLanguage(lang) {
    store.set('language', lang);
    return true;
}

// --- User Initials ---
function getUserInitials() {
    return store.get('userInitials', 'VF');
}

function saveUserInitials(initials) {
    store.set('userInitials', initials.toUpperCase().slice(0, 2));
    return true;
}

// --- Auto Paste ---
function getAutoPaste() {
    return store.get('autoPaste', false);
}

function saveAutoPaste(enabled) {
    store.set('autoPaste', enabled);
    return true;
}

// --- Stats ---
function getStats() {
    // Default stats
    return store.get('stats', { totalTranscriptions: 0, totalChars: 0, savedTime: 0 }); // savedTime in seconds?
}

function updateStats(charCount) {
    const stats = getStats();
    stats.totalTranscriptions = (stats.totalTranscriptions || 0) + 1;
    stats.totalChars = (stats.totalChars || 0) + charCount;
    // Estimate: 300 chars = 1 min speaking ~ 3-4 mins typing?
    // Let's say typing speed is 40 wpm ~ 200 cpm.
    // Time to type = characters / 200 (minutes). 
    // Time saved = Time to type. (Simulated)
    const timeSavedSeconds = (charCount / 200) * 60;
    stats.savedTime = (stats.savedTime || 0) + timeSavedSeconds;

    store.set('stats', stats);
    return stats;
}

// function to delete a history entry only by ID
function deleteHistoryEntry(id) {
    const history = getHistory();
    const newHistory = history.filter(h => h.id !== id);
    store.set('transcription_history', newHistory);
    return true;
}

module.exports = {
    saveApiKey, getApiKey,
    getHotkey, saveHotkey,
    getAudioDevice, saveAudioDevice,
    getTranscriptionMode, saveTranscriptionMode,
    getCustomModes, saveCustomModes,
    getHistory, addToHistory, clearHistory, deleteHistoryEntry,
    getLaunchSettings, saveLaunchSettings,
    getOverlayPositionSettings, saveOverlayPositionSettings,
    getIsFirstRun, setFirstRunComplete,
    getDictionary, saveDictionary, addDictionaryEntry, removeDictionaryEntry,
    getModels, saveModels,
    getLanguage, saveLanguage,
    getUserInitials, saveUserInitials,
    getAutoPaste, saveAutoPaste,
    getStats, updateStats
};

// Dictionary
function getDictionary() {
    return store.get('custom_dictionary', []);
}

function saveDictionary(entries) {
    store.set('custom_dictionary', entries);
    return true;
}

function addDictionaryEntry(entry) {
    const dict = getDictionary();
    dict.push({
        id: Date.now().toString(),
        ...entry
    });
    store.set('custom_dictionary', dict);
    return true;
}

function removeDictionaryEntry(id) {
    const dict = getDictionary().filter(e => e.id !== id);
    store.set('custom_dictionary', dict);
    return true;
}

// Models
function getModels() {
    return {
        transcription: store.get('model_transcription', 'whisper-large-v3'),
        llm: store.get('model_llm', 'llama-3.3-70b-versatile')
    };
}

function saveModels(models) {
    if (models.transcription) store.set('model_transcription', models.transcription);
    if (models.llm) store.set('model_llm', models.llm);
    return true;
}
