// --- Groq API Module ---
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

// Few-shot examples that teach the model the correct behavior pattern
// Single-shot example to establish pattern without context contamination
const FEW_SHOT_EXAMPLES = {
    de: [
        {
            input: "das ist ähm ein test eins zwei drei",
            output: "Das ist ein Test, eins, zwei, drei."
        }
    ],
    en: [
        {
            input: "this is uh a test one two three",
            output: "This is a test, one, two, three."
        }
    ]
};

const SYSTEM_PROMPTS = {
    de: `Du bist ein Text-Optimierer. Deine Aufgabe ist es, den SOLGENDEN Text zu bereinigen.

REGELN:
1. Sprache: Bleibe STRIKT bei DEUTSCH.
2. Prozess: Der nächste User-Input ist DEIN QUELLTEXT. Verarbeite ihn SOFORT.
3. Output: Gib NUR den optimierten Text zurück. Keine Bestätigung ("Ich bin bereit").
4. Anti-Kommentar: Kein "Hier ist der Text". Nur das Ergebnis.`,

    en: `You are a text optimizer. Your task is to clean the FOLLOWING text.

RULES:
1. Language: Remain STRICTLY in ENGLISH.
2. Process: The next user input is YOUR SOURCE TEXT. Process it IMMEDIATELY.
3. Output: Return ONLY the optimized text. No confirmation ("I am ready").
4. Anti-Commentary: No "Here is the text. Just the result.`
};

/**
 * Returns the appropriate system prompt based on language
 * @param {string} language - 'de' or 'en' (defaults to 'en' for others)
 * @returns {string} System prompt
 */
function getSystemPrompt(language = 'de') {
    // Map common codes to our supported prompt languages
    const lang = (language || '').toLowerCase().startsWith('de') ? 'de' : 'en';
    return SYSTEM_PROMPTS[lang];
}

/**
 * Returns the appropriate few-shot examples based on language
 * @param {string} language - 'de' or 'en'
 * @returns {Array} Array of example objects
 */
function getFewShotExamples(language = 'de') {
    const lang = (language || '').toLowerCase().startsWith('de') ? 'de' : 'en';
    return FEW_SHOT_EXAMPLES[lang];
}

// Available Models (curated with pricing)
export const TRANSCRIPTION_MODELS = {
    'whisper-large-v3': {
        name: 'Whisper Large V3',
        price: 0.11
    }
};

export const LLM_MODELS = {
    'llama-3.3-70b-versatile': {
        name: 'Llama 3.3 70B — Beste Qualität',
        inputPrice: 0.59,
        outputPrice: 0.79
    },
    'llama-3.1-8b-instant': {
        name: 'Llama 3.1 8B — Schnellste',
        inputPrice: 0.05,
        outputPrice: 0.08
    }
};

/**
 * Checks if the API key is valid by making a lightweight request
 * @param {string} apiKey 
 * @returns {Promise<boolean>}
 */
