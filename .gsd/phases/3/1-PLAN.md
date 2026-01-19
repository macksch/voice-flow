---
phase: 3
plan: 1
wave: 1
depends_on: []
files_modified:
  - desktop/renderer/api.js
autonomous: true
user_setup: []

must_haves:
  truths:
    - Only high-quality models are available for selection
    - Each model displays pricing information
  artifacts:
    - TRANSCRIPTION_MODELS only contains whisper-large-v3
    - LLM_MODELS contains 2-3 curated options with pricing labels
---

# Plan 3.1: Curate Model Selection with Pricing

<objective>
Remove underperforming models and add pricing information to model labels.

Purpose: Users should only see reliable, high-quality models with transparent cost info.
Output: Updated `TRANSCRIPTION_MODELS` and `LLM_MODELS` constants in `api.js`.
</objective>

<context>
Load for context:
- .gsd/DECISIONS.md (Phase 3 section)
- desktop/renderer/api.js (lines 39-49)
</context>

<tasks>

<task type="auto">
  <name>Curate Transcription Models</name>
  <files>desktop/renderer/api.js</files>
  <action>
    Update TRANSCRIPTION_MODELS constant:
    - REMOVE: 'whisper-large-v3-turbo' (not optimal per user feedback)
    - KEEP: 'whisper-large-v3' as the only transcription option
    - Add pricing info to label: "Whisper Large V3 ($0.111/Std Audio)"
    
    Note: Groq pricing for Whisper is $0.111 per hour of audio.
  </action>
  <verify>View api.js and confirm only one transcription model remains</verify>
  <done>TRANSCRIPTION_MODELS has only whisper-large-v3 with pricing label</done>
</task>

<task type="auto">
  <name>Curate LLM Models with Pricing</name>
  <files>desktop/renderer/api.js</files>
  <action>
    Update LLM_MODELS constant:
    - KEEP: 'llama-3.3-70b-versatile' - Best quality
    - KEEP: 'llama-3.1-8b-instant' - Fastest option
    - REMOVE: 'mixtral-8x7b-32768' - Not best-in-class
    
    Add pricing to labels (Groq pricing per 1M tokens):
    - llama-3.3-70b-versatile: $0.59 input / $0.79 output
    - llama-3.1-8b-instant: $0.05 input / $0.08 output
    
    Format labels like: "Llama 3.3 70B — Beste Qualität ($0.59/1M)"
  </action>
  <verify>View api.js and confirm curated LLM list with pricing</verify>
  <done>LLM_MODELS has 2 options with pricing labels</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Settings dropdown shows only curated models
- [ ] Pricing is visible in model labels
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
