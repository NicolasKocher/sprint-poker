<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1mIh_iAPxByrczVrcmzuXwV47bovDyj8w

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key (optional)

3. Run the app with Netlify Functions (set `NETLIFY_BLOBS_TOKEN` when prompted so the local Blob store works):
   ```bash
   # Terminal 1: Start Netlify Functions Server
   npx netlify dev
   
   # Terminal 2: Start Vite Dev Server (optional, if you want to run separately)
   npm run dev
   ```
   
   Oder einfach nur:
   ```bash
   npx netlify dev
   ```
   Das startet sowohl die Functions als auch das Frontend.

## Deploy to Netlify

1. Build the app:
   ```bash
   npm run build
   ```

2. Deploy to Netlify:
   - Option A: Via Netlify CLI
     ```bash
     npx netlify deploy --prod
     ```
   - Option B: Via Netlify Dashboard
     - Connect your Git repository
     - Netlify will automatically detect the build settings from `netlify.toml`

## Multi-User Support

Die App unterstützt jetzt mehrere Benutzer gleichzeitig – auch über verschiedene Netzwerke hinweg – und speichert Sessions persistent über Netlify Blobs. Das bedeutet:
- Jeder Benutzer kann über den Room Code denselben Raum betreten
- Votes werden in Echtzeit alle 500 ms synchronisiert
- Hosts behalten ihre Rechte, solange sie denselben Namen auf demselben Gerät nutzen (IDs werden lokal gespeichert)
- Ein Klick auf „Exit“ entfernt Benutzer sauber aus der Session; wenn alle den Raum verlassen, wird die Session automatisch gelöscht

**Hinweis:** Für lokale Entwicklung muss `npx netlify dev` mit gültigem `NETLIFY_BLOBS_TOKEN` laufen, damit die persistente Ablage funktioniert.
