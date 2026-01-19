# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
To create a high-performance, cost-effective Windows dictation suite that transforms speech into text reflecting the user's personal style across different contexts (Chat, Jira, Email). VoiceFlow provides a pay-per-use alternative to subscription-based tools, offering total control over AI behavior and model selection.

## Goals
1.  **Strict AI Intent Enforcement:** Ensure the AI performs text "upcycling" without adding commentary or losing critical content.
2.  **Modular & Maintainable Architecture:** Refactor the Electron codebase (Main vs. Renderer) to eliminate bugs and facilitate future feature expansion.
3.  **Context-Aware Processing:** Maintain language consistency (Input Language = Output Language) and mimic the user's personal writing style.
4.  **Hardware & Model Control:** Allow users to choose specific AI models (e.g., choosing stronger Llama models over cheaper, weaker ones) and audio input devices.

## Non-Goals (Out of Scope)
-   **Cross-Platform Support:** While using Electron, macOS and Linux are not priorities for the current phase.
-   **Mobile Integration:** The Android keyboard integration is a separate future project.
-   **Cloud Sync:** All history and settings remain local for now.

## Users
-   **Primary:** Maximilian (Personal productivity, chat, work documentation).
-   **Secondary:** Professionals/Colleagues looking for a customizable, non-subscription dictation tool.

## Constraints
-   **Platform:** Windows 10/11 (reliant on PowerShell for auto-pasting).
-   **API:** Groq API (Whisper for transcription, Llama for upcycling).
-   **Framework:** Electron (Main/Renderer IPC architecture).

## Success Criteria
- [ ] **Commentary-Free Output:** AI never adds "Here is your text..." or explanations.
- [ ] **Language Lock:** Resulting text is always in the same language as the spoken input.
- [ ] **Reliable Auto-Paste:** The "pasting" mechanism works consistently across different active applications.
- [ ] **Zero Duplicate Modes:** Refactored logic prevents overlapping system and custom modes.
- [ ] **Stable Model Selection:** Switching between transcription and LLM models is functional and reflected in API calls.
