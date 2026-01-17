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

// --- Toast Notification System (Issue #8) ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.warn('Toast container not found, falling back to console');
        console.log(`[${type.toUpperCase()}] ${message}`);
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Expose globally
window.showToast = showToast;

// --- Global State ---
let currentActiveMode = 'standard';
let editingModeId = null;
let allModes = [];

const PRESET_ICONS = [
    '🎤', '✉️', '🎫', '💬', '📝', '⚡', '💡', '🤖',
    '📅', '✅', '🐛', '📢', '🧠', '📚', '🎨', '🎵',
    '🌍', '💻', '🔒', '🛒', '🎓', '🏥', '✈️', '🏠',
    '🚀', '⭐', '🔥', '❤️', '⚠️', '🛑'
];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadInitialData();
        attachEventListeners();
        renderActivityChart();
        checkFirstRun(); // Trigger Tutorial
    } catch (e) {
        console.error('Initialization failed', e);
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

async function loadInitialData() {
    await loadStats();
    await loadHistory();
    await loadSettings();
    currentActiveMode = await window.electron.getTranscriptionMode() || 'standard';
    updateActiveModeDisplay();
    await loadModesForEditor();

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
                subEl.textContent = 'Überprüfe und verwalte deine Transkripte.';
                loadHistory();
            } else if (item.dataset.tab === 'settings') {
                titleEl.textContent = 'Einstellungen';
                subEl.textContent = 'Systemkonfiguration.';
                loadSettings();
            }
        });
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
        if (editingModeId && editingModeId !== 'new') {
            const original = allModes.find(m => m.id === editingModeId);
            if (original) prepareEditor(original);
        } else {
            // If we were creating new, maybe go back to first mode or clear
            if (allModes.length > 0) prepareEditor(allModes[0]);
        }
    });

    document.getElementById('btn-set-active').addEventListener('click', async () => {
        if (editingModeId) {
            currentActiveMode = editingModeId;
            await window.electron.saveTranscriptionMode(editingModeId);
            updateActiveModeDisplay();
            await loadModesForEditor(); // Refresh list dots
            prepareEditor(allModes.find(m => m.id === editingModeId)); // Refresh header UI
        }
    });

    document.getElementById('btn-delete-mode').addEventListener('click', async () => {
        if (confirm('Möchtest du diesen Modus wirklich löschen?')) {
            await deleteCustomMode(editingModeId);
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

async function deleteCustomMode(id) {
    try {
        const customModes = await window.electron.getCustomModes() || [];
        const newModes = customModes.filter(m => m.id !== id);
        await window.electron.saveCustomModes(newModes);

        // If we deleted the active mode, revert to standard
        if (currentActiveMode === id) {
            currentActiveMode = 'standard';
            await window.electron.saveTranscriptionMode('standard');
        }

        await loadInitialData(); // Full refresh

        // Force reset to first mode
        if (allModes && allModes.length > 0) {
            prepareEditor(allModes[0]);
        } else {
            // Should not happen as System modes exist, but safe fallback
            prepareEditor(null);
        }
    } catch (error) {
        console.error('Delete failed:', error);
        showToast('Fehler beim Löschen: ' + error.message, 'error');
    }
}

// --- DASHBOARD / STATS ---
async function loadStats() {
    const history = await window.electron.getHistory();
    document.getElementById('stat-total').innerText = history.length;

    const words = history.reduce((acc, curr) => acc + (curr.text ? curr.text.split(' ').length : 0), 0);
    document.getElementById('stat-words').innerText = (words / 1000).toFixed(1) + 'k';

    updateActiveModeDisplay();
}

function updateActiveModeDisplay() {
    const activeEl = document.getElementById('stat-active-mode');

    let modeName = currentActiveMode;
    const sysModes = { 'standard': 'Standard', 'email': 'E-Mail', 'jira': 'Jira', 'chat': 'Chat' };

    if (sysModes[currentActiveMode]) modeName = sysModes[currentActiveMode];
    else {
        window.electron.getCustomModes().then(custom => {
            const found = custom.find(m => m.id === currentActiveMode);
            if (found) {
                activeEl.innerText = found.name;
            } else {
                activeEl.innerText = currentActiveMode; // Fallback
            }
        });
    }
    // Set immediate text if known (for system modes)
    if (sysModes[currentActiveMode]) activeEl.innerText = modeName;
}

function renderActivityChart() {
    const container = document.getElementById('activity-chart');
    container.innerHTML = '';
    const data = [30, 45, 20, 60, 80, 50, 90];
    data.forEach(val => {
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = `${val}%`;
        bar.title = `${val} min`;
        container.appendChild(bar);
    });
}


// --- MODE EDITOR ---
async function loadModesForEditor() {
    const container = document.getElementById('mode-list-container');
    container.innerHTML = '';

    const sysModes = [
        {
            id: 'standard',
            name: 'Standard (Diktat)',
            icon: '🎤',
            prompt: `Du bist ein professioneller Lektor. Deine Aufgabe ist es, den gesprochenen Text exakt wiederzugeben:
- Behalte die gesprochene Sprache bei (Deutsch oder Englisch). NICHT übersetzen.
- Entferne nur Füllwörter (äh, ähm, also, halt).
- Korrigiere nur offensichtliche Grammatikfehler.
- Behalte den Stil und die Wortwahl bei (keine inhaltlichen Änderungen).
- Gib NUR den bereinigten Text zurück.`
        },
        {
            id: 'email',
            name: 'E-Mail',
            icon: '✉️',
            prompt: `Du bist ein professioneller Kommunikations-Assistent für E-Mails.
- Behalte die gesprochene Sprache bei (Deutsch oder Englisch). NICHT übersetzen.
- Entferne Füllwörter und korrigiere Grammatik.
- Formatiere den Text mit sinnvollen Absätzen.
- Füge bei Bedarf eine passende Anrede und Grußformel hinzu, falls diese fehlen oder impliziert sind.
- Achte auf eine höfliche, professionelle Tonalität.
- Gib NUR den E-Mail-Inhalt zurück (keine Betreffzeile).`
        },
        {
            id: 'jira',
            name: 'Jira Ticket',
            icon: '🎫',
            prompt: `Du bist ein erfahrener Product Owner Assistent. Erstelle ein strukturiertes Jira-Ticket aus dem Input.
- Sprache: Wie Input (De/En).
- Strukturiere den Output ZWINGEND mit diesen Überschriften (in Fettdruck):
  **Zusammenfassung**
  (Ein prägnanter Satz)

  **Beschreibung**
  (Detaillierte Erklärung des Problems oder Features)

  **Akzeptanzkriterien**
  (Liste der Anforderungen als Bullet Points)
- Entferne Füllwörter, aber behalte technische Details exakt bei.`
        },
        {
            id: 'chat',
            name: 'Chat',
            icon: '💬',
            prompt: `Du bist ein intelligenter Chat-Assistent.
- Sprache: Wie Input.
- Entferne Stottern und grobe Füllwörter.
- Behalte eine lockere, informelle ("Du") Tonalität bei.
- Verzichte auf förmliche Korrekturen.
- Gib NUR den Text zurück.`
        }
    ];

    const customModes = await window.electron.getCustomModes() || [];

    allModes = [];
    sysModes.forEach(m => allModes.push({ ...m, type: 'system' }));

    customModes.forEach(m => {
        const existingIdx = allModes.findIndex(sm => sm.id === m.id);
        if (existingIdx >= 0) {
            allModes[existingIdx] = { ...m, type: 'system-override' };
        } else {
            allModes.push({ ...m, type: 'custom' });
        }
    });

    allModes.forEach(mode => {
        const item = document.createElement('div');
        item.className = 'mode-list-item';
        if (mode.id === editingModeId) item.classList.add('active');

        const isGlobalActive = mode.id === currentActiveMode;
        const activeDot = isGlobalActive ? '<span style="color:var(--success); font-size:10px; margin-right:8px;">●</span>' : '';

        item.innerHTML = `
            <div class="mode-list-icon">${mode.icon || '✨'}</div>
            <div style="flex:1; font-weight:500;">
                ${activeDot} ${mode.name}
            </div>
            ${mode.type === 'custom' || mode.type === 'system-override' ? '<span style="font-size:10px; opacity:0.5">BEARBEITET</span>' : ''}
        `;

        item.addEventListener('click', () => {
            prepareEditor(mode);
            // Visual selection update
            document.querySelectorAll('.mode-list-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
        });

        container.appendChild(item);
    });
}

function prepareEditor(mode) {
    const nameIn = document.getElementById('edit-name');
    const promptIn = document.getElementById('edit-prompt');
    const iconIn = document.getElementById('edit-icon');
    const activeIndicator = document.getElementById('editor-active-indicator');
    const setActiveBtn = document.getElementById('btn-set-active');
    const deleteBtn = document.getElementById('btn-delete-mode');

    // Render Icon Grid
    const grid = document.getElementById('icon-picker');
    grid.innerHTML = '';
    PRESET_ICONS.forEach(icon => {
        const div = document.createElement('div');
        div.className = 'icon-option';
        div.innerText = icon;
        div.addEventListener('click', () => {
            document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            iconIn.value = icon;
        });
        if ((mode && mode.icon === icon) || (!mode && icon === '✨')) div.classList.add('selected');
        grid.appendChild(div);
    });

    if (mode) {
        editingModeId = mode.id;
        nameIn.value = mode.name;
        promptIn.value = mode.prompt || '';
        iconIn.value = mode.icon || '✨';

        // Active State UI
        if (mode.id === currentActiveMode) {
            activeIndicator.classList.remove('hidden');
            setActiveBtn.classList.add('hidden');
        } else {
            activeIndicator.classList.add('hidden');
            setActiveBtn.classList.remove('hidden');
        }

        // Delete Button: Only for strictly custom modes. 
        // Can we delete 'system-override'? We could allow "Reset" for standard.
        // For logic simplicity: Logic says "Delete Mode". 
        // If type is 'system' or 'system-override', we theoretically shouldn't delete the ID, but reset functionality.
        // For now, only show Delete for 'custom'.
        if (mode.type === 'custom') {
            deleteBtn.classList.remove('hidden');
        } else {
            deleteBtn.classList.add('hidden');
        }

    } else {
        editingModeId = null;
        nameIn.value = '';
        promptIn.value = '';
        iconIn.value = '✨';
        nameIn.placeholder = "Neuer Modus Name";

        activeIndicator.classList.add('hidden');
        setActiveBtn.classList.add('hidden'); // Can't set active before saving
        deleteBtn.classList.add('hidden');
    }
}

async function saveModeFromEditor() {
    const name = document.getElementById('edit-name').value;
    const prompt = document.getElementById('edit-prompt').value;
    const icon = document.getElementById('edit-icon').value;

    if (!name) return showToast('Name fehlt!', 'error');

    const newMode = {
        id: editingModeId || Date.now().toString(),
        name,
        prompt,
        icon
    };

    const currentCustom = await window.electron.getCustomModes() || [];
    const idx = currentCustom.findIndex(m => m.id === newMode.id);

    if (idx >= 0) {
        currentCustom[idx] = newMode;
    } else {
        currentCustom.push(newMode);
    }

    await window.electron.saveCustomModes(currentCustom);

    // If we just edited the active mode, refresh dashboard
    if (currentActiveMode === newMode.id) {
        updateActiveModeDisplay();
    }

    await loadModesForEditor();

    // Reselect the mode in editor
    const reloaded = allModes.find(m => m.id === newMode.id);
    prepareEditor(reloaded);

    showToast('Modus gespeichert!', 'success');
}


// --- HISTORY ---
async function loadHistory(filterText = '') {
    const container = document.getElementById('history-feed');
    container.innerHTML = '';

    const history = await window.electron.getHistory();
    const filtered = history.filter(h => !filterText || h.text.toLowerCase().includes(filterText.toLowerCase()));

    filtered.reverse().forEach(entry => {
        const card = document.createElement('div');
        card.className = 'history-card';

        const date = new Date(entry.timestamp);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString();

        let badgeClass = 'standard';
        if (entry.mode === 'email') badgeClass = 'email';

        card.innerHTML = `
            <div class="hc-header">
                <span class="hc-badge ${badgeClass}">${entry.mode}</span>
                <span class="hc-time">${dateStr}, ${timeStr}</span>
            </div>
            <div class="hc-content">${entry.text}</div>
            <div class="hc-footer">
                <div class="hc-meta">
                    <span>🌐 DE</span>
                    <span>📄 ${entry.text.length} Zeichen</span>
                </div>
                <button class="btn-copy">Kopieren</button>
            </div>
        `;

        card.querySelector('.btn-copy').addEventListener('click', () => {
            window.electron.copyToClipboard(entry.text);
            showToast('In Zwischenablage kopiert!', 'success');
        });

        container.appendChild(card);
    });
}


// --- SETTINGS ---
async function loadSettings() {
    try {
        const key = await window.electron.getApiKey();
        if (key) document.getElementById('api-key-input').value = key;

        const hotkey = await window.electron.getHotkey();
        const hotkeyInput = document.getElementById('hotkey-input');
        if (hotkey) hotkeyInput.value = hotkey;

        // Auto-Start
        try {
            const launch = await window.electron.getLaunchSettings();
            document.getElementById('check-autostart').checked = launch.openAtLogin;
            document.getElementById('check-startmin').checked = launch.openAsHidden;
        } catch (e) {
            console.warn('Launch settings failed (IPC not ready?)', e);
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(d => d.kind === 'audioinput');
        const select = document.getElementById('audio-device-select');
        select.innerHTML = '';
        audioInputs.forEach(d => {
            const op = document.createElement('option');
            op.value = d.deviceId;
            op.text = d.label || 'Microphone';
            select.appendChild(op);
        });

        // Position
        try {
            const pos = await window.electron.getOverlayPosition();
            const posSelect = document.getElementById('overlay-pos-select');
            if (posSelect) posSelect.value = pos || 'bottom-right';
        } catch (e) { console.warn('Overlay position load failed', e); }

    } catch (err) {
        console.error('Error loading settings:', err);
    }
}
