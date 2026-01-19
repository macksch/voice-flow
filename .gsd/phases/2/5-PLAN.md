---
phase: 2
plan: 5
wave: 2
---

# Plan 2.5: Dictionary Phonetic Variations

## Objective
Allow dictionary entries to have multiple "spoken" variants that all map to the same written output.

## Context
- .gsd/DECISIONS.md
- desktop/renderer/api.js
- desktop/renderer/modules/dictionary.js
- desktop/store.js

## Tasks

<task type="auto">
  <name>Update Dictionary Entry Schema</name>
  <files>desktop/renderer/modules/dictionary.js, desktop/store.js</files>
  <action>
    1. Modify the dictionary entry structure to support variations:
       Old: `{ id, spoken, written }`
       New: `{ id, spoken, variations: [], written }`
       
    2. `spoken` is the primary trigger word.
    3. `variations` is an optional array of alternative spellings (e.g., ["giro", "jiro", "gyro"]).
    
    4. Update `renderDictionaryList` to display variations:
       ```javascript
       const variationsText = e.variations?.length ? ` (${e.variations.join(', ')})` : '';
       // Display: "giro" (jiro, gyro) → "JIRA"
       ```
    
    5. Update the add form to allow comma-separated variations in spoken field:
       ```javascript
       // Input: "giro, jiro, gyro" 
       // Parsed: spoken = "giro", variations = ["jiro", "gyro"]
       ```
  </action>
  <verify>Select-String -Path "desktop/renderer/modules/dictionary.js" -Pattern "variations"</verify>
  <done>Dictionary supports multiple spoken variants per entry</done>
</task>

<task type="auto">
  <name>Update applyDictionary for Variations</name>
  <files>desktop/renderer/api.js</files>
  <action>
    Modify `applyDictionary()` function to check all variations:
    
    ```javascript
    function applyDictionary(text, dictionary) {
        if (!dictionary || dictionary.length === 0) return text;
        
        let result = text;
        for (const entry of dictionary) {
            // Collect all triggers: primary + variations
            const triggers = [entry.spoken, ...(entry.variations || [])];
            
            for (const trigger of triggers) {
                const regex = new RegExp(`\\b${escapeRegex(trigger)}\\b`, 'gi');
                result = result.replace(regex, entry.written);
            }
        }
        return result;
    }
    ```
  </action>
  <verify>npm test -- --grep "applyDictionary"</verify>
  <done>Dictionary replacement checks all phonetic variations</done>
</task>

<task type="auto">
  <name>Add Test for Phonetic Variations</name>
  <files>desktop/tests/api.test.js</files>
  <action>
    Add new test case:
    
    ```javascript
    it('should match phonetic variations', () => {
        const input = 'Das ist ein jiro ticket und ein gyro Problem.';
        const dict = [{ spoken: 'giro', variations: ['jiro', 'gyro'], written: 'JIRA' }];
        const output = applyDictionary(input, dict);
        expect(output).toBe('Das ist ein JIRA ticket und ein JIRA Problem.');
    });
    ```
  </action>
  <verify>npm test</verify>
  <done>Test confirms variations are replaced correctly</done>
</task>

## Success Criteria
- [ ] Dictionary UI allows entering variations
- [ ] applyDictionary replaces all variations with correct written form
- [ ] New test passes
