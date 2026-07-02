# VisionLab

A full-stack real-time computer vision web application built with **React + FastAPI**.  
Upload an image or take a webcam snapshot and run it through five detection modes powered by **OpenCV** and **MediaPipe**.

---

## Features

| Mode | Description |
|------|-------------|
| **Face Detection** | Haar Cascade classifier — adjustable scale factor, neighbor count, and min face size |
| **Face + Eye Detection** | Simultaneous face and eye detection with customizable bounding-box colours |
| **Face + Hand Landmarks** | MediaPipe Holistic — 468-point face mesh + 21-keypoint hand skeleton |
| **Object Tracking** | Background subtraction (MOG2) + Euclidean distance tracker on video files |
| **CV Filters** | 9 OpenCV filters: Grayscale, Canny Edge, Gaussian/Median/Bilateral Blur, Sharpen, Sepia, Invert, Emboss |

Every mode supports:
- File upload (JPG, PNG, BMP, WebP) **and** live webcam snapshot
- Real-time parameter sliders
- Processing-time display
- One-click download of the annotated result

---

## Project Structure

```
visionlab/
├── backend/
│   ├── main.py           # FastAPI application — all CV endpoints
│   └── requirements.txt  # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ImageUploader.tsx   # File upload + webcam capture
│   │   │   ├── ResultView.tsx      # Side-by-side result display
│   │   │   └── Stat.tsx            # Metric card
│   │   ├── pages/
│   │   │   ├── FaceDetection.tsx
│   │   │   ├── FaceEyeDetection.tsx
│   │   │   ├── FaceHandLandmarks.tsx
│   │   │   ├── ObjectTracking.tsx
│   │   │   └── Filters.tsx
│   │   ├── lib/utils.ts            # Tailwind class helper
│   │   ├── App.tsx                 # Router + sidebar layout
│   │   ├── main.tsx                # React entry point
│   │   └── index.css               # Tailwind base styles
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4, Wouter, TanStack Query |
| Backend | Python 3.11, FastAPI, Uvicorn |
| CV Engine | OpenCV 4.9 (`opencv-contrib-python-headless`), MediaPipe 0.10 |
| Icons | Lucide React |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 and **npm** (or pnpm / yarn)
- **Python** ≥ 3.10

---

### 1 — Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the API server (port 8000)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The interactive API docs are available at **http://localhost:8000/docs**.

---

### 2 — Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server (port 5173)
npm run dev
```

Open **http://localhost:5173** in your browser.  
The Vite dev server proxies all `/cv-api/*` requests to `http://localhost:8000`, so no CORS configuration is needed during development.

---

### Docker Compose (both services at once)

```bash
# From the project root
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

---

## API Reference

All endpoints accept `multipart/form-data` with an image/video `file` field plus optional parameter fields.  
All image endpoints return JSON with `original` and `result` as base64-encoded PNG strings.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Service health check |
| `POST` | `/face-detection` | Haar Cascade face detection |
| `POST` | `/face-eye-detection` | Face + eye detection |
| `POST` | `/face-hand-landmarks` | MediaPipe Holistic landmarks |
| `POST` | `/object-tracking` | Video object tracking |
| `POST` | `/filters` | OpenCV image filters |

> The frontend routes all requests through the Vite proxy at `/cv-api/...`.  
> In production, configure your reverse proxy (nginx, Caddy, etc.) to forward `/cv-api` to the backend.

---

## Building for Production

```bash
# Build the frontend
cd frontend
npm run build          # outputs to frontend/dist/

# Serve with a static file server + reverse proxy
# or with FastAPI's StaticFiles:
#   app.mount("/", StaticFiles(directory="../frontend/dist", html=True))
```

---

## Webcam Note

Camera access requires a **secure context** (HTTPS or localhost).  
If the webcam shows a black screen inside an embedded iframe, open the app directly in a browser tab.

---

## License

MIT

---

