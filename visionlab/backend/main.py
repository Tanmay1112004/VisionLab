"""
VisionLab — Computer Vision API
FastAPI service exposing OpenCV + MediaPipe endpoints.
"""

import base64
import math
import os
import tempfile
import time
from typing import Optional

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

try:
    import mediapipe as mp
    MP_AVAILABLE = True
except ImportError:
    MP_AVAILABLE = False

# ── App setup ─────────────────────────────────────────────────────────────────

app = FastAPI(
    title="VisionLab CV API",
    description="Computer vision endpoints powered by OpenCV and MediaPipe.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Helpers ───────────────────────────────────────────────────────────────────

def _img_to_b64(img_bgr: np.ndarray) -> str:
    """Encode a BGR image to a base64 PNG string."""
    _, buf = cv2.imencode(".png", img_bgr)
    return base64.b64encode(buf.tobytes()).decode("utf-8")


def _decode_upload(data: bytes) -> np.ndarray:
    """Decode raw bytes to a BGR numpy array."""
    arr = np.frombuffer(data, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Could not decode image.")
    return img


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health", tags=["meta"])
async def health():
    return {"status": "ok", "mediapipe_available": MP_AVAILABLE}


# ── Face Detection ────────────────────────────────────────────────────────────

@app.post("/face-detection", tags=["detection"])
async def face_detection(
    file: UploadFile = File(...),
    scale_factor: float = Form(1.3),
    min_neighbors: int = Form(5),
    min_size: int = Form(30),
):
    """Detect faces using OpenCV Haar Cascade classifier."""
    img = _decode_upload(await file.read())
    cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )

    t0 = time.perf_counter()
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(
        gray,
        scaleFactor=scale_factor,
        minNeighbors=min_neighbors,
        minSize=(min_size, min_size),
    )
    elapsed_ms = (time.perf_counter() - t0) * 1000

    annotated = img.copy()
    face_list = []
    for x, y, w, h in (faces if not isinstance(faces, tuple) else []):
        cv2.rectangle(annotated, (x, y), (x + w, y + h), (127, 0, 255), 2)
        cv2.putText(annotated, "Face", (x, y - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (127, 0, 255), 2)
        face_list.append({"x": int(x), "y": int(y), "w": int(w), "h": int(h)})

    cv2.putText(annotated, f"{elapsed_ms:.1f} ms", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

    return JSONResponse({
        "original": _img_to_b64(img),
        "result": _img_to_b64(annotated),
        "face_count": len(face_list),
        "faces": face_list,
        "processing_ms": round(elapsed_ms, 1),
    })


# ── Face + Eye Detection ──────────────────────────────────────────────────────

_COLOR_MAP = {
    "Purple": (127, 0, 255), "Blue": (255, 0, 0),
    "Green":  (0, 255, 0),   "Red":  (0, 0, 255),
    "Yellow": (0, 255, 255), "Cyan": (255, 255, 0),
    "White":  (255, 255, 255), "Orange": (0, 165, 255),
}


@app.post("/face-eye-detection", tags=["detection"])
async def face_eye_detection(
    file: UploadFile = File(...),
    scale_factor: float = Form(1.3),
    min_neighbors: int = Form(5),
    detect_eyes: bool = Form(True),
    face_color: str = Form("Purple"),
    eye_color: str = Form("Yellow"),
):
    """Detect faces and eyes using Haar Cascade classifiers."""
    img = _decode_upload(await file.read())
    fc = _COLOR_MAP.get(face_color, (127, 0, 255))
    ec = _COLOR_MAP.get(eye_color, (0, 255, 255))

    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )
    eye_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_eye_tree_eyeglasses.xml"
    )

    t0 = time.perf_counter()
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(
        gray, scaleFactor=scale_factor, minNeighbors=min_neighbors, minSize=(30, 30)
    )
    annotated = img.copy()
    face_count = eye_count = 0

    for x, y, w, h in (faces if not isinstance(faces, tuple) else []):
        face_count += 1
        cv2.rectangle(annotated, (x, y), (x + w, y + h), fc, 2)
        cv2.putText(annotated, f"Face {face_count}", (x, y - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, fc, 2)
        if detect_eyes:
            roi_gray  = gray[y:y + h, x:x + w]
            roi_color = annotated[y:y + h, x:x + w]
            for ex, ey, ew, eh in eye_cascade.detectMultiScale(
                roi_gray, scaleFactor=1.1, minNeighbors=5
            ):
                eye_count += 1
                cv2.rectangle(roi_color, (ex, ey), (ex + ew, ey + eh), ec, 2)

    elapsed_ms = (time.perf_counter() - t0) * 1000
    cv2.putText(annotated, f"{elapsed_ms:.1f} ms", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

    return JSONResponse({
        "original": _img_to_b64(img),
        "result": _img_to_b64(annotated),
        "face_count": face_count,
        "eye_count": eye_count,
        "processing_ms": round(elapsed_ms, 1),
    })


# ── Face + Hand Landmarks ─────────────────────────────────────────────────────

@app.post("/face-hand-landmarks", tags=["detection"])
async def face_hand_landmarks(
    file: UploadFile = File(...),
    detection_confidence: float = Form(0.5),
    tracking_confidence: float = Form(0.5),
    draw_face: bool = Form(True),
    draw_hands: bool = Form(True),
):
    """Detect face mesh and hand landmarks using MediaPipe Holistic."""
    if not MP_AVAILABLE:
        raise HTTPException(status_code=503, detail="MediaPipe is not installed.")

    img = _decode_upload(await file.read())
    mp_holistic = mp.solutions.holistic
    mp_drawing  = mp.solutions.drawing_utils
    mp_styles   = mp.solutions.drawing_styles

    t0 = time.perf_counter()
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    annotated = img.copy()

    with mp_holistic.Holistic(
        static_image_mode=True,
        min_detection_confidence=detection_confidence,
        min_tracking_confidence=tracking_confidence,
    ) as holistic:
        results = holistic.process(rgb)

        if draw_face and results.face_landmarks:
            mp_drawing.draw_landmarks(
                annotated,
                results.face_landmarks,
                mp_holistic.FACEMESH_CONTOURS,
                landmark_drawing_spec=None,
                connection_drawing_spec=mp_styles.get_default_face_mesh_contours_style(),
            )
        if draw_hands:
            for hand_lm in filter(None, [results.right_hand_landmarks,
                                          results.left_hand_landmarks]):
                mp_drawing.draw_landmarks(
                    annotated, hand_lm, mp_holistic.HAND_CONNECTIONS,
                    mp_styles.get_default_hand_landmarks_style(),
                    mp_styles.get_default_hand_connections_style(),
                )

    elapsed_ms = (time.perf_counter() - t0) * 1000
    cv2.putText(annotated, f"{elapsed_ms:.1f} ms", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

    hands_detected = sum(
        x is not None for x in [results.right_hand_landmarks,
                                  results.left_hand_landmarks]
    )

    return JSONResponse({
        "original": _img_to_b64(img),
        "result": _img_to_b64(annotated),
        "face_detected": results.face_landmarks is not None,
        "hands_detected": hands_detected,
        "processing_ms": round(elapsed_ms, 1),
    })


# ── Object Tracking ───────────────────────────────────────────────────────────

class _EuclideanTracker:
    """Assign persistent IDs to detected objects via nearest-centroid matching."""

    def __init__(self) -> None:
        self._centers: dict[int, tuple[int, int]] = {}
        self._next_id = 0

    def update(self, rects: list[list[int]]) -> list[list[int]]:
        results: list[list[int]] = []
        for x, y, w, h in rects:
            cx, cy = (2 * x + w) // 2, (2 * y + h) // 2
            matched_id: Optional[int] = None
            for obj_id, (px, py) in self._centers.items():
                if math.hypot(cx - px, cy - py) < 35:
                    matched_id = obj_id
                    break
            if matched_id is None:
                matched_id = self._next_id
                self._next_id += 1
            self._centers[matched_id] = (cx, cy)
            results.append([x, y, w, h, matched_id])

        live_ids = {r[4] for r in results}
        self._centers = {k: v for k, v in self._centers.items() if k in live_ids}
        return results


@app.post("/object-tracking", tags=["detection"])
async def object_tracking(
    file: UploadFile = File(...),
    resize_width: int  = Form(640),
    frame_skip: int    = Form(2),
    min_area: int      = Form(150),
    bg_history: int    = Form(100),
    var_threshold: int = Form(40),
):
    """Track moving objects in a video using background subtraction + Euclidean distance."""
    data = await file.read()
    ext = os.path.splitext(file.filename or "")[1].lower() or ".mp4"
    if ext not in {".mp4", ".avi", ".mov", ".mkv"}:
        ext = ".mp4"

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp_in:
        tmp_in.write(data)
        in_path = tmp_in.name

    out_path = tempfile.mktemp(suffix=".mp4")

    try:
        tracker   = _EuclideanTracker()
        bg_sub    = cv2.createBackgroundSubtractorMOG2(
            history=bg_history, varThreshold=var_threshold
        )
        cap = cv2.VideoCapture(in_path)
        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Cannot open video file.")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        out_h = int(resize_width * 9 / 16)
        writer = cv2.VideoWriter(
            out_path,
            cv2.VideoWriter_fourcc(*"mp4v"),
            20.0,
            (resize_width, out_h),
        )

        frame_idx = processed = max_id = 0
        t_start   = time.perf_counter()

        while True:
            ok, frame = cap.read()
            if not ok:
                break
            frame_idx += 1
            if frame_idx % frame_skip != 0:
                continue

            frame  = cv2.resize(frame, (resize_width, out_h))
            mask   = bg_sub.apply(frame)
            _, mask = cv2.threshold(mask, 254, 255, cv2.THRESH_BINARY)
            contours, _ = cv2.findContours(
                mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )

            detections = [
                list(cv2.boundingRect(c))
                for c in contours
                if cv2.contourArea(c) > min_area
            ]

            for x, y, w, h, obj_id in tracker.update(detections):
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 220, 0), 2)
                cv2.putText(frame, f"ID {obj_id}", (x, y - 8),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 100, 0), 2)
                max_id = max(max_id, obj_id + 1)

            fps = processed / max(time.perf_counter() - t_start, 1e-6)
            cv2.putText(frame, f"FPS: {fps:.1f}  Objects: {max_id}", (10, 25),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 255), 2)
            writer.write(frame)
            processed += 1

        cap.release()
        writer.release()

        with open(out_path, "rb") as f:
            video_b64 = base64.b64encode(f.read()).decode("utf-8")

    finally:
        for p in (in_path, out_path):
            try:
                os.unlink(p)
            except OSError:
                pass

    return JSONResponse({
        "video_b64": video_b64,
        "total_frames": total_frames,
        "processed_frames": processed,
        "objects_tracked": max_id,
        "processing_s": round(time.perf_counter() - t_start, 1),
    })


