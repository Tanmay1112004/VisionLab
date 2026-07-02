import { useState } from "react";
import { ScanFace, Loader2 } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import ResultView from "@/components/ResultView";
import Stat from "@/components/Stat";

export default function FaceDetection() {
  const [scaleFactor, setScaleFactor] = useState(1.3);
  const [minNeighbors, setMinNeighbors] = useState(5);
  const [minSize, setMinSize] = useState(30);
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
      form.append("min_size", String(minSize));
      const res = await fetch("/cv-api/face-detection", { method: "POST", body: form });
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
        <ScanFace className="text-violet-400 w-7 h-7" />
        <div>
          <h1 className="text-xl font-bold text-white">Face Detection</h1>
          <p className="text-sm text-gray-400">Detects human faces using OpenCV Haar Cascade classifier</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Settings</h3>
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs text-gray-400 flex justify-between mb-1">
                  <span>Scale Factor</span><span className="text-white">{scaleFactor.toFixed(2)}</span>
                </span>
                <input type="range" min={1.05} max={2.0} step={0.05} value={scaleFactor}
                  onChange={(e) => setScaleFactor(Number(e.target.value))}
                  className="w-full accent-violet-500" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-400 flex justify-between mb-1">
                  <span>Min Neighbors</span><span className="text-white">{minNeighbors}</span>
                </span>
                <input type="range" min={1} max={10} step={1} value={minNeighbors}
                  onChange={(e) => setMinNeighbors(Number(e.target.value))}
                  className="w-full accent-violet-500" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-400 flex justify-between mb-1">
                  <span>Min Face Size (px)</span><span className="text-white">{minSize}</span>
                </span>
                <input type="range" min={20} max={200} step={5} value={minSize}
                  onChange={(e) => setMinSize(Number(e.target.value))}
                  className="w-full accent-violet-500" />
              </label>
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
              <Loader2 className="animate-spin text-violet-400 w-8 h-8" />
            </div>
          )}
          {error && (
            <div className="bg-red-950/40 border border-red-800 rounded-xl p-4 text-red-300 text-sm">{error}</div>
          )}
          {result && (
            <ResultView original={result.original} result={result.result} filename="face_detection.png" resultLabel="Detected">
              <Stat label="Faces Found" value={result.face_count} />
              <Stat label="Processing" value={result.processing_ms} unit="ms" />
              <Stat label="Status" value={result.face_count > 0 ? "✓" : "None"} />
            </ResultView>
          )}
          {!loading && !result && (
            <div className="flex flex-col items-center justify-center h-48 bg-gray-900 rounded-xl border border-gray-800 text-gray-600">
              <ScanFace size={40} className="mb-3 opacity-30" />
              <p className="text-sm">Upload an image to start detection</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
