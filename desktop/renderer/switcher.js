const listContainer = document.getElementById('mode-list');
let modes = [];
let activeModeId = 'standard';
let selectedIndex = 0;

// Initialize
window.electron.onUpdateModes((data) => {
    console.log('Update modes received:', data);
    modes = data.modes || [];
    activeModeId = data.activeModeId;
    renderList();
    focusItem(0);
});

function renderList() {
    listContainer.innerHTML = '';
    modes.forEach((mode, index) => {
        const div = document.createElement('div');
        div.className = `mode-item ${mode.id === activeModeId ? 'active' : ''}`;
        div.dataset.index = index;
        div.onclick = () => selectMode(mode.id);

        div.innerHTML = `
            <span class="mode-icon">${mode.icon || '🎤'}</span>
            <div class="mode-info">
                <span class="mode-name">${mode.name}</span>
                <span class="mode-desc">${mode.description || ''}</span>
            </div>
        `;
        listContainer.appendChild(div);
    });
}

function selectMode(id) {
    window.electron.switchMode(id);
}

function focusItem(index) {
    const items = document.querySelectorAll('.mode-item');
    items.forEach(i => i.style.background = ''); // Reset explicit hover
    if (items[index]) {
        items[index].scrollIntoView({ block: 'nearest' });
        items[index].style.background = 'var(--bg-input)';
        items[index].style.borderColor = 'var(--primary)';
        selectedIndex = index;
    }
}

// Keyboard Navigation
document.addEventListener('keydown', (e) => {
    const items = document.querySelectorAll('.mode-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
        selectedIndex = (selectedIndex + 1) % items.length;
        focusItem(selectedIndex);
    } else if (e.key === 'ArrowUp') {
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
        focusItem(selectedIndex);
    } else if (e.key === 'Enter') {
        selectMode(modes[selectedIndex].id);
    } else if (e.key === 'Escape') {
        window.electron.hideSwitcher();
    }
});
