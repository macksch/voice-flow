# Changelog

All notable changes to this project will be documented in this file.

## [0.5.1] - 2026-02-10

### Bug Fixes (KRITISCH)

#### Language Detection & Translation Issues
- **FIX**: Syntaxfehler in `api.js` behoben - Kommas nach schließenden Backticks im System Prompt (Zeile 28, 35, 36) verursachten, dass die deutsche Sprache ignoriert wurde
- **FIX**: Inhaltliche Fehler im englischen System Prompt korrigiert - fehlendes "the" vor "FOLLOWING" und "result"
- **FIX**: `getSystemPrompt()` und `getFewShotExamples()` verwenden jetzt korrekt `effectiveLanguage` statt `language`
- **FIX**: Verbesserte Language-Lock Prüfung - prüft jetzt auch auf "english"/"englisch" Keywords, nicht nur "translate"/"übersetzen"
- **FIX**: Fallback auf `'auto'` statt `'de'` in `recording.js` verhindert erzwungene deutsche Transkription
- **FIX**: Whisper-Transkription nutzt jetzt immer `'auto'` zur Spracherkennung

#### Other Fixes
- **FIX**: Überflüssiges `});` in `main.js` Zeile 296 verursachte SyntaxError
- **FIX**: Syntaxfehler in `prompts.js` (Zeilen 6, 13, 25) - überflüssige Kommas nach schließenden Backticks
- **FIX**: CSS für `mode-list-item` korrigiert - nur aktiver Modus hat Rahmen und Hintergrundfarbe

### UI Improvements
- Warnung im Dashboard hinzugefügt: "Nur DE/EN für optimale Textverarbeitung" bei Sprachauswahl
- Toast-Benachrichtigungen für Debugging hinzugefügt (erkennete Sprache, verwendete Sprache, Prompt-Typ)

---

## [0.5.0] - 2026-01-20

### Features
- Dynamic language detection via Whisper `verbose_json`
- Bilingual LLM processing logic
- Automated CI/CD pipeline for Windows
- Model selection (Transcription und LLM)
- History filtering (Text, Modus, Datum)
- Custom modes with export/import

### Bug Fixes
- "Capital of France" semantic drift fixed
- Auto-paste fallback handling
