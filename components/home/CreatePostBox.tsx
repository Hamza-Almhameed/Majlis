"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";

interface CreatePostBoxProps {
  username: string;
  avatarUrl?: string | null;
  onPost?: () => void;
  majlisId?: string;
  majlisIsPrivate?: boolean;
}

export default function CreatePostBox({ username, avatarUrl , onPost, majlisId, majlisIsPrivate }: CreatePostBoxProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleQuickPost() {
    if (!content.trim()) return;
    setLoading(true);

    const res = await fetch("/api/posts/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        visibility: majlisIsPrivate ? "majlis_only" : "public",
        majlis_id: majlisId || null,
      }),
    });

    setLoading(false);
    if (res.ok) {
      setContent("");
      onPost?.();
    }
  }

  return (
    <div
      className="mb-4 rounded-lg p-4 bg-shade1 border border-shade2 shadow-sm ring-1 ring-white/6"
      dir="rtl"
    >
      
      <div className="flex items-center gap-3">
        <Avatar username={username} avatarUrl={avatarUrl} size={40} />
        <div className="flex-1">
          <input
            type="text"
            placeholder="شاركنا شيئاً..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleQuickPost()}
            className="w-full bg-transparent text-white placeholder-white/50 font-tajawal rounded-md px-4 py-2 outline-none border border-transparent focus:border-primary/40 focus:bg-shade3/30 transition"
            aria-label="ماذا تفكر؟"
          />
          <div className="mt-2 text-[12px] text-white/50 font-tajawal">ما الذي يدور في بالك؟</div>
        </div>
      </div>


      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={handleQuickPost}
          disabled={loading || !content.trim()}
          className="inline-flex items-center gap-2 bg-primary text-background font-tajawal font-semibold px-4 py-2 rounded-full disabled:opacity-40 hover:opacity-95 transition text-sm shadow-sm"
        >
          {loading ? "جاري النشر..." : "نشر"}
        </button>

        <button
          onClick={() => router.push("/create-post")}
          className="text-white/50 text-sm font-tajawal hover:text-primary transition-colors"
        >
          منشور متقدم ←
        </button>
      </div>
    </div>
  );
}