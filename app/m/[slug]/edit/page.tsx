"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faImage, faXmark, faLock, faGlobe } from "@fortawesome/free-solid-svg-icons";
import RightSidebar from "@/components/home/RightSidebar";
import LeftSidebar from "@/components/home/LeftSidebar";

export default function EditMajlisPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const iconInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/majalis/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.current_user_role !== "owner") {
          router.push(`/m/${slug}`);
          return;
        }
        setName(data.name);
        setDescription(data.description);
        setRules(data.rules || "");
        setIsPrivate(data.is_private);
        setIconUrl(data.icon_url);
        setCoverUrl(data.cover_url);
        setLoading(false);
      });
  }, [slug]);

  async function handleSave() {
    setError("");
    setSuccess("");
    setSaving(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("rules", rules);
    formData.append("is_private", String(isPrivate));
    if (iconFile) formData.append("icon", iconFile);
    if (coverFile) formData.append("cover", coverFile);

    const res = await fetch(`/api/majalis/${slug}/edit`, {
      method: "PATCH",
      body: formData,
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setSuccess("تم حفظ التغييرات بنجاح");
    setTimeout(() => router.push(`/m/${slug}`), 1000);
  }

  if (loading) return (
    <main className="bg-background min-h-screen p-3 sm:p-6 pb-24 lg:pb-6">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full mx-auto">
        <div className="w-full lg:w-72 lg:shrink-0"><LeftSidebar /></div>
        <div className="flex-1 bg-shade2 rounded-2xl animate-pulse h-64" />
        <div className="w-full lg:w-72 lg:shrink-0"><RightSidebar /></div>
      </div>
    </main>
  );

  return (
    <main className="bg-background min-h-screen p-3 sm:p-6 pb-24 lg:pb-6">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full mx-auto">
        <div className="w-full lg:w-72 lg:shrink-0"><LeftSidebar /></div>

        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center gap-3" dir="rtl">
            <button onClick={() => router.back()} className="text-white/50 hover:text-white transition-colors">
              <FontAwesomeIcon icon={faArrowRight} className="w-5 h-5" />
            </button>
            <h1 className="text-white font-tajawal font-bold text-xl">تعديل مجلس {name}</h1>
          </div>

          <div className="bg-shade2 border border-border rounded-2xl p-6 flex flex-col gap-5" dir="rtl">
            {error && <p className="text-red-400 text-sm font-tajawal bg-red-400/10 px-4 py-2 rounded-lg">{error}</p>}
            {success && <p className="text-primary text-sm font-tajawal bg-primary/10 px-4 py-2 rounded-lg">{success}</p>}


            <div className="flex flex-col gap-2">
              <label className="text-white/60 font-tajawal text-sm">صورة الغلاف <span className="text-white/30">(اختياري)</span></label>
              <div
                onClick={() => coverInputRef.current?.click()}
                className="relative w-full h-32 rounded-xl overflow-hidden bg-shade3 border border-border cursor-pointer hover:border-primary transition-colors flex items-center justify-center"
              >
                {coverPreview || coverUrl ? (
                  <>
                    <img src={coverPreview || coverUrl!} alt="غلاف" className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setCoverFile(null); setCoverPreview(null); setCoverUrl(null); }}
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
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); } }} />
            </div>


            <div className="flex flex-col gap-2">
              <label className="text-white/60 font-tajawal text-sm">صورة المجلس</label>
              <div className="flex items-center gap-4">
                <div
                  onClick={() => iconInputRef.current?.click()}
                  className="relative w-16 h-16 rounded-full overflow-hidden bg-shade3 border border-border cursor-pointer hover:border-primary transition-colors flex items-center justify-center"
                >
                  {iconPreview || iconUrl ? (
                    <img src={iconPreview || iconUrl!} alt="أيقونة" className="w-full h-full object-cover" />
                  ) : (
                    <FontAwesomeIcon icon={faImage} className="w-6 h-6 text-white/30" />
                  )}
                </div>
                <p className="text-white/60 font-tajawal text-sm">اضغط لتغيير صورة المجلس</p>
              </div>
              <input ref={iconInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) { setIconFile(f); setIconPreview(URL.createObjectURL(f)); } }} />
            </div>


            <div className="flex flex-col gap-2">
              <label className="text-white/60 font-tajawal text-sm">اسم المجلس</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-shade3 text-white font-tajawal rounded-xl px-4 py-3 outline-none text-right border border-transparent focus:border-border transition-colors"
              />
            </div>


            <div className="flex flex-col gap-2">
              <label className="text-white/60 font-tajawal text-sm">وصف المجلس</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
                className="bg-shade3 text-white font-tajawal rounded-xl px-4 py-3 outline-none resize-none text-right border border-transparent focus:border-border transition-colors"
              />
            </div>


            <div className="flex flex-col gap-2">
              <label className="text-white/60 font-tajawal text-sm">قواعد المجلس</label>
              <textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={3}
                maxLength={1000}
                className="bg-shade3 text-white font-tajawal rounded-xl px-4 py-3 outline-none resize-none text-right border border-transparent focus:border-border transition-colors"
              />
            </div>


            <div className="flex flex-col gap-2">
              <label className="text-white/60 font-tajawal text-sm">خصوصية المجلس</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsPrivate(false)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors flex-1 justify-center font-tajawal text-sm ${
                    !isPrivate ? "bg-primary/10 border-primary text-primary" : "bg-shade3 border-border text-white/60"
                  }`}
                >
                  <FontAwesomeIcon icon={faGlobe} className="w-4 h-4" />
                  عام
                </button>
                <button
                  onClick={() => setIsPrivate(true)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors flex-1 justify-center font-tajawal text-sm ${
                    isPrivate ? "bg-primary/10 border-primary text-primary" : "bg-shade3 border-border text-white/60"
                  }`}
                >
                  <FontAwesomeIcon icon={faLock} className="w-4 h-4" />
                  خاص
                </button>
              </div>
              {isPrivate && (
                <p className="text-white/40 font-tajawal text-xs">المجلس الخاص يتطلب موافقة على طلبات الانضمام</p>
              )}
            </div>


            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary text-background font-tajawal font-bold py-3 rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
          </div>
        </div>

        <div className="w-full lg:w-72 lg:shrink-0"><RightSidebar /></div>
      </div>
    </main>
  );
}