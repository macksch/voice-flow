---
phase: 1
plan: 2
wave: 1
---

# Plan 1.2: Integrate Dashboard Modules

## Objective
Wire up the extracted modules into `dashboard.js` using standard ES6 imports, completing the modularization and reducing dashboard.js to a thin orchestration layer.

## Context
- .gsd/phases/1/1-PLAN.md
- desktop/renderer/dashboard.js
- desktop/renderer/modules/*.js

## Tasks

<task type="auto">
  <name>Update Dashboard HTML to use Module Script</name>
  <files>desktop/renderer/dashboard.html</files>
  <action>
    Change the script tag for dashboard.js from:
    `<script src="dashboard.js"></script>`
    to:
    `<script type="module" src="dashboard.js"></script>`
    
    This enables ES6 module imports in the browser context.
    NOTE: Electron Renderer with `contextIsolation: true` supports ES6 modules.
  </action>
  <verify>Select-String -Path "desktop/renderer/dashboard.html" -Pattern 'type="module"'</verify>
  <done>dashboard.html loads dashboard.js as an ES6 module</done>
</task>

<task type="auto">
  <name>Refactor Dashboard.js to Import Modules</name>
  <files>desktop/renderer/dashboard.js</files>
  <action>
    1. Add import statements at the top of dashboard.js:
       ```javascript
       import { State, PRESET_ICONS } from './modules/state.js';
       import { showToast } from './modules/toast.js';
       import { loadModesForEditor, prepareEditor, saveModeFromEditor, deleteCustomMode, updateActiveModeDisplay } from './modules/modes.js';
       import { loadHistory, renderHistoryList, renderActivityTable } from './modules/history.js';
       import { loadSettings, initSettingsListeners, loadModels } from './modules/settings.js';
       import { loadDictionary, renderDictionaryList, addDictEntry, deleteDictEntry } from './modules/dictionary.js';
       ```
    2. Remove the inlined implementations of these functions (keep only the imports).
    3. Replace direct state variable access with `State.currentActiveMode`, `State.allModes`, etc.
    4. Keep top-level orchestration (DOMContentLoaded, attachEventListeners, loadInitialData) in dashboard.js.
    
    IMPORTANT: Preserve all event listener attachments and window.* global assignments.
  </action>
  <verify>Select-String -Path "desktop/renderer/dashboard.js" -Pattern "^import"</verify>
  <done>dashboard.js uses ES6 imports and is reduced to ~300-400 lines</done>
</task>

## Success Criteria
- [ ] dashboard.js uses ES6 module imports
- [ ] dashboard.js is reduced to under 500 lines
- [ ] Application still loads without errors (manual verification required)
