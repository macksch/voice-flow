export async function loadDictionary() {
    const entries = await window.electron.getDictionary() || [];
    renderDictionaryList(entries);
}

export function renderDictionaryList(entries) {
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

export async function addDictEntry() {
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

export async function deleteDictEntry(id) {
    if (confirm('Eintrag wirklich löschen?')) {
        await window.electron.removeDictionaryEntry(id);
        loadDictionary();
    }
}
