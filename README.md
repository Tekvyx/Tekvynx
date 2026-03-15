# Offline Music Player

A simple web-based offline music player built with plain HTML, CSS, and JavaScript.

## Features

- Add local audio files (`.mp3`, `.wav`, etc.) from your device.
- Play, pause, skip next/previous tracks.
- Seek through tracks and adjust volume.
- Local library is saved in `localStorage` as Data URLs, so it still works after page reloads.
- Fully offline once loaded.

## Run locally

Open `index.html` directly, or serve it with a static server:

```bash
python3 -m http.server 8000
```

Then browse to `http://localhost:8000`.
