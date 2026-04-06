"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faClock,
  faGlobe,
  faLock,
  faMagnifyingGlass,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

import LeftSidebar from "@/components/home/LeftSidebar";
import RightSidebar from "@/components/home/RightSidebar";
import Avatar from "@/components/ui/Avatar";

type Tab = "posts" | "people" | "majalis";

type SearchUser = {
  type: "user";
  id: string;
  name: string;
  sub: string;
  avatar_url: string | null;
};

type SearchMajlis = {
  type: "majlis";
  id: string;
  name: string;
  sub: string;
  avatar_url: string | null;
};

type SearchItem = SearchUser | SearchMajlis;

interface PostSearchItem {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: string;
  is_temporary: boolean;
  created_at: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_saved: boolean;
  user: {
    username: string;
    avatar_url: string | null;
    last_seen: string | null;
  };
  majlis: { name: string; slug: string } | null;
}

interface MajlisDetails {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  cover_url: string | null;
  members_count: number;
  is_private: boolean;
  created_at: string;
  current_user_role: "owner" | "moderator" | "member" | null;
  join_request_status: "pending" | "approved" | "rejected" | null;
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = useMemo(() => (searchParams.get("q") || "").trim(), [searchParams]);

  const [activeTab, setActiveTab] = useState<Tab>("posts");

  const [loadingUsersMajalis, setLoadingUsersMajalis] = useState(false);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [majalis, setMajalis] = useState<SearchMajlis[]>([]);

  const [loadingPosts, setLoadingPosts] = useState(false);
  const [posts, setPosts] = useState<PostSearchItem[]>([]);

  const [majlisDetails, setMajlisDetails] = useState<MajlisDetails[]>([]);
  const [actionLoadingSlug, setActionLoadingSlug] = useState<string | null>(null);

