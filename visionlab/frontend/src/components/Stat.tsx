interface Props {
  label: string;
  value: string | number;
  unit?: string;
}

export default function Stat({ label, value, unit }: Props) {
  return (
    <div className="bg-gray-800 rounded-lg px-4 py-3 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-white">
        {value}
        {unit && <span className="text-xs text-gray-400 ml-1">{unit}</span>}
      </p>
    </div>
  );
}
