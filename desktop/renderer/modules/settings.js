import { loadDictionary } from './dictionary.js';
import { showToast } from './toast.js';
import { TRANSCRIPTION_MODELS, LLM_MODELS } from '../api.js';

function populateModelSelects() {
    const transcriptModelSelect = document.getElementById('model-transcription');
    const llmModelSelect = document.getElementById('model-llm');

    if (transcriptModelSelect) {
        transcriptModelSelect.innerHTML = '';
        Object.entries(TRANSCRIPTION_MODELS).forEach(([id, model]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = `${model.name} ($${model.price}/min)`;
            transcriptModelSelect.appendChild(option);
        });
    }

    if (llmModelSelect) {
        llmModelSelect.innerHTML = '';
        Object.entries(LLM_MODELS).forEach(([id, model]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = `${model.name} ($${model.inputPrice}/$${model.outputPrice})`;
            llmModelSelect.appendChild(option);
        });
    }
}

export async function loadSettings() {
    try {
        populateModelSelects();

        const transcriptModelSelect = document.getElementById('model-transcription');
        const llmModelSelect = document.getElementById('model-llm');

        const hotkeyInput = document.getElementById('hotkey-input');
        const audioDeviceSelect = document.getElementById('audio-device-select');
        const startLoginCheckbox = document.getElementById('check-autostart');
        const startHiddenCheckbox = document.getElementById('check-startmin');
        const languageSelect = document.getElementById('languageSelect');
        const apiKeyInput = document.getElementById('api-key-input');

        const key = await window.electron.getApiKey();
        if (key && apiKeyInput) apiKeyInput.value = key;

        const hotkey = await window.electron.getHotkey();
        if (hotkey) hotkeyInput.value = hotkey;

        const audioDevice = await window.electron.getAudioDevice();
        if (audioDevice) audioDeviceSelect.value = audioDevice;

        const currentLanguage = await window.electron.getLanguage();
        if (currentLanguage) languageSelect.value = currentLanguage;

        const autoPasteCheckbox = document.getElementById('check-autopaste');
        const autoPaste = await window.electron.getAutoPaste();
        if (autoPasteCheckbox) autoPasteCheckbox.checked = autoPaste;

        const userInitialsInput = document.getElementById('user-initials-input');
        const initials = await window.electron.getUserInitials();
        if (userInitialsInput && initials) userInitialsInput.value = initials;

        const avatarEl = document.getElementById('user-avatar');
        if (avatarEl && initials) avatarEl.textContent = initials;

        const launchSettings = await window.electron.getLaunchSettings();
        if (launchSettings) {
            startLoginCheckbox.checked = launchSettings.openAtLogin;
            startHiddenCheckbox.checked = launchSettings.openAsHidden;
        }

        const models = await window.electron.getModels();
        if (models) {
            if (models.transcription && transcriptModelSelect) transcriptModelSelect.value = models.transcription;
            if (models.llm && llmModelSelect) llmModelSelect.value = models.llm;
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        let audioInputs = devices.filter(d => d.kind === 'audioinput');

        // If no devices found (or labels empty), request permission
        if (audioInputs.length === 0 || audioInputs.every(d => !d.label)) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                // Enumerate again after permission
                const newDevices = await navigator.mediaDevices.enumerateDevices();
                audioInputs = newDevices.filter(d => d.kind === 'audioinput');
                // Stop stream immediately
                stream.getTracks().forEach(t => t.stop());
            } catch (e) {
                console.warn('Microphone permission denied', e);
                showToast('Mikrofon-Zugriff verweigert', 'error');
            }
        }

        audioDeviceSelect.innerHTML = '';
        console.log('[Settings] Audio Inputs found:', audioInputs.length, audioInputs);
        if (audioInputs.length === 0) {
            const op = document.createElement('option');
            op.value = 'default';
            op.innerText = 'Standard-Mikrofon';
            audioDeviceSelect.appendChild(op);
        } else {
            audioInputs.forEach(d => {
                const op = document.createElement('option');
                op.value = d.deviceId;
                op.innerText = d.label || `Microphone ${d.deviceId.slice(0, 5)}...`;
                audioDeviceSelect.appendChild(op);
            });
        }

        if (audioDevice) audioDeviceSelect.value = audioDevice;

        const pos = await window.electron.getOverlayPosition();
        if (pos) document.getElementById('overlay-pos-select').value = pos;

        await loadDictionary();
        await loadModels();

    } catch (err) {
        console.error('Error loading settings:', err);
    }
}

export function initSettingsListeners() {
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

    const userInitialsInput = document.getElementById('user-initials-input');
    if (userInitialsInput) {
        userInitialsInput.onchange = async () => {
            const val = userInitialsInput.value.toUpperCase().slice(0, 2);
            await window.electron.saveUserInitials(val);
            userInitialsInput.value = val;
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

export async function loadModels() {
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
