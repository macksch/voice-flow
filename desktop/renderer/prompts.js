const PROMPTS = {
    standard: `- Sprache beibehalten (Deutsch oder Englisch). NICHT übersetzen.
- Entferne nur Füllwörter (äh, ähm, also, halt).
- Korrigiere nur offensichtliche Grammatikfehler.
- Behalte den Stil und die Wortwahl bei (keine inhaltlichen Änderungen).
- Gib NUR den bereinigten Text zurück.`

    email: `- Sprache beibehalten (Deutsch oder Englisch). NICHT übersetzen.
- Entferne Füllwörter und korrigiere Grammatik.
- Formatiere den Text mit sinnvollen Absätzen.
- Füge bei Bedarf eine passende Anrede und Grußformel hinzu, falls diese fehlen oder impliziert sind.
- Achte auf eine höfliche, professionelle Tonalität.
- Gib NUR den E-Mail-Inhalt zurück (keine Betreffzeile).`

    jira: `- Sprache: Wie Input (De/En).
- Strukturiere den Output ZWINGEND mit diesen Überschriften (in Fettdruck):
  **Zusammenfassung**
  (Ein prägnanter Satz)

  **Beschreibung**
  (Detaillierte Erklärung des Problems oder Features)

  **Akzeptanzkriterien**
  (Liste der Anforderungen als Bullet Points)
- Entferne Füllwörter, aber behalte technische Details exakt bei.`

    chat: `- Sprache: Wie Input.
- Entferne Stottern und grobe Füllwörter.
- Behalte eine lockere, informelle ("Du") Tonalität bei.
- Verzichte auf förmliche Korrekturen.
- Gib NUR den Text zurück.`
};

// For now, in the renderer (without module system or bundler configuration that supports require), 
// we attach this to the window object or expect it to be loaded via script tag.
// Since we are in Electron renderer with nodeIntegration: false, we can't use module.exports easily 
// unless we use a bundler or preload script interactions.
// However, the simplest MVP approach for the renderer is to just expose it globally 
// if we simply load this file via <script src=".../prompts.js"> in index.html.

if (typeof window !== 'undefined') {
    window.PROMPTS = PROMPTS;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PROMPTS;
}
