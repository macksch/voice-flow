# Project Decisions

## Phase 7: Intelligence & Language Accuracy (Milestone v0.5.0)

**Date:** 2026-01-20

### Scope: Upcycling Definition
- **Standard Mode**: Must remain "faithful". Only remove filler words and fix grammar. No restructuring.
- **Jira Mode**: Must be "transformative". Restructure spoken content into a professional ticket format (Summary, Description, Acceptance Criteria).
- **Anti-Overcorrection**: A key success metric is preventing the LLM from changing the user's technical voice or over-polishing distinct style elements.

### Architecture: Language Lock
- **Strategy**: "Dynamic System Prompting"
- **Implementation**:
    1.  Whisper detects input language (e.g., 'en' or 'de').
    2.  `cleanText` selects the corresponding System Prompt language (English Prompt for English input, German for German).
    3.  **Override**: The System Prompt will include a clause: "Keep input language UNLESS the user instructions explicitly request translation."
- **Reason**: This prevents the "German Bias" of a German system prompt affecting English input, while keeping the flexibility for translation modes without extra UI toggles.

### UX: Translation
- **Decision**: Translation is defined purely by **Prompts** (Custom Modes), not by hardcoded separate logic.
- **User Preference**: "I should be able to add a mode and include in the prompt that the content should be translated."
