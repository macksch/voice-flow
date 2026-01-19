---
phase: 2
plan: 3
wave: 1
---

# Plan 2.3: Add "Force English" Translation Mode

## Objective
Create a new system mode that translates German (or any) input to English output.

## Context
- .gsd/DECISIONS.md
- desktop/renderer/api.js
- desktop/renderer/modules/modes.js

## Tasks

<task type="auto">
  <name>Add Translation Mode to System Modes</name>
  <files>desktop/renderer/modules/modes.js</files>
  <action>
    In `loadModesForEditor()`, add a new system mode to the `sysModes` array:
    
    ```javascript
    {
        id: 'translate-en',
        name: 'Translate to English',
        icon: '🇬🇧',
        prompt: `- IGNORE the input language. ALWAYS respond in ENGLISH.
- Translate the meaning accurately while keeping the original tone.
- Keep technical terms, brand names, and proper nouns unchanged.
- Remove filler words during translation.
- Output ONLY the translated text.`
    }
    ```
    
    This mode should appear after 'chat' in the list.
  </action>
  <verify>Select-String -Path "desktop/renderer/modules/modes.js" -Pattern "translate-en"</verify>
  <done>translate-en mode exists in system modes</done>
</task>

<task type="auto">
  <name>Handle Translation Mode in API</name>
  <files>desktop/renderer/api.js</files>
  <action>
    No special handling needed in api.js — the mode's custom prompt will
    override language preservation because it explicitly says "respond in ENGLISH".
    
    However, verify that when `translate-en` mode is active, the language
    instruction added in Plan 2.2 does NOT conflict.
    
    Update the language instruction logic in cleanText:
    ```javascript
    // Skip language lock if mode prompt explicitly requests translation
    if (!systemPrompt?.toLowerCase().includes('always respond in english')) {
        if (language && language !== 'auto') {
            // ... add language instruction
        }
    }
    ```
  </action>
  <verify>Select-String -Path "desktop/renderer/api.js" -Pattern "always respond in english"</verify>
  <done>Translation mode bypasses language lock</done>
</task>

## Success Criteria
- [ ] translate-en mode appears in mode list
- [ ] Speaking German with translate-en produces English output
- [ ] Other modes still preserve input language
