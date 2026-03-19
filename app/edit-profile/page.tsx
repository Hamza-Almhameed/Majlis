"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faCamera } from "@fortawesome/free-solid-svg-icons";
import Avatar from "@/components/ui/Avatar";
import RightSidebar from "@/components/home/RightSidebar";

export default function EditProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users/profile")
      .then((r) => r.json())
      .then((data) => {
        setUsername(data.username);
        setBio(data.bio || "");
        setEmail(data.email || "");
        setAvatarUrl(data.avatar_url);
        setLoading(false);
      });
  }, []);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    setError("");
    setSuccess("");
    setSaving(true);

    const formData = new FormData();
    formData.append("bio", bio);
    if (email) formData.append("email", email);
    if (avatarFile) formData.append("avatar", avatarFile);

    const res = await fetch("/api/users/profile", {
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
    setTimeout(() => router.push(`/u/${username}`), 1000);
  }

  if (loading) return (
    <main className="bg-background min-h-screen p-6">
      <div className="flex gap-6 w-full max-w-6xl mr-auto">
        <div className="flex-1 bg-shade2 rounded-2xl animate-pulse h-64" />
        <RightSidebar />
      </div>
    </main>
  );

  return (
    <main className="bg-background min-h-screen p-6">
      <div className="flex gap-6 w-full max-w-6xl mr-auto">
        <div className="flex-1 flex flex-col gap-4">

          {/* هيدر */}
          <div className="flex items-center gap-3" dir="rtl">
            <button onClick={() => router.back()} className="text-white/50 hover:text-white transition-colors">
              <FontAwesomeIcon icon={faArrowRight} className="w-5 h-5" />
            </button>
            <h1 className="text-white font-tajawal font-bold text-xl">تعديل الملف الشخصي</h1>
          </div>

          <div className="bg-shade2 border border-border rounded-2xl p-6 flex flex-col gap-5" dir="rtl">

            {/* رسائل */}
            {error && (
              <p className="text-red-400 text-sm font-tajawal bg-red-400/10 px-4 py-2 rounded-lg">{error}</p>
            )}
            {success && (
              <p className="text-primary text-sm font-tajawal bg-primary/10 px-4 py-2 rounded-lg">{success}</p>
            )}

            {/* صورة البروفايل */}
            <div className="flex flex-col gap-2">
              <label className="text-white/60 font-tajawal text-sm">صورة البروفايل</label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar
                    username={username}
                    avatarUrl={avatarPreview || avatarUrl}
                    size={80}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 left-0 bg-primary text-background rounded-full w-7 h-7 flex items-center justify-center hover:opacity-90 transition-opacity"
                  >
                    <FontAwesomeIcon icon={faCamera} className="w-3 h-3" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-white/60 font-tajawal text-sm">اضغط على الأيقونة لتغيير الصورة</p>
                  <p className="text-white/30 font-tajawal text-xs">PNG, JPG حتى 5MB</p>
                </div>
              </div>
            </div>

            {/* اسم المستخدم - للعرض فقط */}
            <div className="flex flex-col gap-2">
              <label className="text-white/60 font-tajawal text-sm">اسم المستخدم</label>
              <div className="bg-shade3/50 border border-border rounded-xl px-4 py-3 text-white/40 font-tajawal cursor-not-allowed">
                {username}
              </div>
              <p className="text-white/30 font-tajawal text-xs">اسم المستخدم لا يمكن تغييره حالياً</p>
            </div>

            {/* النبذة الشخصية */}
            <div className="flex flex-col gap-2">
              <label className="text-white/60 font-tajawal text-sm">النبذة الشخصية</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="أخبر الناس عن نفسك..."
                className="bg-shade3 border border-border focus:border-primary text-white placeholder-white/30 font-tajawal rounded-xl px-4 py-3 outline-none resize-none text-right transition-colors"
              />
              <p className="text-white/30 font-tajawal text-xs text-left">{bio.length}/200</p>
            </div>

            {/* الإيميل */}
            <div className="flex flex-col gap-2">
              <label className="text-white/60 font-tajawal text-sm">
                البريد الإلكتروني
                <span className="text-white/30 text-xs mr-2">(اختياري - لاسترداد الحساب)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="bg-shade3 border border-border focus:border-primary text-white placeholder-white/30 font-tajawal rounded-xl px-4 py-3 outline-none text-right transition-colors"
                dir="ltr"
              />
            </div>

            {/* زر الحفظ */}
            <div className="flex justify-start pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary text-background font-tajawal font-bold px-8 py-3 rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
              </button>
            </div>
          </div>
        </div>

        <RightSidebar />
      </div>
    </main>
  );
}