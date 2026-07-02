import { useState } from "react";
import { Hand, Loader2 } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import ResultView from "@/components/ResultView";
import Stat from "@/components/Stat";

export default function FaceHandLandmarks() {
  const [detectionConf, setDetectionConf] = useState(0.5);
  const [trackingConf, setTrackingConf] = useState(0.5);
  const [drawFace, setDrawFace] = useState(true);
  const [drawHands, setDrawHands] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const process = async (file: File) => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("detection_confidence", String(detectionConf));
      form.append("tracking_confidence", String(trackingConf));
      form.append("draw_face", String(drawFace));
      form.append("draw_hands", String(drawHands));
      const res = await fetch("/cv-api/face-hand-landmarks", { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json()).detail || "Processing failed");
      setResult(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Hand className="text-emerald-400 w-7 h-7" />
        <div>
          <h1 className="text-xl font-bold text-white">Face + Hand Landmarks</h1>
          <p className="text-sm text-gray-400">Detects face mesh and hand landmarks using MediaPipe Holistic</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-4">
            <h3 className="text-sm font-semibold text-gray-300">Settings</h3>
            <label className="block">
              <span className="text-xs text-gray-400 flex justify-between mb-1">
                <span>Detection Confidence</span><span className="text-white">{detectionConf.toFixed(2)}</span>
              </span>
              <input type="range" min={0.1} max={1.0} step={0.05} value={detectionConf}
                onChange={(e) => setDetectionConf(Number(e.target.value))}
                className="w-full accent-emerald-500" />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400 flex justify-between mb-1">
                <span>Tracking Confidence</span><span className="text-white">{trackingConf.toFixed(2)}</span>
              </span>
              <input type="range" min={0.1} max={1.0} step={0.05} value={trackingConf}
                onChange={(e) => setTrackingConf(Number(e.target.value))}
                className="w-full accent-emerald-500" />
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={drawFace} onChange={(e) => setDrawFace(e.target.checked)}
                className="accent-emerald-500 w-4 h-4" />
              <span className="text-sm text-gray-300">Show Face Landmarks</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={drawHands} onChange={(e) => setDrawHands(e.target.checked)}
                className="accent-emerald-500 w-4 h-4" />
              <span className="text-sm text-gray-300">Show Hand Landmarks</span>
            </label>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Input</h3>
            <ImageUploader onImage={(file) => process(file)} />
          </div>
        </div>

        <div className="lg:col-span-2">
          {loading && (
            <div className="flex flex-col items-center justify-center h-48 bg-gray-900 rounded-xl border border-gray-800 gap-3">
              <Loader2 className="animate-spin text-emerald-400 w-8 h-8" />
              <p className="text-xs text-gray-500">Running MediaPipe Holistic… this may take a moment</p>
            </div>
          )}
          {error && <div className="bg-red-950/40 border border-red-800 rounded-xl p-4 text-red-300 text-sm">{error}</div>}
          {result && (
            <ResultView original={result.original} result={result.result} filename="landmarks.png" resultLabel="Landmarks">
              <Stat label="Face" value={result.face_detected ? "✓ Detected" : "None"} />
              <Stat label="Hands" value={result.hands_detected} />
              <Stat label="Time" value={result.processing_ms} unit="ms" />
            </ResultView>
          )}
          {!loading && !result && (
            <div className="flex flex-col items-center justify-center h-48 bg-gray-900 rounded-xl border border-gray-800 text-gray-600">
              <Hand size={40} className="mb-3 opacity-30" />
              <p className="text-sm">Upload an image to detect face & hand landmarks</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
