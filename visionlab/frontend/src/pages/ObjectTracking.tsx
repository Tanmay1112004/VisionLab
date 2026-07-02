import { useState, useRef } from "react";
import { Box, Loader2, Download, Upload } from "lucide-react";
import Stat from "@/components/Stat";

export default function ObjectTracking() {
  const [resizeWidth, setResizeWidth] = useState(640);
  const [frameSkip, setFrameSkip] = useState(2);
  const [minArea, setMinArea] = useState(150);
  const [bgHistory, setBgHistory] = useState(100);
  const [varThreshold, setVarThreshold] = useState(40);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setResult(null);
    setError("");
  };

  const process = async () => {
    if (!videoFile) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", videoFile);
      form.append("resize_width", String(resizeWidth));
      form.append("frame_skip", String(frameSkip));
      form.append("min_area", String(minArea));
      form.append("bg_history", String(bgHistory));
      form.append("var_threshold", String(varThreshold));
      const res = await fetch("/cv-api/object-tracking", { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json()).detail || "Processing failed");
      setResult(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadVideo = () => {
    if (!result?.video_b64) return;
    const a = document.createElement("a");
    a.href = `data:video/mp4;base64,${result.video_b64}`;
    a.download = "tracked_output.mp4";
    a.click();
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Box className="text-amber-400 w-7 h-7" />
        <div>
          <h1 className="text-xl font-bold text-white">Object Tracking</h1>
          <p className="text-sm text-gray-400">Tracks moving objects in video using background subtraction</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-4">
            <h3 className="text-sm font-semibold text-gray-300">Settings</h3>
            <div>
              <p className="text-xs text-gray-400 mb-1.5">Output Width</p>
              <div className="flex gap-2">
                {[320, 480, 640].map((w) => (
                  <button key={w} onClick={() => setResizeWidth(w)}
                    className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors
                      ${resizeWidth === w ? "bg-amber-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
                    {w}px
                  </button>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="text-xs text-gray-400 flex justify-between mb-1">
                <span>Frame Skip</span><span className="text-white">{frameSkip}</span>
              </span>
              <input type="range" min={1} max={10} step={1} value={frameSkip}
                onChange={(e) => setFrameSkip(Number(e.target.value))}
                className="w-full accent-amber-500" />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400 flex justify-between mb-1">
                <span>Min Object Area (px²)</span><span className="text-white">{minArea}</span>
              </span>
              <input type="range" min={50} max={1000} step={10} value={minArea}
                onChange={(e) => setMinArea(Number(e.target.value))}
                className="w-full accent-amber-500" />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400 flex justify-between mb-1">
                <span>BG History (frames)</span><span className="text-white">{bgHistory}</span>
              </span>
              <input type="range" min={50} max={500} step={10} value={bgHistory}
                onChange={(e) => setBgHistory(Number(e.target.value))}
                className="w-full accent-amber-500" />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400 flex justify-between mb-1">
                <span>Variance Threshold</span><span className="text-white">{varThreshold}</span>
              </span>
              <input type="range" min={10} max={80} step={5} value={varThreshold}
                onChange={(e) => setVarThreshold(Number(e.target.value))}
                className="w-full accent-amber-500" />
            </label>
          </div>

          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Upload Video</h3>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-amber-500 hover:bg-gray-800/40 transition-colors">
              <Upload size={24} className="text-gray-500 mb-2" />
              <span className="text-sm text-gray-400">Upload video file</span>
              <span className="text-xs text-gray-600 mt-1">MP4, AVI, MOV, MKV</span>
              <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
            </label>
            {videoFile && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-400 truncate">{videoFile.name}</p>
                <button
                  onClick={process}
                  disabled={loading}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {loading ? "Processing…" : "Start Tracking"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {videoPreview && !result && (
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Original Video</p>
              <video src={videoPreview} controls className="w-full rounded-xl bg-black" />
            </div>
          )}
          {loading && (
            <div className="flex flex-col items-center justify-center h-48 bg-gray-900 rounded-xl border border-gray-800 gap-3">
              <Loader2 className="animate-spin text-amber-400 w-8 h-8" />
              <p className="text-xs text-gray-500">Processing video… this may take a while for large files</p>
            </div>
          )}
          {error && <div className="bg-red-950/40 border border-red-800 rounded-xl p-4 text-red-300 text-sm">{error}</div>}
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <Stat label="Total Frames" value={result.total_frames} />
                <Stat label="Processed" value={result.processed_frames} />
                <Stat label="Objects Tracked" value={result.objects_tracked} />
                <Stat label="Time" value={result.processing_s} unit="s" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Tracked Output</p>
                <video
                  src={`data:video/mp4;base64,${result.video_b64}`}
                  controls
                  className="w-full rounded-xl bg-black"
                />
              </div>
              <button
                onClick={downloadVideo}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Download size={15} />
                Download Tracked Video
              </button>
            </div>
          )}
          {!loading && !result && !videoPreview && (
            <div className="flex flex-col items-center justify-center h-48 bg-gray-900 rounded-xl border border-gray-800 text-gray-600">
              <Box size={40} className="mb-3 opacity-30" />
              <p className="text-sm">Upload a video to start tracking</p>
              <p className="text-xs mt-1 text-gray-700">Best with moving objects on a stable camera</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
