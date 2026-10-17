"use client";

import { useEffect, useState } from "react";

/** Animated crossfade between two school photos. */
export function HeroCollage({
  images,
  intervalMs = 4000,
}: {
  images: { src: string; alt: string }[];
  intervalMs?: number;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((i) => (i + 1) % images.length), intervalMs);
    return () => clearInterval(t);
  }, [images.length, intervalMs]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl">
      {images.map((img, i) => (
        <img
          key={img.src}
          src={img.src}
          alt={img.alt}
          aria-hidden={i !== active}
          className={`w-full object-cover transition-opacity duration-1000 max-md:max-h-[55svh] ${
            i === active ? "hero-img" : ""
          } ${
            i === 0 ? "" : "absolute inset-0 h-full"
          } ${i === active ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      <div className="absolute bottom-3 right-3 flex gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Show image ${i + 1}`}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? "w-6 bg-white" : "w-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
