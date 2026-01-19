# VoiceFlow User Guide

**VoiceFlow** is a versatile voice assistant tool for Windows that integrates state-of-the-art Speech-to-Text (Whisper) and Large Language Models (LLM) to transform your voice usage. It's designed to automate typing, answering questions, or polishing text using just your voice.

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **Git**
- **Groq API Key** (Get one at [console.groq.com](https://console.groq.com/))

### Installation
1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd voice-flow
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```
    *Note: This might take a few minutes as it compiles native modules.*

3.  **Configure Environment:**
    Create a `.env` file in the root directory (or rename `.env.example` if available) and add your Groq API key:
    ```env
    GROQ_API_KEY=gsk_your_key_here
    ```

4.  **Start the Application:**
    ```bash
    npm start
    ```

---

## 🎙️ Usage

### Global Hotkey (`F2`)
VoiceFlow runs in the background. Press and hold **F2** to start recording directly into any active application.
1.  **Hold F2**: A small overlay appears (🔴 Recording...).
2.  **Speak**: Say your command or text.
3.  **Release F2**: The audio is processed, and the result is automatically pasted into your active window.

### Modes
Customize how VoiceFlow processes your speech in the **Dashboard** -> **Modes** tab.

-   **Raw Transcription**: Simply transcribes what you say (no AI modification).
-   **Polishing**: Cleans up stutters, grammar, and formatting.
-   **Translation**: Translates spoken text into English (or other target languages).
-   **Answering**: Functions like a chatbot; asks the AI a question and pastes the answer.

### History & Dictionary
-   **History Tab**: View past transcriptions.
    -   **Filter**: Sort by Mode or Date (Today, Last 7 Days, etc.).
    -   **Search**: Full-text search through your history.
-   **Dictionary Tab**: Add custom words (like names or technical terms) that the AI frequently misspells. The system will auto-replace them in the final output.

### Settings
-   **Model Selection**: Choose your preferred AI models.
    -   *Transcription*: Whisper Large V3 (recommended).
    -   *LLM*: Llama 3.3 70B (High Quality) or Llama 3.1 8B (Fast).
    -   *Pricing*: Estimated costs are displayed next to each model.

---

## 🔧 Troubleshooting

**"Global Hotkey Conflict"**
-   If `F2` is already used by another app, you can change the hotkey in the code (`desktop/main.js` -> search for `globalShortcut.register`). *Future versions will have a UI for this.*

**"Dictionary Not Working"**
-   Ensure you added the word exactly as it frequently appears wrong in the "Search" field, and the correct version in "Replace". Dictionary is applied *after* AI processing.

**"Auto-Paste Failed"**
-   Some apps block simulated input. If pasting fails, the Overlay will show a "Copy to Clipboard" button as a backup.
