---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Modularize Dashboard JavaScript

## Objective
Break down the monolithic `dashboard.js` (1150+ lines) into domain-specific modules to improve maintainability and reduce cognitive load. This addresses the "unfinished feel" by making the codebase easier to navigate and debug.

## Context
- .gsd/SPEC.md
- .gsd/ARCHITECTURE.md
- desktop/renderer/dashboard.js
- desktop/renderer/dashboard.html

## Tasks

<task type="auto">
  <name>Create Module Directory Structure</name>
  <files>desktop/renderer/modules/, desktop/renderer/modules/modes.js, desktop/renderer/modules/history.js, desktop/renderer/modules/settings.js, desktop/renderer/modules/dictionary.js, desktop/renderer/modules/state.js</files>
  <action>
    Create a new `modules/` directory inside `desktop/renderer/`.
    Create the following empty module files:
    - `state.js`: Global state management (currentActiveMode, allModes, etc.)
    - `modes.js`: Mode editor logic (loadModesForEditor, prepareEditor, saveModeFromEditor, deleteCustomMode, updateActiveModeDisplay)
    - `history.js`: History logic (loadHistory, renderHistoryList, renderActivityTable)
    - `settings.js`: Settings logic (loadSettings, initSettingsListeners, loadModels)
    - `dictionary.js`: Dictionary logic (loadDictionary, renderDictionaryList, addDictEntry, deleteDictEntry)
    
    Each file should start with an empty structure ready for extraction.
  </action>
  <verify>Test-Path "desktop/renderer/modules/state.js"</verify>
  <done>Five new module files exist in desktop/renderer/modules/</done>
</task>

<task type="auto">
  <name>Extract State and Toast Modules</name>
  <files>desktop/renderer/modules/state.js, desktop/renderer/modules/toast.js</files>
  <action>
    1. Extract global state variables from dashboard.js (lines 36-51) into `state.js`:
       - currentActiveMode, editingModeId, allModes, currentLoadedHistory, historyDisplayLimit, PRESET_ICONS
       - Export them as a single `State` object.
    2. Extract `showToast` function (lines 13-33) into `toast.js`.
       - Export it and keep the `window.showToast = showToast;` assignment.
    
    Do NOT modify dashboard.js yet - just create the module files.
  </action>
  <verify>Select-String -Path "desktop/renderer/modules/state.js" -Pattern "currentActiveMode"</verify>
  <done>state.js exports a State object, toast.js exports showToast function</done>
</task>

<task type="auto">
  <name>Extract Modes Module</name>
  <files>desktop/renderer/modules/modes.js</files>
  <action>
    Extract mode-related functions from dashboard.js into `modes.js`:
    - loadModesForEditor (lines 606-700)
    - prepareEditor (lines 702-763)
    - saveModeFromEditor (lines 765-802)
    - deleteCustomMode (lines 418-443)
    - updateActiveModeDisplay (lines 473-508)
    
    Import State from `./state.js` for shared state access.
    Export all functions for use in dashboard.js.
    
    Do NOT modify dashboard.js yet - just create the module file.
  </action>
  <verify>Select-String -Path "desktop/renderer/modules/modes.js" -Pattern "loadModesForEditor"</verify>
  <done>modes.js contains all mode-related logic with proper exports</done>
</task>

## Success Criteria
- [ ] `desktop/renderer/modules/` directory exists with 6 module files
- [ ] Each module file has correct imports/exports structure
- [ ] Module files contain the extracted logic (ready for integration in Plan 1.2)
