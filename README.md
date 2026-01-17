# VoiceFlow

![VoiceFlow Banner](desktop/assets/icons/icon.png)

**VoiceFlow** ist eine leistungsstarke, plattformübergreifende Diktier-Suite, die moderne Spracherkennung mit intelligenter KI-Verarbeitung verbindet.
Die Anwendung ermöglicht es Benutzern, Texte effizient zu diktieren und diese mithilfe der Groq API und anpassbaren "Modes" direkt weiterzuverarbeiten (z.B. Zusammenfassungen, Umformulierungen, Korrekturen).

## 🚀 Features

*   **🎙️ Präzise Diktierfunktion**: Hochwertige Spracherkennung für schnelle Texteingabe.
*   **🤖 KI-Integration**: Nahtlose Anbindung an die Groq API (LLM) für intelligente Texttransformationen.
*   **✨ Smart Modes**:
    *   **Standard**: Einfache Transkription.
    *   **Custom Modes**: Erstellen Sie eigene Prompts für spezifische Aufgaben (z.B. "Fasse zusammen", "Formuliere als E-Mail").
*   **💾 Historie**: Lokale Speicherung aller Diktate und Bearbeitungen.
*   **🔒 Sicherheit**: Verschlüsselte Speicherung sensibler Daten (wie API Keys) mittels `safeStorage`.
*   **🖥️ Cross-Platform**: Verfügbar für Windows, macOS und Linux (Electron-basiert).
*   **⌨️ Global Hotkey**: Starten Sie die Aufnahme jederzeit aus jeder Anwendung heraus (Default: `Ctrl+Shift+D`).

## 📋 Voraussetzungen

Bevor Sie beginnen, stellen Sie sicher, dass folgende Tools installiert sind:

*   **Node.js** (v18 oder höher empfohlen)
*   **npm** (Node Package Manager)
*   Ein **Groq API Key** (erhältlich unter [console.groq.com](https://console.groq.com))

## 🛠️ Installation & Setup

1.  **Repository klonen**
    ```bash
    git clone https://github.com/macksch/voice-flow.git
    cd voice-flow
    ```

2.  **In das App-Verzeichnis wechseln**
    Das eigentliche Electron-Projekt befindet sich im Ordner `desktop`.
    ```bash
    cd desktop
    ```

3.  **Abhängigkeiten installieren**
    ```bash
    npm install
    ```

4.  **Anwendung starten (Development Guide)**
    Um die App im Entwicklungsmodus zu starten (mit Hot-Reloading Support):
    ```bash
    npm run dev
    ```
    Alternativ via Electron Forge:
    ```bash
    npm start
    ```

## ⚙️ Konfiguration

Beim ersten Start der Anwendung werden Sie durch den Einrichtungsprozess geführt:

1.  **API Key**: Geben Sie Ihren Groq API Key ein. Dieser wird sicher im System-Schlüsselbund (Keychain/Credentials Store) gespeichert.
2.  **Mikrofon**: Wählen Sie Ihr bevorzugtes Eingabegerät.
3.  **Einstellungen**: Über das Dashboard können Sie später jederzeit Hotkeys, Audio-Geräte und Custom Modes anpassen.

## 🏗️ Build & Deployment

Um eine installierbare Version der Anwendung für Ihr Betriebssystem zu erstellen:

### Paket erstellen (Package)
Erstellt ein ausführbares Paket ohne Installer:
```bash
npm run package
```

### Installer erstellen (Make/Dist)
Erstellt die finalen Installer (z.B. `.exe` für Windows, `.dmg` für macOS):
```bash
npm run dist
```
*Hinweis: `npm run dist` führt zusätzlich Skripte zur Icon-Optimierung aus.*

Die erstellten Dateien finden Sie im Ordner `desktop/dist` oder `desktop/out`.

## 🧪 Testing

Das Projekt verwendet **Vitest** für Unit- und Integrationstests.

Tests ausführen:
```bash
npm test
```

## 📂 Projektstruktur

```
voice-flow/
├── implementation_plan_phase4.md  # Aktueller Entwicklungsplan
├── desktop/                       # Hauptanwendung (Electron)
│   ├── main.js                    # Main Process (Electron Entry Point)
│   ├── preload.js                 # Preload Script (Sichere Bridge)
│   ├── assets/                    # Icons, Bilder, Fonts
│   ├── config/                    # Logik für Einstellungen & Store
│   │   └── store.js               # electron-store Wrapper
│   ├── renderer/                  # Frontend (UI) Code
│   │   ├── dashboard.html
│   │   ├── dashboard.js
│   │   └── ...
│   ├── scripts/                   # Build- & Utility-Skripte
│   └── tests/                     # Test-Dateien
└── README.md
```

## 🛠️ Tech Stack

*   **Runtime**: [Node.js](https://nodejs.org/) & [Electron](https://www.electronjs.org/)
*   **Language**: JavaScript
*   **Persistence**: [electron-store](https://github.com/sindresorhus/electron-store)
*   **Testing**: [Vitest](https://vitest.dev/)
*   **Building**: [Electron Forge](https://www.electronforge.io/) & [Electron Builder](https://www.electron.build/)

## 📄 Lizenz

Dieses Projekt ist unter der **MIT License** lizenziert. Siehe [LICENSE](LICENSE) für Details.

---
*Entwickelt von Maximilian Osthoff*
