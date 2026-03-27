"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImage,
  faXmark,
  faClock,
  faGlobe,
  faUsers,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import Avatar from "@/components/ui/Avatar";
import Portal from "@/components/ui/Portal";

interface Majlis {
  id: string;
  name: string;
  slug: string;
}

export default function CreatePostPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<{ username: string; avatar_url?: string } | null>(null);
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isTemporary, setIsTemporary] = useState(false);
  const [selectedMajlis, setSelectedMajlis] = useState<string>("");
  const [majalisList, setMajalisList] = useState<Majlis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // custom dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const ddRef = useRef<HTMLDivElement | null>(null);
  const ddButtonRef = useRef<HTMLButtonElement | null>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data));

    fetch("/api/majalis?my=true")
      .then((res) => res.json())
      .then((data) => setMajalisList(data));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!dropdownOpen) return;
      if (e.key === "Escape") setDropdownOpen(false);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, majalisList.length));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, -1));
      }
      if (e.key === "Enter" && focusedIndex >= -0) {
        e.preventDefault();
        // focusedIndex -1 means "no majlis" option
        if (focusedIndex === -1) setSelectedMajlis("");
        else setSelectedMajlis(majalisList[focusedIndex]?.id ?? "");
        setDropdownOpen(false);
      }
    }

    if (!dropdownOpen) return;
    function compute() {
      const btn = ddButtonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      setMenuStyle({
        position: "absolute",
        left: `${rect.left + window.scrollX}px`,
        top: `${rect.bottom + window.scrollY}px`,
        width: `${rect.width}px`,
        zIndex: 9999,
      });
    }
    compute();
    const onScroll = () => compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", onScroll, true);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [dropdownOpen, focusedIndex, majalisList]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 4) {
      setError("الحد الأقصى 4 صور");
      return;
    }
    setImages((prev) => [...prev, ...files]);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setError("");
    if (!content.trim() && images.length === 0) {
      setError("اكتب شيئاً أو أضف صورة");
      return;
    }
  
    setLoading(true);
  
    const formData = new FormData();
    formData.append("content", content);
    formData.append("majlis_id", selectedMajlis || "");
    formData.append("is_temporary", String(isTemporary));
    const visibility = selectedMajlis ? "majlis_only" : "public";
    formData.append("visibility", visibility);
    images.forEach((img) => formData.append("images", img));
  
    const res = await fetch("/api/posts/create", {
      method: "POST",
      body: formData,
    });
  
    const data = await res.json();
    setLoading(false);
  
    if (!res.ok) {
      setError(data.error);
      return;
    }
  
    router.push("/");
  }

  return (
    <main className="bg-background min-h-screen flex justify-center p-6" dir="rtl">
      <div className="w-full max-w-2xl mx-auto">
        <div className="rounded-2xl overflow-hidden shadow-md border border-border bg-shade2">

          {/* header band */}
          <div className="flex items-center justify-between px-5 py-3 bg-linear-to-r from-shade3/40 to-shade2/30 border-b border-border">
            <button onClick={() => router.back()} className="text-white/60 hover:text-white p-2 rounded-md transition">
              <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
            </button>
            <h1 className="text-white font-tajawal font-bold text-lg">منشور جديد</h1>
            <button
              onClick={handleSubmit}
              disabled={loading || (!content.trim() && images.length === 0)}
              className="inline-flex items-center gap-2 bg-primary text-background font-tajawal font-bold px-4 py-2 rounded-lg disabled:opacity-40 hover:opacity-95 transition"
            >
              {loading ? "جاري النشر..." : "نشر"}
            </button>
          </div>

          <div className="p-6 flex flex-col gap-4">
            {error && (
              <p className="text-red-400 text-sm text-center font-tajawal bg-red-400/10 py-2 px-4 rounded-lg">
                {error}
              </p>
            )}

            {/* composer */}
            <div className="flex gap-4">
              <Avatar username={user?.username || ""} avatarUrl={user?.avatar_url} size={56} />
              <div className="flex-1">
                <textarea
                  placeholder="ما الذي تريد مشاركته؟"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  maxLength={2000}
                  className="w-full bg-shade1/30 backdrop-blur-sm text-white placeholder-white/40 font-tajawal outline-none resize-none rounded-xl p-4 leading-relaxed text-right focus:ring-2 focus:ring-primary/30 transition"
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-white/40 text-xs font-tajawal">{content.length}/2000</p>
                  <p className="text-white/50 text-xs font-tajawal">نصيحة: استخدم @ للاشارة إلى مستخدمين</p>
                </div>
              </div>
            </div>


            {previews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden border border-border bg-black/5">
                    <img src={src} alt="" className="w-full h-36 sm:h-44 object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-black/70 transition"
                      aria-label="حذف الصورة"
                    >
                      <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* options panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* majlis select (primary control for where to post) */}
              <div className="flex items-center justify-between gap-3" ref={ddRef}>
                <span className="text-white/60 font-tajawal text-sm">النشر في</span>
                <div className="relative w-3/4 text-right" dir="rtl">
                  <button
                    ref={ddButtonRef}
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={dropdownOpen}
                    onClick={() => {
                      setDropdownOpen((s) => !s);
                      setFocusedIndex(-1);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-shade3 rounded-lg text-white/90 font-tajawal focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <span className="truncate">
                      {selectedMajlis ? `مجلس ${majalisList.find(m => m.id === selectedMajlis)?.name ?? ""}` : "بدون مجلس"}
                    </span>
                    <FontAwesomeIcon icon={faChevronDown} className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {dropdownOpen && menuStyle && (
                    <Portal>
                      <ul
                        role="listbox"
                        aria-activedescendant={focusedIndex === -1 ? "opt-none" : `opt-${focusedIndex}`}
                        style={menuStyle}
                        className="max-h-56 overflow-auto bg-shade2 border border-border rounded-lg py-1"
                      >
                        <li
                          id="opt-none"
                          role="option"
                          aria-selected={selectedMajlis === ""}
                          onMouseEnter={() => setFocusedIndex(-1)}
                          onClick={() => { setSelectedMajlis(""); setDropdownOpen(false); }}
                          className={`px-3 py-2 cursor-pointer text-right font-tajawal ${focusedIndex === -1 ? "bg-shade3 text-white" : "text-white/80 hover:bg-shade3"}`}
                        >
                          بدون مجلس
                        </li>
                        {majalisList.map((m, idx) => (
                          <li
                            key={m.id}
                            id={`opt-${idx}`}
                            role="option"
                            aria-selected={selectedMajlis === m.id}
                            onMouseEnter={() => setFocusedIndex(idx)}
                            onClick={() => { setSelectedMajlis(m.id); setDropdownOpen(false); }}
                            className={`px-3 py-2 cursor-pointer text-right font-tajawal ${focusedIndex === idx ? "bg-shade3 text-white" : "text-white/80 hover:bg-shade3"}`}
                          >
                            مجلس {m.name}
                          </li>
                        ))}
                      </ul>
                    </Portal>
                  )}
                </div>
              </div>

              {/* duration buttons */}
              <div className="flex items-center justify-between gap-3">
              <span className="text-white/60 font-tajawal text-sm">مدة المنشور</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsTemporary(false)}
                    className={`px-3 py-2 rounded-full text-sm font-tajawal transition ${!isTemporary ? "bg-primary text-background" : "bg-shade3 text-white/60"}`}
                  >
                    دائم
                  </button>
                  <button
                    onClick={() => setIsTemporary(true)}
                    className={`px-3 py-2 rounded-full text-sm font-tajawal transition ${isTemporary ? "bg-primary text-background" : "bg-shade3 text-white/60"}`}
                  >
                    مؤقت - 3 أيام
                  </button>
                </div>
                
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={images.length >= 4}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-shade3 text-white/60 hover:text-primary transition text-sm font-tajawal disabled:opacity-40"
                  >
                    <FontAwesomeIcon icon={faImage} className="w-4 h-4" />
                    إضافة صورة
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </div>
                <span className="text-white/60 font-tajawal text-sm">الوسائط (الحد الأقصى 4)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}