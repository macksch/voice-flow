---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Strengthen Anti-Commentary Measures

## Objective
Eliminate LLM commentary slips by strengthening system prompts and extending post-processing filters.

## Context
- .gsd/DECISIONS.md
- desktop/renderer/api.js
- desktop/tests/api.test.js

## Tasks

<task type="auto">
  <name>Enhance System Prompt with Stricter Rules</name>
  <files>desktop/renderer/api.js</files>
  <action>
    Update the `SYSTEM_PROMPT` constant (lines 20-34) to add explicit prohibitions:
    
    1. Add a new section "ANTI-COMMENTARY ENFORCEMENT" that explicitly lists patterns like:
       - "Änderungen:" or "Changes:"
       - "Ich habe folgende Änderungen vorgenommen:"
       - Numbered lists describing edits (1. Entfernt..., 2. Korrigiert...)
       
    2. Emphasize: "Du darfst NIEMALS eine Liste der Änderungen am Ende hinzufügen."
    
    3. Add: "Wenn der Input eine Frage ist, gib die Frage zurück — beantworte sie NICHT."
  </action>
  <verify>Select-String -Path "desktop/renderer/api.js" -Pattern "ANTI-COMMENTARY"</verify>
  <done>SYSTEM_PROMPT contains explicit anti-list-of-changes rules</done>
</task>

<task type="auto">
  <name>Extend stripLLMMetaCommentary Patterns</name>
  <files>desktop/renderer/api.js</files>
  <action>
    Update `stripLLMMetaCommentary()` function (lines 177-218):
    
    1. Add suffix patterns for "list of changes" format:
       - `/(\n\n?(Änderungen|Changes):?\s*\n[\s\S]*?)$/i`
       - `/(\n\n?\d+\.\s*(Entfernt|Korrigiert|Geändert|Hinzugefügt)[\s\S]*?)$/i`
       - `/(\n\n?-\s*(Füllwörter|Grammatik|Zeichensetzung)[\s\S]*?)$/i`
       
    2. Add prefix pattern for question-answering:
       - `/^(Die Antwort .*?:?\s*)/i`
       - `/^(Ja,|Nein,|Natürlich,)/i` (if followed by explanation)
  </action>
  <verify>Select-String -Path "desktop/renderer/api.js" -Pattern "Änderungen"</verify>
  <done>Function strips "list of changes" suffixes and accidental answers</done>
</task>

## Success Criteria
- [ ] SYSTEM_PROMPT explicitly forbids change lists
- [ ] stripLLMMetaCommentary catches "Änderungen:" suffix
- [ ] Existing tests still pass
