---
phase: 2
plan: 2
wave: 1
---

# Plan 2.2: Language Detection and Passing

## Objective
Pass detected language from Whisper to LLM and add explicit language preservation instruction.

## Context
- .gsd/DECISIONS.md
- desktop/renderer/api.js
- desktop/renderer/recording.js

## Tasks

<task type="auto">
  <name>Modify cleanText to Accept Language Parameter</name>
  <files>desktop/renderer/api.js</files>
  <action>
    1. Update `cleanText` function signature to accept `language` parameter:
       ```javascript
       async function cleanText(rawText, apiKey, systemPrompt, dictionary = [], model = 'llama-3.3-70b-versatile', language = 'auto')
       ```
    
    2. Build language instruction dynamically:
       ```javascript
       let languageInstruction = '';
       if (language && language !== 'auto') {
           const langNames = { de: 'Deutsch', en: 'Englisch', fr: 'Französisch', es: 'Spanisch' };
           const langName = langNames[language] || language;
           languageInstruction = `\n\nSPRACHE: Antworte IMMER auf ${langName}. Behalte fremdsprachige Fachbegriffe bei.`;
       }
       const fullSystemPrompt = `${SYSTEM_PROMPT}${languageInstruction}\n\n${systemPrompt || ''}`.trim();
       ```
    
    3. Update module.exports to reflect new signature.
  </action>
  <verify>Select-String -Path "desktop/renderer/api.js" -Pattern "language = 'auto'"</verify>
  <done>cleanText accepts and uses language parameter</done>
</task>

<task type="auto">
  <name>Pass Language from Recording Flow</name>
  <files>desktop/renderer/recording.js</files>
  <action>
    Locate the call to `cleanText` in recording.js and pass the language setting:
    
    1. Get user's language preference:
       ```javascript
       const language = await window.electron.getLanguage();
       ```
    
    2. Pass to cleanText call:
       ```javascript
       const cleaned = await cleanText(transcript, apiKey, prompt, dictionary, llmModel, language);
       ```
    
    This ensures the LLM knows what language to preserve.
  </action>
  <verify>Select-String -Path "desktop/renderer/recording.js" -Pattern "getLanguage"</verify>
  <done>Language preference flows from settings to LLM</done>
</task>

## Success Criteria
- [ ] cleanText has language parameter
- [ ] recording.js passes language to cleanText
- [ ] LLM receives language instruction in system prompt
