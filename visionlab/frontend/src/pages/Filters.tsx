import { useState } from "react";
import { Wand2, Loader2 } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import ResultView from "@/components/ResultView";
import Stat from "@/components/Stat";

const FILTERS = [
  { name: "Grayscale", desc: "Converts to single-channel luminance" },
  { name: "Edge Detection (Canny)", desc: "Detects edges — two-stage gradient and hysteresis" },
  { name: "Gaussian Blur", desc: "Smooths with a Gaussian kernel, reducing noise" },
  { name: "Median Blur", desc: "Reduces salt-and-pepper noise via median neighborhood" },
  { name: "Bilateral Filter", desc: "Smooths while preserving edges" },
  { name: "Sharpen", desc: "Enhances high-frequency detail" },
  { name: "Sepia", desc: "Warm brownish tint of old photographs" },
  { name: "Invert", desc: "Photographic negative" },
  { name: "Emboss", desc: "Simulates a raised 3D surface" },
];

export default function Filters() {
  const [filterName, setFilterName] = useState("Grayscale");
  const [lowThresh, setLowThresh] = useState(50);
  const [highThresh, setHighThresh] = useState(150);
  const [kernelSize, setKernelSize] = useState(9);
  const [d, setD] = useState(9);
  const [sigmaColor, setSigmaColor] = useState(75);
  const [sigmaSpace, setSigmaSpace] = useState(75);
  const [strength, setStrength] = useState(0.5);
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
      form.append("filter_name", filterName);
      form.append("low_thresh", String(lowThresh));
      form.append("high_thresh", String(highThresh));
      form.append("kernel_size", String(kernelSize));
      form.append("d", String(d));
      form.append("sigma_color", String(sigmaColor));
      form.append("sigma_space", String(sigmaSpace));
      form.append("strength", String(strength));
      const res = await fetch("/cv-api/filters", { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json()).detail || "Processing failed");
      setResult(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedFilter = FILTERS.find((f) => f.name === filterName);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Wand2 className="text-rose-400 w-7 h-7" />
        <div>
          <h1 className="text-xl font-bold text-white">OpenCV Filters</h1>
          <p className="text-sm text-gray-400">Apply classic image processing filters to any image</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-4">
            <h3 className="text-sm font-semibold text-gray-300">Filter</h3>
            <div className="flex flex-col gap-1">
              {FILTERS.map(({ name }) => (
                <button key={name} onClick={() => setFilterName(name)}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors
                    ${filterName === name ? "bg-rose-900/50 text-rose-300 border border-rose-800" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}>
                  {name}
                </button>
              ))}
            </div>
            {selectedFilter && (
              <p className="text-xs text-gray-600 italic">{selectedFilter.desc}</p>
            )}
          </div>

          {filterName === "Edge Detection (Canny)" && (
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-4">
              <h3 className="text-sm font-semibold text-gray-300">Parameters</h3>
              <label className="block">
                <span className="text-xs text-gray-400 flex justify-between mb-1"><span>Low Threshold</span><span className="text-white">{lowThresh}</span></span>
                <input type="range" min={10} max={200} value={lowThresh} onChange={(e) => setLowThresh(Number(e.target.value))} className="w-full accent-rose-500" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-400 flex justify-between mb-1"><span>High Threshold</span><span className="text-white">{highThresh}</span></span>
                <input type="range" min={50} max={400} value={highThresh} onChange={(e) => setHighThresh(Number(e.target.value))} className="w-full accent-rose-500" />
              </label>
            </div>
          )}
          {(filterName === "Gaussian Blur" || filterName === "Median Blur") && (
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-4">
              <h3 className="text-sm font-semibold text-gray-300">Parameters</h3>
              <label className="block">
                <span className="text-xs text-gray-400 flex justify-between mb-1"><span>Kernel Size</span><span className="text-white">{kernelSize}</span></span>
                <input type="range" min={3} max={31} step={2} value={kernelSize} onChange={(e) => setKernelSize(Number(e.target.value))} className="w-full accent-rose-500" />
              </label>
            </div>
          )}
          {filterName === "Bilateral Filter" && (
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-4">
              <h3 className="text-sm font-semibold text-gray-300">Parameters</h3>
              <label className="block">
                <span className="text-xs text-gray-400 flex justify-between mb-1"><span>Diameter</span><span className="text-white">{d}</span></span>
                <input type="range" min={3} max={15} value={d} onChange={(e) => setD(Number(e.target.value))} className="w-full accent-rose-500" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-400 flex justify-between mb-1"><span>Sigma Color</span><span className="text-white">{sigmaColor}</span></span>
                <input type="range" min={10} max={200} value={sigmaColor} onChange={(e) => setSigmaColor(Number(e.target.value))} className="w-full accent-rose-500" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-400 flex justify-between mb-1"><span>Sigma Space</span><span className="text-white">{sigmaSpace}</span></span>
                <input type="range" min={10} max={200} value={sigmaSpace} onChange={(e) => setSigmaSpace(Number(e.target.value))} className="w-full accent-rose-500" />
              </label>
            </div>
          )}
          {filterName === "Sharpen" && (
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-4">
              <h3 className="text-sm font-semibold text-gray-300">Parameters</h3>
              <label className="block">
                <span className="text-xs text-gray-400 flex justify-between mb-1"><span>Strength</span><span className="text-white">{strength.toFixed(1)}</span></span>
                <input type="range" min={0.1} max={2.0} step={0.1} value={strength} onChange={(e) => setStrength(Number(e.target.value))} className="w-full accent-rose-500" />
              </label>
            </div>
          )}

          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Input</h3>
            <ImageUploader onImage={(file) => process(file)} />
          </div>
        </div>

        <div className="lg:col-span-2">
          {loading && (
            <div className="flex items-center justify-center h-48 bg-gray-900 rounded-xl border border-gray-800">
              <Loader2 className="animate-spin text-rose-400 w-8 h-8" />
            </div>
          )}
          {error && <div className="bg-red-950/40 border border-red-800 rounded-xl p-4 text-red-300 text-sm">{error}</div>}
          {result && (
            <ResultView
              original={result.original}
              result={result.result}
              filename={`filter_${filterName.toLowerCase().replace(/[^a-z]/g, "_")}.png`}
              resultLabel={filterName}
            >
              <Stat label="Filter" value={result.filter} />
              <Stat label="Processing" value={result.processing_ms} unit="ms" />
              <Stat label="Status" value="✓ Done" />
            </ResultView>
          )}
          {!loading && !result && (
            <div className="flex flex-col items-center justify-center h-48 bg-gray-900 rounded-xl border border-gray-800 text-gray-600">
              <Wand2 size={40} className="mb-3 opacity-30" />
              <p className="text-sm">Select a filter and upload an image</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
