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

---

## Phase 3 Decisions

**Date:** 2026-01-19

### Scope Clarifications

**Auto-Paste Behavior:**
- Current auto-paste is working fine—no bug.
- Ideal: Paste text WITHOUT using clipboard (direct keyboard simulation).
- Fallback: If auto-paste fails, show "Copy" button in overlay; clipboard used only as fallback.
- Research: Windows `SendInput` API for clipboard-free typing simulation.

**Model Selection:**
- Current global setting works; no per-mode override needed.
- Curate model list: Remove low-quality models (e.g., Whisper Turbo not optimal).
- Transcription: Use `whisper-large-v3` only.
- LLM Upcycling: Limit to 2-3 high-quality models with pricing info displayed.

**History Enhancements:**
- Mode filter (dropdown)
- Date filter (date range picker or preset: Today, Last 7 days, etc.)
- Full-text search (search across original and result text)

### Approach

**Auto-Paste:**
- Option C chosen: Research Windows `SendInput` for direct text simulation.
- Fallback to clipboard + manual paste if simulation fails.

**Model Selection UI:**
- Simple curated dropdown with pricing labels (e.g., "Llama 3.3 70B — $0.59/1M tokens").
- Remove underperforming models from options.

**History Search:**
- Implement client-side filtering (no backend needed).
- UI: Search bar + Mode dropdown + Date preset selector.

### Constraints

- Auto-paste must not block clipboard unless fallback is triggered.
- Pricing info should be approximate and static (no live API calls).
- History filtering should be fast (client-side, no pagination changes needed).

---

## Phase 4 Decisions

**Date:** 2026-01-19

### Scope
- **User Guide:** Technical documentation for installation, configuration, and usage.
- **Acceptance Criteria:** A checklist for QA/Validation with space for issue notes.
- **Format:** Markdown files in `docs/` folder.
- **Language:** English (for broader compatibility).

### Approach
- **File Structure:**
  - `docs/USER_GUIDE.md`: Comprehensive manual.
  - `docs/ACCEPTANCE_CRITERIA.md`: Functional checklist.
- **Performance Audit:** Light verification based on user experience (latency is acceptable).

### Constraints
- Documentation should be concise and easy to maintain.
