# VoiceFlow Acceptance Criteria & QA Checklist

**Version:** 0.4.0
**Date:** 2026-01-19

Use this checklist to validate the core functionality of VoiceFlow.

---

## 1. Core Functionality (The "Happy Path")

- [x] **Global Hotkey (Ctrl+Shift+D)**
    - [x] Pressing Hotkey brings up the overlay.
    - [x] Releasing Hotkey (if push-to-talk) or pressing again stops recording.
    - [x] Recording duration is limited/safe (doesn't crash on long press).
- [x] **Transcription**
    - [x] Dictionary replacements are applied correctly.
    - [x] Language is detected correctly (or defaults safely).
- [ ] **Pasting**
    - [x] Text is pasted into the active window (Notepad, Browser, etc.).
    - [ ] If pasting fails, "Copy to Clipboard" option appears.

> **Issue Notes:**
> still no pasting pop-up when it failed before, but for now it's ok...

---

## 2. UI & Experience

- [x] **Overlay**
    - [x] Shows "Recording" state clearly (red dot/text).
    - [x] Shows "Processing" state (spinner/text).
    - [x] Disappears automatically after pasting.
- [x] **Dashboard**
    - [x] **Modes Tab**: Can create, edit, and delete modes.
    - [x] **History Tab**:
        - [x] New recordings appear at the top.
        - [x] Filters (Mode, Date) work correctly.
        - [x] Search works for both original and processed text.
    - [x] **Dictionary Tab**: Can add and delete entries; table updates.
    - [x] **Settings Tab**: Can change Transcription and LLM models.

> **Issue Notes:**
> The overlay disappears automatically even if pasting was not successful. As mentioned above, there is no "copy to clipboard" overlay when pasting automatically fails. as per above, ok for now.
> This is a topic not mentioned in the above acceptance criteria, but for some combo boxes (like the selection for models), the combo box doesn't look cohesive. It features light text on a light background, which makes it impossible to read until you hover over the options. This should be changed.


---

## 3. Advanced Features (Phase 3 Polish)

- [ ] **Model Selection**
    - [ ] Only curated models are shown (Whisper V3, Llama 3).
    - [ ] Pricing info is visible in the dropdown.
- [x] **History Filtering**
    - [x] "Today" filter shows only today's entries.
    - [x] "Translation" mode filter shows only translation entries.

> **Issue Notes:**
> The model selection is still the old one, including:
> 1. Whisper Large V3
> 2. Whisper Large V3 Turbo
> 3. Llama 3.3 70B
> 4. Llama 3.1 8B
> 5. Mixtral 8x7B
>Additionally, the whole pricing thing is missing completely.
>

---

## 4. Edge Cases

- [ ] **Network Loss**: App handles offline state gracefully (Toast result: "API Error").
- [ ] **Empty Audio**: Quick tap of F2 doesn't crash app (Toast: "Audio too short").
- [x] **App Restart**: Settings and persistent store are saved after restart.

> **Issue Notes:**
> I cannot really test the network loss (at least not at this point), but it doesn't really matter.
> As already mentioned, F2 doesn't do anything, so the empty audio is not testable as well. I can do it by pushing the buttons (the hotkey combination) two times, but it still recognizes a word. It just makes things up (like one word); for example, it did "you" and previously it did "Paris."
