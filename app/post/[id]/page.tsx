"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faHeart as faHeartSolid, faEllipsisVertical, faBookmark as faBookmarkSolid, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartOutline, faComment, faBookmark as faBookmarkOutline , faComments} from "@fortawesome/free-regular-svg-icons";
import Avatar from "@/components/ui/Avatar";
import RightSidebar from "@/components/home/RightSidebar";
import LeftSidebar from "@/components/home/LeftSidebar";
import ImageLightbox from "@/components/ui/ImageLightbox";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  likes_count: number;
  is_liked: boolean;
  user: { username: string; avatar_url: string | null };
  replies?: Comment[];
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: string;
  created_at: string;
  is_liked: boolean;
  likes_count: number;
  comments_count: number;
  user: { username: string; avatar_url: string | null };
  majlis: { name: string; slug: string } | null;
  is_saved?: boolean;
}

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likingPost, setLikingPost] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [likingCommentId, setLikingCommentId] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const [isSaved, setIsSaved] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [postMenuOpen, setPostMenuOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [editPostContent, setEditPostContent] = useState("");

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lbImages, setLbImages] = useState<string[]>([]);
  const [lbIndex, setLbIndex] = useState(0);

  const commentRef = useRef<HTMLTextAreaElement | null>(null);

  // comment sorting: default to most liked first
  const [commentSort, setCommentSort] = useState<"most_liked" | "newest" | "oldest">("most_liked");
  const [commentSortOpen, setCommentSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement | null>(null);

  // helper to sort comments client-side
  function sortComments(list: Comment[], mode: "most_liked" | "newest" | "oldest") {
    const copy = [...list];
    if (mode === "most_liked") {
      return copy.sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0));
    }
    if (mode === "newest") {
      return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    // oldest
    return copy.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  // close sort dropdown on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setCommentSortOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const fetchComments = useCallback(async (pageNum: number, replace = false) => {
    const res = await fetch(`/api/posts/${id}/comments?page=${pageNum}`);
    const data = await res.json();

    if (!Array.isArray(data)) return;
    if (data.length < 5) setHasMore(false);
    setComments((prev) => {
      const combined = replace ? data : [...prev, ...data];
      return sortComments(combined, commentSort);
    });
  }, [id, commentSort]);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then(setCurrentUser);
    fetch(`/api/posts/${id}`).then((r) => r.json()).then((data) => {
      setPost(data);
      setIsLiked(data.is_liked);
      setLikesCount(data.likes_count);
      setIsSaved(data.is_saved ?? false);
      setLoading(false);
    });
  }, [id]);

  // when user changes the comment sorting mode, reset pagination and reload first page
  useEffect(() => {
    // reset pagination & comments
    setPage(0);
    setHasMore(true);
    setComments([]);
    fetchComments(0, true);
  }, [commentSort, fetchComments]);

  useEffect(() => {
    if (loading) return;
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        setLoadingMore(true);
        const nextPage = page + 1;
        setPage(nextPage);
        fetchComments(nextPage).finally(() => setLoadingMore(false));
      }
    }, { threshold: 0.1 });

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page, fetchComments, loading]);

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

  async function toggleBookmarkPost() {
    if (savingPost) return;
    setSavingPost(true);
    const res = await fetch(`/api/posts/${id}/save`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setIsSaved(data.saved);
    }
    setSavingPost(false);
  }

  async function handleDeletePost() {
    if (!confirm("هل أنت متأكد من حذف المنشور؟")) return;
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/");
    }
  }

  async function handleEditPost() {
    if (!editPostContent.trim()) return;
    const res = await fetch(`/api/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editPostContent }),
    });
    if (res.ok) {
      setPost((p) => (p ? { ...p, content: editPostContent } : p));
      setEditingPost(false);
    }
  }

  async function handleSubmitComment() {
    if (!newComment.trim()) return;
    setSubmitting(true);

    const res = await fetch(`/api/posts/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: newComment,
        parent_id: replyingTo?.id || null,
      }),
    });

    if (res.ok) {
      const comment = await res.json();
      if (replyingTo) {
        setComments((prev) => prev.map((c) =>
          c.id === replyingTo.id
            ? { ...c, replies: [...(c.replies || []), comment] }
            : c
        ));
      } else {
        setComments((prev) => [comment, ...prev]);
      }
      setNewComment("");
      setReplyingTo(null);
    }
    setSubmitting(false);
  }

  async function togglePostLike() {
    if (likingPost) return;
    setLikingPost(true);
    const res = await fetch(`/api/posts/${id}/like`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setIsLiked(data.liked);
      setLikesCount(data.count);
    }
    setLikingPost(false);
  }

  async function toggleCommentLike(commentId: string) {
    if (likingCommentId === commentId) return;
    setLikingCommentId(commentId);
    const res = await fetch(`/api/comments/${commentId}/like`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setComments((prev) => prev.map((c) =>
        c.id === commentId ? { ...c, is_liked: data.liked, likes_count: data.count } : c
      ));
    }
    setLikingCommentId(null);
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("هل أنت متأكد من حذف التعليق؟")) return;
    const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  }

  async function handleEditComment(commentId: string, content: string) {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      setComments((prev) => prev.map((c) =>
        c.id === commentId ? { ...c, content } : c
      ));
      setEditingCommentId(null);
    }
  }

  if (loading) return (
    <main className="bg-background min-h-screen p-6">
      <div className="flex gap-6 w-full max-w-6xl mx-auto">
        <LeftSidebar />
        <div className="w-64" />
        <div className="flex-1 bg-shade2 rounded-2xl animate-pulse h-64" />
        <div className="w-72 min-w-[18rem]" />
        <RightSidebar />
      </div>
    </main>
  );

  if (!post) return (
    <main className="bg-background min-h-screen p-6 flex items-center justify-center">
      <p className="text-white/40 font-tajawal">المنشور غير موجود</p>
    </main>
  );

  return (
    <main className="bg-background min-h-screen p-6">
      <div className="flex gap-6 w-full mx-auto">
        <div className="w-72 shrink-0">
          <LeftSidebar />
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center gap-3" dir="rtl">
            <button onClick={() => router.back()} className="text-white/50 hover:text-white transition-colors">
              <FontAwesomeIcon icon={faArrowRight} className="w-5 h-5" />
            </button>
            <h1 className="text-white font-tajawal font-bold text-xl">المنشور</h1>
          </div>

          <article className="bg-shade2 border border-border rounded-2xl p-4 flex flex-col gap-3 shadow-sm" dir="rtl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Link href={`/u/${post.user.username}`}>
                  <Avatar username={post.user.username} avatarUrl={post.user.avatar_url} size={48} />
                </Link>
                <div className="flex flex-col">
                  <Link href={`/u/${post.user.username}`} className="text-white font-tajawal font-bold hover:underline">
                    {post.user.username}
                  </Link>
                  {post.majlis && (
                    <Link href={`/m/${post.majlis.slug}`} className="text-primary font-tajawal text-sm">
                      مجلس {post.majlis.name}
                    </Link>
                  )}
                  <div className="flex items-center gap-2 text-xs text-white/60 font-tajawal mt-1">
                    <time dateTime={post.created_at}>{timeAgo(post.created_at)}</time>
                  </div>
                </div>
              </div>

              <div className="relative">
                <button onClick={() => setPostMenuOpen((s) => !s)}
                  className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-shade3 transition-colors">
                  <FontAwesomeIcon icon={faEllipsisVertical} className="w-5 h-5" />
                </button>

                {postMenuOpen && (
                  <div className="absolute left-0 top-8 bg-shade2 border border-border rounded-xl shadow-lg z-20 w-40 overflow-hidden" dir="rtl">
                    {currentUser?.id === post.user_id ? (
                      <>
                        <button onClick={() => { setEditingPost(true); setEditPostContent(post.content); setPostMenuOpen(false); }}
                          className="w-full flex items-center gap-2 px-4 py-3 text-white font-tajawal text-sm hover:bg-shade3 transition-colors">
                          تعديل
                        </button>
                        <div className="border-t border-border" />
                        <button onClick={() => { setPostMenuOpen(false); handleDeletePost(); }}
                          className="w-full flex items-center gap-2 px-4 py-3 text-red-400 font-tajawal text-sm hover:bg-shade3 transition-colors">
                          حذف
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { toggleBookmarkPost(); setPostMenuOpen(false); }}
                          className="w-full flex items-center gap-2 px-4 py-3 text-white font-tajawal text-sm hover:bg-shade3 transition-colors">
                          {isSaved ? "إلغاء الحفظ" : "حفظ"}
                        </button>
                        <div className="border-t border-border" />
                        <button onClick={() => setPostMenuOpen(false)}
                          className="w-full flex items-center gap-2 px-4 py-3 text-red-400 font-tajawal text-sm hover:bg-shade3 transition-colors">
                          ابلاغ
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {editingPost ? (
              <div className="flex flex-col gap-2" dir="rtl">
                <textarea
                  value={editPostContent}
                  onChange={(e) => setEditPostContent(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  className="w-full bg-shade3 text-white font-tajawal rounded-xl px-4 py-3 outline-none resize-none text-right leading-relaxed"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingPost(false)}
                    className="px-4 py-2 rounded-lg bg-shade3 text-white/60 font-tajawal text-sm hover:bg-border transition-colors">
                    إلغاء
                  </button>
                  <button onClick={handleEditPost}
                    disabled={!editPostContent.trim()}
                    className="px-4 py-2 rounded-lg bg-primary text-background font-tajawal font-bold text-sm disabled:opacity-40">
                    حفظ
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-white font-tajawal leading-relaxed text-right">{post.content}</p>
            )}

            {post.media_type === "image" && post.media_url && (() => {
              const images = parseMediaUrls(post.media_url);
              if (images.length === 0) return null;
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

            {lightboxOpen && (
              <ImageLightbox images={lbImages} startIndex={lbIndex} onClose={closeLightbox} />
            )}

            <div className="flex items-stretch pt-3 border-t border-border" dir="ltr" aria-label="post actions">
              <div className="flex-1 flex items-center justify-center">
                <button
                  onClick={toggleBookmarkPost}
                  disabled={savingPost}
                  className={`w-[calc(100%-20px)] max-w-none flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors focus:outline-none ${
                    isSaved ? "bg-primary/10 text-primary" : "text-white/60 hover:text-primary"
                  }`}
                  aria-pressed={isSaved}
                  aria-label={isSaved ? "محفوظ" : "حفظ"}
                >
                  {savingPost ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={isSaved ? faBookmarkSolid : faBookmarkOutline} className="text-[20px]" />
                  )}
                  <span className="font-tajawal text-base">حفظ</span>
                </button>
              </div>

              <div className="flex-1 flex items-center justify-center border-x border-border/60">
                <button
                  onClick={() => { commentRef.current?.focus(); }}
                  className="w-full max-w-none flex items-center justify-center gap-3 px-4 py-3 rounded-none text-white/60 hover:text-primary transition-colors focus:outline-none"
                  aria-label="التعليقات"
                >
                  <FontAwesomeIcon icon={faComment} className="text-[20px]" />
                  <span className="font-tajawal text-base">{comments.length}</span>
                </button>
              </div>

              <div className="flex-1 flex items-center justify-center">
                <button
                  onClick={togglePostLike}
                  disabled={likingPost}
                  className={`w-[calc(100%-20px)] max-w-none flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors focus:outline-none ${
                    isLiked ? "bg-primary/20 text-primary" : "text-white/60 hover:text-primary"
                  }`}
                  aria-pressed={isLiked}
                  aria-label={isLiked ? "تم الإعجاب" : "إعجاب"}
                >
                  {likingPost ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={isLiked ? faHeartSolid : faHeartOutline} className="text-[20px]" />
                  )}
                  <span className="font-tajawal text-base">{likesCount}</span>
                </button>
              </div>
            </div>
          </article>

          {/* improved composer */}
          <div className="bg-shade1 border border-border rounded-2xl p-4 flex gap-3 items-start" dir="rtl">
            <Avatar username={currentUser?.username || ""} size={44} />
            <div className="flex-1">
              {replyingTo && (
                <div className="flex items-center justify-between bg-shade3/60 border border-border rounded-lg px-3 py-2 mb-3">
                  <span className="text-white/60 font-tajawal text-sm">رد على {replyingTo.user.username}</span>
                  <button onClick={() => setReplyingTo(null)} className="text-white/40 hover:text-white text-xs font-tajawal">إلغاء</button>
                </div>
              )}

              <textarea
                ref={commentRef}
                placeholder={replyingTo ? `رد على ${replyingTo.user.username}...` : "اكتب تعليقاً..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="w-full bg-shade3 text-white placeholder-white/40 font-tajawal rounded-xl px-4 py-3 outline-none resize-none text-right border border-transparent focus:border-border transition-colors"
              />

              <div className="mt-2 flex items-center justify-between">
                <div className="text-white/40 text-xs font-tajawal">
                  {newComment.length}/2000
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setNewComment(""); setReplyingTo(null); commentRef.current?.blur(); }}
                    className="px-3 py-1 rounded-lg bg-shade3 text-white/60 font-tajawal text-sm hover:bg-border transition-colors"
                  >
                    مسح
                  </button>
                  <button
                    onClick={handleSubmitComment}
                    disabled={submitting || !newComment.trim()}
                    className="px-4 py-2 rounded-xl bg-primary text-background font-tajawal font-bold text-sm disabled:opacity-40"
                  >
                    {submitting ? "جاري الإرسال..." : replyingTo ? "رد" : "تعليق"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* improved comment list */}
          <div className="flex flex-col gap-3">
            {/* sort control (custom dropdown) */}
            <div className="flex items-center justify-between gap-3 px-2" dir="rtl">
              <div className="text-white/60 font-tajawal text-sm">ترتيب التعليقات:</div>
              <div className="relative" ref={sortRef}>
                <button
                  onClick={() => setCommentSortOpen((s) => !s)}
                  aria-haspopup="menu"
                  aria-expanded={commentSortOpen}
                  className="flex items-center gap-2 bg-shade3/60 text-white rounded-lg px-3 py-1 text-sm border border-transparent hover:border-primary transition"
                >
                  <span className="font-tajawal">
                    {commentSort === "most_liked" ? "الأكثر إعجاباً" : commentSort === "newest" ? "الأحدث" : "الأقدم"}
                  </span>
                  <FontAwesomeIcon icon={commentSortOpen ? faChevronUp : faChevronDown} className="w-3 h-3 text-white/60" />
                </button>

                {commentSortOpen && (
                  <div className="absolute right-0 mt-2 bg-shade2 border border-border rounded-xl shadow-lg z-30 w-44 overflow-hidden" dir="rtl">
                    <button
                      onClick={() => { setCommentSort("most_liked"); setCommentSortOpen(false); }}
                      className={`w-full text-right px-4 py-3 text-sm font-tajawal ${commentSort === "most_liked" ? "bg-shade3" : "hover:bg-shade3"}`}
                    >
                      الأكثر إعجاباً
                    </button>
                    <div className="border-t border-border" />
                    <button
                      onClick={() => { setCommentSort("newest"); setCommentSortOpen(false); }}
                      className={`w-full text-right px-4 py-3 text-sm font-tajawal ${commentSort === "newest" ? "bg-shade3" : "hover:bg-shade3"}`}
                    >
                      الأحدث
                    </button>
                    <div className="border-t border-border" />
                    <button
                      onClick={() => { setCommentSort("oldest"); setCommentSortOpen(false); }}
                      className={`w-full text-right px-4 py-3 text-sm font-tajawal ${commentSort === "oldest" ? "bg-shade3" : "hover:bg-shade3"}`}
                    >
                      الأقدم
                    </button>
                  </div>
                )}
              </div>
            </div>
            {comments.length === 0 ? (
              <p className="text-white/40 font-tajawal text-center py-6">لا يوجد تعليقات بعد</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="bg-shade3/40 border border-border rounded-2xl p-3 flex flex-col gap-3" dir="rtl">
                  <div className="flex items-start gap-3">
                    <Link href={`/u/${comment.user.username}`}>
                      <Avatar username={comment.user.username} avatarUrl={comment.user.avatar_url} size={36} />
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Link href={`/u/${comment.user.username}`} className="text-white font-tajawal font-bold text-sm truncate hover:underline">
                            {comment.user.username}
                          </Link>
                          <span className="text-white/40 font-tajawal text-xs">{timeAgo(comment.created_at)}</span>
                        </div>

                        <div className="relative">
                          <button onClick={() => setOpenMenuId(openMenuId === comment.id ? null : comment.id)}
                            className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-shade3 transition-colors">
                            <FontAwesomeIcon icon={faEllipsisVertical} className="w-4 h-4" />
                          </button>
                          {openMenuId === comment.id && (
                            <div className="absolute left-0 top-8 bg-shade2 border border-border rounded-xl shadow-lg z-20 w-36 overflow-hidden">
                              {currentUser?.id === comment.user_id ? (
                                <>
                                  <button onClick={() => { setEditingCommentId(comment.id); setEditContent(comment.content); setOpenMenuId(null); }}
                                    className="w-full px-4 py-3 text-white font-tajawal text-sm hover:bg-shade3 text-right">تعديل</button>
                                  <div className="border-t border-border" />
                                  <button onClick={() => { handleDeleteComment(comment.id); setOpenMenuId(null); }}
                                    className="w-full px-4 py-3 text-red-400 font-tajawal text-sm hover:bg-shade3 text-right">حذف</button>
                                </>
                              ) : (
                                <button onClick={() => setOpenMenuId(null)}
                                  className="w-full px-4 py-3 text-red-400 font-tajawal text-sm hover:bg-shade3 text-right">ابلاغ</button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {editingCommentId === comment.id ? (
                        <div className="mt-2">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={2}
                            className="w-full bg-shade3 text-white font-tajawal rounded-xl px-3 py-2 outline-none resize-none text-right text-sm"
                          />
                          <div className="mt-2 flex gap-2 justify-end">
                            <button onClick={() => setEditingCommentId(null)}
                              className="px-3 py-1 rounded-lg bg-shade3 text-white/60 font-tajawal text-xs">إلغاء</button>
                            <button onClick={() => handleEditComment(comment.id, editContent)}
                              className="px-3 py-1 rounded-lg bg-primary text-background font-tajawal font-bold text-xs">حفظ</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-white font-tajawal text-sm leading-relaxed mt-2">{comment.content}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1 border-t border-border/50">
                    <button onClick={() => toggleCommentLike(comment.id)} disabled={likingCommentId === comment.id}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-x transition-colors ${comment.is_liked ? "bg-primary/10 text-primary" : "text-white/40 hover:text-primary"}`}>
                      {likingCommentId === comment.id
                        ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        : <FontAwesomeIcon icon={comment.is_liked ? faHeartSolid : faHeartOutline} className="w-3 h-3" />}
                      <span className="font-tajawal">{comment.likes_count}</span>
                    </button>

                    <button onClick={() => setReplyingTo(comment)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-x transition-colors text-white/40 hover:text-primary`}>
                      <FontAwesomeIcon icon={faComment} className="w-3 h-3" />
                      رد
                    </button>
                  </div>

                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 mr-6 pr-3 border-r-2 border-border flex flex-col gap-2">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-2">
                          <Link href={`/u/${reply.user.username}`}>
                            <Avatar username={reply.user.username} avatarUrl={reply.user.avatar_url} size={28} />
                          </Link>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Link href={`/u/${reply.user.username}`} className="text-white font-tajawal font-bold text-xs hover:underline">
                                {reply.user.username}
                              </Link>
                              <span className="text-white/40 font-tajawal text-xs">{timeAgo(reply.created_at)}</span>
                            </div>
                            <p className="text-white/60 font-tajawal text-sm leading-relaxed mt-1">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}

            <div ref={loaderRef} className="py-6 text-center min-h-12.5">
              {hasMore ? (
                loadingMore ? (
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                ) : null
              ) : (
                comments.length > 0 && (
                  <p className="text-white/40 font-tajawal text-sm">لا يوجد المزيد</p>
                )
              )}
            </div>
          </div>
        </div>

        <div className="w-72 shrink-0">
          <RightSidebar />
        </div>
      </div>
    </main>
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