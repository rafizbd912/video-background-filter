# Video Background Filter

A real-time video processing system that applies a grayscale filter to the background while keeping the speaker/person in full color using OpenCV face detection.

## Quick-start

### 1. Backend (Python 3.9+)

```bash
# from project root
python -m venv venv && source venv/bin/activate   # create venv (Windows: venv\Scripts\activate)
pip install --upgrade pip
pip install -r requirements.txt                   # installs Flask, OpenCV, Mediapipe, NumPy …
python backend/main.py                            # runs on http://localhost:8080
```

### 2. Frontend (Node 18+)

```bash
cd frontend
npm install        # installs React + TS deps (react-scripts etc.)
npm start          # dev server on http://localhost:3000
```

Open the browser at `localhost:3000`, press **Start Filter** to enable the effect, **Stop Filter** to disable it.

---

## How it works

| Stage | Tech | Details |
|-------|------|---------|
| Person segmentation | **Mediapipe SelfieSegmentation** | pixel-accurate mask of the speaker – no arm / hair artefacts |
| Filtering | OpenCV | background → grayscale, foreground kept in colour |
| Transport | HTTP multipart | every 100 ms the browser captures the current `<video>` frame, POSTs it to `/detect`, receives the processed JPEG and overlays it |

---

## Features

* Manual **Start / Stop** button – no auto-filter when you just play the video.
* Smooth edges thanks to Gaussian-blurred mask.
* Works for single person videos but falls back gracefully if segmentation fails.

---

## Troubleshooting

* **Mediapipe build** – first install can take a minute (compiles C++) and needs Python ≤3.11.
* **Mac M-series** – wheels provided, no extra compile flags required.
* If you change backend code: stop the Flask process (`Ctrl-C`) and rerun `python backend/main.py`.

---

## Folder structure (high level)

```
backend/              Flask API (`/detect`)
  main.py             routes + CORS
  helpers.py          Mediapipe processing
frontend/             React + TypeScript app
  src/components/VideoPlayer.tsx  frame capture / overlay logic
  src/App.tsx         UI + Start/Stop buttons
```

---

**Enjoy your real-time background filter!**