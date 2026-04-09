import { useState, useEffect } from "react";

const MESSAGES = [
  "You shape people's careers — your care builds better workplaces.",
  "Every hire you make is an investment in the company's future.",
  "Your work behind the scenes moves the entire organization forward.",
  "Great HR isn't just policy — it's people, handled with heart.",
  "You turn potential into performance. That's your superpower.",
  "The best teams are built by the best HR professionals — like you.",
  "Your dedication ensures every employee feels seen and valued.",
  "Culture starts with you. Keep nurturing it every single day.",
  "You don't just manage people — you inspire and protect them.",
  "Behind every great employee experience is a great HR team.",
  "Your empathy and professionalism make this a place worth working.",
  "You are the backbone of this organization's people strategy.",
  "Every problem you solve today creates a better tomorrow.",
  "You help people grow — that is one of the most powerful things.",
  "Strong HR = strong teams. You are the reason this works.",
  "Your attention to fairness and process keeps trust alive here.",
  "The work you do changes lives — never underestimate that.",
  "You advocate for people. That matters more than you know.",
  "Great workplaces don't happen by accident — they're built by you.",
  "Today is another chance to make a real difference for your team.",
];

export default function WelcomeScreen({ user, onDismiss }) {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState("logo"); // logo → greeting → message → ready
  const [glowOn, setGlowOn] = useState(false);
  const [message] = useState(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("greeting"), 1000);
    const t2 = setTimeout(() => setPhase("message"), 2200);
    const t3 = setTimeout(() => setPhase("ready"), 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Glow pulse on message phase
  useEffect(() => {
    if (phase !== "message" && phase !== "ready") return;
    const interval = setInterval(() => setGlowOn(g => !g), 700);
    return () => clearInterval(interval);
  }, [phase]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 400);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #0f2657 0%, #1e3a8a 50%, #0f2657 100%)",
        animation: visible ? "none" : "fadeOut 0.4s ease-out forwards",
      }}
    >
      <div className="text-center px-8 max-w-xl w-full flex flex-col items-center gap-6">

        {/* Logo */}
        <div
          className="transition-all duration-700"
          style={{
            opacity: phase === "logo" ? 0 : 1,
            transform: phase === "logo" ? "scale(0.7)" : "scale(1)",
          }}
        >
          <img
            src="https://media.base44.com/images/public/69d6172befce3a4a3f9ed78a/177b2a6a8_GladexLogonobackground.png"
            alt="Gladex Logo"
            className="w-36 h-36 object-contain drop-shadow-2xl mx-auto"
          />
        </div>

        {/* Welcome heading */}
        <div
          className="transition-all duration-700"
          style={{
            opacity: ["greeting", "message", "ready"].includes(phase) ? 1 : 0,
            transform: ["greeting", "message", "ready"].includes(phase) ? "translateY(0)" : "translateY(20px)",
          }}
        >
          <p className="text-orange-400 font-semibold text-sm uppercase tracking-widest mb-1">Welcome back</p>
          <h1 className="text-white font-extrabold text-3xl md:text-4xl drop-shadow-lg">
            {user?.full_name || user?.email?.split("@")[0] || "HR Professional"}
          </h1>
          <p className="text-blue-300 text-sm mt-1">Gladex HR Hub — Task Tracker</p>
        </div>

        {/* Motivational message */}
        <div
          className="transition-all duration-700 rounded-2xl px-6 py-5 max-w-md border"
          style={{
            opacity: ["message", "ready"].includes(phase) ? 1 : 0,
            transform: ["message", "ready"].includes(phase) ? "translateY(0)" : "translateY(20px)",
            background: glowOn
              ? "rgba(249,115,22,0.18)"
              : "rgba(255,255,255,0.07)",
            borderColor: glowOn
              ? "rgba(249,115,22,0.7)"
              : "rgba(255,255,255,0.15)",
            boxShadow: glowOn
              ? "0 0 30px rgba(249,115,22,0.4)"
              : "0 0 10px rgba(0,0,0,0.2)",
            transition: "background 0.6s, border-color 0.6s, box-shadow 0.6s, opacity 0.7s, transform 0.7s",
          }}
        >
          <p className="text-xs text-orange-300 uppercase tracking-widest mb-2 font-semibold">✦ HR Message of the Day</p>
          <p className="text-white text-base font-medium leading-relaxed italic">"{message}"</p>
        </div>

        {/* Continue button */}
        <div
          className="transition-all duration-700"
          style={{
            opacity: phase === "ready" ? 1 : 0,
            transform: phase === "ready" ? "translateY(0)" : "translateY(10px)",
          }}
        >
          <button
            onClick={handleDismiss}
            className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold px-10 py-3 rounded-xl transition-all shadow-lg shadow-orange-900/40 text-sm tracking-wide"
          >
            Start My Day →
          </button>
        </div>
      </div>
    </div>
  );
}