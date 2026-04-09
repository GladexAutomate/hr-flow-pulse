import { Clock, Paperclip, Edit3, CheckCircle, AlertTriangle } from "lucide-react";

function getIcon(action) {
  if (action?.includes("Attachment")) return <Paperclip className="w-3.5 h-3.5 text-blue-500" />;
  if (action?.includes("Submitted")) return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
  if (action?.includes("Status")) return <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />;
  return <Edit3 className="w-3.5 h-3.5 text-gray-400" />;
}

export default function RecordTimeline({ timeline }) {
  const entries = Array.isArray(timeline) ? [...timeline].reverse() : [];

  if (entries.length === 0) {
    return <p className="text-sm text-gray-400 italic text-center py-4">No history yet.</p>;
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
      {entries.map((entry, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              {getIcon(entry.action)}
            </div>
            {i < entries.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
          </div>
          <div className="pb-3 flex-1">
            <p className="text-sm font-semibold text-gray-800">{entry.action}</p>
            {entry.details && <p className="text-xs text-gray-500 mt-0.5">{entry.details}</p>}
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "—"}
              {entry.user && <span>· {entry.user}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}