import { useState, useRef } from "react";

const API_BASE = process.env.API_BASE;

export default function App() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { workerId, url }
  const [logs, setLogs] = useState(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg }
  const pollRef = useRef(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setLogs(null);

    try {
      const res = await fetch(`${API_BASE}/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Server error: ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      showToast("success", "Worker deployed successfully");
    } catch (err) {
      setError(err.message);
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    if (!result?.workerId) return;
    setLogsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/logs/${result.workerId}`);
      if (!res.ok) throw new Error(`Failed to fetch logs: ${res.status}`);
      const text = await res.text();
      setLogs(text);
    } catch (err) {
      setLogs(`Error fetching logs: ${err.message}`);
    } finally {
      setLogsLoading(false);
    }
  };

  const lines = code ? code.split("\n").length : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 relative overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=IBM+Plex+Mono:wght@300;400;500&display=swap');
        body { font-family: 'IBM Plex Mono', monospace; }
        .font-display { font-family: 'Syne', sans-serif; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .blink { animation: blink 2s ease-in-out infinite; }
        @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .slide-up { animation: slideUp 0.3s ease forwards; }
        @keyframes spin { to{transform:rotate(360deg)} }
        .spin { animation: spin 0.7s linear infinite; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
      `}</style>

      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-10 z-0"
        style={{
          backgroundImage:
            "linear-gradient(#52525b 1px, transparent 1px), linear-gradient(90deg, #52525b 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow blob */}
      <div className="fixed top-[-120px] right-[-80px] w-[420px] h-[420px] rounded-full bg-lime-400 opacity-5 blur-3xl pointer-events-none z-0" />

      <div className="relative z-10">
        {/* ── NAVBAR ── */}
        <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="blink w-2 h-2 rounded-full bg-lime-400 inline-block" />
              <span className="font-display text-xl font-extrabold tracking-tight text-zinc-100">
                CodeWorker
              </span>
            </div>
            <ul className="hidden md:flex items-center gap-8">
              {["Docs", "Examples", "Pricing"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-xs tracking-widest text-zinc-500 hover:text-zinc-100 transition-colors duration-200 uppercase">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
            <button className="group relative text-xs tracking-widest uppercase px-5 py-2 border border-zinc-700 text-zinc-100 overflow-hidden transition-colors duration-200 hover:border-lime-400">
              <span className="absolute inset-0 bg-lime-400 -translate-x-full group-hover:translate-x-0 transition-transform duration-250 ease-in-out z-0" />
              <span className="relative z-10 group-hover:text-zinc-950 transition-colors duration-200">Login</span>
            </button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-12">
          <p className="text-xs tracking-[3px] uppercase text-lime-400 mb-5 font-medium">
            // code execution engine
          </p>
          <h1 className="font-display text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-zinc-100 mb-6">
            Paste your code.
            <br />
            Deploy in{" "}
            <span className="text-lime-400 italic">seconds.</span>
          </h1>
          <p className="text-sm leading-loose text-zinc-500 max-w-xl mb-3">
            Drop any Deno/TypeScript snippet below. Our engine spins up an isolated Docker worker, runs your code, and gives you a live URL instantly.
          </p>
          <p className="text-sm leading-loose text-zinc-500 max-w-xl">
            No signup required. Workers auto-expire after 60 seconds.
          </p>
          <div className="w-10 h-px bg-zinc-800 mt-10" />
        </section>

        {/* ── CODE INPUT ── */}
        <section className="max-w-5xl mx-auto px-6 pb-10">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-xs tracking-[2px] uppercase text-zinc-600">paste your snippet</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <div className="border border-zinc-800 bg-zinc-900 focus-within:border-zinc-600 transition-colors duration-200">
            {/* Fake traffic lights header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span className="ml-auto text-xs text-zinc-700 tracking-wide">index.ts</span>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={`// paste your Deno/TypeScript code here...\nDeno.serve((req) => new Response("Hello from worker!"));`}
              spellCheck={false}
              className="w-full min-h-64 bg-transparent resize-y outline-none text-sm leading-relaxed text-zinc-300 placeholder-zinc-700 p-5 font-mono caret-lime-400"
            />

            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
              <span className="text-xs text-zinc-700 tracking-wide">
                {code.length} chars · {lines} lines
              </span>
              <button
                onClick={handleSubmit}
                disabled={!code.trim() || loading}
                className={`
                  flex items-center gap-2 text-xs tracking-widest uppercase px-6 py-2.5 font-medium transition-all duration-200
                  ${!code.trim() || loading
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-lime-400 text-zinc-950 hover:bg-lime-300 hover:-translate-y-px active:translate-y-0 cursor-pointer"}
                `}
              >
                {loading ? (
                  <>
                    <span className="spin w-3 h-3 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full inline-block" />
                    Deploying...
                  </>
                ) : (
                  "→ Deploy"
                )}
              </button>
            </div>
          </div>

          <p className="mt-3 text-xs text-zinc-700 tracking-wide">
            Supports Deno / TypeScript · Workers expire after 60s · Max 50,000 characters
          </p>
        </section>

        {/* ── ERROR ── */}
        {error && (
          <section className="max-w-5xl mx-auto px-6 pb-10 fade-in">
            <div className="border border-red-800 bg-red-950/30 p-5">
              <p className="text-xs tracking-[2px] uppercase text-red-400 mb-2">// deployment error</p>
              <p className="text-sm text-red-300 font-mono">{error}</p>
            </div>
          </section>
        )}

        {/* ── RESULT ── */}
        {result && (
          <section className="max-w-5xl mx-auto px-6 pb-28 fade-in">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-xs tracking-[2px] uppercase text-zinc-600">worker deployed</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            <div className="border border-zinc-800 bg-zinc-900">
              {/* Worker ID row */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                <div>
                  <p className="text-xs text-zinc-600 tracking-widest uppercase mb-1">Worker ID</p>
                  <p className="text-sm text-zinc-400 font-mono">{result.workerId}</p>
                </div>
                <span className="flex items-center gap-2 text-xs text-lime-400">
                  <span className="blink w-1.5 h-1.5 rounded-full bg-lime-400 inline-block" />
                  LIVE
                </span>
              </div>

              {/* Worker URL row */}
              <div className="px-5 py-4 border-b border-zinc-800">
                <p className="text-xs text-zinc-600 tracking-widest uppercase mb-2">Worker URL</p>
                <div className="flex items-center gap-3">
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-lime-400 hover:text-lime-300 underline underline-offset-4 font-mono break-all transition-colors"
                  >
                    {result.url}
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(result.url);
                      showToast("success", "URL copied to clipboard");
                    }}
                    className="shrink-0 text-xs tracking-widest uppercase px-3 py-1.5 border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-100 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Logs row */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-zinc-600 tracking-widest uppercase">Container Logs</p>
                  <button
                    onClick={fetchLogs}
                    disabled={logsLoading}
                    className="flex items-center gap-2 text-xs tracking-widest uppercase px-4 py-1.5 border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {logsLoading ? (
                      <>
                        <span className="spin w-3 h-3 border border-zinc-500 border-t-zinc-100 rounded-full inline-block" />
                        Fetching...
                      </>
                    ) : (
                      "↓ Fetch Logs"
                    )}
                  </button>
                </div>

                {logs !== null && (
                  <div className="bg-zinc-950 border border-zinc-800 p-4 max-h-64 overflow-y-auto">
                    <pre className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap break-all font-mono">
                      {logs || "(no logs yet)"}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            <p className="mt-3 text-xs text-zinc-700 tracking-wide">
              ⚠ This worker will auto-terminate in 60 seconds from deployment.
            </p>
          </section>
        )}
      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div className={`slide-up fixed bottom-8 right-8 z-50 flex items-center gap-3 text-xs tracking-wide px-5 py-3 font-medium shadow-xl
          ${toast.type === "success" ? "bg-lime-400 text-zinc-950" : "bg-red-500 text-white"}`}>
          {toast.type === "success" ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
