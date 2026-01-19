# ROADMAP.md

> **Current Phase**: Phase 0: Mapping (Complete)
> **Milestone**: v0.4.0 (The Structure & Reliability Update)

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
**Status**: ⬜ Not Started
**Objective**: Ensure all non-negotiable features are professional-grade.
- [ ] Validate and fix "Automatic Pasting" edge cases.
- [ ] Implement functional UI for Model Selection (Transcription vs. LLM).
- [ ] Enhance History Tracking with better search/filtering.

### Phase 4: User Manual & Final Verification
**Status**: ⬜ Not Started
**Objective**: Prepare for internal "colleague" usage and ensure stability.
- [ ] Create a comprehensive User Test Guide.
- [ ] Document all Environment Variables and API requirements.
- [ ] Final performance audit of the recording pipeline.
