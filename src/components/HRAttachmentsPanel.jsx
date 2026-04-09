import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, Paperclip, ExternalLink } from "lucide-react";

const NTE_TYPES = [
  "Signed NTE",
  "Explanation Letter",
  "Appeal",
  "Admin Hearing",
  "NOD",
];

const DEFAULT_TYPES = ["Supporting Document", "Proof of Completion"];

export default function HRAttachmentsPanel({ req, onUpdated, currentUser }) {
  const [uploading, setUploading] = useState(null);

  const attachments = Array.isArray(req.hr_attachments) ? req.hr_attachments : [];
  const isNTE = req.subject === "NTE Request";
  const types = isNTE ? NTE_TYPES : DEFAULT_TYPES;

  const handleUpload = async (type, file) => {
    setUploading(type + file.name);
    const res = await base44.integrations.Core.UploadFile({ file });
    const newAttachment = {
      id: Date.now().toString(),
      type,
      url: res.file_url,
      uploaded_at: new Date().toISOString(),
      uploaded_by: currentUser?.email || "HR Staff",
    };
    const updatedAttachments = [...attachments, newAttachment];
    const newTimeline = [
      ...(Array.isArray(req.timeline) ? req.timeline : []),
      {
        timestamp: new Date().toISOString(),
        action: "Attachment Added",
        user: currentUser?.email || "HR Staff",
        details: `Uploaded: ${type}`,
      },
    ];
    await base44.entities.HRRequest.update(req.id, {
      hr_attachments: updatedAttachments,
      timeline: newTimeline,
    });
    setUploading(null);
    onUpdated();
  };

  const byType = types.reduce((acc, t) => {
    acc[t] = attachments.filter(a => a.type === t);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {types.map(type => (
        <div key={type} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold ${type === "NOD" ? "text-orange-600" : "text-gray-700"}`}>
              {type} {type === "NOD" && isNTE && <span className="text-orange-400">(Required for Completion)</span>}
            </span>
            <label className="flex items-center gap-1 cursor-pointer text-blue-500 hover:text-blue-700 text-xs font-semibold">
              {uploading?.startsWith(type) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              Upload
              <input
                type="file"
                className="hidden"
                onChange={e => e.target.files[0] && handleUpload(type, e.target.files[0])}
              />
            </label>
          </div>
          {byType[type].length === 0 ? (
            <p className="text-xs text-gray-400 italic">No files uploaded</p>
          ) : (
            <div className="space-y-1">
              {byType[type].map((att, i) => (
                <a
                  key={att.id || i}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-500 hover:underline"
                >
                  <Paperclip className="w-3 h-3" />
                  {type} #{i + 1}
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  <span className="text-gray-400 ml-1">
                    {att.uploaded_at ? new Date(att.uploaded_at).toLocaleDateString() : ""}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}