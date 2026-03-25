"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faBan } from "@fortawesome/free-solid-svg-icons";
import Avatar from "@/components/ui/Avatar";
import RightSidebar from "@/components/home/RightSidebar";
import LeftSidebar from "@/components/home/LeftSidebar";

export default function BlockedPage() {
  const router = useRouter();
  const [blocked, setBlocked] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users/blocked")
      .then((r) => r.json())
      .then((data) => {
        setBlocked(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  async function handleUnblock(username: string) {
    await fetch(`/api/users/${username}/block`, { method: "POST" });
    setBlocked((prev) => prev.filter((b) => b.blocked.username !== username));
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
            <h1 className="text-white font-tajawal font-bold text-xl">الحسابات المحظورة</h1>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-shade2 rounded-2xl animate-pulse h-16" />
              ))}
            </div>
          ) : blocked.length === 0 ? (
            <div className="bg-shade2 border border-border rounded-2xl p-8 text-center" dir="rtl">
              <FontAwesomeIcon icon={faBan} className="w-10 h-10 text-white/20 mb-3" />
              <p className="text-white/40 font-tajawal">لا يوجد حسابات محظورة</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {blocked.map((b) => (
                <div key={b.blocked.id} className="bg-shade2 border border-border rounded-2xl p-4 flex items-center justify-between" dir="rtl">
                  <Link href={`/u/${b.blocked.username}`} className="flex items-center gap-3">
                    <Avatar username={b.blocked.username} avatarUrl={b.blocked.avatar_url} size={40} />
                    <span className="text-white font-tajawal font-bold text-sm">{b.blocked.username}</span>
                  </Link>
                  <button
                    onClick={() => handleUnblock(b.blocked.username)}
                    className="px-3 py-2 rounded-lg bg-red-400/10 text-red-400 font-tajawal text-sm hover:bg-red-400/20 transition-colors"
                  >
                    إلغاء الحظر
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-72 shrink-0"><RightSidebar /></div>
      </div>
    </main>
  );
}