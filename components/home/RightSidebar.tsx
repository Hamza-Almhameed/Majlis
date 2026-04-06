"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faMessage,
  faBell,
  faUsers,
  faBookmark,
  faGear,
  faCompass,
  faChevronDown,
  faPen,
  faCirclePlus,
  faUser,
  faRightFromBracket,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import Avatar from "@/components/ui/Avatar";

const menuItems = [
  { icon: faHouse, label: "الرئيسية", href: "/" },
  { icon: faCompass, label: "استكشاف", href: "/explore" },
  { icon: faMessage, label: "المحادثات", href: "/messages" },
  { icon: faBell, label: "التنبيهات", href: "/notifications", badge: true },
  { icon: faUsers, label: "مجالسي", href: "/my-majalis" },
  { icon: faTrophy, label: "الإنجازات", href: "/badges" },
  { icon: faBookmark, label: "المحفوظات", href: "/saved" },
  { icon: faGear, label: "الاعدادات والخصوصية", href: "/settings" },
];

export default function RightSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<{ username: string; avatar_url?: string | null } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);


  useEffect(() => {
    function fetchUnread() {
      fetch("/api/notifications/unread-count")
        .then((r) => r.json())
        .then((data) => setUnreadCount(data.count || 0));
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close menus on outside click or Escape
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setCreateOpen(false);
        setProfileOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setCreateOpen(false);
        setProfileOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside
      ref={containerRef}
      className="hidden lg:flex fixed top-1/2 right-6 w-72 min-w-[18rem] h-[calc(100%-48px)] overflow-y-auto flex-col gap-4 py-6 px-4 rounded-xl bg-linear-to-b from-shade3/60 to-shade2/50 backdrop-blur-sm border border-border shadow-lg z-40 -translate-y-1/2"
      dir="rtl"
      aria-label="شريط جانبي"
    >
      
      <h1 className="font-ashkal text-primary text-5xl text-right mb-2 select-none">
        مجلس
      </h1>


      <div className="relative">
        <button
          onClick={() => {
            setCreateOpen((s) => !s);
            setProfileOpen(false);
          }}
          aria-expanded={createOpen}
          aria-controls="create-menu"
          className="w-full flex items-center justify-between gap-2 bg-primary text-background font-tajawal font-bold text-lg rounded-lg py-3 px-4 transition-transform transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <span className="flex items-center gap-3">
            <FontAwesomeIcon icon={faCirclePlus} className="w-4 h-4" />
            <span>انشاء</span>
          </span>
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`w-4 h-4 transition-transform ${createOpen ? "rotate-180" : ""}`}
          />
        </button>


        {createOpen && (
          <div
            id="create-menu"
            role="menu"
            className="absolute top-14 left-0 right-0 bg-shade2 border border-border rounded-lg overflow-hidden z-20 shadow-md translate-y-1 scale-98 animate-[ease_120ms] origin-top-right"
            style={{ animation: "none" /* keep minimal, tailwind classes used above */ }}
          >
            <Link
              href="/create-post"
              role="menuitem"
              className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-shade3 text-white font-tajawal text-sm"
            >
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faPen} className="w-4 h-4 text-primary" />
                <div className="text-right">
                  <div className="font-semibold">منشور جديد</div>
                  <div className="text-[11px] text-white/70">مشاركة فكرة أو سؤال</div>
                </div>
              </div>
            </Link>

            <div className="border-t border-border" />

            <Link
              href="/create-majlis"
              role="menuitem"
              className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-shade3 text-white font-tajawal text-sm"
            >
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faCirclePlus} className="w-4 h-4 text-primary" />
                <div className="text-right">
                  <div className="font-semibold">مجلس جديد</div>
                  <div className="text-[11px] text-white/70">قم ببناء مجتمع مخصص</div>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>


      <nav className="flex flex-col gap-2 mt-1" aria-label="التنقل الرئيسي">
        {menuItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-white font-tajawal text-sm ${
                isActive
                  ? "bg-primary/20 shadow-md"
                  : "hover:bg-shade2/70"
              } focus:outline-none focus:ring-2 focus:ring-primary/40`}
            >
              <div className="relative w-5 h-5 flex items-center justify-center text-white/90">
        <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
        {item.badge && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-background text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>
              <span className="flex-1 text-right">{item.label}</span>
            </Link>
          );
        })}
      </nav>


      <div className="relative mt-auto">
        <button
          onClick={() => {
            setProfileOpen((s) => !s);
            setCreateOpen(false);
          }}
          aria-expanded={profileOpen}
          aria-controls="profile-menu"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-shade2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <Avatar username={user?.username || ""} avatarUrl={user?.avatar_url} size={40} />
          <div className="flex flex-col items-start flex-1 min-w-0">
            <span className="text-white font-tajawal truncate">{user?.username || "ضيف"}</span>
            <span className="text-[12px] text-white/60 font-tajawal truncate">@{user?.username || "guest"}</span>
          </div>
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`w-3 h-3 transition-transform ${profileOpen ? "rotate-180" : ""}`}
          />
        </button>

        {profileOpen && (
          <div
            id="profile-menu"
            role="menu"
            className="absolute bottom-14 left-0 right-0 bg-shade2 border border-border rounded-lg overflow-hidden z-20 shadow-md"
          >
            <Link
              href={`/u/${user?.username}`}
              role="menuitem"
              className="flex items-center justify-end gap-2 px-4 py-3 hover:bg-shade3 text-white font-tajawal"
            >
              الملف الشخصي
              <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-primary" />
            </Link>

            <div className="border-t border-border" />

            <button
              onClick={handleLogout}
              role="menuitem"
              className="w-full flex items-center justify-end gap-2 px-4 py-3 hover:bg-shade3 text-red-400 font-tajawal"
            >
              تسجيل الخروج
              <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}