import { State } from './state.js';
import { showToast } from './toast.js';

export async function loadHistory(filterText = '') {
    const history = await window.electron.getHistory();

    // Sort logic (newest first)
    history.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
    });

    State.currentLoadedHistory = history.filter(h => !filterText || (h.text && h.text.toLowerCase().includes(filterText.toLowerCase())));

    // Reset Pagination
    State.historyDisplayLimit = 20;

    renderHistoryList();
}

export function renderHistoryList() {
    const container = document.getElementById('history-feed');
    if (!container) return;

    container.innerHTML = '';

    const visible = State.currentLoadedHistory.slice(0, State.historyDisplayLimit);

    visible.forEach(entry => {
        const card = document.createElement('div');
        card.className = 'history-card';

        const date = new Date(entry.timestamp || Date.now());
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString();

        let badgeClass = 'standard';
        let displayMode = entry.modeName || entry.mode;

        // Resolve Mode Name from allModes
        if (typeof State.allModes !== 'undefined') {
            const modeObj = State.allModes.find(m => m.id === entry.mode);
            if (modeObj) {
                if (!entry.modeName) displayMode = modeObj.name;
                if (['email', 'chat', 'jira'].includes(entry.mode)) badgeClass = entry.mode;
            } else {
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
    if (State.currentLoadedHistory.length > State.historyDisplayLimit) {
        const btnContainer = document.createElement('div');
        btnContainer.style.textAlign = 'center';
        btnContainer.style.marginTop = '20px';
        btnContainer.style.marginBottom = '20px';

        const btn = document.createElement('button');
        btn.className = 'btn-secondary';
        btn.innerText = `Mehr laden (${State.currentLoadedHistory.length - State.historyDisplayLimit} weitere)`;
        btn.onclick = () => {
            State.historyDisplayLimit += 20;
            renderHistoryList();
        };

        btnContainer.appendChild(btn);
        container.appendChild(btnContainer);
    }

    if (State.currentLoadedHistory.length === 0) {
        container.innerHTML = '<div style="text-align:center; opacity:0.6; padding:20px;">Keine Einträge gefunden.</div>';
    }
}

export function renderActivityTable(history) {
    const tbody = document.getElementById('activity-table-body');
    const countLabel = document.getElementById('activity-count');
    const totalLabel = document.getElementById('total-count');

    if (!tbody) return;

    tbody.innerHTML = '';

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

        let statusClass = 'badge-success';
        let statusText = 'ERFOLGREICH';

        if (entry.mode === 'email' || entry.mode === 'jira') {
            statusClass = 'badge-processing';
            statusText = 'BEARBEITET';
        }

        const dateObj = new Date(entry.timestamp);
        const dateStr = dateObj.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = dateObj.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

        const rawText = entry.result || entry.text || '';
        const shortText = rawText.length > 40 ? rawText.substring(0, 40) + '...' : rawText;
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

        tr.querySelector('.btn-copy').addEventListener('click', () => {
            window.electron.copyToClipboard(rawText);
            showToast('Kopiert!', 'success');
        });

        tr.querySelector('.btn-delete').addEventListener('click', async (e) => {
            if (confirm('Eintrag löschen?')) {
                if (entry.id) {
                    await window.electron.deleteHistoryEntry(entry.id);
                    tr.remove();
                    // Load stats refresh
                    if (window.loadStats) window.loadStats();
                    showToast('Eintrag gelöscht', 'success');
                } else {
                    tr.remove();
                    showToast('Eintrag lokal entfernt (Keine ID)', 'info');
                }
            }
        });

        tbody.appendChild(tr);
    });
}
