# ROADMAP.md

> **Current Phase**: Phase 7: Intelligence & Language Accuracy (Planning)
> **Milestone**: v0.5.0 (Developing)

## Must-Haves (from SPEC)
- [x] Commentary-free AI transformation
- [ ] Robust Auto-Pasting (Windows)
- [x] Functional Model Selection
- [x] Cleaned IPC Architecture
- [ ] **Strict Language Lock (Input = Output)**
- [ ] **Advanced Upcycling Quality**

## Phases

### Phase 1: Foundation & IPC Refactoring
**Status**: ✅ Complete
**Objective**: Clean up the "unfinished" feel by streamlining the communication between Main and Renderer processes.
- [x] Decouple `dashboard.js` logic into smaller modules.
- [x] Centralize IPC event handling to prevent listener leaks.
- [x] Fix existing "small bugs" in window management (Dashboard/Overlay).

### Phase 2: AI Reliability & Prompt Engineering
**Status**: ✅ Complete
**Objective**: Solve the "interference" and "language hiccup" problems.
- [x] Implement robust System Prompts that strictly forbid metadata/explanations.
- [x] Add language detection or strict language passing to the upcycling process.
- [x] Refine "Few-Shot" examples in `api.js` to better mimic user style.

### Phase 3: Feature Polish (MVP Completeness)
**Status**: ✅ Complete
**Objective**: Ensure all non-negotiable features are professional-grade.
- [x] Curate Model Selection with pricing info (Plan 3.1)
- [x] Implement History Filtering — Mode & Date (Plan 3.2)
- [ ] (Deferred) Clipboard-free auto-paste research

### Phase 4: User Manual & Final Verification
**Status**: ✅ Complete
**Objective**: Prepare for internal "colleague" usage and ensure stability.
- [x] Create a comprehensive User Test Guide.
- [x] Document all Environment Variables and API requirements.
- [x] Final performance audit of the recording pipeline.

### Phase 5: Bug Fixes & Refinement
**Status**: ✅ Complete
**Objective**: Address critical feedback from QA and refine UX.
- [x] **Fix Model Selection**: Dynamic population from API constants.
- [x] **Fix Hotkey**: Confirmed default as Ctrl+Shift+D.
- [x] **Fix Paste**: Show "Copy" overlay on paste failure.
- [x] **Fix CSS**: Ensure dropdown visibility in dark mode.

### Phase 7: Intelligence & Language Accuracy
**Status**: ⬜ Not Started
**Objective**: Ensure the AI always speaks the user's language and provides professional-grade upcycling.
- [ ] Implement Whisper `verbose_json` for language detection.
- [ ] Create bilingual/neutral `SYSTEM_PROMPT` to remove German bias.
- [ ] Pipe detected language from Whisper into Llama cleanup.
- [ ] Refine Standard/Jira/Email prompts for higher quality.

### Phase 8: CI/CD Automation
**Status**: 🔵 In Progress
**Objective**: Automate Windows builds and releases via GitHub Actions.
- [x] Configure `electron-builder` for generic (GitHub) provider.
- [x] Create GitHub Action workflow (`build.yml`) for Windows.
- [x] Implement basic auto-update listener in `main.js`.
- [ ] Verification: Push a tag and verify release creation.

