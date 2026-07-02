import { Download } from "lucide-react";

interface Props {
  original?: string;
  result?: string;
  originalLabel?: string;
  resultLabel?: string;
  filename?: string;
  children?: React.ReactNode;
}

export default function ResultView({
  original,
  result,
  originalLabel = "Original",
  resultLabel = "Result",
  filename = "result.png",
  children,
}: Props) {
  const downloadResult = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = `data:image/png;base64,${result}`;
    a.download = filename;
    a.click();
  };

  if (!result) return null;

  return (
    <div className="space-y-4 mt-4">
      {children && (
        <div className="grid grid-cols-3 gap-3">{children}</div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {original && (
          <div>
            <p className="text-xs text-gray-500 mb-1.5">{originalLabel}</p>
            <img
              src={`data:image/png;base64,${original}`}
              alt="original"
              className="w-full rounded-lg object-contain bg-black max-h-72"
            />
          </div>
        )}
        <div>
          <p className="text-xs text-gray-500 mb-1.5">{resultLabel}</p>
          <img
            src={`data:image/png;base64,${result}`}
            alt="result"
            className="w-full rounded-lg object-contain bg-black max-h-72"
          />
        </div>
      </div>
      <button
        onClick={downloadResult}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        <Download size={15} />
        Download Result
      </button>
    </div>
  );
}
