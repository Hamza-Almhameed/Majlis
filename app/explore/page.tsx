"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCompass,
  faMagnifyingGlass,
  faUsers,
  faLock,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";

import RightSidebar from "@/components/home/RightSidebar";
import LeftSidebar from "@/components/home/LeftSidebar";
type JoinRequestStatus = "pending" | "approved" | "rejected" | null;
type UserRole = "owner" | "moderator" | "member" | null;

interface MajlisRec {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  cover_url: string | null;
  members_count: number;
  is_private: boolean;
  current_user_role: UserRole;
  join_request_status: JoinRequestStatus;
}

interface ExploreResponse {
  items: MajlisRec[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export default function ExplorePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const [seed] = useState(() => Math.floor(Math.random() * 1_000_000_000));
  const [majalis, setMajalis] = useState<MajlisRec[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionLoadingSlug, setActionLoadingSlug] = useState<string | null>(null);

  const loaderRef = useRef<HTMLDivElement | null>(null);
  const pageSize = 9;

  const queryTrimmed = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      try {
        if (page === 0) setLoading(true);
        else setLoadingMore(true);

        const res = await fetch(
          `/api/majalis/explore?page=${page}&pageSize=${pageSize}&seed=${seed}`
        );
        const data = (await res.json()) as ExploreResponse;

        if (cancelled) return;

        const nextItems = data.items || [];
        setMajalis((prev) => {
          if (page === 0) return nextItems;
          const existing = new Set(prev.map((p) => p.id));
          const merged = [...prev, ...nextItems.filter((it) => !existing.has(it.id))];
          return merged;
        });
        setHasMore(!!data.hasMore);
      } catch {
        if (!cancelled) setHasMore(false);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    }

    loadPage();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, seed]);

  useEffect(() => {
    if (loading || loadingMore) return;
    if (!hasMore) return;
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && hasMore && !loadingMore) {
        setPage((p) => p + 1);
      }
    });

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore]);

  function getActionState(m: MajlisRec) {
    const isMember = !!m.current_user_role;
    const isPending = m.join_request_status === "pending";

    if (isMember) return { text: "مغادرة", disabled: actionLoadingSlug === m.slug };
    if (isPending) return { text: "طلب قيد الانتظار", disabled: true };
    if (m.is_private)
      return { text: "طلب الانضمام", disabled: actionLoadingSlug === m.slug };
    return { text: "انضم", disabled: actionLoadingSlug === m.slug };
  }

  async function handleJoinOrLeave(m: MajlisRec) {
    setActionLoadingSlug(m.slug);
    try {
      const isMember = !!m.current_user_role;
      const method = isMember ? "DELETE" : "POST";

      const res = await fetch(`/api/majalis/${m.slug}/join`, { method });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "تعذر تنفيذ العملية");
        return;
      }

      
      setMajalis([]);
      setPage(0);
      setHasMore(true);
    } finally {
      setActionLoadingSlug(null);
    }
  }

  return (
    <main className="bg-background min-h-screen p-3 sm:p-6 pb-24 lg:pb-6">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full mx-auto">
        <div className="hidden lg:block w-full lg:w-72 lg:shrink-0" />

        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-shade2 border border-border rounded-2xl p-5 flex flex-col gap-4" dir="rtl">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faCompass} className="w-5 h-5 text-primary" />
              <h1 className="text-white font-tajawal font-bold text-xl">استكشف</h1>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!queryTrimmed) return;
                router.push(`/search?q=${encodeURIComponent(queryTrimmed)}`);
              }}
              className="flex items-center gap-2"
              dir="rtl"
            >
              <div className="flex items-center gap-2 bg-shade3 border border-border rounded-lg px-3 py-2 flex-1">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="w-4 h-4 text-white/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث عن مستخدم أو مجلس"
                  className="bg-transparent text-white placeholder-white/40 font-tajawal outline-none w-full text-sm"
                  aria-label="بحث"
                />
              </div>

              <button
                type="submit"
                className="shrink-0 px-4 py-2 rounded-lg bg-primary text-background font-tajawal font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
                disabled={!queryTrimmed}
              >
                بحث
              </button>
            </form>
          </div>

          <div className="bg-shade2 border border-border rounded-2xl p-5 flex flex-col gap-3" dir="rtl">
            <h2 className="text-white font-tajawal font-bold text-lg">مجالس مقترحة للانضمام</h2>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <div key={i} className="bg-shade3 rounded-xl animate-pulse aspect-square" />
                ))}
              </div>
            ) : majalis.filter((m) => !m.current_user_role).length === 0 ? (
              <div className="text-white/40 font-tajawal text-sm">لا توجد نتائج حالياً</div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {majalis
                    .filter((m) => !m.current_user_role)
                    .map((m) => {
                    const action = getActionState(m);

                    return (
                      <div
                        key={m.id}
                        className="relative aspect-square w-full rounded-xl overflow-hidden bg-shade3 border border-border"
                      >
                        {m.cover_url ? (
                          <img
                            src={m.cover_url}
                            alt={m.name}
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="absolute inset-0 w-full h-full bg-shade2 flex items-center justify-center">
                            {m.icon_url ? (
                              <img
                                src={m.icon_url}
                                alt={m.name}
                                className="w-12 h-12 rounded-full border border-border object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-shade3 border border-border flex items-center justify-center">
                                <FontAwesomeIcon icon={faUsers} className="w-5 h-5 text-primary" />
                              </div>
                            )}
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-shade2/90 via-shade2/30 to-transparent" />

                        <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col gap-2">
                          <div className="text-white font-tajawal font-bold text-sm leading-tight line-clamp-2">
                            مجلس {m.name}
                          </div>

                          <div className="text-white/60 font-tajawal text-[11px] flex items-center gap-2">
                            <FontAwesomeIcon icon={faUsers} className="w-3 h-3" />
                            <span>{m.members_count} عضو</span>
                            <span className="text-white/20">·</span>
                            <span className="flex items-center gap-1">
                              <FontAwesomeIcon
                                icon={m.is_private ? faLock : faGlobe}
                                className="w-3 h-3"
                              />
                              {m.is_private ? "خاص" : "عام"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/m/${m.slug}`}
                              className="flex-1 px-2 py-1 rounded-lg bg-primary/10 text-primary font-tajawal font-bold text-[11px] text-center hover:bg-primary/20 transition-colors"
                            >
                              زيارة
                            </Link>

                            <button
                              onClick={() => handleJoinOrLeave(m)}
                              disabled={action.disabled}
                              className={`px-2 py-1 rounded-lg font-tajawal text-[11px] font-bold transition-colors disabled:opacity-40 ${
                                action.disabled ? "bg-shade2 text-white/60" : "bg-primary text-background hover:opacity-90"
                              }`}
                            >
                              {action.text}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                    })}
                </div>

                <div ref={loaderRef} className="py-4 text-center">
                  {hasMore ? (
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    <p className="text-white/40 font-tajawal text-sm">لا يوجد المزيد من المجالس</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="w-full lg:w-72 lg:shrink-0">
          <RightSidebar />
          <LeftSidebar />
        </div>
      </div>
    </main>
  );
}
