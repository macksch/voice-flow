import { State, PRESET_ICONS } from './modules/state.js';
import { showToast } from './modules/toast.js';
import { loadModesForEditor, prepareEditor, saveModeFromEditor, deleteCustomMode, updateActiveModeDisplay } from './modules/modes.js';
import { loadHistory, renderHistoryList, renderActivityTable } from './modules/history.js';
import { loadSettings, initSettingsListeners, loadModels } from './modules/settings.js';
import { loadDictionary, renderDictionaryList, addDictEntry, deleteDictEntry } from './modules/dictionary.js';

// --- Global Error Handling (Issue #5) ---
window.onerror = function (message, source, lineno, colno, error) {
    console.error('Global Error:', { message, source, lineno, colno, error });
    showToast(`Fehler: ${message}`, 'error');
    return true;
};

window.onunhandledrejection = function (event) {
    console.error('Unhandled Promise Rejection:', event.reason);
    showToast(`Async Fehler: ${event.reason?.message || event.reason}`, 'error');
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    // Always attach listeners first so UI works even if data fails
    attachEventListeners();
    initSettingsListeners();

    // Listen for mode changes from Switcher (Alt+M)
    if (window.electron && window.electron.onModeChanged) {
        window.electron.onModeChanged(async (modeId) => {
            console.log('Mode changed via Switcher:', modeId);
            State.currentActiveMode = modeId;
            updateActiveModeDisplay();
            // Refresh mode list if currently viewing modes
            const modesView = document.getElementById('view-modes');
            if (modesView && !modesView.classList.contains('hidden')) {
                await loadModesForEditor();
            }
        });
    }

    try {
        await loadInitialData();
        checkFirstRun(); // Trigger Tutorial
    } catch (e) {
        console.error('Initialization failed', e);
        showToast('System Init Fehler: ' + e.message, 'error');
    }
});

async function checkFirstRun() {
    const isFirstRun = await window.electron.getIsFirstRun();
    if (!isFirstRun) return;

    const overlay = document.getElementById('tutorial-overlay');
    overlay.classList.remove('hidden');

    document.querySelectorAll('.btn-next-step').forEach(btn => {
        btn.addEventListener('click', () => {
            const current = document.querySelector('.tutorial-step.active');
            const nextStepNum = parseInt(current.dataset.step) + 1;
            const next = document.querySelector(`.tutorial-step[data-step="${nextStepNum}"]`);

            if (next) {
                current.classList.remove('active');
                next.classList.add('active');
            }
        });
    });

    document.querySelectorAll('.btn-prev-step').forEach(btn => {
        btn.addEventListener('click', () => {
            const current = document.querySelector('.tutorial-step.active');
            const prevStepNum = parseInt(current.dataset.step) - 1;
            const prev = document.querySelector(`.tutorial-step[data-step="${prevStepNum}"]`);

            if (prev) {
                current.classList.remove('active');
                prev.classList.add('active');
            }
        });
    });

    document.querySelector('.btn-finish-tutorial').addEventListener('click', async () => {
        await window.electron.setFirstRunComplete();
        overlay.classList.add('hidden');
    });
}


async function checkApiStatus() {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.api-status span');

    if (!statusDot || !statusText) return;

    statusText.innerText = 'Prüfe...';
    statusDot.style.background = 'var(--text-secondary)';

    const apiKey = document.getElementById('api-key-input').value; // Get current input value (after loadSettings)
    // Fallback if input is empty but key is saved? loadSettings fills input, so input value is safe.

    try {
        const isConnected = await window.electron.checkApiConnection(apiKey);

        if (isConnected) {
            statusDot.style.background = 'var(--success)';
            statusText.innerText = 'Groq API Verbunden';
        } else {
            statusDot.style.background = 'var(--error)';
            statusText.innerText = 'Nicht Verbunden';
        }
    } catch (e) {
        console.warn('API Check failed', e);
        statusDot.style.background = 'var(--error)';
        statusText.innerText = 'Statusfehler';
    }
}

async function loadInitialData() {
    await loadModesForEditor(); // Load modes first for Name resolution
    await loadStats();
    await loadHistory();
    await loadSettings(); // Changed to await
    await checkApiStatus(); // Check on load
    State.currentActiveMode = await window.electron.getTranscriptionMode() || 'standard';

    updateActiveModeDisplay();

    // Issue #4: Load dynamic version
    try {
        const version = await window.electron.getAppVersion();
        const statusEl = document.getElementById('update-status');
        if (statusEl && version) {
            statusEl.innerText = `Version ${version}`;
        }
    } catch (e) {
        console.warn('Could not load app version', e);
    }
}

function attachEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');

            document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));
            const viewId = `view-${item.dataset.tab}`;
            const viewEl = document.getElementById(viewId);
            if (viewEl) viewEl.classList.remove('hidden');

            // Update Header
            const titleEl = document.getElementById('page-title');
            const subEl = document.getElementById('page-subtitle');

            if (item.dataset.tab === 'home') {
                titleEl.textContent = 'Willkommen zurück';
                subEl.textContent = 'Verwalte deine VoiceFlow Sprachverarbeitung.';
                loadStats();
            } else if (item.dataset.tab === 'modes') {
                titleEl.textContent = 'Modi verwalten';
                subEl.textContent = 'Erstelle und bearbeite deine KI-Prompts.';
                loadModesForEditor();
            } else if (item.dataset.tab === 'history') {
                titleEl.textContent = 'Verlauf';
                subEl.textContent = 'Deine letzten Transkriptionen.';
                renderHistoryList();
            } else if (item.dataset.tab === 'settings') {
                titleEl.textContent = 'Einstellungen';
                subEl.textContent = 'Systemkonfiguration.';
                loadSettings();
            }
        });
    });

    // Notifications
    document.getElementById('btn-notifications').addEventListener('click', () => {
        showToast('Keine neuen Benachrichtigungen', 'info');
    });

    // --- Mode Editor Actions ---
    document.getElementById('btn-create-mode-view').addEventListener('click', () => {
        prepareEditor(null);
    });

    document.getElementById('btn-save-edit').addEventListener('click', async () => {
        await saveModeFromEditor();
    });

    document.getElementById('btn-cancel-edit').addEventListener('click', () => {
        // Reset to currently editing or clear
        if (State.editingModeId && State.editingModeId !== 'new') {
            const original = State.allModes.find(m => m.id === State.editingModeId);
            if (original) prepareEditor(original);
        } else {
            // If we were creating new, maybe go back to first mode or clear
            if (State.allModes.length > 0) prepareEditor(State.allModes[0]);
        }
    });

    document.getElementById('btn-set-active').addEventListener('click', async () => {
        if (State.editingModeId) {
            State.currentActiveMode = State.editingModeId;
            await window.electron.saveTranscriptionMode(State.editingModeId);
            updateActiveModeDisplay();
            await loadModesForEditor(); // Refresh list dots
            prepareEditor(State.allModes.find(m => m.id === State.editingModeId)); // Refresh header UI
        }
    });

    document.getElementById('btn-delete-mode').addEventListener('click', async () => {
        if (confirm('Möchtest du diesen Modus wirklich löschen?')) {
            await deleteCustomMode(State.editingModeId);
        }
    });

    // --- Export / Import ---
    document.getElementById('btn-export-modes').addEventListener('click', async () => {
        const customModes = await window.electron.getCustomModes() || [];
        if (customModes.length === 0) return showToast('Keine eigenen Modi vorhanden zum Exportieren.', 'info');

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customModes, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "voiceflow_modes.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });

    document.getElementById('btn-import-modes').addEventListener('click', () => {
        document.getElementById('file-import-modes').click();
    });

    document.getElementById('file-import-modes').addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (!Array.isArray(imported)) throw new Error('Format ungültig (kein Array)');

                // Merge logic: Overwrite existing by ID, add new
                const current = await window.electron.getCustomModes() || [];
                let addedCount = 0;
                let updatedCount = 0;

                imported.forEach(newMode => {
                    if (!newMode.id || !newMode.name) return; // Skip invalid
                    const idx = current.findIndex(c => c.id === newMode.id);
                    if (idx >= 0) {
                        current[idx] = newMode;
                        updatedCount++;
                    } else {
                        current.push(newMode);
                        addedCount++;
                    }
                });

                await window.electron.saveCustomModes(current);
                await loadModesForEditor();
                showToast(`Import erfolgreich: ${addedCount} neu, ${updatedCount} aktualisiert.`, 'success');
            } catch (err) {
                console.error(err);
                showToast('Fehler beim Import: ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
    });

    // --- History Actions ---
    document.getElementById('btn-start-rec-action').addEventListener('click', () => {
        const hotkey = document.getElementById('hotkey-input').value;
        showToast('Bitte Global Hotkey nutzen: ' + hotkey, 'info');
    });

    document.getElementById('history-search').addEventListener('input', (e) => {
        loadHistory(e.target.value);
    });

    // Settings Save
    document.getElementById('save-settings-btn').addEventListener('click', async () => {
        const key = document.getElementById('api-key-input').value;
        const device = document.getElementById('audio-device-select').value;
        const autoStart = document.getElementById('check-autostart').checked;
        const startMin = document.getElementById('check-startmin').checked;
        const overlayPos = document.getElementById('overlay-pos-select').value;

        await window.electron.saveApiKey(key);
        await window.electron.saveAudioDevice(device);
        await window.electron.saveOverlayPosition(overlayPos);

        // Save launch settings
        await window.electron.saveLaunchSettings({
            openAtLogin: autoStart,
            openAsHidden: startMin
        });

        await checkApiStatus();

        showToast('Einstellungen gespeichert', 'success');
    });

    // Hotkey Listener (Issue #7)
    const hotkeyInput = document.getElementById('hotkey-input');
    if (hotkeyInput) {
        hotkeyInput.addEventListener('keydown', async (e) => {
            e.preventDefault();

            const parts = [];
            if (e.ctrlKey) parts.push('CommandOrControl');
            if (e.altKey) parts.push('Alt');
            if (e.shiftKey) parts.push('Shift');

            // Get key name (excluding modifier keys themselves)
            const ignoredKeys = ['Control', 'Alt', 'Shift', 'Meta'];
            if (!ignoredKeys.includes(e.key)) {
                // Normalize key (uppercase letter or special key name)
                let keyName = e.key.length === 1 ? e.key.toUpperCase() : e.key;
                parts.push(keyName);
            }

            if (parts.length > 1) { // Need at least modifier + key
                const combo = parts.join('+');
                hotkeyInput.value = combo;
                hotkeyInput.dataset.value = combo;
            }
        });

        hotkeyInput.addEventListener('blur', async () => {
            const newHotkey = hotkeyInput.dataset.value;
            if (newHotkey) {
                try {
                    await window.electron.saveHotkey(newHotkey);
                    showToast('Hotkey gespeichert: ' + newHotkey, 'success');
                } catch (err) {
                    showToast('Hotkey konnte nicht gespeichert werden', 'error');
                }
            }
        });
    }

    attachUpdaterLogic();
}

