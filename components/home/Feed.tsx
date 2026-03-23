"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as faHeartOutline, faComment, faBookmark as faBookmarkOutline } from "@fortawesome/free-regular-svg-icons";
import { faClock, faHeart as faHeartSolid, faBookmark as faBookmarkSolid } from "@fortawesome/free-solid-svg-icons";
import Avatar from "@/components/ui/Avatar";
import ImageLightbox from "@/components/ui/ImageLightbox";

interface Post {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: string;
  is_temporary: boolean;
  created_at: string;
  is_liked: boolean;
  is_saved: boolean;
  user: {
    username: string;
    avatar_url: string | null;
    last_seen: string | null;
  };
  majlis: {
    name: string;
    slug: string;
  } | null;
  likes_count: number;
  comments_count: number;
}

interface FeedProps {
  currentUserId?: string;
  onDelete?: () => void;
  initialPosts?: Post[];
  disablePagination?: boolean;
  profileUsername?: string;
  feedType?: "home" | "likes" | "saved";
  majlisSlug?: string;
}

export default function Feed({ currentUserId, onDelete, initialPosts, disablePagination, profileUsername, feedType, majlisSlug  }: FeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts || []);
  const [loading, setLoading] = useState(!initialPosts);
  

  // local UI state maps
  const [liked, setLiked] = useState<Record<string, boolean>>(() => {
    if (!initialPosts) return {};
    const map: Record<string, boolean> = {};
    initialPosts.forEach((p) => { map[p.id] = p.is_liked; });
    return map;
  });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() => {
    if (!initialPosts) return {};
    const map: Record<string, number> = {};
    initialPosts.forEach((p) => { map[p.id] = p.likes_count; });
    return map;
  });

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(!disablePagination);
  const loaderRef = useRef<HTMLDivElement>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lbImages, setLbImages] = useState<string[]>([]);
  const [lbIndex, setLbIndex] = useState(0);

  //menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  //edit post state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const [likingPostId, setLikingPostId] = useState<string | null>(null);
  const [savingPostId, setSavingPostId] = useState<string | null>(null);

  const [savedMap, setSavedMap] = useState<Record<string, boolean>>(() => {
    if (!initialPosts) return {};
    const map: Record<string, boolean> = {};
    initialPosts.forEach((p) => { map[p.id] = p.is_saved; });
    return map;
  });

  async function handleEdit(postId: string, newContent: string) {
    const res = await fetch(`/api/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newContent }),
    });

    if (res.ok) {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, content: newContent } : p))
      );
      setEditingPostId(null);
    }
  }

  function openLightbox(images: string[], index = 0) {
    setLbImages(images);
    setLbIndex(index);
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
    setLbImages([]);
    setLbIndex(0);
  }

  // helper: normalize media_url into array of urls
  function parseMediaUrls(media_url: string | null): string[] {
    if (!media_url) return [];
    try {
      const parsed = JSON.parse(media_url);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      // not JSON — treat as single URL string
    }
    return [media_url];
  }

  useEffect(() => {
    if (initialPosts) return;
  
    let url = `/api/posts?page=0`;
    if (profileUsername) url = `/api/users/${profileUsername}/posts?page=0`;
    if (feedType === "saved") url = `/api/saved?page=0`;
    if (feedType === "likes") url = `/api/users/${profileUsername}/liked-posts?page=0`;
    if (majlisSlug) url = `/api/majalis/${majlisSlug}/posts?page=0`;
  
    fetch(url)
      .then((res) => res.json())
      .then((data: Post[]) => {
        if (!Array.isArray(data)) return;
        setPosts(data);
        if (data.length < 10) setHasMore(false);
        const likes: Record<string, number> = {};
        const likedMap: Record<string, boolean> = {};
        const savedMap2: Record<string, boolean> = {};
        data.forEach((p) => {
          likes[p.id] = p.likes_count;
          likedMap[p.id] = p.is_liked;
          savedMap2[p.id] = p.is_saved;
        });
        setLikeCounts(likes);
        setLiked(likedMap);
        setSavedMap(savedMap2);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // infinite scroll
  useEffect(() => {
    if (loading) return;
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        setLoadingMore(true);
        setPage((prevPage) => {
          const nextPage = prevPage + 1;
          let url = `/api/posts?page=${nextPage}`;
          if (profileUsername) url = `/api/users/${profileUsername}/posts?page=${nextPage}`;
          if (feedType === "saved") url = `/api/saved?page=${nextPage}`;
          if (majlisSlug) url = `/api/majalis/${majlisSlug}/posts?page=${nextPage}`;
          fetch(url)
            .then((res) => res.json())
            .then((data: Post[]) => {
              if (data.length < 10) setHasMore(false);
              setPosts((prev) => {
                const existingIds = new Set(prev.map((p) => p.id));
                const newPosts = data.filter((p: Post) => !existingIds.has(p.id));
                return [...prev, ...newPosts];
              });
              setLikeCounts((prev) => {
                const likes: Record<string, number> = {};
                data.forEach((p: Post) => {
                  likes[p.id] = p.likes_count;
                });
                return { ...prev, ...likes };
              });
              setLoadingMore(false);
            });
          return nextPage;
        });
      }
    });

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore]);

  // إغلاق القائمة لما يضغط برا
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  async function handleDelete(postId: string) {
    if (!confirm("هل أنت متأكد من حذف المنشور؟")) return;

    const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    if (res.ok) {
      onDelete?.();
    }
  }

  async function toggleLike(postId: string) {
    if (likingPostId === postId) return;
    setLikingPostId(postId);

    const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setLiked((s) => ({ ...s, [postId]: data.liked }));
      setLikeCounts((c) => ({ ...c, [postId]: data.count }));
    }

    setLikingPostId(null);
  }

  async function toggleBookmark(postId: string) {
    if (savingPostId === postId) return;
    setSavingPostId(postId);
  
    const res = await fetch(`/api/posts/${postId}/save`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setSavedMap((s) => ({ ...s, [postId]: data.saved }));
    }
  
    setSavingPostId(null);
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-shade2 rounded-2xl p-4 animate-pulse">
            <div className="flex items-center justify-end gap-3">
              <div className="h-10 w-10 rounded-full bg-shade3" />
              <div className="flex flex-col items-end gap-1 w-48">
                <div className="h-3 bg-shade3 rounded w-full" />
                <div className="h-2 bg-shade3 rounded w-3/4" />
              </div>
            </div>
            <div className="mt-4 h-20 bg-shade3 rounded" />
            <div className="mt-3 flex gap-3">
              <div className="h-8 w-16 bg-shade3 rounded" />
              <div className="h-8 w-16 bg-shade3 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => {
        const isLiked = !!liked[post.id];
        const isBookmarked = savedMap[post.id] ?? false;
        const isExpanded = !!expanded[post.id];
        const likesDisplay = likeCounts[post.id] ?? post.likes_count;

        return (
          <article
            key={post.id}
            className="bg-shade2 border border-border rounded-2xl p-4 flex flex-col gap-3 shadow-sm transition hover:shadow-md"
            aria-labelledby={`post-${post.id}-title`}
            dir="rtl"
          >
            {/* header */}
            <header className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Link href={`/u/${post.user.username}`} className="rounded-full shrink-0" aria-label={`${post.user.username} - ملف المستخدم`}>
                <Avatar
                username={post.user.username}
                avatarUrl={post.user.avatar_url}
                lastSeen={post.user.last_seen}
                showPresence={true}
                size={48}
                 />
                </Link>

                <div className="flex flex-col items-start min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 id={`post-${post.id}-title`} className="text-white font-tajawal font-semibold text-sm truncate">
                      <Link href={`/u/${post.user.username}`} className="hover:underline">
                        {post.user.username}
                      </Link>
                    </h2>
                    {post.majlis && (
                      <Link href={`/m/${post.majlis.slug}`} className="text-[12px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-tajawal hover:bg-primary/10">
                        مجلس {post.majlis.name}
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60 font-tajawal mt-1">
                    {post.is_temporary && <FontAwesomeIcon icon={faClock} className="w-3 h-3" />}
                    <time dateTime={post.created_at}>{timeAgo(post.created_at)}</time>
                  </div>
                </div>
              </div>

              {/* optional small actions (on header) */}
              <div className="flex items-center gap-2">
                {/* optional small actions (on header) */}
                <div className="relative" ref={openMenuId === post.id ? menuRef : null}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === post.id ? null : post.id);
                    }}
                    className="text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-shade3"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="5" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="19" r="1.5" />
                    </svg>
                  </button>

                  {openMenuId === post.id && (
                    <div className="absolute left-0 top-8 bg-shade2 border border-border rounded-xl shadow-lg z-20 w-40 overflow-hidden" dir="rtl">
                      {currentUserId === post.user_id ? (
                        // منشوري
                        <>
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              setEditingPostId(post.id);
                              setEditContent(post.content);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-3 text-white font-tajawal text-sm hover:bg-shade3 transition-colors"
                          >
                            تعديل
                          </button>
                          <div className="border-t border-border" />
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              handleDelete(post.id);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-3 text-red-400 font-tajawal text-sm hover:bg-shade3 transition-colors"
                          >
                            حذف
                          </button>
                        </>
                      ) : (
                        // منشور شخص ثاني
                        <>
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              toggleBookmark(post.id);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-3 text-white font-tajawal text-sm hover:bg-shade3 transition-colors"
                          >
                            {savedMap[post.id] ? "إلغاء الحفظ" : "حفظ"}
                          </button>
                          <div className="border-t border-border" />
                          <button
                            onClick={() => setOpenMenuId(null)}
                            className="w-full flex items-center gap-2 px-4 py-3 text-red-400 font-tajawal text-sm hover:bg-shade3 transition-colors"
                          >
                            ابلاغ
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* content */}
            {editingPostId === post.id ? (
              <div className="flex flex-col gap-2" dir="rtl">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  className="w-full bg-shade3 text-white font-tajawal rounded-xl px-4 py-3 outline-none resize-none text-right leading-relaxed"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setEditingPostId(null)}
                    className="px-4 py-2 rounded-lg bg-shade3 text-white/60 font-tajawal text-sm hover:bg-border transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => handleEdit(post.id, editContent)}
                    disabled={!editContent.trim()}
                    className="px-4 py-2 rounded-lg bg-primary text-background font-tajawal font-bold text-sm disabled:opacity-40"
                  >
                    حفظ
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-right text-white font-tajawal leading-relaxed max-w-full wrap-break-word">
                <p className={`transition-all ${isExpanded ? "" : "line-clamp-4"}`}>{post.content}</p>
                {!isExpanded && post.content.length > 280 && (
                  <button
                    onClick={() => setExpanded((s) => ({ ...s, [post.id]: true }))}
                    className="mt-2 text-primary text-sm font-tajawal hover:underline focus:outline-none"
                  >
                    اقرأ المزيد
                  </button>
                )}
                {isExpanded && (
                  <button
                    onClick={() => setExpanded((s) => ({ ...s, [post.id]: false }))}
                    className="mt-2 text-white/60 text-sm font-tajawal hover:underline focus:outline-none"
                  >
                    إخفاء
                  </button>
                )}
              </div>
            )}

            {/* media */}
            {post.media_type === "image" && post.media_url && (() => {
              const images = parseMediaUrls(post.media_url);
              if (images.length === 0) return null;
              // single large image
              if (images.length === 1) {
                return (
                  <div className="mt-2 rounded-lg overflow-hidden w-full bg-black/5">
                    <img
                      src={images[0]}
                      alt="صورة المنشور"
                      loading="lazy"
                      onClick={() => openLightbox(images, 0)}
                      className="w-full h-105 sm:h-96 object-cover rounded-lg transform transition-transform hover:scale-105 cursor-pointer"
                    />
                  </div>
                );
              }

              // two images - equal columns
              if (images.length === 2) {
                return (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {images.map((url, i) => (
                      <div key={i} className="overflow-hidden rounded-lg h-52 sm:h-64 bg-black/5">
                        <img src={url} alt={`صورة ${i + 1}`} loading="lazy" onClick={() => openLightbox(images, i)} className="w-full h-full object-cover transition-transform hover:scale-105 cursor-pointer" />
                      </div>
                    ))}
                  </div>
                );
              }

              // three images: large left + two stacked right
              if (images.length === 3) {
                return (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div className="col-span-2 overflow-hidden rounded-lg h-72 sm:h-80 bg-black/5">
                      <img src={images[0]} alt="صورة 1" loading="lazy" onClick={() => openLightbox(images, 0)} className="w-full h-full object-cover transition-transform hover:scale-105 cursor-pointer" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="overflow-hidden rounded-lg h-36 sm:h-40 bg-black/5">
                        <img src={images[1]} alt="صورة 2" loading="lazy" onClick={() => openLightbox(images, 1)} className="w-full h-full object-cover transition-transform hover:scale-105 cursor-pointer" />
                      </div>
                      <div className="overflow-hidden rounded-lg h-36 sm:h-40 bg-black/5">
                        <img src={images[2]} alt="صورة 3" loading="lazy" onClick={() => openLightbox(images, 2)} className="w-full h-full object-cover transition-transform hover:scale-105 cursor-pointer" />
                      </div>
                    </div>
                  </div>
                );
              }

              // 4 or more: 2x2 grid, show +N overlay on last tile if more
              const display = images.slice(0, 4);
              const extra = images.length - 4;
              return (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {display.map((url, i) => (
                    <div key={i} className="relative overflow-hidden rounded-lg h-52 sm:h-64 bg-black/5">
                      <img src={url} alt={`صورة ${i + 1}`} loading="lazy" onClick={() => openLightbox(images, i)} className="w-full h-full object-cover transition-transform hover:scale-105 cursor-pointer" />
                      {i === 3 && extra > 0 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-lg font-semibold">
                          +{extra}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* lightbox invocation */}
            {lightboxOpen && (
              <ImageLightbox
                images={lbImages}
                startIndex={lbIndex}
                onClose={closeLightbox}
              />
            )}

            {/* actions */}
            <footer className="flex items-stretch pt-3 border-t border-border" dir="ltr" aria-label="post actions">
              {/* left: save (fills left column) */}
              <div className="flex-1 flex items-center justify-center">
                <button
                  onClick={() => toggleBookmark(post.id)}
                  disabled={savingPostId === post.id}
                  className={`w-[calc(100%-20px)] max-w-none flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors focus:outline-none ${
                    isBookmarked ? "bg-primary/10 text-primary" : "text-white/60 hover:text-primary"
                  }`}
                  aria-pressed={isBookmarked}
                  aria-label={isBookmarked ? "محفوظ" : "حفظ"}
                >
                  {savingPostId === post.id ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={isBookmarked ? faBookmarkSolid : faBookmarkOutline} className="text-[20px]" />
                  )}
                  <span className="font-tajawal text-base">حفظ</span>
                </button>
              </div>

              {/* middle: comment (fills center column) with left/right thin borders as separators */}
              <div className="flex-1 flex items-center justify-center border-x border-border/60">
                <button
                  onClick={() => (window.location.href = `/post/${post.id}`)}
                  className="w-full max-w-none flex items-center justify-center gap-3 px-4 py-3 rounded-none text-white/60 hover:text-primary transition-colors focus:outline-none"
                  aria-label="التعليقات"
                >
                  <FontAwesomeIcon icon={faComment} className="text-[20px]" />
                  <span className="font-tajawal text-base">{post.comments_count}</span>
                </button>
              </div>

              {/* right: like (fills right column) */}
              <div className="flex-1 flex items-center justify-center">
                <button
                  onClick={() => toggleLike(post.id)}
                  disabled={likingPostId === post.id}
                  className={`w-[calc(100%-20px)] max-w-none flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors focus:outline-none ${
                    isLiked ? "bg-primary/20 text-primary" : "text-white/60 hover:text-primary"
                  }`}
                  aria-pressed={isLiked}
                  aria-label={isLiked ? "تم الإعجاب" : "إعجاب"}
                >
                  {likingPostId === post.id ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={isLiked ? faHeartSolid : faHeartOutline} className="text-[20px]" />
                  )}
                  <span className="font-tajawal text-base">{likesDisplay}</span>
                </button>
              </div>
            </footer>
          </article>
        );
      })}

      {/* مؤشر التحميل */}
      <div ref={loaderRef} className="py-4 text-center">
        {hasMore ? (
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        ) : (
          <p className="text-white/40 font-tajawal text-sm">لا يوجد المزيد من المنشورات</p>
        )}
      </div>
    </div>
  );
}

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