let mediaRecorder;
let audioChunks = [];
let startTime;
let timerInterval;
let currentModeName = 'Standard';

// Visualizer State
let audioContext;
let analyser;
let dataArray;

// DOM Elements
const timerElement = document.getElementById('timer');
const cancelBtn = document.getElementById('cancel-btn');
const modeBadge = document.getElementById('current-mode');

// Pending UI Elements
const recordingPill = document.getElementById('recording-pill');
const pendingPill = document.getElementById('pending-pill');
const copyPendingBtn = document.getElementById('copy-pending-btn');
const closePendingBtn = document.getElementById('close-pending-btn');

// --- Visualizer Logic ---
function initVisualizer() {
    const visualizer = document.getElementById('visualizer');
    visualizer.innerHTML = '';
    // Create bars
    for (let i = 0; i < 15; i++) {
        const bar = document.createElement('div');
        bar.className = 'bar';
        visualizer.appendChild(bar);
    }
}

function startVisualizer(stream) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Resume context if suspended
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 64; // Higher resolution for better look
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    const bars = document.querySelectorAll('.bar');

    function draw() {
        if (!isRecording) return; // Stop drawing

        analyser.getByteFrequencyData(dataArray);

        bars.forEach((bar, index) => {
            // We have 15 bars, simply pick data points spaced out
            const dataIndex = Math.floor(index * (bufferLength / 15));
            const val = dataArray[dataIndex] || 0;

            // Map 0-255 to height 3px - 16px
            const height = Math.max(3, (val / 255) * 16);
            bar.style.height = `${height}px`;

            // Opacity based on loudness
            bar.style.opacity = Math.max(0.3, val / 200);
        });

        requestAnimationFrame(draw);
    }

    draw();
}

let isRecording = false;

// --- Event Listeners from Main ---
if (window.electron && window.electron.onStartRecording) {
    window.electron.onStartRecording(async () => {
        console.log('Start Recording triggered');
        isRecording = true;
        audioChunks = [];

        // Reset UI
        if (timerElement) timerElement.innerText = "00:00";
        // Ensure recording UI is shown
        if (recordingPill) recordingPill.style.display = 'flex';
        if (pendingPill) pendingPill.style.display = 'none';

        initVisualizer();

        // Get Settings
        const deviceId = await window.electron.getAudioDevice();
        const mode = await window.electron.getTranscriptionMode();

        // Update Badge
        if (modeBadge) {
            // Define system modes locally to map IDs
            const sysModes = {
                'standard': 'Standard Mode',
                'email': 'E-Mail',
                'jira': 'Jira Ticket',
                'chat': 'Chat'
            };

            let displayMode = sysModes[mode] || mode; // Default to ID if not standard

            // Check Custom Modes if not standard or to ensure override
            const customModes = await window.electron.getCustomModes() || [];
            const custom = customModes.find(m => m.id === mode);
            if (custom) {
                displayMode = custom.name;
            }

            currentModeName = displayMode;
            modeBadge.innerText = displayMode;
        }

        try {
            const constraints = {
                audio: {
                    deviceId: deviceId !== 'default' ? { exact: deviceId } : undefined
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            startVisualizer(stream);

            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.isCancelled = false;

            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                // Stop tracks
                stream.getTracks().forEach(track => track.stop());

                if (mediaRecorder.isCancelled) {
                    mediaRecorder.isCancelled = false;
                    isRecording = false;
                    return;
                }

                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); // Chrome/Electron uses webm
                processAudio(audioBlob, mode);
                isRecording = false;
            };

            mediaRecorder.start();
            startTimer();

        } catch (err) {
            console.error('Mic Error:', err);
            // alert('Mikrofon Fehler: ' + err.message); // Blocking
            window.electron.showToast('Mikrofon Fehler: ' + err.message, 'error');
            window.electron.closeOverlay();
        }
    });

    window.electron.onStopRecording(() => {
        console.log('Stop Recording triggered');
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            stopTimer();
        }
    });
} else {
    console.error('Electron bindings not found');
}

