"use client";

interface VideoPlayerProps {
  youtubeId: string;
  startSeconds: number;
}

export function VideoPlayer({ youtubeId, startSeconds }: VideoPlayerProps) {
  const src = `https://www.youtube.com/embed/${youtubeId}?start=${startSeconds}&rel=0&modestbranding=1&iv_load_policy=3`;

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden mb-3.5"
      style={{ aspectRatio: "16/9", background: "var(--surface)" }}
    >
      {/* Covers the video title bar to reduce meta-hints */}
      <div
        className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
        style={{ height: "24%", background: "var(--surface)" }}
      />
      <iframe
        key={src}
        src={src}
        className="w-full h-full border-0 block"
        allow="autoplay; encrypted-media"
        allowFullScreen
      />
    </div>
  );
}
