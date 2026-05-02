import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Webhook, Save, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const WEBHOOK_KEYS = [
  {
    key: "attendance_approved_webhook",
    label: "Attendance Approved Webhook",
    description: "Fired when an attendance proposal is approved by HR.",
  },
  {
    key: "attendance_rejected_webhook",
    label: "Attendance Rejected Webhook",
    description: "Fired when an attendance proposal is rejected by HR.",
  },
];

export default function WebhookSettings() {
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const records = await base44.entities.AppSettings.filter({});
      const map = {};
      records.forEach(r => { map[r.key] = { id: r.id, value: r.value }; });
      const initial = {};
      WEBHOOK_KEYS.forEach(({ key }) => {
        initial[key] = map[key]?.value || "";
      });
      setValues(initial);
      // store record ids
      setRecordMap(map);
      setLoading(false);
    };
    load();
  }, []);

  const [recordMap, setRecordMap] = useState({});

  const handleSave = async (key) => {
    setSaving(s => ({ ...s, [key]: true }));
    const existing = recordMap[key];
    if (existing) {
      await base44.entities.AppSettings.update(existing.id, { value: values[key] });
    } else {
      const created = await base44.entities.AppSettings.create({ key, value: values[key] });
      setRecordMap(m => ({ ...m, [key]: { id: created.id, value: values[key] } }));
    }
    setSaving(s => ({ ...s, [key]: false }));
    setSaved(s => ({ ...s, [key]: true }));
    setTimeout(() => setSaved(s => ({ ...s, [key]: false })), 2000);
  };

  if (loading) return (
    <div className="flex items-center gap-2 text-gray-400 py-4">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading webhook settings...
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Webhook className="w-4 h-4 text-orange-500" />
        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Webhook Settings</p>
      </div>
      <p className="text-sm text-gray-500 -mt-2">Configure webhook URLs for attendance proposal events. A POST request will be sent with the proposal data.</p>

      {WEBHOOK_KEYS.map(({ key, label, description }) => (
        <div key={key} className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">{label}</label>
          <p className="text-xs text-gray-400">{description}</p>
          <div className="flex gap-2">
            <input
              type="url"
              value={values[key] || ""}
              onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
              placeholder="https://hooks.example.com/..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
            />
            <Button
              onClick={() => handleSave(key)}
              disabled={saving[key]}
              className="shrink-0 flex items-center gap-1.5"
              variant={saved[key] ? "outline" : "default"}
            >
              {saving[key] ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved[key] ? (
                <><CheckCircle className="w-4 h-4 text-green-500" /> Saved</>
              ) : (
                <><Save className="w-4 h-4" /> Save</>
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}