// --- Timer ---
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const diff = Date.now() - startTime;
        const totalSeconds = Math.floor(diff / 1000);
        const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const secs = (totalSeconds % 60).toString().padStart(2, '0');
        if (timerElement) timerElement.innerText = `${mins}:${secs}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

// --- Cancel Logic ---
async function cancelRecording() {
    console.log('Canceling...');
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.isCancelled = true;
        mediaRecorder.stop();
        stopTimer();
        // Notify main
        if (window.electron) window.electron.cancelRecording();
    } else {
        if (window.electron) window.electron.closeOverlay();
    }
}

if (cancelBtn) {
    cancelBtn.addEventListener('click', cancelRecording);
}

// Escape Key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        cancelRecording();
    }
});

import { transcribe, cleanText } from './api.js';

// ... existing code ...

async function processAudio(audioBlob, mode) {
    try {
        const apiKey = await window.electron.getApiKey();
        if (!apiKey) {
            alert('API Key fehlt! Bitte im Dashboard konfigurieren.');
            window.electron.closeOverlay();
            return;
        }

        if (modeBadge) {
            modeBadge.innerText = "Transcribing...";
            modeBadge.style.color = "#FFD700";
        }

        // Removed manual check for window.transcribe since we import it


        // Get Models, Dictionary & Language
        const models = await window.electron.getModels();
        const dictionary = await window.electron.getDictionary() || [];
        const language = await window.electron.getLanguage() || 'auto';

        // Transcribe - Always use auto to let Whisper detect language
        const transcriptionResult = await transcribe(audioBlob, apiKey, models.transcription, 'auto');
        const rawText = transcriptionResult.text;
        // Use detected language from Whisper, or fallback to 'auto' (let LLM decide)
        const detectedLanguage = transcriptionResult.detectedLanguage || 'auto';

        // Debug: Show detected language via Toast
        await window.electron.showToast(`Erkannte Sprache: ${detectedLanguage || 'Unbekannt'}`, 'info');

        console.log('Transkription:', rawText);
        console.log('Detected Language:', detectedLanguage);
        console.log('Full transcription result:', transcriptionResult);

        if (modeBadge) modeBadge.innerText = "Cleaning...";

        // Resolve Prompt
        let systemPrompt = "Bereinige diesen Text.";
        let examples = [];

        console.log('[processAudio] Current mode:', mode);
        console.log('[processAudio] window.PROMPTS available:', !!window.PROMPTS);
        if (window.PROMPTS) {
            console.log('[processAudio] Available system prompts:', Object.keys(window.PROMPTS));
        }

        if (window.PROMPTS && window.PROMPTS[mode]) {
            systemPrompt = window.PROMPTS[mode];
            console.log('[processAudio] Using SYSTEM prompt for mode:', mode);
            await window.electron.showToast(`System-Prompt wird verwendet (Modus: ${mode})`, 'info');
        } else {
            const customModes = await window.electron.getCustomModes() || [];
            const custom = customModes.find(m => m.id === mode || m.name === mode);
            if (custom) {
                systemPrompt = custom.prompt;
                examples = custom.examples || [];
                console.log('[processAudio] Using CUSTOM prompt for mode:', mode, 'Custom name:', custom.name);
                await window.electron.showToast(`Custom-Prompt wird verwendet (Modus: ${custom.name})`, 'info');
            } else {
                console.log('[processAudio] No prompt found for mode:', mode);
                await window.electron.showToast(`Kein Prompt gefunden für Modus: ${mode}`, 'error');
            }
        }

        console.log('[processAudio] Final system prompt:', systemPrompt);

        // Clean with Dictionary and Model
        const finalResult = await cleanText(rawText, apiKey, systemPrompt, dictionary, models.llm, detectedLanguage, examples);
        console.log('Final:', finalResult);

        // Copy to clipboard
        await window.electron.copyToClipboard(finalResult);

        // Update Stats
        if (finalResult && finalResult.length > 0) {
            await window.electron.updateStats(finalResult.length);
        }

        // Add to History
        await window.electron.addHistory({
            mode: mode,
            original: rawText,
            result: finalResult,
            timestamp: new Date().toISOString()
        });

        // Auto Paste (Dictation Mode)
        const autoPaste = await window.electron.getAutoPaste();
        if (autoPaste) {
            setTimeout(async () => {
                const pasteResult = await window.electron.pasteResult();
                console.log('Paste result:', pasteResult);

                if (pasteResult && pasteResult.success === false) {
                    console.warn('Auto-paste failed, showing pending overlay');
                    showPendingOverlay(finalResult);
                } else {
                    window.electron.closeOverlay();
                }
            }, 100);
        } else {
            window.electron.closeOverlay();
        }

    } catch (error) {
        console.error('Processing failed:', error);
        // Show error in dashboard toast
        window.electron.showToast('Fehler: ' + error.message, 'error');
        window.electron.closeOverlay();
    }
}

// --- Pending Overlay Logic ---
let currentPendingText = '';

function showPendingOverlay(text) {
    currentPendingText = text;
    if (recordingPill) recordingPill.style.display = 'none';
    if (pendingPill) {
        pendingPill.style.display = 'flex';
        // Force layout update if needed
    }
}

if (copyPendingBtn) {
    copyPendingBtn.addEventListener('click', async () => {
        if (currentPendingText) {
            await window.electron.copyToClipboard(currentPendingText);
            // Flash button or text?
            copyPendingBtn.innerText = 'Kopiert!';
            setTimeout(() => {
                copyPendingBtn.innerText = 'Kopieren';
                window.electron.closeOverlay();
            }, 800);
        }
    });
}

if (closePendingBtn) {
    closePendingBtn.addEventListener('click', () => {
        window.electron.closeOverlay();
    });
}
