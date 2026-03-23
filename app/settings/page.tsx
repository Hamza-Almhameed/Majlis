"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight, faLock, faEnvelope, faRightFromBracket,
  faBell, faBan, faMessage, faTrash, faInfoCircle,
  faShield, faChevronLeft, faEye, faEyeSlash,
  faUserCircle, faEnvelope as faEnvelopeAlt, faClock
} from "@fortawesome/free-solid-svg-icons";
import RightSidebar from "@/components/home/RightSidebar";
import Modal from "@/components/ui/Modal";
import LeftSidebar from "@/components/home/LeftSidebar";

type Section = null | "change-password" | "link-email" | "delete-account";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; email?: string; avatar_url?: string } | null>(null);
  const [activeSection, setActiveSection] = useState<Section>(null);

  // change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // modal control for dialogs
  const [modalOpen, setModalOpen] = useState(false);

  // link email
  const [emailInput, setEmailInput] = useState("");

  // delete account
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showLastSeen, setShowLastSeen] = useState(true);

  useEffect(() => {
    fetch("/api/users/profile")
      .then((r) => r.json())
      .then((data) => {
        setUser(data);
        setShowLastSeen(data.show_last_seen ?? true);
      });
  }, []);

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  function openSection(section: Section) {
    // open the modal dialog for the requested section
    setActiveSection(section);
    setModalOpen(true);
    resetMessages();
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setEmailInput(user?.email || "");
    setDeletePassword("");
    setDeleteConfirm("");
  }

  async function handleChangePassword() {
    resetMessages();
    if (newPassword !== confirmNewPassword) {
      setError("كلمتا المرور الجديدتان غير متطابقتين");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setSuccess("تم تغيير كلمة المرور بنجاح");
    setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword("");
  }

  async function handleLinkEmail() {
    resetMessages();
    if (!emailInput.trim()) { setError("أدخل بريداً إلكترونياً"); return; }
    setLoading(true);
    const formData = new FormData();
    formData.append("email", emailInput);
    const res = await fetch("/api/users/profile", {
      method: "PATCH",
      body: formData,
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setSuccess("تم ربط البريد الإلكتروني بنجاح");
    setUser((u) => u ? { ...u, email: emailInput } : u);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function handleDeleteAccount() {
    resetMessages();
    if (deleteConfirm !== "احذف حسابي") {
      setError("اكتب 'احذف حسابي' للتأكيد");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/delete-account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deletePassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    router.push("/register");
  }

  const settingsSections = [
    {
      title: "الحساب والأمان",
      items: [
        {
          icon: faLock,
          label: "تغيير كلمة المرور",
          sub: "تغيير كلمة المرور الحالية",
          action: () => openSection("change-password"),
          active: true,
        },
        {
          icon: faEnvelope,
          label: "ربط البريد الإلكتروني",
          sub: user?.email ? user.email : "غير مربوط",
          action: () => openSection("link-email"),
          active: true,
        },
        {
          icon: faRightFromBracket,
          label: "تسجيل الخروج",
          sub: "تسجيل الخروج من الحساب",
          action: handleLogout,
          active: true,
          danger: false,
        },
      ],
    },
    {
      title: "الخصوصية",
      items: [
        {
          icon: faBan,
          label: "الحسابات المحظورة",
          sub: "قريباً",
          action: null,
          active: false,
        },
        {
          icon: faMessage,
          label: "من يمكنه مراسلتي",
          sub: "قريباً",
          action: null,
          active: false,
        },
        {
          icon: faClock,
          label: "آخر تواجد",
          sub: showLastSeen ? "ظاهر للآخرين" : "مخفي عن الآخرين",
          action: async () => {
            const newVal = !showLastSeen;
            setShowLastSeen(newVal);
            await fetch("/api/users/presence-setting", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ show_last_seen: newVal }),
            });
          },
          active: true,
          toggle: true,
          toggleValue: showLastSeen,
        },
      ],
    },
    {
      title: "الإشعارات",
      items: [
        {
          icon: faBell,
          label: "إشعارات التعليقات والإعجابات",
          sub: "قريباً",
          action: null,
          active: false,
        },
      ],
    },
    {
      title: "عن التطبيق",
      items: [
        {
          icon: faInfoCircle,
          label: "عن مجلس",
          sub: "الإصدار 0.1.0 - نسخة تجريبية",
          href: "/about",
          active: true,
        },
        {
          icon: faShield,
          label: "سياسة الخصوصية",
          sub: "اقرأ سياسة الخصوصية والشروط",
          href: "/privacy",
          active: true,
        },
      ],
    },
    {
      title: "منطقة الخطر",
      items: [
        {
          icon: faTrash,
          label: "حذف الحساب",
          sub: "حذف الحساب وكل البيانات نهائياً",
          action: () => openSection("delete-account"),
          active: true,
          danger: true,
        },
      ],
    },
  ];

  return (
    <main className="bg-background min-h-screen p-6">
      <div className="flex gap-6 w-full mx-auto">

        <div className="w-72 shrink-0"><LeftSidebar /></div>


        <div className="flex-1 flex flex-col gap-4">

          {/* هيدر */}
          <div className="flex items-center gap-3" dir="rtl">
            <button onClick={() => router.back()} className="text-white/50 hover:text-white transition-colors p-2 rounded">
              <FontAwesomeIcon icon={faArrowRight} className="w-5 h-5" />
            </button>
            <h1 className="text-white font-tajawal font-bold text-xl">الإعدادات والخصوصية</h1>
          </div>

          {/* profile summary */}
          <div className="bg-shade2 border border-border rounded-2xl p-4 flex items-center gap-4" dir="rtl">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-shade3 flex items-center justify-center overflow-hidden">
                {/* avatar or fallback */}
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user?.username} className="w-full h-full object-cover" />
                ) : (
                  <FontAwesomeIcon icon={faUserCircle} className="w-10 h-10 text-white/60" />
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-white font-tajawal font-bold">{user?.username ?? "المستخدم"}</span>
                {user?.email && (
                  <span className="text-white/50 text-xs font-tajawal flex items-center gap-1">
                    <FontAwesomeIcon icon={faEnvelopeAlt} className="w-3 h-3 text-white/50" /> {user.email}
                  </span>
                )}
              </div>
              <p className="text-white/40 text-sm mt-1">اضبط تفضيلات حسابك وخصوصيتك هنا</p>
            </div>
          </div>

          {/* الأقسام */}
          {settingsSections.map((section) => (
            <div key={section.title} className="flex flex-col gap-3" dir="rtl">
              <h2 className="text-white/40 font-tajawal text-xs px-2">{section.title}</h2>
              <div className="bg-shade2 border border-border rounded-2xl overflow-hidden shadow-sm">
              {section.items.map((item, i) => {
        const ItemContent = (
          <div className="flex items-center justify-between gap-3 py-3 w-full text-right">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.danger ? "bg-red-500/10" : "bg-shade3"}`}>
                <FontAwesomeIcon icon={item.icon as any} className={`w-5 h-5 ${item.danger ? "text-red-400" : "text-primary"}`} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`font-tajawal text-sm ${item.danger ? "text-red-400" : "text-white"}`}>{item.label}</span>
                {item.sub && <span className="text-white/40 font-tajawal text-xs truncate">{item.sub}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {item.toggle !== undefined ? (
                <div className={`w-10 h-6 rounded-full transition-colors relative ${
                  item.toggleValue ? "bg-primary" : "bg-shade3"
                }`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                    item.toggleValue ? "right-1" : "left-1"
                  }`} />
                </div>
              ) : item.active ? (
                <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4 text-white/30" />
              ) : (
                <div className="text-white/30 text-[10px] bg-white/5 px-2 py-1 rounded">قريباً</div>
              )}
            </div>
          </div>
        );

        return (
          <div key={i} className="px-4 hover:bg-white/2 transition-colors">
            {item.href ? (
              <Link href={item.href} className="block w-full">{ItemContent}</Link>
            ) : (
              <button 
                onClick={item.action || undefined} 
                className={`w-full block text-right ${!item.active ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
                disabled={!item.active}
              >
                {ItemContent}
              </button>
            )}
            {i < section.items.length - 1 && <div className="border-t border-border/50" />}
          </div>
        );
      })}
              </div>
            </div>
          ))}
        </div>

        
        <div className="w-72 shrink-0">
            <RightSidebar />
        </div>
      </div>

      {/* MODALS */}
      {modalOpen && activeSection === "change-password" && (
        <Modal title="تغيير كلمة المرور" onClose={() => setModalOpen(false)}>
          {error && <div className="mb-3 text-sm text-red-400 bg-red-400/8 px-3 py-2 rounded font-tajawal">{error}</div>}
          {success && <div className="mb-3 text-sm text-primary bg-primary/8 px-3 py-2 rounded font-tajawal">{success}</div>}

          <div className="relative mt-2">
            <input
              type={showCurrentPassword ? "text" : "password"}
              placeholder="كلمة المرور الحالية"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-shade3 text-white placeholder-white/30 font-tajawal rounded-xl px-4 py-3 outline-none text-right border border-border"
            />
            <button onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
              <FontAwesomeIcon icon={showCurrentPassword ? faEye : faEyeSlash} className="w-4 h-4" />
            </button>
          </div>

          <div className="relative mt-3">
            <input
              type={showNewPassword ? "text" : "password"}
              placeholder="كلمة المرور الجديدة"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-shade3 text-white placeholder-white/30 font-tajawal rounded-xl px-4 py-3 outline-none text-right border border-border"
            />
            <button onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
              <FontAwesomeIcon icon={showNewPassword ? faEye : faEyeSlash} className="w-4 h-4" />
            </button>
          </div>

          <input
            type="password"
            placeholder="تأكيد كلمة المرور الجديدة"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className="w-full bg-shade3 text-white placeholder-white/30 font-tajawal rounded-xl px-4 py-3 outline-none text-right mt-3 border border-border"
          />

          <div className="flex gap-3 justify-end mt-5">
            <button onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-shade3 text-white/60 font-tajawal text-sm hover:bg-border transition">إلغاء</button>
            <button onClick={handleChangePassword} disabled={loading}
              className="px-4 py-2 rounded-xl bg-primary text-background font-tajawal font-bold text-sm disabled:opacity-40">
              {loading ? "جاري التغيير..." : "تغيير"}
            </button>
          </div>
        </Modal>
      )}

      {modalOpen && activeSection === "link-email" && (
        <Modal title="ربط البريد الإلكتروني" onClose={() => setModalOpen(false)}>
          <p className="text-white/50 font-tajawal text-sm">يُستخدم لاسترداد الحساب فقط ولن يظهر للآخرين.</p>
          {error && <div className="mt-3 text-sm text-red-400 bg-red-400/8 px-3 py-2 rounded">{error}</div>}
          {success && <div className="mt-3 text-sm text-primary bg-primary/8 px-3 py-2 rounded">{success}</div>}

          <input
            type="email"
            placeholder="example@email.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            className="w-full bg-shade3 text-white placeholder-white/30 font-tajawal rounded-xl px-4 py-3 outline-none mt-4 border border-border"
            dir="ltr"
          />

          <div className="flex gap-3 justify-end mt-5">
            <button onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-shade3 text-white/60 font-tajawal text-sm hover:bg-border transition">إلغاء</button>
            <button onClick={handleLinkEmail} disabled={loading}
              className="px-4 py-2 rounded-xl bg-primary text-background font-tajawal font-bold text-sm disabled:opacity-40">
              {loading ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </Modal>
      )}

      {modalOpen && activeSection === "delete-account" && (
        <Modal title="حذف الحساب نهائياً" onClose={() => setModalOpen(false)}>
          <div className="text-white/50 font-tajawal text-sm leading-relaxed">
            سيتم حذف حسابك وجميع منشوراتك وتعليقاتك وبياناتك بشكل نهائي ولا يمكن التراجع عن هذا الإجراء.
          </div>
          {error && <div className="mt-3 text-sm text-red-400 bg-red-400/8 px-3 py-2 rounded">{error}</div>}

          <input
            type="password"
            placeholder="كلمة المرور للتأكيد"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            className="w-full bg-shade3 text-white placeholder-white/30 font-tajawal rounded-xl px-4 py-3 outline-none text-right mt-4 border border-border"
          />

          <input
            type="text"
            placeholder="اكتب: احذف حسابي"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            className="w-full bg-shade3 text-white placeholder-white/30 font-tajawal rounded-xl px-4 py-3 outline-none text-right mt-3 border border-border"
          />

          <div className="flex gap-3 justify-end mt-5">
            <button onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-shade3 text-white/60 font-tajawal text-sm hover:bg-border transition">إلغاء</button>
            <button onClick={handleDeleteAccount} disabled={loading}
              className="px-4 py-2 rounded-xl bg-red-500 text-white font-tajawal font-bold text-sm disabled:opacity-40">
              {loading ? "جاري الحذف..." : "حذف الحساب"}
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}