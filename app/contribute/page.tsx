"use client";

import { useState, useRef } from "react";
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

type Status = "idle" | "uploading" | "success" | "error";

export default function ContributePage() {
  const [file, setFile] = useState<File | null>(null);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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
    setFile(null);
    setCountry("");
    setCity("");
    setName("");
    setStatus("idle");
    setErrorMsg("");
    if (inputRef.current) inputRef.current.value = "";
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
      <Link
        href="/"
        className="text-sm mb-6 inline-block"
        style={{ color: "var(--text-muted)" }}
      >
        ← Back
      </Link>

      <h1 className="text-2xl font-medium tracking-tight mb-1" style={{ color: "var(--text)" }}>
        Contribute a clip
      </h1>
      <p className="text-sm mb-7" style={{ color: "var(--text-muted)" }}>
        Are you a native Arabic speaker? Upload a short recording of yourself (10–30 seconds) speaking naturally. Your clip may be used in the game.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* File upload */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
            Audio or video file
          </label>
          <input
            ref={inputRef}
            type="file"
            accept="audio/*,video/*"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm rounded-lg px-3 py-2.5 border-0 outline-none"
            style={{
              background: "var(--surface)",
              color: "var(--text)",
              border: "0.5px solid var(--border)",
            }}
          />
          {file && (
            <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
              {file.name} — {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
          )}
        </div>

        {/* Country */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
            Country
          </label>
          <select
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full text-sm rounded-lg px-3 py-2.5 border-0 outline-none appearance-none"
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
            className="w-full text-sm rounded-lg px-3 py-2.5 border-0 outline-none"
            style={{
              background: "var(--surface)",
              color: "var(--text)",
              border: "0.5px solid var(--border)",
            }}
          />
        </div>

        {/* Name (optional) */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
            Your name <span style={{ color: "var(--text-faint)" }}>(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Ahmed"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-sm rounded-lg px-3 py-2.5 border-0 outline-none"
            style={{
              background: "var(--surface)",
              color: "var(--text)",
              border: "0.5px solid var(--border)",
            }}
          />
        </div>

        {errorMsg && (
          <p className="text-sm" style={{ color: "var(--accent-2)" }}>
            {errorMsg}
          </p>
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
