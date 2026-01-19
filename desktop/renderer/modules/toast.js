// --- Toast Notification System (Issue #8) ---
export function showToast(message, type = 'info') {
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