export async function checkApiKey(apiKey) {
    if (!apiKey) return false;
    try {
        const response = await fetch(`${GROQ_BASE_URL}/models`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        return response.ok;
    } catch (e) {
        console.error('API Check Critical Failure:', e);
        return false;
    }
}

// Helper for delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Transcribes audio using Groq Whisper API
 * @param {Blob} audioBlob - WebM audio blob
 * @param {string} apiKey - Groq API key
 * @param {string} model - Transcription model ID
 * @returns {Promise<string>} Transcribed text
 */
export async function transcribe(audioBlob, apiKey, model = 'whisper-large-v3', language = 'auto') {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.webm');
            formData.append('model', model);

            // Only append language if specific one selected (not auto)
            if (language && language !== 'auto') {
                formData.append('language', language);
            }

            // Request verbose_json to get detected language
            formData.append('response_format', 'verbose_json');
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

            // Return object with text and detected language
            return {
                text: data.text,
                detectedLanguage: data.language
            };

        } catch (error) {
            // ... (rest of error handling same as before)
            if (error.message.includes('API Key')) {
                throw error;
            }

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
 * Cleans text using Groq Llama API with few-shot prompting
 * @param {string} rawText - Raw transcribed text
 * @param {string} apiKey - Groq API key
 * @param {string} systemPrompt - Optional custom system prompt
 * @param {Array} dictionary - Optional dictionary entries
 * @param {string} model - LLM model ID
 * @param {string} language - Detected language code (e.g., 'de', 'en')
 * @returns {Promise<string>} Cleaned text (falls back to raw on error)
 */
export async function cleanText(rawText, apiKey, customRules, dictionary = [], model = 'llama-3.3-70b-versatile', language = 'auto', examples = []) {
    if (!rawText || rawText.trim().length === 0) return "";

    // Log detected language for debugging
    console.log('[cleanText] Detected language:', language, 'Raw text:', rawText.substring(0, 50));

    // 1. Select Base System Prompt based on detected language
    // If language is 'auto' or undefined, default to German as fallback for better results
    const effectiveLanguage = (!language || language === 'auto') ? 'de' : language;
    console.log('[cleanText] Effective language:', effectiveLanguage);

    // Debug: Show effective language via Toast
    if (typeof window !== 'undefined' && window.electron) {
        window.electron.showToast(`LLM verwendet Sprache: ${effectiveLanguage.toUpperCase()}`, 'info');
    }

    const basePrompt = getSystemPrompt(effectiveLanguage);
    console.log('[cleanText] Base prompt selected:', effectiveLanguage === 'de' ? 'DEUTSCH' : 'ENGLISCH');

    // 2. Build full prompt
    // We add a soft lock instruction if custom rules don't explicitly mention translation
    const promptLower = (customRules || '').toLowerCase();
    let languageLock = "";

    // Check for both English AND German translation keywords
    const wantsTranslation = promptLower.includes('translate') ||
                          promptLower.includes('übersetzen') ||
                          promptLower.includes('english') ||
                          promptLower.includes('englisch');

    if (!wantsTranslation) {
        const langName = effectiveLanguage.startsWith('de') ? 'Deutsch' : 'English';
        languageLock = effectiveLanguage.startsWith('de')
            ? `\nZUSATZ: Der Input ist als '${langName}' erkannt worden. Bleibe bei dieser Sprache.`
            : `\nADDITION: Input detected as '${langName}'. Keep this language.`;
        console.log('[cleanText] Language lock added:', languageLock);
    } else {
        console.log('[cleanText] Translation requested, skipping language lock');
    }

    const fullSystemPrompt = customRules
        ? `${basePrompt}${languageLock}\n\nUSER RULES:\n${customRules}`
        : `${basePrompt}${languageLock}`;

    console.log('[cleanText] Full system prompt:', fullSystemPrompt);

    // Build messages array
    const messages = [
        { role: 'system', content: fullSystemPrompt }
    ];

    // Optional: Use explicitly provided custom examples (e.g. from a specific Mode)
    // Priority: Custom Examples -> Language Specific Examples
    let effectiveExamples = (examples && examples.length > 0) ? examples.slice(0, 3) : getFewShotExamples(effectiveLanguage);

    // Add few-shot examples as user/assistant pairs
    if (effectiveExamples && effectiveExamples.length > 0) {
        for (const example of effectiveExamples) {
            messages.push({ role: 'user', content: example.input });
            messages.push({ role: 'assistant', content: example.output });
        }
    }

    // Add the actual input
    messages.push({ role: 'user', content: rawText });

    try {
        const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: 0.1,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            console.error('LLM Cleanup failed, returning raw text. Status:', response.status);
            await handleApiError(response);
        }

        const data = await response.json();
        let result = data.choices[0]?.message?.content || rawText;

        // Strip LLM meta-commentary that sometimes slips through
        result = stripLLMMetaCommentary(result);

        // Apply Dictionary
        return applyDictionary(result, dictionary);

    } catch (error) {
        console.error('Text cleanup failed:', error);
        return applyDictionary(rawText, dictionary); // Still apply dictionary on fallback
    }
}

/**
 * Strips common LLM meta-commentary patterns from output
 * @param {string} text - Text to clean
 * @returns {string} Text with meta-commentary removed
 */
function stripLLMMetaCommentary(text) {
    if (!text) return text;

    // Common prefixes to remove (case-insensitive)
    const prefixPatterns = [
        /^(Hier ist der bereinigte Text:?\s*)/i,
        /^(Der bereinigte Text( lautet)?:?\s*)/i,
        /^(Ich habe (den Text |die |folgende )?.*?(bereinigt|korrigiert|angepasst|entfernt).*?:?\s*)/i,
        /^(Bereinigter Text:?\s*)/i,
        /^(Korrigierter Text:?\s*)/i,
        /^(Ausgabe:?\s*)/i,
        /^(Ergebnis:?\s*)/i,
        /^(Text:?\s*)/i,
        /^(Die Antwort .*?:?\s*)/i, // Prevent QA answers
        /^(Ja,|Nein,|Natürlich,) .*?$/i, // Prevent QA interactions
        /^["„](.*)[""]$/s,  // Remove surrounding quotes
    ];

    let result = text.trim();

    for (const pattern of prefixPatterns) {
        const match = result.match(pattern);
        if (match) {
            // For the quote pattern, extract the inner content
            if (pattern.source.includes('["„]')) {
                result = match[1] || result;
            } else {
                result = result.replace(pattern, '');
            }
        }
    }

    // Common suffixes to remove
    const suffixPatterns = [
        /(\s*Ich habe .*?(entfernt|korrigiert|bereinigt).*?)$/i,
        /(\s*Änderungen:.*?)$/is,
        /(\s*Changes:.*?)$/is,
        /(\s*\(Füllwörter.*?entfernt\).*?)$/i,
        /(\n\n?(Änderungen|Changes):?\s*\n[\s\S]*?)$/i, // Explicit change lists
        /(\n\n?\d+\.\s*(Entfernt|Korrigiert|Geändert|Hinzugefügt)[\s\S]*?)$/i, // Numbered change lists
        /(\n\n?-\s*(Füllwörter|Grammatik|Zeichensetzung)[\s\S]*?)$/i // Bulleted change lists
    ];

    for (const pattern of suffixPatterns) {
        result = result.replace(pattern, '');
    }

    return result.trim();
}

function applyDictionary(text, dictionary) {
    if (!dictionary || dictionary.length === 0) return text;

    let result = text;
    for (const entry of dictionary) {
        // Collect all triggers: primary + variations
        const triggers = [entry.spoken, ...(entry.variations || [])];

        for (const trigger of triggers) {
            // Case-insensitive word boundary replacement
            const regex = new RegExp(`\\b${escapeRegex(trigger.trim())}\\b`, 'gi');
            result = result.replace(regex, entry.written);
        }
    }
    return result;
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
window.applyDictionary = applyDictionary;

// Export for testing
if (typeof module !== 'undefined') {
    module.exports = { transcribe, cleanText, applyDictionary, TRANSCRIPTION_MODELS, LLM_MODELS };
}
