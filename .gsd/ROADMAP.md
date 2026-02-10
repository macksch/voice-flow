# ROADMAP.md

> **Current Phase**: v0.5.1 Bug Fixes
> **Milestone**: v0.5.1 (In Progress)

## Must-Haves (from SPEC)
- [x] Commentary-free AI transformation
- [x] Robust Auto-Pasting (Windows)
- [x] Functional Model Selection
- [x] Cleaned IPC Architecture
- [x] **Strict Language Lock (Input = Output)**
- [x] **Advanced Upcycling Quality**

## Phases

### Milestone v0.5.1 - Critical Bug Fixes (2026-02-10)

#### Phase 1: Syntax Fixes (COMPLETED)
- [x] Fix SyntaxError in `main.js` (extra `});`)
- [x] Fix syntax errors in `prompts.js` (extra commas)
- [x] Fix content errors in `api.js` English prompt

#### Phase 2: Language Detection Improvements (COMPLETED)
- [x] Change fallback from 'de' to 'auto' in `recording.js`
- [x] Always use 'auto' for Whisper transcription
- [x] Fix `getSystemPrompt()` and `getFewShotExamples()` to use `effectiveLanguage`
- [x] Improve Language-Lock check (include "english"/"englisch" keywords)
- [x] Add debug logging and toast notifications

#### Phase 3: UI/UX Fixes (COMPLETED)
- [x] Fix CSS for `mode-list-item` (only active has border)
- [x] Add warning text for unsupported languages in Dashboard

#### Phase 4: Documentation & Release (IN PROGRESS)
- [x] Update package.json to v0.5.1
- [x] Create CHANGELOG.md
- [x] Update STATE.md
- [ ] Update ROADMAP.md ← HERE
- [ ] Create git commit
- [ ] Create git tag v0.5.1
- [ ] Create GitHub release

---

## Planned Future Milestones

### v0.6.0 - Feature Enhancements
<!-- Add planned features for v0.6.0 here -->
- Global Hotkey Customization
- Database local sync
- Additional language support (beyond DE/EN)

### v0.7.0 - Enterprise Features
<!-- Add planned features for v0.7.0 here -->
- Multi-user support
- Team collaboration
- Cloud sync

