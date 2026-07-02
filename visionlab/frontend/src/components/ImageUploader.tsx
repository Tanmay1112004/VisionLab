import { useRef, useState, useCallback, useEffect } from "react";
import { Upload, Camera, X, Circle } from "lucide-react";

interface Props {
  onImage: (file: File, preview: string) => void;
  accept?: string;
  label?: string;
}

export default function ImageUploader({ onImage, accept = "image/*", label = "image" }: Props) {
  const [mode, setMode] = useState<"upload" | "webcam">("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [webcamReady, setWebcamReady] = useState(false);
  const [webcamError, setWebcamError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setWebcamReady(false);
    setWebcamError("");
  }, []);

  const startWebcam = useCallback(async () => {
    setWebcamError("");
    setWebcamReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
          setWebcamReady(true);
        };
      }
    } catch (err: any) {
      const msg = err?.name === "NotAllowedError"
        ? "Camera permission denied. Allow camera access in your browser."
        : err?.name === "NotFoundError"
        ? "No camera found on this device."
        : "Could not start webcam.";
      setWebcamError(msg);
    }
  }, []);

  useEffect(() => {
    if (mode === "webcam" && !preview) {
      startWebcam();
    } else if (mode === "upload") {
      stopWebcam();
    }
    return () => {
      if (mode === "webcam") stopWebcam();
    };
  }, [mode]);

  const takeSnapshot = () => {
    const video = videoRef.current;
    if (!video || !webcamReady) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "snapshot.png", { type: "image/png" });
      const url = URL.createObjectURL(blob);
      setPreview(url);
      onImage(file, url);
      stopWebcam();
    }, "image/png");
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onImage(file, url);
  };

  const clearImage = () => {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
    if (mode === "webcam") startWebcam();
  };

  const switchMode = (m: "upload" | "webcam") => {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
    setMode(m);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["upload", "webcam"] as const).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
              ${mode === m ? "bg-violet-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
          >
            {m === "upload" ? <Upload size={14} /> : <Camera size={14} />}
            {m === "upload" ? "Upload File" : "Webcam"}
          </button>
        ))}
      </div>

      {mode === "upload" && !preview && (
        <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-violet-500 hover:bg-gray-800/40 transition-colors">
          <Upload size={28} className="text-gray-500 mb-2" />
          <span className="text-sm text-gray-400">Click to upload {label}</span>
          <span className="text-xs text-gray-600 mt-1">JPG, PNG, BMP, WebP</span>
          <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
        </label>
      )}

      {mode === "webcam" && !preview && (
        <div className="space-y-2">
          {webcamError ? (
            <div className="bg-red-950/40 border border-red-800 rounded-xl p-3 text-red-300 text-xs text-center space-y-2">
              <p>{webcamError}</p>
              <button
                onClick={startWebcam}
                className="px-3 py-1.5 bg-red-800/60 hover:bg-red-700/60 text-red-200 rounded-lg text-xs"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="relative bg-black rounded-xl overflow-hidden" style={{ minHeight: "160px" }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-xl block"
                  style={{ display: "block" }}
                />
                {!webcamReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-xl">
                    <div className="text-center">
                      <Camera size={28} className="text-gray-500 mx-auto mb-2 animate-pulse" />
                      <p className="text-xs text-gray-500">Starting camera…</p>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={takeSnapshot}
                disabled={!webcamReady}
                className="w-full py-2.5 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Circle size={14} className="fill-white" />
                Take Snapshot
              </button>
            </>
          )}
        </div>
      )}

      {preview && (
        <div className="relative">
          <img src={preview} alt="preview" className="w-full rounded-xl object-contain max-h-64 bg-black" />
          <button
            onClick={clearImage}
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
