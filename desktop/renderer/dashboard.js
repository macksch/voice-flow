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
let currentLoadedHistory = [];
let historyDisplayLimit = 20;

const PRESET_ICONS = [
    '🎤', '✉️', '🎫', '💬', '📝', '⚡', '💡', '🤖',
    '📅', '✅', '🐛', '📢', '🧠', '📚', '🎨', '🎵',
    '🌍', '💻', '🔒', '🛒', '🎓', '🏥', '✈️', '🏠',
    '🚀', '⭐', '🔥', '❤️', '⚠️', '🛑'
];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    // Always attach listeners first so UI works even if data fails
    attachEventListeners();
    initSettingsListeners();

    // Listen for mode changes from Switcher (Alt+M)
    if (window.electron && window.electron.onModeChanged) {
        window.electron.onModeChanged(async (modeId) => {
            console.log('Mode changed via Switcher:', modeId);
            currentActiveMode = modeId;
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
    currentActiveMode = await window.electron.getTranscriptionMode() || 'standard';

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

function updateActiveModeDisplay() {
    const activeLabel = document.getElementById('dashboard-active-mode');
    const activeIconContainer = document.querySelector('.active-mode-card .am-icon');

    // Default Icons
    const modeIcons = {
        'standard': '🎤',
        'email': '✉️',
        'jira': '🎫',
        'chat': '💬'
    };

    window.electron.getCustomModes().then(customModes => {
        let displayOne = "Standard";
        let iconOne = "🎤";

        // Check if system mode
        if (modeIcons[currentActiveMode]) {
            displayOne = currentActiveMode.charAt(0).toUpperCase() + currentActiveMode.slice(1);
            if (currentActiveMode === 'jira') displayOne = 'Jira Ticket';
            iconOne = modeIcons[currentActiveMode];
        } else {
            // Check custom mode
            const found = customModes.find(m => m.id === currentActiveMode);
            if (found) {
                displayOne = found.name;
                iconOne = found.icon || '✨';
            } else {
                displayOne = "Unbekannt";
            }
        }

        if (activeLabel) activeLabel.innerText = displayOne;
        if (activeIconContainer) activeIconContainer.innerText = iconOne;
    });
}

function renderActivityTable(history) {
    const tbody = document.getElementById('activity-table-body');
    const countLabel = document.getElementById('activity-count');
    const totalLabel = document.getElementById('total-count');

    if (!tbody) return;

    tbody.innerHTML = '';

    // Sort Newest First
    history.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    const limit = 7;
    const visible = history.slice(0, limit);

    if (countLabel) countLabel.innerText = visible.length;
    if (totalLabel) totalLabel.innerText = history.length;

    if (visible.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; opacity:0.5; padding:20px;">Keine Aktivitäten gefunden.</td></tr>';
        return;
    }

    visible.forEach(entry => {
        const tr = document.createElement('tr');

        // Status Badge logic
        // If mode is 'jira' or 'email' or 'chat', we might assume 'processed'
        // If 'standard' -> 'success'
        // Just a heuristic for now
        let statusClass = 'badge-success';
        let statusText = 'ERFOLGREICH';

        if (entry.mode === 'email' || entry.mode === 'jira') {
            statusClass = 'badge-processing';
            statusText = 'BEARBEITET';
        }

        // Date
        const dateObj = new Date(entry.timestamp);
        const dateStr = dateObj.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = dateObj.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

        // Content
        const rawText = entry.result || entry.text || '';
        const shortText = rawText.length > 40 ? rawText.substring(0, 40) + '...' : rawText;

        // Duration / Length
        // entry.duration not always there? Assume chars count as metric
        const chars = rawText.length;

        tr.innerHTML = `
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td><div class="table-text" title="${rawText.replace(/"/g, '&quot;')}">${shortText}</div></td>
            <td><span class="table-date">${dateStr}, ${timeStr}</span></td>
            <td><span class="table-date">${chars} Zeichen</span></td>
            <td>
                <div class="action-btn-group">
                    <button class="btn-icon-small btn-copy" title="Kopieren">📋</button>
                    <button class="btn-icon-small btn-delete" title="Löschen">🗑️</button>
                </div>
            </td>
        `;

        // Logic
        tr.querySelector('.btn-copy').addEventListener('click', () => {
            window.electron.copyToClipboard(rawText);
            showToast('Kopiert!', 'success');
        });

        // Delete (Only from view strictly speaking, or real delete?)
        // Currently we don't have a clear ID based delete in history store maybe?
        // Entry usually doesn't have an ID unless we added it recently.
        // Assuming index based or we skip delete for now.
        // Let's implement delete if entry has ID, else ignore.
        tr.querySelector('.btn-delete').addEventListener('click', async (e) => {
            if (confirm('Eintrag löschen?')) {
                if (entry.id) {
                    await window.electron.deleteHistoryEntry(entry.id);
                    tr.remove();
                    // Refresh stats to update counts
                    loadStats();
                    showToast('Eintrag gelöscht', 'success');
                } else {
                    // Fallback for very old entries without ID
                    tr.remove();
                    showToast('Eintrag lokal entfernt (Keine ID)', 'info');
                }
            }
        });

        tbody.appendChild(tr);
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
            prompt: `- Sprache beibehalten (Deutsch oder Englisch). NICHT übersetzen.
- Entferne nur Füllwörter (äh, ähm, also, halt).
- Korrigiere nur offensichtliche Grammatikfehler.
- Behalte den Stil und die Wortwahl bei (keine inhaltlichen Änderungen).
- Gib NUR den bereinigten Text zurück.`
        },
        {
            id: 'email',
            name: 'E-Mail',
            icon: '✉️',
            prompt: `- Sprache beibehalten (Deutsch oder Englisch). NICHT übersetzen.
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
            prompt: `- Sprache: Wie Input (De/En).
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
            prompt: `- Sprache: Wie Input.
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
// --- HISTORY ---
async function loadHistory(filterText = '') {
    const history = await window.electron.getHistory();

    // Sort logic (newest first)
    history.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
    });

    currentLoadedHistory = history.filter(h => !filterText || (h.text && h.text.toLowerCase().includes(filterText.toLowerCase())));

    // Reset Pagination
    historyDisplayLimit = 20;

    renderHistoryList();
}

function renderHistoryList() {
    const container = document.getElementById('history-feed');
    if (!container) return;

    container.innerHTML = '';

    const visible = currentLoadedHistory.slice(0, historyDisplayLimit);

    visible.forEach(entry => {
        const card = document.createElement('div');
        card.className = 'history-card';

        const date = new Date(entry.timestamp || Date.now());
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString();

        let badgeClass = 'standard';
        let displayMode = entry.modeName || entry.mode;

        // Resolve Mode Name from allModes (loaded in loadInitialData)
        if (typeof allModes !== 'undefined') {
            const modeObj = allModes.find(m => m.id === entry.mode);
            if (modeObj) {
                if (!entry.modeName) displayMode = modeObj.name;
                // Keep specific styling for system modes
                if (['email', 'chat', 'jira'].includes(entry.mode)) badgeClass = entry.mode;
            } else {
                // Fallback for system IDs if not found in list or legacy
                const names = { 'standard': 'Standard', 'email': 'E-Mail', 'chat': 'Chat', 'jira': 'Jira' };
                if (names[entry.mode]) { displayMode = names[entry.mode]; badgeClass = entry.mode; }
            }
        }

        const text = entry.result || entry.text || '';

        card.innerHTML = `
            <div class="hc-header">
                <span class="hc-badge ${badgeClass}">${displayMode}</span>
                <span class="hc-time">${dateStr}, ${timeStr}</span>
            </div>
            <div class="hc-content">${text}</div>
            <div class="hc-footer">
                <div class="hc-meta">
                    <span>🌐 DE</span>
                    <span>📄 ${text.length} Zeichen</span>
                </div>
                <button class="btn-copy">Kopieren</button>
            </div>
        `;

        card.querySelector('.btn-copy').addEventListener('click', () => {
            window.electron.copyToClipboard(text);
            showToast('In Zwischenablage kopiert!', 'success');
        });

        container.appendChild(card);
    });

    // Load More Button
    if (currentLoadedHistory.length > historyDisplayLimit) {
        const btnContainer = document.createElement('div');
        btnContainer.style.textAlign = 'center';
        btnContainer.style.marginTop = '20px';
        btnContainer.style.marginBottom = '20px';

        const btn = document.createElement('button');
        btn.className = 'btn-secondary';
        btn.innerText = `Mehr laden (${currentLoadedHistory.length - historyDisplayLimit} weitere)`;
        btn.onclick = () => {
            historyDisplayLimit += 20;
            renderHistoryList();
        };

        btnContainer.appendChild(btn);
        container.appendChild(btnContainer);
    }

    if (currentLoadedHistory.length === 0) {
        container.innerHTML = '<div style="text-align:center; opacity:0.6; padding:20px;">Keine Einträge gefunden.</div>';
    }
}

async function loadStats() {
    try {
        const stats = await window.electron.getStats();
        const els = {
            transcriptions: document.getElementById('stat-transcriptions'),
            words: document.getElementById('stat-words'),
            time: document.getElementById('stat-time')
        };

        if (els.transcriptions) els.transcriptions.innerText = stats.totalTranscriptions;
        if (els.words) els.words.innerText = stats.totalChars;
        if (els.time) {
            const mins = Math.round(stats.savedTime / 60);
            els.time.innerText = stats.savedTime > 3600 ? `${(stats.savedTime / 3600).toFixed(1)}h` : `${mins}m`;
        }
    } catch (e) { console.warn('Stats load failed', e); }
}


// --- SETTINGS ---
async function loadSettings() {
    try {
        const apiKeyInput = document.getElementById('api-key-input');
        const hotkeyInput = document.getElementById('hotkey-input');
        const audioDeviceSelect = document.getElementById('audio-device-select');
        const startLoginCheckbox = document.getElementById('check-autostart');
        const startHiddenCheckbox = document.getElementById('check-startmin');
        const transcriptModelSelect = document.getElementById('model-transcription'); // Corrected ID
        const llmModelSelect = document.getElementById('model-llm'); // Corrected ID
        const languageSelect = document.getElementById('languageSelect'); // New element

        // Load Settings
        const apiKey = await window.electron.getApiKey();
        if (apiKey) apiKeyInput.value = apiKey;

        const hotkey = await window.electron.getHotkey();
        if (hotkey) hotkeyInput.value = hotkey;

        const audioDevice = await window.electron.getAudioDevice();
        if (audioDevice) audioDeviceSelect.value = audioDevice;

        const currentLanguage = await window.electron.getLanguage();
        if (currentLanguage) languageSelect.value = currentLanguage;

        const autoPasteCheckbox = document.getElementById('check-autopaste');
        const autoPaste = await window.electron.getAutoPaste();
        if (autoPasteCheckbox) autoPasteCheckbox.checked = autoPaste;

        // User Initials
        const userInitialsInput = document.getElementById('user-initials-input');
        const initials = await window.electron.getUserInitials();
        if (userInitialsInput && initials) userInitialsInput.value = initials;
        // Update avatar
        const avatarEl = document.getElementById('user-avatar');
        if (avatarEl && initials) avatarEl.textContent = initials;

        const launchSettings = await window.electron.getLaunchSettings();
        if (launchSettings) {
            startLoginCheckbox.checked = launchSettings.openAtLogin;
            startHiddenCheckbox.checked = launchSettings.openAsHidden;
        }

        // Load Models
        const models = await window.electron.getModels();
        if (models) {
            if (models.transcription && transcriptModelSelect) transcriptModelSelect.value = models.transcription;
            if (models.llm && llmModelSelect) llmModelSelect.value = models.llm;
        }


        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(d => d.kind === 'audioinput');
        // const select = document.getElementById('audio-device-select'); // This was already defined as audioDeviceSelect
        audioDeviceSelect.innerHTML = '';
        audioInputs.forEach(d => {
            const op = document.createElement('option');
            op.value = d.deviceId;
            op.innerText = d.label || `Microphone ${d.deviceId.slice(0, 5)}...`;
            audioDeviceSelect.appendChild(op);
        });

        // Set selected device after populating
        if (audioDevice) audioDeviceSelect.value = audioDevice;

        // Position
        const pos = await window.electron.getOverlayPosition();
        if (pos) document.getElementById('overlay-pos-select').value = pos;

        // Dictionary & Models
        await loadDictionary();
        await loadModels();

    } catch (err) {
        console.error('Error loading settings:', err);
    }
}

// --- DICTIONARY ---
async function loadDictionary() {
    const entries = await window.electron.getDictionary() || [];
    renderDictionaryList(entries);
}

function renderDictionaryList(entries) {
    const container = document.getElementById('dictionary-list');
    if (!container) return;

    if (entries.length === 0) {
        container.innerHTML = '<div style="color:#6B7280; font-size:13px; font-style:italic;">Keine Einträge vorhanden.</div>';
        return;
    }

    container.innerHTML = entries.map(e => `
        <div class="dict-entry">
            <span class="dict-spoken">"${e.spoken}"</span>
            <span class="dict-arrow">→</span>
            <span class="dict-written">"${e.written}"</span>
            <button class="dict-delete" onclick="deleteDictEntry('${e.id}')">🗑️</button>
        </div>
    `).join('');
}

async function addDictEntry() {
    const spokenInput = document.getElementById('dict-spoken');
    const writtenInput = document.getElementById('dict-written');

    const spoken = spokenInput.value.trim();
    const written = writtenInput.value.trim();

    if (!spoken || !written) return;

    await window.electron.addDictionaryEntry({ spoken, written });
    spokenInput.value = '';
    writtenInput.value = '';
    loadDictionary();
}

async function deleteDictEntry(id) {
    if (confirm('Eintrag wirklich löschen?')) {
        await window.electron.removeDictionaryEntry(id);
        loadDictionary();
    }
}

// Ensure these are globally available for onclick handlers
window.addDictEntry = addDictEntry;
window.deleteDictEntry = deleteDictEntry;

// Event Listener for Add Button
document.getElementById('add-dict-btn')?.addEventListener('click', addDictEntry);


function initSettingsListeners() {
    const languageSelect = document.getElementById('languageSelect');
    const transcriptModelSelect = document.getElementById('model-transcription');
    const llmModelSelect = document.getElementById('model-llm');
    const autoPasteCheckbox = document.getElementById('check-autopaste');
    const startLogin = document.getElementById('check-autostart');
    const startMin = document.getElementById('check-startmin');

    if (languageSelect) {
        languageSelect.onchange = async () => {
            await window.electron.saveLanguage(languageSelect.value);
            showToast('Sprache gespeichert', 'success');
        };
    }

    if (autoPasteCheckbox) {
        autoPasteCheckbox.onchange = async () => {
            await window.electron.saveAutoPaste(autoPasteCheckbox.checked);
            showToast('Einstellung gespeichert', 'success');
        };
    }

    const saveLaunch = async () => {
        if (!startLogin || !startMin) return;
        await window.electron.saveLaunchSettings({
            openAtLogin: startLogin.checked,
            openAsHidden: startMin.checked
        });
        showToast('Start-Einstellungen gespeichert', 'success');
    };

    if (startLogin) startLogin.onchange = saveLaunch;
    if (startMin) startMin.onchange = saveLaunch;

    // User Initials
    const userInitialsInput = document.getElementById('user-initials-input');
    if (userInitialsInput) {
        userInitialsInput.onchange = async () => {
            const val = userInitialsInput.value.toUpperCase().slice(0, 2);
            await window.electron.saveUserInitials(val);
            userInitialsInput.value = val; // Normalize display
            // Update avatar
            const avatarEl = document.getElementById('user-avatar');
            if (avatarEl) avatarEl.textContent = val || 'VF';
            showToast('Initialen gespeichert', 'success');
        };
    }

    if (transcriptModelSelect) {
        transcriptModelSelect.onchange = async (e) => {
            await window.electron.saveModels({ transcription: e.target.value });
            showToast('Modell gespeichert', 'success');
        };
    }

    if (llmModelSelect) {
        llmModelSelect.onchange = async (e) => {
            await window.electron.saveModels({ llm: e.target.value });
            showToast('Modell gespeichert', 'success');
        };
    }

    // Toggle API Visibility
    const toggleApiBtn = document.getElementById('toggle-api-visibility');
    const apiKeyInput = document.getElementById('api-key-input');
    if (toggleApiBtn && apiKeyInput) {
        toggleApiBtn.onclick = () => {
            const isSecret = apiKeyInput.type === 'password';
            apiKeyInput.type = isSecret ? 'text' : 'password';
            toggleApiBtn.innerText = isSecret ? '🔒' : '👁️';
        };
    }
}

// --- MODELS ---
async function loadModels() {
    // This function now only ensures the models are loaded and selected,
    // the listeners are handled by initSettingsListeners.
    const models = await window.electron.getModels();

    const transSelect = document.getElementById('model-transcription');
    const llmSelect = document.getElementById('model-llm');

    if (transSelect && models.transcription) {
        transSelect.value = models.transcription;
    }

    if (llmSelect && models.llm) {
        llmSelect.value = models.llm;
    }
}
