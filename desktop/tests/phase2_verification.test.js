import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock window object before importing api.js
global.window = {};

const { cleanText, applyDictionary } = require('../renderer/api.js');

// Mock fetch
global.fetch = vi.fn();

describe('Phase 2 Verification', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('Plan 2.1: Anti-Commentary', () => {
        it('should strip LLM meta-commentary from response', async () => {
            const raw = 'Test content';
            const dirtyResponse = 'Hier ist der bereinigte Text: Clean content\n\nÄnderungen:\n- Füllwörter entfernt';

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ choices: [{ message: { content: dirtyResponse } }] })
            });

            const result = await cleanText(raw, 'key');
            expect(result).toBe('Clean content');
        });
    });

    describe('Plan 2.2: Language Passing', () => {
        it('should inject language instruction when language is provided', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ choices: [{ message: { content: 'ok' } }] })
            });

            await cleanText('input', 'key', null, [], 'model', 'fr');

            const callArgs = global.fetch.mock.calls[0];
            const body = JSON.parse(callArgs[1].body);
            const systemContent = body.messages[0].content;

            // Should use English base prompt for non-German languages
            expect(systemContent).toContain('output should be in ENGLISH');
        });
    });

    describe('Plan 2.3: Translate Mode', () => {
        it('should SKIP language preservation if prompt demands translation', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ choices: [{ message: { content: 'ok' } }] })
            });

            const translatePrompt = "Translate to English: IGNORE the input language. ALWAYS respond in ENGLISH.";
            // Pass 'de' language, but expect NO German preservation because translation is requested
            await cleanText('input', 'key', translatePrompt, [], 'model', 'de');

            const callArgs = global.fetch.mock.calls[0];
            const body = JSON.parse(callArgs[1].body);
            const systemContent = body.messages[0].content;

            // Should NOT contain German preservation text
            expect(systemContent).not.toContain('Behalte diese Sprache strikt bei');
            // Should contain English translation instruction
            expect(systemContent).toContain('MUSS auf ENGLISCH sein');
        });

        it('should preserve language if mode explicitly requests it', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ choices: [{ message: { content: 'ok' } }] })
            });

            const preservePrompt = "BEHALTE DIE SPRACHE DES INPUTS STRIKT BEI - KEINE ÜBERSETZUNG!";
            // Even with German detected, should preserve input language
            await cleanText('English text input', 'key', preservePrompt, [], 'model', 'de');

            const callArgs = global.fetch.mock.calls[0];
            const body = JSON.parse(callArgs[1].body);
            const systemContent = body.messages[0].content;

            // Should contain language preservation
            expect(systemContent).toContain('Behalte diese Sprache strikt bei');
        });
    });

    describe('Plan 2.4: Per-Mode Examples', () => {
        it('should use custom examples instead of defaults', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ choices: [{ message: { content: 'ok' } }] })
            });

            const customExamples = [
                { input: 'My Custom Input', output: 'My Custom Output' }
            ];

            await cleanText('input', 'key', null, [], 'model', 'auto', customExamples);

            const callArgs = global.fetch.mock.calls[0];
            const body = JSON.parse(callArgs[1].body);
            const messages = body.messages;

            // Should find custom example in messages
            const foundExample = messages.find(m => m.content === 'My Custom Input');
            expect(foundExample).toBeDefined();

            // Should NOT find default example "Drachen"
            const foundDefault = messages.find(m => m.content?.includes('Drachen'));
            expect(foundDefault).toBeUndefined();
        });
    });

    describe('Plan 2.5: Dictionary Variations', () => {
        it('should match primary spoken word', () => {
            const dict = [{ spoken: 'giro', variations: ['jiro'], written: 'JIRA' }];
            const result = applyDictionary('Das ist giro', dict);
            expect(result).toBe('Das ist JIRA');
        });

        it('should match variations', () => {
            const dict = [{ spoken: 'giro', variations: ['jiro', 'gyro'], written: 'JIRA' }];
            const result = applyDictionary('Das ist jiro und gyro', dict);
            expect(result).toBe('Das ist JIRA und JIRA');
        });

        it('should handle undefined variations gracefully', () => {
            const dict = [{ spoken: 'giro', written: 'JIRA' }]; // No variations field
            const result = applyDictionary('Das ist jiro', dict);
            expect(result).toBe('Das ist jiro'); // No match

            const result2 = applyDictionary('Das ist giro', dict);
            expect(result2).toBe('Das ist JIRA'); // Match
        });
    });
});
