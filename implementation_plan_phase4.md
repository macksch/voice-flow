# Implementation Plan - Phase 4: Optimierungen & Features

Dieser Plan adressiert die Punkte 11-16 aus der Code-Analyse (`walkthrough.md`), um die Anwendung von einem funktionierenden MVP zu einem polierten Produkt zu entwickeln.

## Übersicht der Tasks

| ID | Feature | Beschreibung | Priorität |
|----|---------|--------------|-----------|
| #11 | History Pagination | Implementierung von "Load More" statt alle Einträge zu laden | Mittel |
| #12 | Activity Chart | Visualisierung echter Nutzungsdaten statt Dummy-Werte | Mittel |
| #13 | Notifications | Benachrichtigungs-System für Updates & Status-Meldungen | Niedrig |
| #14 | User Profile | Profilbild-Upload und persistente Speicherung | Niedrig |
| #15 | API Status | Echter Verbindungs-Check zur Groq API | Hoch |
| #16 | Testing Suite | Setup von Vitest/Jest und erste Unit Tests | Hoch |

---

## Detaillierte Planung

### Task 15: Dynamischer API Status Check (Hoch)
**Code:** `renderer/dashboard.js`, `main.js`, `preload.js`
- **Ziel:** Der "Verbunden" Status im Header soll den tatsächlichen Prüfstatus des API Keys widerspiegeln.
- **Implementierung:**
  1. IPC-Handler `checkApiKey` in `main.js` hinzufügen (macht einen minimalen Request an Groq).
  2. In `dashboard.js` beim Start und bei Key-Änderung prüfen.
  3. UI-Badge Farbe rot/grün anpassen.

### Task 16: Testing Infrastructure (Hoch)
**Code:** `package.json`, `tests/`
- **Ziel:** `npm test` soll funktionieren.
- **Implementierung:**
  1. Installation von `vitest` (leichter als Jest für dieses Setup).
  2. Konfiguration in `package.json`.
  3. Schreiben von Unit-Tests für `api.js` (Text-Cleanup Logik) und `dashboard.js` (Hilfsfunktionen).

### Task 11: History Pagination (Mittel)
**Code:** `renderer/dashboard.js`, `config/store.js`
- **Ziel:** Performance verbessern bei vielen Einträgen.
- **Implementierung:**
  1. `store.js`: `getHistory(limit, offset)` Methode anpassen.
  2. `dashboard.js`: "Mehr laden" Button am Ende der Liste einfügen, wenn mehr Einträge verfügbar sind.
  3. Initial nur 10 Einträge laden.

### Task 12: Activity Chart mit echten Daten (Mittel)
**Code:** `renderer/dashboard.js`
- **Ziel:** Der Chart soll zeigen, wie viele Aufnahmen in den letzten 7 Tagen gemacht wurden.
- **Implementierung:**
  1. Daten-Aggregation aus der History (group by Date).
  2. Ersetzen des `chartData` Arrays in `dashboard.js` mit berechneten Werten.
  3. Auffüllen von fehlenden Tagen mit 0.

### Task 13: Notification Center (Niedrig)
**Code:** `renderer/dashboard.js`, `renderer/dashboard.html`
- **Ziel:** Klick auf Glocke zeigt letzte System-Events.
- **Implementierung:**
  1. Einfaches Array im `localStorage` für Benachrichtigungen (z.B. "Update verfügbar", "Willkommen").
  2. Kleines Dropdown-Menü beim Klick auf die Glocke.
  3. Badge-Counter bei neuen Nachrichten.

### Task 14: User Avatar (Niedrig)
**Code:** `renderer/dashboard.js`, `config/store.js`
- **Ziel:** Personalisierung.
- **Implementierung:**
  1. Datei-Upload Input (versteckt).
  2. Speichern des Bildes (als Base64 im Store oder Pfad).
  3. Setzen des `src` Attributs des Avatar-Bildes.

---

## Reihenfolge der Umsetzung

1. **Setup & Stabilität:** #16 (Tests), #15 (API Status)
2. **Daten-Logik:** #12 (Chart), #11 (Pagination)
3. **UI Polish:** #13 (Notifications), #14 (Avatar)
