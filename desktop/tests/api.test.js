import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock window object before importing api.js
global.window = {};

const { transcribe, cleanText } = require('../renderer/api.js');

// Mock fetch
global.fetch = vi.fn();

describe('Groq API Module', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('transcribe', () => {
        it('should call Groq Whisper API correctly', async () => {
            const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
            const mockKey = 'sk-12345';
            const mockText = 'Transcribed text';

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ text: mockText })
            });

            const result = await transcribe(mockBlob, mockKey);

            expect(result).toBe(mockText);
            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.groq.com/openai/v1/audio/transcriptions',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer sk-12345' }
                })
            );
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
        it('should use Llama model for cleanup', async () => {
            const raw = 'Äh hallo';
            const clean = 'Hallo';

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: clean } }]
                })
            });

            const result = await cleanText(raw, 'key');
            expect(result).toBe(clean);
        });

        it('should return raw text if API fails', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Server Error'
            });

            const raw = 'Fallback Text';
            const result = await cleanText(raw, 'key');
            expect(result).toBe(raw);
        });
    });
});
