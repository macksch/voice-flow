# VoiceFlow Acceptance Criteria & QA Checklist

**Version:** 0.4.0
**Date:** 2026-01-19

Use this checklist to validate the core functionality of VoiceFlow.

---

## 1. Core Functionality (The "Happy Path")

- [ ] **Global Hotkey (F2)**
    - [ ] Pressing F2 brings up the overlay.
    - [ ] Releasing F2 stops recording.
    - [ ] Recording duration is limited/safe (doesn't crash on long press).
- [ ] **Transcription**
    - [ ] Dictionary replacements are applied correctly.
    - [ ] Language is detected correctly (or defaults safely).
- [ ] **Pasting**
    - [ ] Text is pasted into the active window (Notepad, Browser, etc.).
    - [ ] If pasting fails, "Copy to Clipboard" option appears.

> **Issue Notes:**
>
>

---

## 2. UI & Experience

- [ ] **Overlay**
    - [ ] Shows "Recording" state clearly (red dot/text).
    - [ ] Shows "Processing" state (spinner/text).
    - [ ] Disappears automatically after pasting.
- [ ] **Dashboard**
    - [ ] **Modes Tab**: Can create, edit, and delete modes.
    - [ ] **History Tab**:
        - [ ] New recordings appear at the top.
        - [ ] Filters (Mode, Date) work correctly.
        - [ ] Search works for both original and processed text.
    - [ ] **Dictionary Tab**: Can add and delete entries; table updates.
    - [ ] **Settings Tab**: Can change Transcription and LLM models.

> **Issue Notes:**
>
>

---

## 3. Advanced Features (Phase 3 Polish)

- [ ] **Model Selection**
    - [ ] Only curated models are shown (Whisper V3, Llama 3).
    - [ ] Pricing info is visible in the dropdown.
- [ ] **History Filtering**
    - [ ] "Today" filter shows only today's entries.
    - [ ] "Translation" mode filter shows only translation entries.

> **Issue Notes:**
>
>

---

## 4. Edge Cases

- [ ] **Network Loss**: App handles offline state gracefully (Toast result: "API Error").
- [ ] **Empty Audio**: Quick tap of F2 doesn't crash app (Toast: "Audio too short").
- [ ] **App Restart**: Settings and persistent store are saved after restart.

> **Issue Notes:**
>
>
