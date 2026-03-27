import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

export default function Modal({ title, children, onClose }: {
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
      <div
        className="relative bg-shade2 border border-border rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl transform transition-all duration-180 scale-100"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-tajawal font-bold">{title}</h3>
            <button onClick={onClose} aria-label="Close" className="text-white/40 hover:text-white px-2 py-1 rounded-md">
              <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="border-t border-border/50 -mx-6 px-6 pt-4 max-h-[70vh] overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