function attachUpdaterLogic() {
    const statusEl = document.getElementById('update-status');
    const checkBtn = document.getElementById('btn-check-updates');
    const restartBtn = document.getElementById('btn-restart-update');
    const progressEl = document.getElementById('update-progress-bar');
    const fillEl = document.getElementById('update-progress-fill');

    if (checkBtn) {
        checkBtn.addEventListener('click', async () => {
            statusEl.innerText = 'Checking...';
            await window.electron.checkForUpdates();
        });
    }

    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            window.electron.quitAndInstall();
        });
    }

    // Listeners
    window.electron.onUpdateMessage((text) => {
        statusEl.innerText = text;
    });

    window.electron.onUpdateProgress((percent) => {
        progressEl.style.display = 'block';
        fillEl.style.width = percent + '%';
        statusEl.innerText = `Downloading... ${Math.round(percent)}%`;
    });

    window.electron.onUpdateDownloaded((info) => {
        statusEl.innerText = `Ready to install: ${info.version}`;
        restartBtn.classList.remove('hidden');
        progressEl.style.display = 'none';
    });
}
// --- DASHBOARD / STATS ---
async function loadStats() {
    try {
        const stats = await window.electron.getStats();
        // Update Stats Cards
        const elTotal = document.getElementById('stat-total');
        const elWords = document.getElementById('stat-words');
        const elTime = document.getElementById('stat-time');

        if (elTotal) elTotal.innerText = stats.totalTranscriptions || 0;
        if (elWords) elWords.innerText = (stats.totalChars || 0).toLocaleString('de-DE');
        if (elTime) {
            const mins = Math.round((stats.savedTime || 0) / 60);
            const val = (stats.savedTime || 0) > 3600
                ? `${((stats.savedTime || 0) / 3600).toFixed(1)} h`
                : `${mins} m`;
            elTime.innerText = val;
        }

        // Render Activity Table
        const history = await window.electron.getHistory();
        renderActivityTable(history);
        updateActiveModeDisplay();
    } catch (e) {
        console.warn('Stats load failed', e);
    }
}


// Make globally available for onclicks in HTML (if any exist)
window.loadStats = loadStats;
window.loadInitialData = loadInitialData;
window.deleteCustomMode = deleteCustomMode;
