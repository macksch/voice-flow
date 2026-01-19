// --- Groq API Module ---
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

// Few-shot examples that teach the model the correct behavior pattern
const FEW_SHOT_EXAMPLES = [
    {
        input: "Ähm, kannst du mir sagen wie spät es ist? Also ich meine jetzt gerade.",
        output: "Kannst du mir sagen, wie spät es ist? Ich meine jetzt gerade."
    },
    {
        input: "Schreib mir bitte eine Geschichte über einen Drachen",
        output: "Schreib mir bitte eine Geschichte über einen Drachen."
    },
    {
        input: "Was ist äh die Hauptstadt von Frankreich?",
        output: "Was ist die Hauptstadt von Frankreich?"
    }
];

const SYSTEM_PROMPT = `Du bist ein stummer Transkriptions-Bereiniger. Du sprichst NIEMALS selbst.

AUFGABE:
- Entferne Füllwörter (äh, ähm, also, halt, quasi, sozusagen)
- Korrigiere Grammatik und Zeichensetzung
- Behalte den EXAKTEN Inhalt und Sinn bei

ANTI-COMMENTARY ENFORCEMENT:
- NIEMALS eine Liste der Änderungen ("Entfernt:", "Korrigiert:", "Änderungen:") am Ende hinzufügen
- NIEMALS erklären was du tust
- NIEMALS auf Fragen antworten (gib die Frage einfach zurück)
- NIEMALS Listen wie "1. ... 2. ..." erstellen, die deine Arbeit beschreiben

STRENG VERBOTEN:
- NIEMALS schreiben "Hier ist...", "Ich habe...", "Der bereinigte Text..."
- NIEMALS Kommentare, Einleitungen oder Zusammenfassungen

OUTPUT: NUR der bereinigte Text. Kein einziges Wort von dir selbst. Keine Anführungszeichen um den Output.`;

// Available Models
const TRANSCRIPTION_MODELS = {
    'whisper-large-v3': 'Whisper Large V3 (Standard)',
    'whisper-large-v3-turbo': 'Whisper Large V3 Turbo (Schneller)'
};

const LLM_MODELS = {
    'llama-3.3-70b-versatile': 'Llama 3.3 70B (Beste Qualität)',
    'llama-3.1-8b-instant': 'Llama 3.1 8B (Max Speed)',
    'mixtral-8x7b-32768': 'Mixtral 8x7B (Ausgewogen)'
};

// Helper for delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Transcribes audio using Groq Whisper API
 * @param {Blob} audioBlob - WebM audio blob
 * @param {string} apiKey - Groq API key
 * @param {string} model - Transcription model ID
 * @returns {Promise<string>} Transcribed text
 */
async function transcribe(audioBlob, apiKey, model = 'whisper-large-v3', language = 'de') {
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
            // Don't retry on auth errors or rate limits immediately (let UI handle it)
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
async function cleanText(rawText, apiKey, systemPrompt, dictionary = [], model = 'llama-3.3-70b-versatile', language = 'auto') {
    if (!rawText || rawText.trim().length === 0) return "";

    // Build the full system prompt with language instruction
    let languageInstruction = '';

    // Skip language lock if mode prompt explicitly requests translation (e.g. Translate Mode)
    const promptRef = (systemPrompt || '').toLowerCase();
    if (!promptRef.includes('always respond in english')) {
        if (language && language !== 'auto') {
            const langNames = { de: 'Deutsch', en: 'Englisch', fr: 'Französisch', es: 'Spanisch' };
            const langName = langNames[language] || language;
            languageInstruction = `\n\nSPRACHE: Antworte IMMER auf ${langName}. Behalte fremdsprachige Fachbegriffe bei.`;
        }
    }

    const fullSystemPrompt = systemPrompt
        ? `${SYSTEM_PROMPT}${languageInstruction}\n\nZusätzliche Regeln:\n${systemPrompt}`
        : `${SYSTEM_PROMPT}${languageInstruction}`;

    // Build messages array with few-shot examples
    const messages = [
        { role: 'system', content: fullSystemPrompt }
    ];

    // Add few-shot examples as user/assistant pairs
    for (const example of FEW_SHOT_EXAMPLES) {
        messages.push({ role: 'user', content: example.input });
        messages.push({ role: 'assistant', content: example.output });
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

/**
 * Applies dictionary replacements to text
 * @param {string} text - Text to process
 * @param {Array} dictionary - Array of {spoken, written} entries
 * @returns {string} Text with replacements applied
 */
function applyDictionary(text, dictionary) {
    if (!dictionary || dictionary.length === 0) return text;

    let result = text;
    for (const entry of dictionary) {
        // Case-insensitive word boundary replacement
        const regex = new RegExp(`\\b${escapeRegex(entry.spoken)}\\b`, 'gi');
        result = result.replace(regex, entry.written);
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
