// --- Groq API Module ---
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

// Helper for delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Transcribes audio using Groq Whisper API
 * @param {Blob} audioBlob - WebM audio blob
 * @param {string} apiKey - Groq API key
 * @returns {Promise<string>} Transcribed text
 */
async function transcribe(audioBlob, apiKey) {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.webm');
            formData.append('model', 'whisper-large-v3');
            formData.append('language', 'de');
            formData.append('temperature', '0');

            const response = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey}` },
                body: formData
            });

            if (!response.ok) {
                await handleApiError(response);
            }

            const data = await response.json();
            return data.text;

        } catch (error) {
            attempt++;
            console.warn(`Transcription attempt ${attempt} failed:`, error);

            if (attempt === maxRetries) {
                throw new Error(`Transkription fehlgeschlagen: ${error.message}`);
            }

            await sleep(1000 * Math.pow(2, attempt - 1));
        }
    }
}

/**
 * Cleans text using Groq Llama API
 * @param {string} rawText - Raw transcribed text
 * @param {string} apiKey - Groq API key
 * @param {string} systemPrompt - System prompt for cleanup
 * @returns {Promise<string>} Cleaned text (falls back to raw on error)
 */
async function cleanText(rawText, apiKey, systemPrompt) {
    if (!rawText || rawText.trim().length === 0) return "";

    const prompt = systemPrompt || "Bereinige diesen Text.";

    try {
        const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: prompt },
                    { role: 'user', content: rawText }
                ],
                temperature: 0.3,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            console.error('LLM Cleanup failed, returning raw text. Status:', response.status);
            await handleApiError(response);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || rawText;

    } catch (error) {
        console.error('Text cleanup failed:', error);
        return rawText; // Graceful fallback
    }
}

/**
 * Handles API errors with descriptive messages
 * @param {Response} response - Fetch response object
 */
async function handleApiError(response) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;

    try {
        const errorData = await response.json();
        if (errorData.error?.message) {
            errorMessage = errorData.error.message;
        }
    } catch (e) { /* ignore JSON parse error */ }

    if (response.status === 401) {
        throw new Error('API Key ungültig');
    } else if (response.status === 429) {
        throw new Error('Rate Limit erreicht (zu viele Anfragen)');
    } else if (response.status >= 500) {
        throw new Error('Groq Server Fehler');
    }

    throw new Error(errorMessage);
}

// Expose globally for renderer
window.transcribe = transcribe;
window.cleanText = cleanText;