# ── Filters ───────────────────────────────────────────────────────────────────

def _apply_filter(img: np.ndarray, name: str, params: dict) -> np.ndarray:
    out = img.copy()
    if name == "Grayscale":
        out = cv2.cvtColor(cv2.cvtColor(out, cv2.COLOR_BGR2GRAY), cv2.COLOR_GRAY2BGR)
    elif name == "Edge Detection (Canny)":
        gray = cv2.GaussianBlur(cv2.cvtColor(out, cv2.COLOR_BGR2GRAY), (5, 5), 0)
        out  = cv2.cvtColor(
            cv2.Canny(gray, params["low_thresh"], params["high_thresh"]),
            cv2.COLOR_GRAY2BGR,
        )
    elif name == "Gaussian Blur":
        k   = params["kernel_size"] | 1
        out = cv2.GaussianBlur(out, (k, k), 0)
    elif name == "Median Blur":
        out = cv2.medianBlur(out, params["kernel_size"] | 1)
    elif name == "Bilateral Filter":
        out = cv2.bilateralFilter(
            out, params["d"], params["sigma_color"], params["sigma_space"]
        )
    elif name == "Sharpen":
        s = params["strength"]
        k = np.array([[0, -s, 0], [-s, 1 + 4 * s, -s], [0, -s, 0]], np.float32)
        out = np.clip(cv2.filter2D(out, -1, k), 0, 255).astype(np.uint8)
    elif name == "Sepia":
        m   = np.array([[0.272, 0.534, 0.131],
                         [0.349, 0.686, 0.168],
                         [0.393, 0.769, 0.189]])
        out = np.clip(cv2.transform(out.astype(np.float64), m), 0, 255).astype(np.uint8)
    elif name == "Invert":
        out = cv2.bitwise_not(out)
    elif name == "Emboss":
        k   = np.array([[-2, -1, 0], [-1, 1, 1], [0, 1, 2]], np.float32)
        gray = cv2.cvtColor(out, cv2.COLOR_BGR2GRAY).astype(np.float32)
        out  = cv2.cvtColor(
            np.clip(cv2.filter2D(gray, -1, k) + 128, 0, 255).astype(np.uint8),
            cv2.COLOR_GRAY2BGR,
        )
    return out


@app.post("/filters", tags=["filters"])
async def filters_endpoint(
    file: UploadFile = File(...),
    filter_name: str = Form("Grayscale"),
    low_thresh: int  = Form(50),
    high_thresh: int = Form(150),
    kernel_size: int = Form(9),
    d: int           = Form(9),
    sigma_color: int = Form(75),
    sigma_space: int = Form(75),
    strength: float  = Form(0.5),
):
    """Apply an OpenCV image filter."""
    img = _decode_upload(await file.read())
    params = dict(
        low_thresh=low_thresh, high_thresh=high_thresh,
        kernel_size=kernel_size, d=d,
        sigma_color=sigma_color, sigma_space=sigma_space,
        strength=strength,
    )

    t0  = time.perf_counter()
    out = _apply_filter(img, filter_name, params)
    elapsed_ms = (time.perf_counter() - t0) * 1000

    return JSONResponse({
        "original": _img_to_b64(img),
        "result": _img_to_b64(out),
        "filter": filter_name,
        "processing_ms": round(elapsed_ms, 2),
    })
