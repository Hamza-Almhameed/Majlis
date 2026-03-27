"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faImage, faXmark } from "@fortawesome/free-solid-svg-icons";
import { faLightbulb } from "@fortawesome/free-regular-svg-icons";
import RightSidebar from "@/components/home/RightSidebar";
import LeftSidebar from "@/components/home/LeftSidebar";
import Avatar from "@/components/ui/Avatar";

export default function CreateMajlisPage() {
  const router = useRouter();
  const iconInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleNameChange(value: string) {
    setName(value);
  const cleanedForSlug = value.trim().replace(/مجلس\s*/g, "").replace(/\s+/g, "-");
  if (!slug) {
    setSlug(cleanedForSlug);
  }
  }

  function handleIconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    setError("");

    if (!name.trim() || !slug.trim() || !description.trim()) {
      setError("الاسم والرابط والوصف مطلوبون");
      return;
    }

    if (!iconFile) {
      setError("صورة المجلس مطلوبة");
      return;
    }

    const cleanName = name.trim().replace(/^مجلس\s*/g, "");

    setLoading(true);

    const formData = new FormData();
    formData.append("name", cleanName);
    formData.append("slug", slug);
    formData.append("description", description);
    formData.append("rules", rules);
    formData.append("icon", iconFile);
    if (coverFile) formData.append("cover", coverFile);

    const res = await fetch("/api/majalis/create", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    router.push(`/m/${data.slug}`);
  }

  return (
    <main className="bg-background min-h-screen p-6">
      <div className="flex gap-6 w-full mx-auto">
        <div className="w-72 shrink-0"><LeftSidebar /></div>

        <div className="flex-1 flex flex-col gap-4">


          <div className="flex items-center gap-3" dir="rtl">
            <button onClick={() => router.back()} className="text-white/50 hover:text-white transition-colors">
              <FontAwesomeIcon icon={faArrowRight} className="w-5 h-5" />
            </button>
            <h1 className="text-white font-tajawal font-bold text-xl">إنشاء مجلس جديد</h1>
          </div>

          <div className="bg-shade2 border border-border rounded-2xl p-6 flex flex-col gap-5" dir="rtl">

            {error && (
              <p className="text-red-400 text-sm font-tajawal bg-red-400/10 px-4 py-2 rounded-lg">{error}</p>
            )}


            <div className="flex flex-col gap-2">
              <label className="text-white/60 font-tajawal text-sm">صورة الغلاف <span className="text-white/30">(اختياري)</span></label>
              <div
                onClick={() => coverInputRef.current?.click()}
                className="relative w-full h-32 rounded-xl overflow-hidden bg-shade3 border border-border cursor-pointer hover:border-primary transition-colors flex items-center justify-center"
              >
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="غلاف" className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setCoverFile(null); setCoverPreview(null); }}
                      className="absolute top-2 left-2 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-white/30">
                    <FontAwesomeIcon icon={faImage} className="w-8 h-8" />
                    <span className="font-tajawal text-sm">اضغط لإضافة صورة غلاف</span>
                  </div>
                )}
              </div>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            </div>


            <div className="flex flex-col gap-2">
              <label className="text-white/60 font-tajawal text-sm">صورة المجلس <span className="text-red-400">*</span></label>
              <div className="flex items-center gap-4">
                <div
                  onClick={() => iconInputRef.current?.click()}
                  className="relative w-16 h-16 rounded-full overflow-hidden bg-shade3 border border-border cursor-pointer hover:border-primary transition-colors flex items-center justify-center"
                >
                  {iconPreview ? (
                    <img src={iconPreview} alt="أيقونة" className="w-full h-full object-cover" />
                  ) : (
                    <FontAwesomeIcon icon={faImage} className="w-6 h-6 text-white/30" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-white/60 font-tajawal text-sm">اضغط لاختيار صورة المجلس</p>
                  <p className="text-white/30 font-tajawal text-xs">PNG, JPG - مربعة الشكل</p>
                </div>
              </div>
              <input ref={iconInputRef} type="file" accept="image/*" className="hidden" onChange={handleIconChange} />
            </div>


            <div className="flex flex-col gap-2">
              <label className="text-white/60 font-tajawal text-sm">اسم المجلس <span className="text-red-400">*</span></label>
              <input
                type="text"
                placeholder="مثال: مجلس الكتب"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="bg-shade3 text-white placeholder-white/30 font-tajawal rounded-xl px-4 py-3 outline-none text-right border border-transparent focus:border-border transition-colors"
              />
            </div>


            <div className="flex flex-col gap-2">
              <label className="text-white/60 font-tajawal text-sm">رابط المجلس <span className="text-red-400">*</span></label>
              <div className="flex items-center gap-2 bg-shade3 rounded-xl px-4 py-3 border border-transparent focus-within:border-border transition-colors">
                <input
                  type="text"
                  placeholder="مثال: كتب"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="bg-transparent text-white placeholder-white/30 font-tajawal outline-none flex-1 text-right"
                />
                <span className="text-white/30 font-tajawal text-sm">/m/</span>
              </div>
              <p className="text-white/30 font-tajawal text-xs">الرابط لا يمكن تغييره لاحقاً</p>
            </div>


            <div className="flex flex-col gap-2">
              <label className="text-white/60 font-tajawal text-sm">وصف المجلس <span className="text-red-400">*</span></label>
              <textarea
                placeholder="صف موضوع المجلس وما يناقشه..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
                className="bg-shade3 text-white placeholder-white/30 font-tajawal rounded-xl px-4 py-3 outline-none resize-none text-right border border-transparent focus:border-border transition-colors"
              />
              <p className="text-white/30 font-tajawal text-xs text-left">{description.length}/500</p>
            </div>


            <div className="flex flex-col gap-2">
              <label className="text-white/60 font-tajawal text-sm">قواعد المجلس <span className="text-white/30">(اختياري)</span></label>
              <textarea
                placeholder="ضع قواعد المجلس هنا..."
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={3}
                maxLength={1000}
                className="bg-shade3 text-white placeholder-white/30 font-tajawal rounded-xl px-4 py-3 outline-none resize-none text-right border border-transparent focus:border-border transition-colors"
              />
            </div>


            <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3" dir="rtl">
              <p className="text-white/60 font-tajawal text-sm leading-relaxed">
                <FontAwesomeIcon icon={faLightbulb}/> المجلس سيكون <span className="text-primary font-bold">عاماً</span> بشكل افتراضي، يمكنك تحويله لخاص لاحقاً من إعدادات المجلس.
              </p>
            </div>


            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-primary text-background font-tajawal font-bold py-3 rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {loading ? "جاري الإنشاء..." : "إنشاء المجلس"}
            </button>
          </div>
        </div>

        <div className="w-72 shrink-0"><RightSidebar /></div>
      </div>
    </main>
  );
}