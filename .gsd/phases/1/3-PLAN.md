---
phase: 1
plan: 3
wave: 2
---

# Plan 1.3: IPC Cleanup and Bug Fixes

## Objective
Address the "unfinished feel" by fixing known window management bugs and preventing IPC listener leaks. This plan depends on Plans 1.1 and 1.2 being complete.

## Context
- .gsd/SPEC.md
- desktop/main.js
- desktop/renderer/dashboard.js
- desktop/renderer/recording.js

## Tasks

<task type="auto">
  <name>Audit and De-duplicate IPC Listeners</name>
  <files>desktop/main.js, desktop/preload.js</files>
  <action>
    1. Review all `ipcRenderer.on()` calls in preload.js to identify potential listener leaks.
    2. Check if any listeners are registered multiple times (e.g., inside loops or re-initialized functions).
    3. If found, add `ipcRenderer.removeAllListeners('event-name')` before re-registering, OR refactor to register only once at startup.
    
    Known patterns to fix:
    - Ensure `onStartRecording`, `onStopRecording` are not re-attached.
    - Ensure `onModeChanged`, `onHistoryUpdated` are registered only once.
  </action>
  <verify>Select-String -Path "desktop/preload.js" -Pattern "ipcRenderer.on" | Measure-Object</verify>
  <done>All IPC listeners are registered exactly once with no leaks</done>
</task>

<task type="auto">
  <name>Fix Overlay Window Position Duplicate</name>
  <files>desktop/main.js</files>
  <action>
    In `toggleRecording()` (lines 208-227 in main.js), there are duplicate calls:
    ```javascript
    overlayWindow.setPosition(Math.round(x), Math.round(y));
    overlayWindow.setAlwaysOnTop(true, 'screen-saver');
    overlayWindow.setPosition(Math.round(x), Math.round(y)); // DUPLICATE
    overlayWindow.setAlwaysOnTop(true, 'screen-saver'); // DUPLICATE
    ```
    
    Remove the duplicate lines (217-218). This is likely a copy-paste error contributing to the "buggy" feeling.
  </action>
  <verify>Select-String -Path "desktop/main.js" -Pattern "setPosition.*setPosition" -Context 0,3</verify>
  <done>toggleRecording() has no duplicate calls</done>
</task>

<task type="checkpoint:human-verify">
  <name>Visual Verification of Window Behavior</name>
  <files>N/A</files>
  <action>
    After the above changes, run the application:
    1. Trigger recording with the global hotkey.
    2. Verify the overlay appears in the correct position (no flicker or double-positioning).
    3. Open the Dashboard, change modes, and confirm mode changes are reflected.
    4. Check the console for any "listener already registered" warnings.
  </action>
  <verify>Manual</verify>
  <done>Overlay appears correctly, no console warnings, mode switching works</done>
</task>

## Success Criteria
- [ ] No duplicate IPC listener registrations
- [ ] toggleRecording() has no duplicate setPosition/setAlwaysOnTop calls
- [ ] Human verification passes for overlay and mode switching
