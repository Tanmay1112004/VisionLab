import { useState } from "react";
import { Eye, Loader2 } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import ResultView from "@/components/ResultView";
import Stat from "@/components/Stat";

const FACE_COLORS = ["Purple", "Blue", "Green", "Red"];
const EYE_COLORS = ["Yellow", "Cyan", "White", "Orange"];

export default function FaceEyeDetection() {
  const [scaleFactor, setScaleFactor] = useState(1.3);
  const [minNeighbors, setMinNeighbors] = useState(5);
  const [detectEyes, setDetectEyes] = useState(true);
  const [faceColor, setFaceColor] = useState("Purple");
  const [eyeColor, setEyeColor] = useState("Yellow");
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
      form.append("scale_factor", String(scaleFactor));
      form.append("min_neighbors", String(minNeighbors));
      form.append("detect_eyes", String(detectEyes));
      form.append("face_color", faceColor);
      form.append("eye_color", eyeColor);
      const res = await fetch("/cv-api/face-eye-detection", { method: "POST", body: form });
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
        <Eye className="text-blue-400 w-7 h-7" />
        <div>
          <h1 className="text-xl font-bold text-white">Face + Eye Detection</h1>
          <p className="text-sm text-gray-400">Detects faces and eyes simultaneously using Haar Cascade classifiers</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-4">
            <h3 className="text-sm font-semibold text-gray-300">Settings</h3>
            <label className="block">
              <span className="text-xs text-gray-400 flex justify-between mb-1">
                <span>Scale Factor</span><span className="text-white">{scaleFactor.toFixed(2)}</span>
              </span>
              <input type="range" min={1.05} max={2.0} step={0.05} value={scaleFactor}
                onChange={(e) => setScaleFactor(Number(e.target.value))}
                className="w-full accent-blue-500" />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400 flex justify-between mb-1">
                <span>Min Neighbors</span><span className="text-white">{minNeighbors}</span>
              </span>
              <input type="range" min={1} max={10} step={1} value={minNeighbors}
                onChange={(e) => setMinNeighbors(Number(e.target.value))}
                className="w-full accent-blue-500" />
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={detectEyes} onChange={(e) => setDetectEyes(e.target.checked)}
                className="accent-blue-500 w-4 h-4" />
              <span className="text-sm text-gray-300">Detect eyes within faces</span>
            </label>
            <div>
              <p className="text-xs text-gray-400 mb-1.5">Face Box Color</p>
              <div className="flex gap-2 flex-wrap">
                {FACE_COLORS.map((c) => (
                  <button key={c} onClick={() => setFaceColor(c)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors
                      ${faceColor === c ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1.5">Eye Box Color</p>
              <div className="flex gap-2 flex-wrap">
                {EYE_COLORS.map((c) => (
                  <button key={c} onClick={() => setEyeColor(c)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors
                      ${eyeColor === c ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Input</h3>
            <ImageUploader onImage={(file) => process(file)} />
          </div>
        </div>

        <div className="lg:col-span-2">
          {loading && (
            <div className="flex items-center justify-center h-48 bg-gray-900 rounded-xl border border-gray-800">
              <Loader2 className="animate-spin text-blue-400 w-8 h-8" />
            </div>
          )}
          {error && <div className="bg-red-950/40 border border-red-800 rounded-xl p-4 text-red-300 text-sm">{error}</div>}
          {result && (
            <ResultView original={result.original} result={result.result} filename="face_eye_detection.png" resultLabel="Detected">
              <Stat label="Faces" value={result.face_count} />
              <Stat label="Eyes" value={result.eye_count} />
              <Stat label="Time" value={result.processing_ms} unit="ms" />
            </ResultView>
          )}
          {!loading && !result && (
            <div className="flex flex-col items-center justify-center h-48 bg-gray-900 rounded-xl border border-gray-800 text-gray-600">
              <Eye size={40} className="mb-3 opacity-30" />
              <p className="text-sm">Upload an image to detect faces and eyes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
