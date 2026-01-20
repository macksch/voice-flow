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
            prompt: `- Behalte die Sprache des Inputs STRIKT bei (Input Englisch = Output Englisch).
- Entferne NUR Füllwörter (äh, ähm, also, sozusagen) und Stottern.
- Korrigiere Grammatik und Zeichensetzung präzise.
- Ändere NIEMALS den Wortlaut oder Stil, wenn es nicht grammatikalisch notwendig ist.
- Gib NUR den bereinigten Text zurück.`
        },
        {
            id: 'email',
            name: 'E-Mail',
            icon: '✉️',
            prompt: `- Sprache: Wie Input.
- Formatiere den Text als professionelle E-Mail mit Absätzen.
- Korrigiere Grammatik und Ausdruck.
- Füge eine zum Kontext passende Anrede und Grußformel hinzu (falls nicht diktiert).
- Tonalität: Höflich, professionell, klar.
- Gib NUR den E-Mail-Body zurück (keine Betreff-Vorschläge, keine Meta-Texte).`
        },
        {
            id: 'jira',
            name: 'Jira Ticket',
            icon: '🎫',
            prompt: `- Sprache: Wie Input.
- Strukturiere den Inhalt professionell in ein Jira-Ticket um.
- Versuche, die folgenden Abschnitte zu füllen (falls Informationen vorhanden sind):
  **Zusammenfassung**
  (Ein prägnanter Titel)

  **Beschreibung**
  (Detaillierte Problembeschreibung oder Anforderung)

  **Akzeptanzkriterien**
  (Liste der Anforderungen als Bullet Points)
- Tonalität: Technisch, sachlich, präzise (Entwickler-Sprache).
- Entferne Füllwörter komplett.
- Formatiere Code-Snippets oder Fehlermeldungen in Markdown-Codeblöcken.`
        },
        {
            id: 'chat',
            name: 'Chat',
            icon: '💬',
            prompt: `- Sprache: Wie Input.
- Entferne nur grobe Füllwörter (äh, ähm).
- Behalte die lockere, gesprochene Umgangssprache bei ("Du"-Form).
- Verwende Emojis, wenn es zum Kontext passt (aber sparsam).
- Korrigiere keine saloppen Formulierungen (z.B. "is nich" statt "ist nicht"), um den Chat-Charakter zu wahren.
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
    const examplesIn = document.getElementById('edit-examples');
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
        if (examplesIn) examplesIn.value = formatExamples(mode.examples);

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
        if (examplesIn) examplesIn.value = '';

        activeIndicator.classList.add('hidden');
        setActiveBtn.classList.add('hidden');
        deleteBtn.classList.add('hidden');
    }
}

export async function saveModeFromEditor() {
    const name = document.getElementById('edit-name').value;
    const prompt = document.getElementById('edit-prompt').value;
    const icon = document.getElementById('edit-icon').value;
    const examplesText = document.getElementById('edit-examples')?.value;

    if (!name) return showToast('Name fehlt!', 'error');

    const newMode = {
        id: State.editingModeId || Date.now().toString(),
        name,
        prompt,
        icon,
        examples: parseExamples(examplesText)
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

    });
}

// Helper to parse examples from textarea
function parseExamples(text) {
    if (!text) return [];
    return text.split('---').map(block => {
        const inputMatch = block.match(/INPUT:\s*(.+)/s);
        const outputMatch = block.match(/OUTPUT:\s*(.+)/s);
        if (inputMatch && outputMatch) {
            return { input: inputMatch[1].trim(), output: outputMatch[1].trim() };
        }
        return null;
    }).filter(Boolean);
}

// Helper to format examples for textarea
function formatExamples(examples) {
    if (!examples || examples.length === 0) return '';
    return examples.map(e => `INPUT: ${e.input}\nOUTPUT: ${e.output}`).join('\n---\n');
}
