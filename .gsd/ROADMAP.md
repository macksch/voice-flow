# ROADMAP.md

> **Current Phase**: Phase 6: Release (Complete)
> **Milestone**: v0.4.0 (Released)

## Must-Haves (from SPEC)
- [ ] Commentary-free AI transformation
- [ ] Robust Auto-Pasting (Windows)
- [ ] Functional Model Selection
- [ ] Cleaned IPC Architecture

## Phases

### Phase 1: Foundation & IPC Refactoring
**Status**: ⬜ Not Started
**Objective**: Clean up the "unfinished" feel by streamlining the communication between Main and Renderer processes.
- [ ] Decouple `dashboard.js` logic into smaller modules.
- [ ] Centralize IPC event handling to prevent listener leaks.
- [ ] Fix existing "small bugs" in window management (Dashboard/Overlay).

### Phase 2: AI Reliability & Prompt Engineering
**Status**: ⬜ Not Started
**Objective**: Solve the "interference" and "language hiccup" problems.
- [ ] Implement robust System Prompts that strictly forbid metadata/explanations.
- [ ] Add language detection or strict language passing to the upcycling process.
- [ ] Refine "Few-Shot" examples in `api.js` to better mimic user style.

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
