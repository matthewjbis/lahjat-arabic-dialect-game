import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-5 text-center">
      <h1
        className="text-4xl font-medium tracking-tight mb-3"
        style={{ color: "var(--text)" }}
      >
        Lahjat
      </h1>
      <p
        className="text-base max-w-md mb-8"
        style={{ color: "var(--text-muted)" }}
      >
        Listen to a short clip of Arabic speech and drop a pin where you think
        the speaker is from. Scoring rewards dialect knowledge, not just
        geography.
      </p>
      <Link
        href="/play"
        className="inline-block px-6 py-3 rounded-lg text-white font-medium text-sm transition-opacity hover:opacity-90"
        style={{ background: "var(--accent)" }}
      >
        Play Classic Mode
      </Link>
    </main>
  );
}
