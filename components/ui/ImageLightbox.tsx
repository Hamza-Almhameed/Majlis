"use client";

import { useEffect, useState } from "react";

interface Props {
  images: string[];
  startIndex?: number;
  onClose: () => void;
}

export default function ImageLightbox({ images, startIndex = 0, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    setIndex(startIndex);
  }, [startIndex]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, images.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [images.length, onClose]);

  if (!images || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <button
        aria-label="إغلاق"
        onClick={onClose}
        className="absolute top-4 left-4 text-white text-xl p-2 rounded-full hover:bg-white/10"
      >
        ✕
      </button>

      <div className="relative max-w-[96vw] max-h-[96vh]" onClick={(e) => e.stopPropagation()}>
        <img
          src={images[index]}
          alt={`صورة ${index + 1}`}
          className="max-w-full max-h-[86vh] object-contain rounded-md"
        />

        {index > 0 && (
          <button
            onClick={() => setIndex((i) => Math.max(i - 1, 0))}
            aria-label="السابق"
            className="absolute left-2 top-1/2 -translate-y-1/2 text-white text-2xl p-2 rounded-full bg-black/40 hover:bg-black/60"
          >
            ‹
          </button>
        )}

        {index < images.length - 1 && (
          <button
            onClick={() => setIndex((i) => Math.min(i + 1, images.length - 1))}
            aria-label="التالي"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-2xl p-2 rounded-full bg-black/40 hover:bg-black/60"
          >
            ›
          </button>
        )}

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/80 text-sm">
          {index + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}
