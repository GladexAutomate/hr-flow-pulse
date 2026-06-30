import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Timer, Save, Loader2, CheckCircle, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SLA_SETTINGS_KEY, SLA_SUBJECTS, RESOURCE_TIERS,
  parseSlaSettings, defaultSlaSettings,
} from "@/lib/sla";

export default function SlaSettings() {
  const [settings, setSettings] = useState(defaultSlaSettings());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.entities.AppSettings.filter({ key: SLA_SETTINGS_KEY }).then(rows => {
      setSettings(parseSlaSettings(rows[0]?.value));
      setLoading(false);
    });
  }, []);

  const setSubject = (subject, value) => {
    const n = Math.max(1, parseInt(value, 10) || 0);
    setSettings(s => ({ ...s, [subject]: n }));
  };

  const setResourceTier = (tier, value) => {
    const n = Math.max(1, parseInt(value, 10) || 0);
    setSettings(s => ({ ...s, "Resource Request": { ...s["Resource Request"], [tier]: n } }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const value = JSON.stringify(settings);
    const existing = await base44.entities.AppSettings.filter({ key: SLA_SETTINGS_KEY });
    if (existing[0]) {
      await base44.entities.AppSettings.update(existing[0].id, { value });
    } else {
      await base44.entities.AppSettings.create({ key: SLA_SETTINGS_KEY, value });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => setSettings(defaultSlaSettings());

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
      </div>
    );
  }

  const NumberInput = ({ value, onChange }) => (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={1}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-800 text-center focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
      <span className="text-xs text-gray-400">days</span>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Timer className="w-4 h-4 text-orange-500" />
          <p className="text-xs text-orange-500 uppercase font-bold tracking-wide">SLA Settings</p>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          Set the turnaround target (in days) for each request type. Used to flag urgent and breached requests.
        </p>
      </div>

      {/* Important note about scope */}
      <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5 text-sm text-blue-700">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>
          Changes apply to <strong>new requests only</strong>. Existing records keep the SLA they were
          created with, so their breach status will not change.
        </span>
      </div>

      {/* Per-subject rows */}
      <div className="divide-y divide-gray-50">
        {SLA_SUBJECTS.map(subject => (
          subject === "Resource Request" ? (
            <div key={subject} className="py-3">
              <div className="text-sm font-semibold text-gray-700 mb-2">{subject}</div>
              <div className="space-y-2 pl-3 border-l-2 border-orange-100">
                {RESOURCE_TIERS.map(tier => (
                  <div key={tier} className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{tier}</span>
                    <NumberInput
                      value={settings["Resource Request"]?.[tier] ?? ""}
                      onChange={v => setResourceTier(tier, v)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div key={subject} className="flex items-center justify-between py-3">
              <span className="text-sm font-semibold text-gray-700">{subject}</span>
              <NumberInput value={settings[subject] ?? ""} onChange={v => setSubject(subject, v)} />
            </div>
          )
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button variant="outline" className="flex items-center gap-2" onClick={handleReset} disabled={saving}>
          <RotateCcw className="w-4 h-4" /> Reset to defaults
        </Button>
        <Button
          className="flex-1 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : saved ? "Saved!" : "Save SLA Settings"}
        </Button>
      </div>
    </div>
  );
}