  // Fetch users + majalis for the first two tabs.
  useEffect(() => {
    if (!q) return;
    let cancelled = false;

    async function load() {
      try {
        setLoadingUsersMajalis(true);
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as SearchItem[];
        if (cancelled) return;

        setUsers(data.filter((x) => x.type === "user") as SearchUser[]);
        setMajalis(data.filter((x) => x.type === "majlis") as SearchMajlis[]);
      } finally {
        if (!cancelled) setLoadingUsersMajalis(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [q]);

  // Fetch posts only when the posts tab is active.
  useEffect(() => {
    if (!q || activeTab !== "posts") return;
    let cancelled = false;

    async function loadPosts() {
      try {
        setLoadingPosts(true);
        const res = await fetch(`/api/search/posts?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as PostSearchItem[];
        if (cancelled) return;
        setPosts(data || []);
      } finally {
        if (!cancelled) setLoadingPosts(false);
      }
    }

    loadPosts();
    return () => {
      cancelled = true;
    };
  }, [q, activeTab]);

  // Fetch majlis join statuses only when the majalis tab is active.
  useEffect(() => {
    if (activeTab !== "majalis") return;
    if (!majalis.length) {
      setMajlisDetails([]);
      return;
    }

    let cancelled = false;

    async function loadMajlisDetails() {
      const details = await Promise.all(
        majalis.map(async (m) => {
          const res = await fetch(`/api/majalis/${m.sub}`);
          const d = await res.json();
          return d as MajlisDetails;
        })
      );

      if (!cancelled) setMajlisDetails(details);
    }

    loadMajlisDetails();
    return () => {
      cancelled = true;
    };
  }, [activeTab, majalis]);

  const tabItems: { key: Tab; label: string }[] = useMemo(
    () => [
      { key: "posts", label: "المنشورات" },
      { key: "people", label: "الأشخاص" },
      { key: "majalis", label: "المجالس" },
    ],
    []
  );

  function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "الآن";
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    const days = Math.floor(diff / 86400);
    if (days < 30) return `منذ ${days} يوم`;
    const months = Math.floor(days / 30);
    if (months < 12) return `منذ ${months} شهر`;
    return `منذ ${Math.floor(months / 12)} سنة`;
  }

  function getMajlisAction(details: MajlisDetails) {
    const isMember = !!details.current_user_role;
    const isPending = details.join_request_status === "pending";

    if (isMember) {
      return { text: "مغادرة", disabled: actionLoadingSlug === details.slug, method: "DELETE" as const };
    }

    if (isPending) {
      return { text: "طلب قيد الانتظار", disabled: true, method: "POST" as const };
    }

    if (details.is_private) {
      return { text: "طلب الانضمام", disabled: actionLoadingSlug === details.slug, method: "POST" as const };
    }

    return { text: "انضم", disabled: actionLoadingSlug === details.slug, method: "POST" as const };
  }

  async function handleMajlisJoin(details: MajlisDetails) {
    const action = getMajlisAction(details);
    setActionLoadingSlug(details.slug);

    try {
      const res = await fetch(`/api/majalis/${details.slug}/join`, { method: action.method });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "تعذر تنفيذ العملية");
        return;
      }

      // Refresh statuses for the current results.
      const refreshed = await Promise.all(
        majalis.map(async (m) => {
          const r = await fetch(`/api/majalis/${m.sub}`);
          return (await r.json()) as MajlisDetails;
        })
      );
      setMajlisDetails(refreshed);
    } finally {
      setActionLoadingSlug(null);
    }
  }

  if (!q) {
    return (
      <main className="bg-background min-h-screen p-3 sm:p-6 pb-24 lg:pb-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full mx-auto">
          <div className="w-full lg:w-72 lg:shrink-0">
            <LeftSidebar />
          </div>
          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-shade2 border border-border rounded-2xl p-6 text-center">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="w-8 h-8 text-white/20 mb-3" />
              <p className="text-white/40 font-tajawal text-sm">اكتب كلمة للبحث</p>
            </div>
          </div>
          <div className="w-full lg:w-72 lg:shrink-0">
            <RightSidebar />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-background min-h-screen p-3 sm:p-6 pb-24 lg:pb-6">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full mx-auto">
        <div className="w-full lg:w-72 lg:shrink-0">
          <LeftSidebar />
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center gap-3" dir="rtl">
            <button
              onClick={() => router.back()}
              className="text-white/50 hover:text-white transition-colors"
              aria-label="رجوع"
            >
              <FontAwesomeIcon icon={faArrowRight} className="w-5 h-5" />
            </button>

            <h1 className="text-white font-tajawal font-bold text-xl">نتائج البحث: {q}</h1>
          </div>

          <div className="flex border-b border-border" dir="rtl">
            {tabItems.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 font-tajawal text-sm transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? "text-primary border-primary"
                    : "text-white/40 border-transparent hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "posts" && (
            <section className="flex flex-col gap-3">
              {loadingPosts ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-shade2 border border-border rounded-2xl p-4 animate-pulse h-36" />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-shade2 border border-border rounded-2xl p-8 text-center" dir="rtl">
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="w-10 h-10 text-white/20 mb-3" />
                  <p className="text-white/40 font-tajawal">لا توجد منشورات مطابقة</p>
                </div>
              ) : (
                posts.map((p) => (
                  <article
                    key={p.id}
                    className="bg-shade2 border border-border rounded-2xl p-4 flex flex-col gap-2"
                    dir="rtl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Link href={`/u/${p.user.username}`} aria-label={p.user.username}>
                          <Avatar username={p.user.username} avatarUrl={p.user.avatar_url} size={40} />
                        </Link>
                        <div className="flex flex-col items-start min-w-0">
                          <Link href={`/u/${p.user.username}`} className="text-white font-tajawal font-bold text-sm truncate hover:underline">
                            {p.user.username}
                          </Link>
                          <div className="text-white/60 font-tajawal text-xs flex items-center gap-2 mt-1">
                            {p.is_temporary && <FontAwesomeIcon icon={faClock} className="w-3 h-3" />}
                            <span>{timeAgo(p.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {p.majlis && (
                          <Link
                            href={`/m/${p.majlis.slug}`}
                            className="text-[12px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-tajawal hover:bg-primary/10"
                          >
                            مجلس {p.majlis.name}
                          </Link>
                        )}
                      </div>
                    </div>

                    <p className="text-white/80 font-tajawal text-sm leading-relaxed line-clamp-3">
                      {p.content}
                    </p>

                    <div className="flex items-center justify-between gap-3 text-white/60 text-xs font-tajawal">
                      <div className="flex items-center gap-3">
                        <span>{p.likes_count} إعجابات</span>
                        <span>·</span>
                        <span>{p.comments_count} تعليقات</span>
                      </div>
                      <Link
                        href={`/post/${p.id}`}
                        className="text-primary hover:underline"
                      >
                        فتح
                      </Link>
                    </div>
                  </article>
                ))
              )}
            </section>
          )}

          {activeTab === "people" && (
            <section className="flex flex-col gap-3" dir="rtl">
              {loadingUsersMajalis ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-shade2 border border-border rounded-2xl p-4 animate-pulse h-18" />
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="bg-shade2 border border-border rounded-2xl p-8 text-center">
                  <p className="text-white/40 font-tajawal">لا يوجد أشخاص مطابقة</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {users.map((u) => (
                    <Link
                      key={u.id}
                      href={`/u/${u.sub}`}
                      className="bg-shade2 border border-border rounded-2xl p-4 flex items-center gap-3 hover:bg-shade3 transition-colors"
                    >
                      <Avatar username={u.name} avatarUrl={u.avatar_url} size={44} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-white font-tajawal font-bold text-sm truncate">{u.name}</span>
                        <span className="text-white/40 font-tajawal text-xs">مستخدم</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === "majalis" && (
            <section className="flex flex-col gap-3" dir="rtl">
              {loadingUsersMajalis ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-shade3 rounded-xl animate-pulse aspect-square" />
                  ))}
                </div>
              ) : majalis.length === 0 ? (
                <div className="bg-shade2 border border-border rounded-2xl p-8 text-center">
                  <p className="text-white/40 font-tajawal">لا توجد مجالس مطابقة</p>
                </div>
              ) : majlisDetails.length === 0 ? (
                <div className="bg-shade2 border border-border rounded-2xl p-8 text-center">
                  <p className="text-white/40 font-tajawal">جاري تحميل التفاصيل...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {majlisDetails.map((m) => {
                    const action = getMajlisAction(m);
                    return (
                      <div
                        key={m.id}
                        className="relative aspect-square w-full rounded-xl overflow-hidden bg-shade3 border border-border"
                      >
                        {m.cover_url ? (
                          <img src={m.cover_url} alt={m.name} className="absolute inset-0 w-full h-full object-cover" />
                        ) : null}

                        {!m.cover_url && (
                          <div className="absolute inset-0 bg-shade2" />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-shade2/90 via-shade2/30 to-transparent" />

                        <div className="absolute inset-x-0 top-3 px-3 flex items-center gap-2">
                          {m.icon_url ? (
                            <img src={m.icon_url} alt="" className="w-10 h-10 rounded-full border border-border object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-shade3 border border-border flex items-center justify-center">
                              <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-primary" />
                            </div>
                          )}
                        </div>

                        <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col gap-2">
                          <div className="text-white font-tajawal font-bold text-sm leading-tight line-clamp-2">
                            مجلس {m.name}
                          </div>

                          <div className="text-white/60 font-tajawal text-[11px] flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <FontAwesomeIcon icon={m.is_private ? faLock : faGlobe} className="w-3 h-3" />
                              {m.is_private ? "خاص" : "عام"}
                            </span>
                            <span className="text-white/20">·</span>
                            <span>{m.members_count} عضو</span>
                          </div>

                          <button
                            onClick={() => handleMajlisJoin(m)}
                            disabled={action.disabled}
                            className={`px-2 py-1 rounded-lg font-tajawal text-[11px] font-bold transition-colors disabled:opacity-40 ${
                              action.disabled ? "bg-shade2 text-white/60" : "bg-primary text-background hover:opacity-90"
                            }`}
                          >
                            {action.text}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </div>

        <div className="w-full lg:w-72 lg:shrink-0">
          <RightSidebar />
        </div>
      </div>
    </main>
  );
}



export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background p-6 text-white">جارٍ التحميل ...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}