import { State, PRESET_ICONS } from './state.js';
import { showToast } from './toast.js';

export async function loadModesForEditor() {
    const container = document.getElementById('mode-list-container');
    if (!container) return;
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

    State.allModes = [];
    sysModes.forEach(m => State.allModes.push({ ...m, type: 'system' }));

    customModes.forEach(m => {
        const existingIdx = State.allModes.findIndex(sm => sm.id === m.id);
        if (existingIdx >= 0) {
            State.allModes[existingIdx] = { ...m, type: 'system-override' };
        } else {
            State.allModes.push({ ...m, type: 'custom' });
        }
    });

    State.allModes.forEach(mode => {
        const item = document.createElement('div');
        item.className = 'mode-list-item';
        if (mode.id === State.editingModeId) item.classList.add('active');

        const isGlobalActive = mode.id === State.currentActiveMode;
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

export function prepareEditor(mode) {
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
        State.editingModeId = mode.id;
        nameIn.value = mode.name;
        promptIn.value = mode.prompt || '';
        iconIn.value = mode.icon || '✨';

        // Active State UI
        if (mode.id === State.currentActiveMode) {
            activeIndicator.classList.remove('hidden');
            setActiveBtn.classList.add('hidden');
        } else {
            activeIndicator.classList.add('hidden');
            setActiveBtn.classList.remove('hidden');
        }

        if (mode.type === 'custom') {
            deleteBtn.classList.remove('hidden');
        } else {
            deleteBtn.classList.add('hidden');
        }

    } else {
        State.editingModeId = null;
        nameIn.value = '';
        promptIn.value = '';
        iconIn.value = '✨';
        nameIn.placeholder = "Neuer Modus Name";

        activeIndicator.classList.add('hidden');
        setActiveBtn.classList.add('hidden');
        deleteBtn.classList.add('hidden');
    }
}

export async function saveModeFromEditor() {
    const name = document.getElementById('edit-name').value;
    const prompt = document.getElementById('edit-prompt').value;
    const icon = document.getElementById('edit-icon').value;

    if (!name) return showToast('Name fehlt!', 'error');

    const newMode = {
        id: State.editingModeId || Date.now().toString(),
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
    if (State.currentActiveMode === newMode.id) {
        updateActiveModeDisplay();
    }

    await loadModesForEditor();

    // Reselect the mode in editor
    const reloaded = State.allModes.find(m => m.id === newMode.id);
    prepareEditor(reloaded);

    showToast('Modus gespeichert!', 'success');
}

export async function deleteCustomMode(id) {
    try {
        const customModes = await window.electron.getCustomModes() || [];
        const newModes = customModes.filter(m => m.id !== id);
        await window.electron.saveCustomModes(newModes);

        // If we deleted the active mode, revert to standard
        if (State.currentActiveMode === id) {
            State.currentActiveMode = 'standard';
            await window.electron.saveTranscriptionMode('standard');
        }

        if (window.loadInitialData) await window.loadInitialData();

        // Force reset to first mode
        if (State.allModes && State.allModes.length > 0) {
            prepareEditor(State.allModes[0]);
        } else {
            prepareEditor(null);
        }
    } catch (error) {
        console.error('Delete failed:', error);
        showToast('Fehler beim Löschen: ' + error.message, 'error');
    }
}

export function updateActiveModeDisplay() {
    const activeLabel = document.getElementById('dashboard-active-mode');
    const activeIconContainer = document.querySelector('.active-mode-card .am-icon');

    const modeIcons = {
        'standard': '🎤',
        'email': '✉️',
        'jira': '🎫',
        'chat': '💬'
    };

    window.electron.getCustomModes().then(customModes => {
        let displayOne = "Standard";
        let iconOne = "🎤";

        if (modeIcons[State.currentActiveMode]) {
            displayOne = State.currentActiveMode.charAt(0).toUpperCase() + State.currentActiveMode.slice(1);
            if (State.currentActiveMode === 'jira') displayOne = 'Jira Ticket';
            iconOne = modeIcons[State.currentActiveMode];
        } else {
            const found = customModes.find(m => m.id === State.currentActiveMode);
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
