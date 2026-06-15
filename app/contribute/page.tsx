"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const ARAB_COUNTRIES = [
  { code: "DZ", name: "Algeria" },
  { code: "BH", name: "Bahrain" },
  { code: "KM", name: "Comoros" },
  { code: "DJ", name: "Djibouti" },
  { code: "EG", name: "Egypt" },
  { code: "IQ", name: "Iraq" },
  { code: "JO", name: "Jordan" },
  { code: "KW", name: "Kuwait" },
  { code: "LB", name: "Lebanon" },
  { code: "LY", name: "Libya" },
  { code: "MR", name: "Mauritania" },
  { code: "MA", name: "Morocco" },
  { code: "OM", name: "Oman" },
  { code: "PS", name: "Palestine" },
  { code: "QA", name: "Qatar" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SO", name: "Somalia" },
  { code: "SD", name: "Sudan" },
  { code: "SY", name: "Syria" },
  { code: "TN", name: "Tunisia" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "YE", name: "Yemen" },
];

type Source = "record" | "upload";
type Status = "idle" | "uploading" | "success" | "error";

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function ContributePage() {
  const [source, setSource] = useState<Source>("record");
  const [file, setFile] = useState<File | null>(null);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Recorder state
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  async function startRecording() {
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const mime = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mime });
        const ext = mime.split("/")[1].split(";")[0];
        setFile(new File([blob], `recording.${ext}`, { type: mime }));
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setErrorMsg("Microphone access denied — please allow mic access and try again.");
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stop();
    setIsRecording(false);
  }

  function clearRecording() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setFile(null);
    setSeconds(0);
  }

  function switchSource(s: Source) {
    clearRecording();
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSource(s);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !country || !city.trim()) return;

    setStatus("uploading");
    setErrorMsg("");

    const form = new FormData();
    form.append("file", file);
    form.append("country", country);
    form.append("city", city.trim());
    if (name.trim()) form.append("name", name.trim());

    try {
      const res = await fetch("/api/submit-clip", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error ?? "Something went wrong");
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch {
      setErrorMsg("Network error, please try again");
      setStatus("error");
    }
  }

  function handleReset() {
    clearRecording();
    setFile(null);
    setCountry("");
    setCity("");
    setName("");
    setStatus("idle");
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (status === "success") {
    return (
      <main className="max-w-lg mx-auto px-5 py-16 text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: "var(--accent)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold mb-2" style={{ color: "var(--text)" }}>
          Clip submitted
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Thank you for contributing. We'll review your clip and add it to the game.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleReset}
            className="px-4 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            Submit another
          </button>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: "var(--surface-2)", color: "var(--text)" }}
          >
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-5 py-10">
      <Link href="/" className="text-sm mb-6 inline-block" style={{ color: "var(--text-muted)" }}>
        ← Back
      </Link>

      <h1 className="text-2xl font-medium tracking-tight mb-1" style={{ color: "var(--text)" }}>
        Contribute a clip
      </h1>
      <p className="text-sm mb-7" style={{ color: "var(--text-muted)" }}>
        Are you a native Arabic speaker? Record or upload a short clip of yourself speaking naturally (10–30 seconds). Your clip may be used in the game.
      </p>

      {/* Recording guidelines */}
      <div
        className="rounded-xl p-4 mb-2 text-sm"
        style={{ background: "var(--surface)", border: "0.5px solid var(--border)" }}
      >
        <p className="font-medium mb-2" style={{ color: "var(--text)" }}>
          Recording guidelines
        </p>
        <ul className="flex flex-col gap-1.5" style={{ color: "var(--text-muted)" }}>
          <li className="flex gap-2">
            <span style={{ color: "var(--accent-2)" }}>✕</span>
            Don't mention your country, city, or region by name
          </li>
          <li className="flex gap-2">
            <span style={{ color: "var(--accent-2)" }}>✕</span>
            Avoid referencing local landmarks or places that would give away your location
          </li>
          <li className="flex gap-2">
            <span style={{ color: "var(--accent)" }}>✓</span>
            Talk naturally about everyday topics — food, family, weather, daily life
          </li>
          <li className="flex gap-2">
            <span style={{ color: "var(--accent)" }}>✓</span>
            Cultural references, traditions, and expressions are welcome
          </li>
          <li className="flex gap-2">
            <span style={{ color: "var(--accent)" }}>✓</span>
            Aim for 10–30 seconds of natural, conversational speech
          </li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Source toggle */}
        <div
          className="flex rounded-lg p-1 gap-1"
          style={{ background: "var(--surface)" }}
        >
          {(["record", "upload"] as Source[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => switchSource(s)}
              className="flex-1 py-1.5 rounded-md text-sm font-medium transition-all"
              style={{
                background: source === s ? "var(--surface-2)" : "transparent",
                color: source === s ? "var(--text)" : "var(--text-faint)",
              }}
            >
              {s === "record" ? "Record audio" : "Upload file"}
            </button>
          ))}
        </div>

        {/* Record panel */}
        {source === "record" && (
          <div
            className="rounded-xl p-5 flex flex-col items-center gap-4"
            style={{ background: "var(--surface)" }}
          >
            {!audioUrl ? (
              <>
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-105"
                  style={{
                    background: isRecording ? "var(--accent-2)" : "var(--accent)",
                    boxShadow: isRecording ? "0 0 0 6px color-mix(in srgb, var(--accent-2) 20%, transparent)" : "none",
                  }}
                >
                  {isRecording ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                      <rect x="6" y="6" width="12" height="12" rx="1" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                      <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z" />
                      <path d="M19 10a7 7 0 0 1-14 0" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      <line x1="12" y1="17" x2="12" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </button>

                <div className="text-center">
                  {isRecording ? (
                    <p className="text-sm font-medium tabular-nums" style={{ color: "var(--accent-2)" }}>
                      Recording {formatTime(seconds)}
                    </p>
                  ) : (
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      Tap to start recording
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <audio controls src={audioUrl} className="w-full" style={{ accentColor: "var(--accent)" }} />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {formatTime(seconds)} recorded
                </p>
                <button
                  type="button"
                  onClick={clearRecording}
                  className="text-xs px-3 py-1.5 rounded-md"
                  style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
                >
                  Re-record
                </button>
              </>
            )}
          </div>
        )}

        {/* Upload panel */}
        {source === "upload" && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm rounded-lg px-3 py-2.5"
              style={{
                background: "var(--surface)",
                color: "var(--text)",
                border: "0.5px solid var(--border)",
              }}
            />
            <p className="text-xs mt-1.5" style={{ color: "var(--text-faint)" }}>
              MP3, MP4, WAV, OGG, WebM, MOV — max 50 MB
            </p>
            {file && (
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                {file.name} — {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            )}
          </div>
        )}

        {/* Country */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
            Country
          </label>
          <select
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full text-sm rounded-lg px-3 py-2.5 appearance-none"
            style={{
              background: "var(--surface)",
              color: country ? "var(--text)" : "var(--text-faint)",
              border: "0.5px solid var(--border)",
            }}
          >
            <option value="" disabled>Select your country</option>
            {ARAB_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
            City
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Cairo"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full text-sm rounded-lg px-3 py-2.5"
            style={{
              background: "var(--surface)",
              color: "var(--text)",
              border: "0.5px solid var(--border)",
            }}
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
            Your name <span style={{ color: "var(--text-faint)" }}>(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Ahmed"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-sm rounded-lg px-3 py-2.5"
            style={{
              background: "var(--surface)",
              color: "var(--text)",
              border: "0.5px solid var(--border)",
            }}
          />
        </div>

        {errorMsg && (
          <p className="text-sm" style={{ color: "var(--accent-2)" }}>{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={!file || !country || !city.trim() || status === "uploading"}
          className="px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          {status === "uploading" ? "Uploading…" : "Submit clip"}
        </button>
      </form>
    </main>
  );
}
