"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import Feed from "@/components/home/Feed";
import RightSidebar from "@/components/home/RightSidebar";
import LeftSidebar from "@/components/home/LeftSidebar";

export default function SavedPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data));

    fetch("/api/saved")
      .then((res) => res.json())
      .then((data) => {
        setPosts(data);
        setLoading(false);
      });
  }, []);

  return (
    <main className="bg-background min-h-screen p-6">
      <div className="flex gap-6 w-full mx-auto">

        {/* يسار  */}
        <div className="w-72 shrink-0">
          <LeftSidebar />
        </div>

        {/* وسط */}
        <div className="flex-1 flex flex-col gap-4">
          {/* هيدر */}
          <div className="flex items-center gap-3" dir="rtl">
            <button
              onClick={() => router.back()}
              className="text-white/50 hover:text-white transition-colors"
            >
              <FontAwesomeIcon icon={faArrowRight} className="w-5 h-5" />
            </button>
            <FontAwesomeIcon icon={faBookmark} className="w-5 h-5 text-primary" />
            <h1 className="text-white font-tajawal font-bold text-xl">المحفوظات</h1>
          </div>

          {loading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-shade2 rounded-2xl p-4 animate-pulse h-32" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-shade2 border border-border rounded-2xl p-8 text-center" dir="rtl">
              <FontAwesomeIcon icon={faBookmark} className="w-10 h-10 text-white/20 mb-3" />
              <p className="text-white/40 font-tajawal">لا يوجد منشورات محفوظة</p>
            </div>
          ) : (
            <Feed
              key="saved"
              currentUserId={user?.id}
              initialPosts={posts}
              disablePagination
            />
          )}
        </div>

        

        {/* يمين */}
        <div className="w-72 shrink-0">
          <RightSidebar />
        </div>
      </div>
    </main>
  );
}