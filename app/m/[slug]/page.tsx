"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight, faUsers, faLock, faGlobe,
  faGear, faChartBar, faPen, faClipboardList
} from "@fortawesome/free-solid-svg-icons";
import RightSidebar from "@/components/home/RightSidebar";
import LeftSidebar from "@/components/home/LeftSidebar";
import Feed from "@/components/home/Feed";
import Avatar from "@/components/ui/Avatar";
import CreatePostBox from "@/components/home/CreatePostBox";

interface Majlis {
  id: string;
  name: string;
  slug: string;
  description: string;
  rules: string | null;
  icon_url: string | null;
  cover_url: string | null;
  members_count: number;
  posts_count: number;
  is_private: boolean;
  created_at: string;
  current_user_role: "owner" | "moderator" | "member" | null;
  join_request_status: "pending" | "approved" | "rejected" | null;
}

export default function MajlisPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [majlis, setMajlis] = useState<Majlis | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; avatar_url?: string } | null>(null);
  const [feedKey, setFeedKey] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then(setCurrentUser);
    fetchMajlis();
  }, [slug]);

  async function fetchMajlis() {
    const res = await fetch(`/api/majalis/${slug}`);
    const data = await res.json();
    if (res.ok) {
      setMajlis(data);
    }
    setLoading(false);
  }

  async function handleJoin() {
    setJoining(true);
    const res = await fetch(`/api/majalis/${slug}/join`, { method: "POST" });
    const data = await res.json();
    setJoining(false);
    if (res.ok) {
      fetchMajlis();
      setFeedKey((k) => k + 1);
    }
  }

  async function handleLeave() {
    if (!confirm("هل أنت متأكد من مغادرة المجلس؟")) return;
    setJoining(true);
    const res = await fetch(`/api/majalis/${slug}/join`, { method: "DELETE" });
    setJoining(false);
    if (res.ok) {
      fetchMajlis();
      setFeedKey((k) => k + 1);
    }
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

  if (!majlis) return (
    <main className="bg-background min-h-screen p-6 flex items-center justify-center">
      <p className="text-white/40 font-tajawal text-xl">المجلس غير موجود</p>
    </main>
  );

  const isOwner = majlis.current_user_role === "owner";
  const isModerator = majlis.current_user_role === "moderator";
  const isMember = !!majlis.current_user_role;
  const canPost = isMember;
  const isPending = majlis.join_request_status === "pending";

  return (
    <main className="bg-background min-h-screen p-3 sm:p-6 pb-24 lg:pb-6">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full mx-auto">
        <div className="w-full lg:w-72 lg:shrink-0"><LeftSidebar /></div>

        <div className="flex-1 flex flex-col gap-4">


          <div className="flex items-center gap-3" dir="rtl">
            <button onClick={() => router.back()} className="text-white/50 hover:text-white transition-colors">
              <FontAwesomeIcon icon={faArrowRight} className="w-5 h-5" />
            </button>
          </div>


          <div className="bg-shade2 border border-border rounded-2xl overflow-hidden">


            {majlis.cover_url ? (
              <img src={majlis.cover_url} alt="غلاف" className="w-full h-36 object-cover" />
            ) : (
              <div className="w-full h-24 bg-linear-to-l from-primary/20 to-shade3" />
            )}

            <div className="p-5 flex flex-col gap-4" dir="rtl">

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                {majlis.icon_url ? (
                    <img src={majlis.icon_url} alt={majlis.name} className="w-14 h-14 rounded-full object-cover border-2 border-border" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-shade3 border-2 border-border flex items-center justify-center">
                      <FontAwesomeIcon icon={faUsers} className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div className="flex flex-col items-start gap-1">
                    <div className="flex items-center gap-2">
                      <h1 className="text-white font-tajawal font-bold text-xl">مجلس {majlis.name}</h1>
                      <FontAwesomeIcon
                        icon={majlis.is_private ? faLock : faGlobe}
                        className="w-3 h-3 text-white/40"
                      />
                    </div>
                    <div className="flex items-center gap-3 text-white/40 font-tajawal text-xs">
                      <span>{majlis.posts_count} منشور</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faUsers} className="w-3 h-3" />
                        {majlis.members_count} عضو
                      </span>
                    </div>
                  </div>
                  
                </div>

                <div className="flex items-center gap-3">

                  {isOwner ? (
                    <div className="flex gap-2">
                      <Link href={`/m/${slug}/edit`}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-shade3 text-white font-tajawal text-sm hover:bg-border transition-colors">
                        <FontAwesomeIcon icon={faPen} className="w-3 h-3" />
                        تعديل
                      </Link>
                      <Link href={`/m/${slug}/manage`}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary font-tajawal text-sm hover:bg-primary/20 transition-colors">
                        <FontAwesomeIcon icon={faChartBar} className="w-3 h-3" />
                        الإدارة
                      </Link>
                    </div>
                  ) : isModerator ? (
                    <div className="flex gap-2">
                      <button onClick={handleLeave} disabled={joining}
                        className="px-3 py-2 rounded-lg bg-shade3 text-white/60 font-tajawal text-sm hover:bg-border transition-colors disabled:opacity-40">
                        مغادرة
                      </button>
                      <Link href={`/m/${slug}/manage`}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary font-tajawal text-sm hover:bg-primary/20 transition-colors">
                        <FontAwesomeIcon icon={faChartBar} className="w-3 h-3" />
                        الإدارة
                      </Link>
                    </div>
                  ) : isMember ? (
                    <button onClick={handleLeave} disabled={joining}
                      className="px-4 py-2 rounded-lg bg-shade3 text-white/60 font-tajawal text-sm hover:bg-border transition-colors disabled:opacity-40">
                      {joining ? "..." : "مغادرة"}
                    </button>
                  ) : isPending ? (
                    <button disabled
                      className="px-4 py-2 rounded-lg bg-shade3 text-white/40 font-tajawal text-sm cursor-default">
                      طلب قيد الانتظار
                    </button>
                  ) : (
                    <button onClick={handleJoin} disabled={joining}
                      className="px-4 py-2 rounded-lg bg-primary text-background font-tajawal font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40">
                      {joining ? "..." : majlis.is_private ? "طلب الانضمام" : "انضم"}
                    </button>
                  )}
                </div>
              </div>


              <p className="text-white/60 font-tajawal text-sm leading-relaxed whitespace-pre-wrap">{majlis.description}</p>


              {majlis.rules && (
                <div className="bg-shade3/50 rounded-xl p-3">
                  <h3 className="text-white/60 font-tajawal text-s mb-2"><FontAwesomeIcon icon={faClipboardList} /> قواعد المجلس</h3>
                  <p className="text-white/50 font-tajawal text-xs leading-relaxed whitespace-pre-line">{majlis.rules}</p>
                </div>
              )}
            </div>
          </div>


          {majlis.is_private && !isMember ? (
            <div className="bg-shade2 border border-border rounded-2xl p-8 text-center" dir="rtl">
              <FontAwesomeIcon icon={faLock} className="w-10 h-10 text-white/20 mb-3" />
              <p className="text-white/40 font-tajawal">هذا المجلس خاص، انضم لرؤية المنشورات</p>
            </div>
          ) : (
            <>
              {canPost && (
                <CreatePostBox
                  username={currentUser?.username || ""}
                  avatarUrl={currentUser?.avatar_url}
                  majlisId={majlis.id}
                  majlisIsPrivate={majlis.is_private}
                  onPost={() => setFeedKey((k) => k + 1)}
                />
              )}
              <Feed
                key={feedKey}
                currentUserId={currentUser?.id}
                majlisSlug={slug}
              />
            </>
          )}
        </div>

        <div className="w-full lg:w-72 lg:shrink-0"><RightSidebar /></div>
      </div>
    </main>
  );
}