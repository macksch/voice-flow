import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock window object before importing api.js
global.window = {};

const { transcribe, cleanText, applyDictionary } = require('../renderer/api.js');

// Mock fetch
global.fetch = vi.fn();

describe('Groq API Module', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('transcribe', () => {
        it('should call Groq Whisper API correctly with default model', async () => {
            const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
            const mockKey = 'sk-12345';
            const mockText = 'Transcribed text';

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ text: mockText, language: 'en' })
            });

            const result = await transcribe(mockBlob, mockKey);

            expect(result).toEqual({ text: mockText, detectedLanguage: 'en' });
            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.groq.com/openai/v1/audio/transcriptions',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer sk-12345' },
                    body: expect.any(FormData)
                })
            );
        });

        it('should accept custom model and handle auto language', async () => {
            const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
            global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ text: 'ok', language: 'en' }) });

            await transcribe(mockBlob, 'key', 'whisper-large-v3-turbo', 'auto');

            expect(global.fetch).toHaveBeenCalled();
            // In a better test env we would check FormData manually, but basic non-crash check is ok for now.
        });

        it('should handle API errors', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({ error: { message: 'Invalid Key' } })
            });

            const mockBlob = new Blob([''], { type: 'audio/webm' });
            await expect(transcribe(mockBlob, 'bad-key')).rejects.toThrow('API Key ungültig');
        });
    });

    describe('cleanText', () => {
        it('should use Llama model and apply dictionary', async () => {
            const raw = 'Äh hallo giro';
            const cleanLLM = 'Hallo giro';
            const dictionary = [{ spoken: 'giro', written: 'Jira' }];

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: cleanLLM } }]
                })
            });

            const result = await cleanText(raw, 'key', null, dictionary, 'llama-3.3-70b');
            expect(result).toBe('Hallo Jira'); // Dictionary applied AFTER LLM

            // Verify model param in body
            const callArgs = global.fetch.mock.calls[0];
            const body = JSON.parse(callArgs[1].body);
            expect(body.model).toBe('llama-3.3-70b');
        });

        it('should return raw text with dictionary applied if API fails', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Server Error'
            });

            const raw = 'Fallback Text giro';
            const dictionary = [{ spoken: 'giro', written: 'Jira' }];

            const result = await cleanText(raw, 'key', null, dictionary);
            expect(result).toBe('Fallback Text Jira');
        });
    });

    describe('applyDictionary', () => {
        it('should replace words case-insensitively', () => {
            const input = 'Das ist ein test auf jira.';
            const dict = [{ spoken: 'jira', written: 'JIRA' }, { spoken: 'test', written: 'Test' }];
            const output = applyDictionary(input, dict);
            expect(output).toBe('Das ist ein Test auf JIRA.');
        });

        it('should match whole words only', () => {
            const input = 'Testing tester';
            const dict = [{ spoken: 'test', written: 'Fail' }];
            const output = applyDictionary(input, dict);
            expect(output).toBe('Testing tester'); // No replacement
        });
    });
});
