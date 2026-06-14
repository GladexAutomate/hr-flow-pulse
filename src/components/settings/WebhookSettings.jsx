import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Webhook, Save, Loader2, CheckCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const WEBHOOK_KEYS = [
  {
    key: "hr_request_webhook",
    label: "HR Request Notifications Webhook",
    description: "Fired when a new HR request is submitted or its status changes. Sends a professional HTML email payload with Date Submitted, Branch, Subject, Status, and Attachments.",
  },
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
  const [testing, setTesting] = useState({});
  const [testResult, setTestResult] = useState({});
  const [testStatus, setTestStatus] = useState({});

  const handleTest = async (key) => {
    const url = values[key];
    if (!url) return;
    setTesting(t => ({ ...t, [key]: true }));
    setTestResult(r => ({ ...r, [key]: null }));
    try {
      let res;
      if (key === "hr_request_webhook") {
        // Send a sample HR request payload directly to the URL
        const dateFormatted = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
        const emailBody = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Segoe UI',Helvetica,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.10);"><tr><td style="background:linear-gradient(135deg,#1e3a6e 0%,#1d4ed8 100%);padding:32px 36px 24px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td><p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,0.55);letter-spacing:2px;text-transform:uppercase;font-weight:700;">Gladex · HR Hub</p><h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;">HR Request Notification</h1></td><td align="right" valign="top"><span style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:12px;font-weight:700;padding:6px 16px;border-radius:20px;">Pending</span></td></tr></table></td></tr><tr><td style="background:#f97316;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr><tr><td style="padding:32px 36px 0;"><p style="margin:0;font-size:16px;color:#111827;font-weight:600;">Hello, Sample Employee,</p><p style="margin:10px 0 0;font-size:14px;color:#4b5563;line-height:1.7;">Your HR request has been <strong>successfully submitted</strong>. Our People &amp; Culture team will review it shortly.</p></td></tr><tr><td style="padding:24px 36px 0;"><p style="margin:0;font-size:11px;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;border-bottom:2px solid #f3f4f6;padding-bottom:8px;">Request Details</p></td></tr><tr><td style="padding:16px 36px 0;"><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;"><tr style="background:#f8fafc;"><td style="padding:10px 16px;font-size:12px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:1px;width:38%;">Field</td><td style="padding:10px 16px;font-size:12px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Value</td></tr><tr><td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-size:13px;color:#6b7280;font-weight:600;">Date Submitted</td><td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-size:13px;color:#111827;">${dateFormatted}</td></tr><tr style="background:#fafafa;"><td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-size:13px;color:#6b7280;font-weight:600;">Branch</td><td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-size:13px;color:#111827;">Gladex Main</td></tr><tr><td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-size:13px;color:#6b7280;font-weight:600;">Department</td><td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-size:13px;color:#111827;">Operations</td></tr><tr style="background:#fafafa;"><td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-size:13px;color:#6b7280;font-weight:600;">Subject / Request Type</td><td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-size:13px;color:#111827;font-weight:600;">COE (Certificate of Employment)</td></tr><tr><td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-size:13px;color:#6b7280;font-weight:600;">Email Address</td><td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-size:13px;color:#111827;">sample@gladex.com</td></tr><tr style="background:#fafafa;"><td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-size:13px;color:#6b7280;font-weight:600;">Status</td><td style="padding:10px 16px;border-top:1px solid #f0f0f0;"><span style="display:inline-block;background:#f59e0b22;color:#f59e0b;font-size:12px;font-weight:700;padding:3px 12px;border-radius:10px;">Pending</span></td></tr></table></td></tr><tr><td style="padding:24px 36px 0;"><p style="margin:0 0 8px;font-size:11px;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;border-bottom:2px solid #f3f4f6;padding-bottom:8px;">Attachments</p><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;"><tr><td colspan="2" style="padding:8px 16px;font-size:13px;color:#9ca3af;font-style:italic;">No attachments</td></tr></table></td></tr><tr><td style="padding:28px 36px 24px;text-align:center;"><p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">For questions or follow-ups, please contact the HR team directly.</p></td></tr><tr><td style="background:#1e3a6e;padding:20px 36px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td><p style="margin:0;font-size:13px;color:rgba(255,255,255,0.85);font-weight:700;">Gladex Tours · HR Hub</p><p style="margin:2px 0 0;font-size:11px;color:rgba(255,255,255,0.45);">People &amp; Culture Department · Flow Pulse System</p></td><td align="right"><p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);">Automated Notification<br>Do not reply directly</p></td></tr></table></td></tr></table></td></tr></table></body></html>`;
        const samplePayload = {
          event: "hr_request_created",
          date_submitted: new Date().toISOString(),
          date_submitted_formatted: dateFormatted,
          branch: "Gladex Main",
          subject: "COE (Certificate of Employment)",
          status: "Pending",
          requested_by: "Sample Employee",
          email_address: "sample@gladex.com",
          hr_attachments: [],
          email_body: emailBody,
        };
        const fetchRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(samplePayload),
        });
        setTestStatus(s => ({ ...s, [key]: fetchRes.status }));
        setTestResult(r => ({ ...r, [key]: fetchRes.status < 500 ? "ok" : "error" }));
      } else {
        res = await base44.functions.invoke("testWebhook", { url, key });
        const status = res.data?.status;
        setTestStatus(s => ({ ...s, [key]: status }));
        setTestResult(r => ({ ...r, [key]: (status && status < 500) ? "ok" : "error" }));
      }
    } catch {
      setTestResult(r => ({ ...r, [key]: "error" }));
    }
    setTesting(t => ({ ...t, [key]: false }));
    setTimeout(() => setTestResult(r => ({ ...r, [key]: null })), 3000);
  };

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
              onClick={() => handleTest(key)}
              disabled={testing[key] || !values[key]}
              variant="outline"
              className="shrink-0 flex items-center gap-1.5 min-w-[80px] justify-center"
              title="Send a test payload to this webhook"
            >
              {testing[key] && <Loader2 className="w-4 h-4 animate-spin" />}
              {!testing[key] && testResult[key] === "ok" && <CheckCircle className="w-4 h-4 text-green-500" />}
              {!testing[key] && testResult[key] === "error" && <Send className="w-4 h-4 text-red-500" />}
              {!testing[key] && !testResult[key] && <Send className="w-4 h-4" />}
              <span>
                {testing[key] ? "" : testResult[key] === "ok" ? `Sent! (${testStatus[key]})` : testResult[key] === "error" ? `Failed (${testStatus[key]})` : "Test"}
              </span>
            </Button>
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