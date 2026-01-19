---
phase: 2
plan: 4
wave: 2
---

# Plan 2.4: Per-Mode Few-Shot Example Storage

## Objective
Allow users to define custom few-shot examples per mode, stored in the mode's data structure.

## Context
- .gsd/DECISIONS.md
- desktop/renderer/api.js
- desktop/renderer/modules/modes.js
- desktop/store.js

## Tasks

<task type="auto">
  <name>Extend Mode Schema with Examples Field</name>
  <files>desktop/renderer/modules/modes.js</files>
  <action>
    1. Update the mode editor UI to include an "Examples" section.
       In `prepareEditor()`, after the prompt textarea, add a section for examples.
       
    2. For now, examples will be a simple textarea with format:
       ```
       INPUT: example input
       OUTPUT: expected output
       ---
       INPUT: another input
       OUTPUT: another output
       ```
       
    3. When saving mode, parse and store examples as array:
       ```javascript
       mode.examples = parseExamples(examplesText);
       ```
       
    4. Add parse function:
       ```javascript
       function parseExamples(text) {
           if (!text) return [];
           return text.split('---').map(block => {
               const inputMatch = block.match(/INPUT:\s*(.+)/s);
               const outputMatch = block.match(/OUTPUT:\s*(.+)/s);
               if (inputMatch && outputMatch) {
                   return { input: inputMatch[1].trim(), output: outputMatch[1].trim() };
               }
               return null;
           }).filter(Boolean);
       }
       ```
  </action>
  <verify>Select-String -Path "desktop/renderer/modules/modes.js" -Pattern "parseExamples"</verify>
  <done>Mode editor supports examples field and parsing</done>
</task>

<task type="auto">
  <name>Use Mode Examples in API</name>
  <files>desktop/renderer/api.js</files>
  <action>
    1. Modify `cleanText` to accept optional `examples` parameter:
       ```javascript
       async function cleanText(rawText, apiKey, systemPrompt, dictionary = [], model, language, examples = [])
       ```
    
    2. If mode-specific examples are provided, use them INSTEAD of default FEW_SHOT_EXAMPLES:
       ```javascript
       const effectiveExamples = (examples && examples.length > 0) ? examples : FEW_SHOT_EXAMPLES;
       for (const example of effectiveExamples) {
           messages.push({ role: 'user', content: example.input });
           messages.push({ role: 'assistant', content: example.output });
       }
       ```
       
    3. Limit to max 3 examples for token efficiency.
  </action>
  <verify>Select-String -Path "desktop/renderer/api.js" -Pattern "effectiveExamples"</verify>
  <done>cleanText uses mode-specific examples when provided</done>
</task>

## Success Criteria
- [ ] Mode editor shows examples field
- [ ] Examples are saved with mode data
- [ ] Custom examples override defaults when used
