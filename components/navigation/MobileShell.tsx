"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBell,
  faBookmark,
  faPlus,
  faCompass,
  faCommentDots,
  faGear,
  faHouse,
  faRightFromBracket,
  faTrophy,
  faUser,
  faUsers,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

export default function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<{ username: string } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const hideOnPaths = ["/login", "/register", "/privacy"];
  const shouldHide = hideOnPaths.some((p) => pathname === p || pathname?.startsWith(`${p}/`));

  useEffect(() => {
    if (shouldHide) return;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setUser(data?.id ? data : null))
      .catch(() => setUser(null));
  }, [shouldHide]);

  useEffect(() => {
    if (shouldHide) return;
    function fetchUnread() {
      fetch("/api/notifications/unread-count")
        .then((r) => r.json())
        .then((data) => setUnreadCount(data.count || 0))
        .catch(() => setUnreadCount(0));
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [shouldHide]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("click", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const navItems = [
    { href: "/", icon: faHouse, label: "الرئيسية" },
    { href: "/explore", icon: faCompass, label: "استكشاف" },
    { href: "/create-post", icon: faPlus, label: "إنشاء", center: true },
    { href: "/notifications", icon: faBell, label: "التنبيهات", badge: true },
    { href: "/messages", icon: faCommentDots, label: "المحادثات" },
  ];

  return (
    <>
      {!shouldHide && <div className="h-14 lg:hidden" />}
      {children}
      {!shouldHide && <div className="h-20 lg:hidden" />}

      {!shouldHide && (
        <>
          <header className="lg:hidden fixed top-0 inset-x-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
            <div className="h-14 px-4 flex items-center justify-between">
              <h1 className="font-ashkal text-primary text-4xl leading-none select-none">مجلس</h1>
              <div ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((s) => !s)}
                  className="w-9 h-9 rounded-lg bg-shade1 border border-border text-white/80 hover:text-white flex items-center justify-center"
                  aria-label="القائمة"
                  aria-expanded={menuOpen}
                >
                  <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} className="w-4 h-4" />
                </button>
              </div>
            </div>
          </header>

          <div
            className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-200 ${
              menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={!menuOpen}
          >
            <div className="absolute inset-0 bg-black/45" />
            <aside
              className={`absolute top-0 right-0 h-full w-[82%] max-w-[320px] bg-shade2 border-l border-border shadow-2xl transform transition-transform duration-250 ${
                menuOpen ? "translate-x-0" : "translate-x-full"
              }`}
              dir="rtl"
              aria-label="قائمة التنقل"
            >
              <div className="h-14 px-4 flex items-center justify-between border-b border-border">
                <h2 className="text-white font-tajawal font-bold">القائمة</h2>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-8 h-8 rounded-lg bg-shade3 text-white/80 hover:text-white flex items-center justify-center"
                  aria-label="إغلاق القائمة"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 flex flex-col gap-1 overflow-y-auto h-[calc(100%-56px)]">
                <Link href="/create-majlis" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-lg text-white font-tajawal text-sm hover:bg-shade3">إنشاء مجلس</Link>
                <Link href="/my-majalis" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-lg text-white font-tajawal text-sm hover:bg-shade3">مجالسي</Link>
                <Link href="/badges" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-lg text-white font-tajawal text-sm hover:bg-shade3">الإنجازات</Link>
                <Link href="/saved" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-lg text-white font-tajawal text-sm hover:bg-shade3">المحفوظات</Link>
                <Link href="/settings" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-lg text-white font-tajawal text-sm hover:bg-shade3">الإعدادات والخصوصية</Link>
                <div className="border-t border-border my-2" />
                <Link href={user?.username ? `/u/${user.username}` : "/"} onClick={() => setMenuOpen(false)} className="flex items-center justify-between px-4 py-3 rounded-lg text-white font-tajawal text-sm hover:bg-shade3">
                  الملف الشخصي
                  <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-primary" />
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-red-400 font-tajawal text-sm hover:bg-shade3">
                  تسجيل الخروج
                  <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
                </button>
              </div>
            </aside>
          </div>

          <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-shade2/95 backdrop-blur-md border-t border-border">
            <div className="h-16 px-3 flex items-center justify-between" dir="rtl">
              {navItems.map((item) => {
                const isActive = item.href === "/" ? pathname === "/" : pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center justify-center ${item.center ? "w-14" : "w-11"} h-11 rounded-full transition-colors ${
                      item.center ? "bg-primary text-background shadow-lg" : isActive ? "text-primary bg-primary/10" : "text-white/60"
                    }`}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <FontAwesomeIcon icon={item.icon} className={item.center ? "w-6 h-6 text-xl" : "w-5 h-5 text-xl"} />
                    {item.badge && unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-background text-[9px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </>
      )}
    </>
  );
}
