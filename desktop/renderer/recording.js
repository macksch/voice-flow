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
            alert('Mikrofon Fehler: ' + err.message);
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

// --- Audio Processing ---
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

        if (typeof transcribe === 'undefined') {
            throw new Error('API module not loaded');
        }

        // Transcribe
        const rawText = await transcribe(audioBlob, apiKey);

        if (modeBadge) modeBadge.innerText = "Cleaning...";

        // Resolve Prompt
        let systemPrompt = "Bereinige diesen Text.";
        if (window.PROMPTS && window.PROMPTS[mode]) {
            systemPrompt = window.PROMPTS[mode];
        } else {
            const customModes = await window.electron.getCustomModes() || [];
            const custom = customModes.find(m => m.id === mode || m.name === mode);
            if (custom) {
                systemPrompt = custom.prompt;
            }
        }

        // Clean
        const cleanTextContent = await cleanText(rawText, apiKey, systemPrompt);

        // Copy
        await window.electron.copyToClipboard(cleanTextContent);

        // Auto-Paste
        await window.electron.pasteResult();

        // Save History
        await window.electron.addHistory({
            mode: mode,
            modeName: currentModeName,
            text: cleanTextContent,
            duration: Date.now() - startTime
        });

        // Close
        window.electron.closeOverlay();

    } catch (error) {
        console.error('Processing failed:', error);
        alert('Fehler: ' + error.message);
        window.electron.closeOverlay();
    }
}
