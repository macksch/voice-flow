# STATE.md — Current Project Status

> **Current Phase**: v0.5.1 Development
> **Milestone**: v0.5.1 (In Progress)

## Current Position
- **Phase**: Bug Fixes & Language Improvements
- **Status**: Critical language detection bugs fixed. Version v0.5.1 in preparation.

## Last Session Summary (2026-02-10)
- **Fixed Language Translation Bug**: German text was being translated to English due to syntax errors in `api.js` and `prompts.js`
- **Fixed Syntax Errors**: Removed extra commas after closing backticks in prompt templates
- **Fixed Fallback Logic**: Changed from forcing 'de' to using 'auto' for transcription
- **Fixed CSS**: Mode list items now only show border/background when active
- **Added Debugging**: Toast notifications for language detection and prompt selection

## In-Progress Work
- Preparing v0.5.1 release with bugfixes
- Creating CHANGELOG.md documentation

## Blockers
- None.

## Context Dump
### Critical Bugs Fixed
| File | Issue | Fix |
|-------|--------|------|
| `main.js:296` | SyntaxError - extra `});` | Removed extra closing brace |
| `recording.js:243` | Forced 'de' fallback | Changed to 'auto' fallback |
| `recording.js:246` | Used setting language | Always use 'auto' for transcription |
| `prompts.js:6,13,25` | Syntax errors - extra commas | Removed commas after backticks |
| `api.js:28,35,36` | Syntax/content errors in English prompt | Fixed "the" before words, removed comma |
| `api.js:213` | Used `language` instead of `effectiveLanguage` | Changed to `effectiveLanguage` |
| `dashboard.css:685-702` | Inactive modes had border | Only active has border now |

### Language Detection Improvements
- Whisper now always uses 'auto' for language detection
- Fallback on 'auto' defaults to German for system prompts
- Language-Lock check now includes "english"/"englisch" keywords
- Debug logging added for better troubleshooting

### Files Modified in v0.5.1
- `desktop/package.json` - Version bump to 0.5.1
- `desktop/main.js` - Syntax fix
- `desktop/renderer/recording.js` - Language fallback improvements
- `desktop/renderer/api.js` - Syntax fixes and language detection
- `desktop/renderer/prompts.js` - Syntax fixes
- `desktop/renderer/dashboard.html` - UI warning for language support
- `desktop/renderer/dashboard.css` - Mode list styling fix
- `CHANGELOG.md` - Created

## Next Steps
1. Update ROADMAP.md with v0.5.1 information
2. Create git commit: "fix: critical language detection bugs"
3. Create git tag: v0.5.1
4. Create GitHub release v0.5.1
5. Start v0.6.0 planning for new features
