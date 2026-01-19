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

    container.innerHTML = entries.map(e => {
        const variationsText = e.variations && e.variations.length > 0
            ? `<span style="opacity:0.6; font-size:0.9em;"> (${e.variations.join(', ')})</span>`
            : '';

        return `
        <div class="dict-entry">
            <div style="flex:1; overflow:hidden; text-overflow:ellipsis;">
                <span class="dict-spoken">"${e.spoken}"${variationsText}</span>
                <span class="dict-arrow">→</span>
                <span class="dict-written">"${e.written}"</span>
            </div>
            <button class="dict-delete" onclick="deleteDictEntry('${e.id}')">🗑️</button>
        </div>
    `}).join('');
}

export async function addDictEntry() {
    const spokenInput = document.getElementById('dict-spoken');
    const writtenInput = document.getElementById('dict-written');

    const rawSpoken = spokenInput.value.trim();
    const written = writtenInput.value.trim();

    if (!rawSpoken || !written) return;

    // Parse variations (comma separated)
    const parts = rawSpoken.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const spoken = parts[0];
    const variations = parts.slice(1);

    await window.electron.addDictionaryEntry({ spoken, variations, written });
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
