# DECISIONS.md — Architectural and Scope Decisions

## Phase 2 Decisions

**Date:** 2026-01-19

### Scope

- LLM still occasionally adds unwanted commentary (e.g., "list of changes" at end of message).
- Current few-shot examples are generic/AI-generated, not user-personalized.
- Language detection is Whisper-only; LLM doesn't receive language context.

### Approach

**Language Handling:**
- Chose: Option A — Pass detected language to LLM with explicit instruction.
- Add a "Force English" mode that translates German input to English output.
- Tech terms in foreign language (e.g., English terms in German speech) must be preserved.

**Few-Shot Examples:**
- Current static examples are not scalable for different users.
- New approach: User-configurable few-shot examples stored per-mode or globally.
- Token budget consideration: Keep examples concise (2-3 per mode max).
- Future feature: Users can record their own examples.

**Dictionary Behavior:**
- Dictionary should apply AFTER LLM processing (current behavior is correct).
- Dictionary should handle phonetic variations (e.g., "giro" → "JIRA", "Jiro" → "JIRA").
- Consider fuzzy matching or multiple spoken variants per entry.

### Constraints

- No manual language configuration required for normal use.
- Personalization must be user-friendly (no editing JSON files).
- Token efficiency: Few-shot examples should be minimal but effective.

### Action Items for Phase 2

1. **Strengthen System Prompt**: Add even stricter anti-commentary rules.
2. **Enhance stripLLMMetaCommentary()**: Catch "list of changes" pattern.
3. **Pass Language to LLM**: Include detected language in system prompt.
4. **Add "Force English" Mode**: New system mode for translation.
5. **Per-Mode Few-Shot Storage**: Allow custom examples per mode.
6. **Dictionary Fuzzy Matching**: Handle phonetic variations.
