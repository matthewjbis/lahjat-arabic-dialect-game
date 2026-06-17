"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useT, useLang } from "@/contexts/LanguageContext";

const COUNTRY_CODES = [
  "DZ","BH","KM","DJ","EG","IQ","JO","KW","LB","LY",
  "MR","MA","OM","PS","QA","SA","SO","SD","SY","TN","AE","YE",
];

type Source = "record" | "upload";
type Status = "idle" | "uploading" | "success" | "error";

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function ContributePage() {
  const t = useT();
  const { lang } = useLang();

  const countries = useMemo(() => {
    const names = new Intl.DisplayNames([lang], { type: "region" });
    return COUNTRY_CODES
      .map((code) => ({ code, name: names.of(code) ?? code }))
      .sort((a, b) => a.name.localeCompare(b.name, lang));
  }, [lang]);

  const [source, setSource] = useState<Source>("record");
  const [file, setFile] = useState<File | null>(null);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mp3InputRef = useRef<HTMLInputElement>(null);

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
      setErrorMsg(t.micDenied);
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
    if (mp3InputRef.current) mp3InputRef.current.value = "";
  }

  function handleMp3Upload(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setFile(picked);
    setAudioUrl(URL.createObjectURL(picked));
    setSeconds(0);
  }

  function switchSource(s: Source) {
    clearRecording();
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (mp3InputRef.current) mp3InputRef.current.value = "";
    setSource(s);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !country) return;

    setStatus("uploading");
    setErrorMsg("");

    const form = new FormData();
    form.append("file", file);
    form.append("country", country);
    form.append("city", city.trim());
    form.append("source_type", source);
    if (name.trim()) form.append("name", name.trim());

    try {
      const res = await fetch("/api/submit-clip", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error ?? t.somethingWrong);
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch {
      setErrorMsg(t.networkError);
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
    if (mp3InputRef.current) mp3InputRef.current.value = "";
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
        {/* Success title and body sit on the dark page background */}
        <h1 className="text-xl font-semibold mb-2" style={{ color: "var(--heading)" }}>
          {t.successTitle}
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--on-bg-muted)" }}>
          {t.successBody}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleReset}
            className="px-4 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: "var(--accent)", color: "var(--gold-ink)" }}
          >
            {t.submitAnother}
          </button>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: "var(--surface-2)", color: "var(--text)" }}
          >
            {t.backToHome}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-5 py-10">
      {/* text-left is a physical property — keeps the back link on the left even in RTL */}
      <div className="text-left mb-6">
        <Link href="/" className="text-sm" style={{ color: "var(--on-bg-muted)" }}>
          {t.backLink}
        </Link>
      </div>

      {/* Page-level heading and subtitle on dark background */}
      <h1 className="text-2xl font-medium tracking-tight mb-1" style={{ color: "var(--heading)" }}>
        {t.contributeTitle}
      </h1>
      <p className="text-sm mb-7" style={{ color: "var(--on-bg-muted)" }}>
        {t.contributeSubtitle}
      </p>

      {/* Recording guidelines — sits on parchment surface card */}
      <div
        className="rounded-xl p-3 mb-2 text-xs"
        style={{ background: "var(--surface)", border: "0.5px solid var(--border)" }}
      >
        <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text)" }}>
          {t.guidelinesTitle}
        </p>
        <ul className="flex flex-col gap-1" style={{ color: "var(--text-muted)" }}>
          <li className="flex gap-2">
            <span style={{ color: "var(--accent-2)" }}>✕</span>
            {t.guidelineNo1}
          </li>
          <li className="flex gap-2">
            <span style={{ color: "var(--accent-2)" }}>✕</span>
            {t.guidelineNo2}
          </li>
          <li className="flex gap-2">
            <span style={{ color: "var(--accent)" }}>✓</span>
            {t.guidelineYes1}
          </li>
          <li className="flex gap-2">
            <span style={{ color: "var(--accent)" }}>✓</span>
            {t.guidelineYes2}
          </li>
          <li className="flex gap-2">
            <span style={{ color: "var(--accent)" }}>✓</span>
            {t.guidelineYes3}
          </li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Source toggle */}
        <div className="flex rounded-lg p-1 gap-1" style={{ background: "var(--surface)" }}>
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
              {s === "record" ? t.tabRecord : t.tabUpload}
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
                      {t.recordingLabel(formatTime(seconds))}
                    </p>
                  ) : (
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      {t.tapToRecord}
                    </p>
                  )}
                </div>

                {!isRecording && (
                  <>
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                      <span className="text-xs" style={{ color: "var(--text-faint)" }}>{t.orDivider}</span>
                      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                    </div>
                    <div className="w-full">
                      <p className="text-xs mb-2 text-center" style={{ color: "var(--text-muted)" }}>
                        {t.uploadAudioHint}
                      </p>
                      <input
                        ref={mp3InputRef}
                        type="file"
                        accept="audio/*,.mp3,.m4a,.wav,.aac"
                        onChange={handleMp3Upload}
                        className="w-full text-sm rounded-lg px-3 py-2.5"
                        style={{
                          background: "var(--surface-2)",
                          color: "var(--text)",
                          border: "0.5px solid var(--border)",
                        }}
                      />
                      <p className="text-xs mt-1.5" style={{ color: "var(--text-faint)" }}>
                        {t.uploadAudioFormats}
                      </p>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <audio controls src={audioUrl} className="w-full" style={{ accentColor: "var(--accent)" }} />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {seconds > 0 ? t.recordedLabel(formatTime(seconds)) : file?.name}
                </p>
                <button
                  type="button"
                  onClick={clearRecording}
                  className="text-xs px-3 py-1.5 rounded-md"
                  style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
                >
                  {t.reRecord}
                </button>
              </>
            )}
          </div>
        )}

        {/* Upload panel */}
        {source === "upload" && (
          <div>
            <p className="text-xs mb-2" style={{ color: "var(--on-bg-muted)" }}>
              {t.uploadVideoHint}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm rounded-lg px-3 py-2.5"
              style={{
                background: "var(--surface)",
                color: "var(--text)",
                border: "0.5px solid var(--border)",
              }}
            />
            <p className="text-xs mt-1.5" style={{ color: "var(--on-bg-muted)" }}>
              {t.uploadFormats}
            </p>
            {file && (
              <p className="text-xs mt-1" style={{ color: "var(--on-bg-muted)" }}>
                {file.name} — {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            )}
          </div>
        )}

        {/* Country */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--on-bg-muted)" }}>
            {t.countryLabel}
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
            <option value="" disabled>{t.countryPlaceholder}</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--on-bg-muted)" }}>
            {t.cityLabel}
          </label>
          <input
            type="text"
            placeholder={t.cityPlaceholder}
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
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--on-bg-muted)" }}>
            {t.nameLabel} <span style={{ color: "var(--on-bg-faint)" }}>{t.nameOptional}</span>
          </label>
          <input
            type="text"
            placeholder={t.namePlaceholder}
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
          disabled={!file || !country || status === "uploading"}
          className="px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "var(--accent)", color: "var(--gold-ink)" }}
        >
          {status === "uploading" ? t.uploading : t.submitClip}
        </button>
      </form>
    </main>
  );
}
