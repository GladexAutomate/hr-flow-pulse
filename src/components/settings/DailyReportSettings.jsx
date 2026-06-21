import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, Clock, Send, Save, Loader2, CheckCircle, Users, Link } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DailyReportSettings() {
  const [recipients, setRecipients] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [time1, setTime1] = useState("09:00");
  const [time2, setTime2] = useState("17:00");
  const [saving, setSaving] = useState(false);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [savedWebhook, setSavedWebhook] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    async function load() {
      const settings = await base44.entities.AppSettings.filter({ key: "daily_report_recipients" });
      if (settings[0]) setRecipients(settings[0].value);
      const t1 = await base44.entities.AppSettings.filter({ key: "daily_report_time_1" });
      if (t1[0]) setTime1(t1[0].value);
      const t2 = await base44.entities.AppSettings.filter({ key: "daily_report_time_2" });
      if (t2[0]) setTime2(t2[0].value);
      const wh = await base44.entities.AppSettings.filter({ key: "daily_report_webhook_url" });
      if (wh[0]) setWebhookUrl(wh[0].value);
    }
    load();
  }, []);

  const upsertSetting = async (key, value) => {
    const existing = await base44.entities.AppSettings.filter({ key });
    if (existing[0]) {
      await base44.entities.AppSettings.update(existing[0].id, { value });
    } else {
      await base44.entities.AppSettings.create({ key, value });
    }
  };

  const handleSaveWebhook = async () => {
    setSavingWebhook(true);
    setSavedWebhook(false);
    await upsertSetting("daily_report_webhook_url", webhookUrl);
    setSavingWebhook(false);
    setSavedWebhook(true);
    setTimeout(() => setSavedWebhook(false), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await Promise.all([
      upsertSetting("daily_report_recipients", recipients),
      upsertSetting("daily_report_time_1", time1),
      upsertSetting("daily_report_time_2", time2),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await base44.functions.invoke("generateDailyHRReport", {});
      if (res.data?.success) {
        setTestResult({ ok: true, msg: `Report sent to ${res.data.recipients?.length} recipient(s). ${res.data.total_open} open requests included.` });
      } else {
        setTestResult({ ok: false, msg: res.data?.error || "Unknown error" });
      }
    } catch (e) {
      setTestResult({ ok: false, msg: e.message });
    }
    setTesting(false);
  };

  const emailList = recipients.split(",").map(e => e.trim()).filter(Boolean);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-4 h-4 text-orange-500" />
          <p className="text-xs text-orange-500 uppercase font-bold tracking-wide">Daily HR Report</p>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          Automatically sends a professional daily summary of all <strong>open &amp; pending HR requests</strong> grouped by category,
          including SLA progress, breach alerts, and urgency indicators.
        </p>
      </div>

      {/* Webhook URL */}
      <div className="space-y-1.5">
        <p className="font-semibold text-gray-800">Daily HR Report Webhook</p>
        <p className="text-sm text-gray-500">Fired when the daily report is generated. Sends the report data as a POST request to this URL.</p>
        <div className="flex gap-2 mt-2">
          <input
            type="url"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            placeholder="https://your-webhook-url.com/..."
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <Button
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-4"
            onClick={handleSaveWebhook}
            disabled={savingWebhook}
          >
            {savingWebhook ? <Loader2 className="w-4 h-4 animate-spin" /> : savedWebhook ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {savedWebhook ? "Saved!" : "Save"}
          </Button>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Recipients */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          Report Recipients
        </label>
        <textarea
          value={recipients}
          onChange={e => setRecipients(e.target.value)}
          rows={3}
          placeholder="hr@company.com, manager@company.com, director@company.com"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
        />
        <div className="flex items-center gap-2 flex-wrap">
          {emailList.length > 0 ? (
            emailList.map((email, i) => (
              <span key={i} className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-blue-100">
                {email}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400 italic">No recipients added yet</span>
          )}
        </div>
        <p className="text-xs text-gray-400">Separate multiple emails with commas.</p>
      </div>

      {/* Schedule Times */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          Send Schedule (twice daily)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500 mb-1.5 font-medium">Morning Dispatch</p>
            <input
              type="time"
              value={time1}
              onChange={e => setTime1(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1.5 font-medium">Afternoon Dispatch</p>
            <input
              type="time"
              value={time2}
              onChange={e => setTime2(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Reports will be sent at <strong>{time1}</strong> and <strong>{time2}</strong> daily (Philippine Time).
          Save settings first, then notify your administrator to activate the schedule.
        </p>
      </div>

      {/* Test result */}
      {testResult && (
        <div className={`flex items-start gap-2 rounded-xl p-3 text-sm ${testResult.ok ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{testResult.msg}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 flex items-center gap-2"
          onClick={handleTest}
          disabled={testing || emailList.length === 0}
        >
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {testing ? "Sending…" : "Send Test Report Now"}
        </Button>
        <Button
          className="flex-1 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : saved ? "Saved!" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}