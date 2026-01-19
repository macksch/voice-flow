---
phase: 3
plan: 2
wave: 1
depends_on: []
files_modified:
  - desktop/renderer/modules/history.js
  - desktop/renderer/dashboard.html
  - desktop/renderer/dashboard.js
autonomous: true
user_setup: []

must_haves:
  truths:
    - Users can filter history by mode
    - Users can filter history by date range
    - Text search continues to work
  artifacts:
    - Filter UI controls exist in history view
    - loadHistory accepts mode and date filter parameters
---

# Plan 3.2: History Filtering — Mode and Date

<objective>
Add mode dropdown and date preset filters to the history view.

Purpose: Users need to quickly find past transcriptions by context (mode) or time range.
Output: Updated history UI with filter controls and client-side filtering logic.
</objective>

<context>
Load for context:
- .gsd/DECISIONS.md (Phase 3 section)
- desktop/renderer/modules/history.js
- desktop/renderer/dashboard.html (history section)
</context>

<tasks>

<task type="auto">
  <name>Add Filter UI to History View</name>
  <files>desktop/renderer/dashboard.html</files>
  <action>
    In the history view section (view-history), add filter controls:
    
    1. Mode dropdown (id="history-mode-filter"):
       - Options: "Alle Modi", then dynamically populated from State.allModes
       
    2. Date preset dropdown (id="history-date-filter"):
       - Options: "Alle Zeiten", "Heute", "Letzte 7 Tage", "Letzte 30 Tage"
    
    Position these NEXT TO the existing search input (history-search).
    Use flexbox row layout with gap.
    
    AVOID: Don't make the filters too wide; use reasonable max-widths.
  </action>
  <verify>View dashboard.html and confirm filter elements exist</verify>
  <done>Filter dropdowns present in history view HTML</done>
</task>

<task type="auto">
  <name>Implement Filter Logic in history.js</name>
  <files>desktop/renderer/modules/history.js</files>
  <action>
    Modify loadHistory function:
    
    1. Accept new parameters: loadHistory(filterText, modeFilter, dateFilter)
    2. Get filter values from DOM if not passed
    3. Filter logic:
       - modeFilter: If not "all", filter entries where entry.mode === modeFilter
       - dateFilter: 
         - "today": timestamp is today
         - "7days": timestamp within last 7 days
         - "30days": timestamp within last 30 days
         - "all": no date filtering
    
    Create helper function getDateCutoff(preset) to calculate cutoff timestamp.
    
    AVOID: Don't break existing text search functionality.
  </action>
  <verify>npm test and review code for filter logic</verify>
  <done>loadHistory filters by mode, date, and text</done>
</task>

<task type="auto">
  <name>Wire Up Filter Event Listeners</name>
  <files>desktop/renderer/dashboard.js</files>
  <action>
    In attachEventListeners():
    
    1. Add change listener to #history-mode-filter
    2. Add change listener to #history-date-filter
    3. Both should call loadHistory() with current filter values
    4. Populate mode dropdown on history tab click (from State.allModes)
    
    AVOID: Don't duplicate history loading; reuse existing loadHistory call.
  </action>
  <verify>Run app and test filter dropdowns trigger history reload</verify>
  <done>Filter changes reload history with applied filters</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Mode dropdown filters history to selected mode
- [ ] Date dropdown filters by time range
- [ ] Text search still works alongside other filters
- [ ] Filters combine correctly (mode + date + text)
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
