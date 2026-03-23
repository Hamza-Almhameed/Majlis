"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faPen, faUsers } from "@fortawesome/free-solid-svg-icons";
import Avatar from "@/components/ui/Avatar";
import RightSidebar from "@/components/home/RightSidebar";
import LeftSidebar from "@/components/home/LeftSidebar";
import Feed from "@/components/home/Feed";

interface UserProfile {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  badges: string[];
  created_at: string;
  posts_count: number;
  likes_received: number;
  majalis_count: number;
  is_own_profile: boolean;
  last_seen: string | null;
}

interface MajlisMember {
  role: string;
  majlis: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    members_count: number;
  };
}

type Tab = "posts" | "likes" | "saved";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [majalis, setMajalis] = useState<MajlisMember[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  const isOnline = profile?.last_seen
  ? (Date.now() - new Date(profile.last_seen).getTime()) < 3 * 60 * 1000
  : false;

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then(setCurrentUser);

    fetch(`/api/users/${username}`)
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setLoading(false);
      });

    fetch(`/api/users/${username}/majalis`)
      .then((r) => r.json())
      .then(setMajalis);
  }, [username]);

  if (loading) return (
    <main className="bg-background min-h-screen p-6">
      <div className="flex gap-6 w-full max-w-6xl mr-auto">
        <div className="w-72 shrink-0"><LeftSidebar /></div>
        <div className="flex-1 bg-shade2 rounded-2xl animate-pulse h-64" />
        <div className="w-72 shrink-0"><RightSidebar /></div>
      </div>
    </main>
  );

  if (!profile) return (
    <main className="bg-background min-h-screen p-6 flex items-center justify-center">
      <p className="text-white/40 font-tajawal text-xl">المستخدم غير موجود</p>
    </main>
  );

  return (
    <main className="bg-background min-h-screen p-6">
      <div className="flex gap-6 w-full mx-auto">
        <div className="w-72 shrink-0"><LeftSidebar /></div>

        <div className="flex-1 flex flex-col gap-4">

          {/* هيدر */}
          <div className="flex items-center gap-3" dir="rtl">
            <button onClick={() => router.back()} className="text-white/50 hover:text-white transition-colors">
              <FontAwesomeIcon icon={faArrowRight} className="w-5 h-5" />
            </button>
            <h1 className="text-white font-tajawal font-bold text-xl">{profile.username}</h1>
          </div>

          {/* بطاقة البروفايل */}
          <div className="bg-shade2 border border-border rounded-2xl p-6 flex flex-col gap-4" dir="rtl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar username={profile.username} avatarUrl={profile.avatar_url} size={72} />
                <div className="flex flex-col gap-1">
                  <h2 className="text-white font-tajawal text-2xl">{profile.username}</h2>
                  <p className="text-white/40 font-tajawal text-sm">
                    انضم {timeAgo(profile.created_at)}
                  </p>
                  <p className="font-tajawal text-xs flex items-center gap-1 mt-1">
                    {isOnline ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                        <span className="text-primary">متواجد الآن</span>
                      </>
                    ) : profile.last_seen ? (
                      <span className="text-white/30">آخر تواجد {timeAgo(profile.last_seen)}</span>
                    ) : (
                      <></>
                    )}
                  </p>
                </div>
              </div>

              {profile.is_own_profile && (
                <Link href="/edit-profile"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-shade3 text-white font-tajawal text-sm hover:bg-border transition-colors">
                  <FontAwesomeIcon icon={faPen} className="w-3 h-3" />
                  تعديل الملف
                </Link>
              )}
            </div>

            {/* البايو */}
            {profile.bio && (
              <p className="text-white/80 font-tajawal leading-relaxed">{profile.bio}</p>
            )}

            {/* الإحصائيات */}
            <div className="flex items-center gap-6 py-3 border-y border-border">
              <div className="flex flex-col items-center gap-1">
                <span className="text-white font-tajawal font-bold text-lg">{profile.posts_count}</span>
                <span className="text-white/40 font-tajawal text-xs">منشور</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-white font-tajawal font-bold text-lg">{profile.likes_received}</span>
                <span className="text-white/40 font-tajawal text-xs">إعجاب</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-white font-tajawal font-bold text-lg">{profile.majalis_count}</span>
                <span className="text-white/40 font-tajawal text-xs">مجلس</span>
              </div>
            </div>

            {/* الشارات */}
            {profile.badges && profile.badges.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-white/60 font-tajawal text-sm">الشارات</h3>
                <div className="flex gap-2 flex-wrap">
                  {profile.badges.slice(0, 5).map((badge, i) => (
                    <span key={i} className="bg-primary/10 text-primary font-tajawal text-xs px-3 py-1 rounded-full border border-primary/20">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* المجالس */}
            {majalis.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-white/60 font-tajawal text-sm">المجالس</h3>
                <div className="flex gap-2 flex-wrap">
                  {majalis.map((m, i) => (
                    <Link key={i} href={`/m/${m.majlis.slug}`}
                      className="flex items-center gap-1 bg-shade3 text-white font-tajawal text-xs px-3 py-1 rounded-full hover:bg-border transition-colors">
                      <FontAwesomeIcon icon={faUsers} className="w-3 h-3 text-primary" />
                      {m.majlis.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* التبويبات */}
          <div className="flex border-b border-border" dir="rtl">
            {[
              { key: "posts", label: "المنشورات" },
              ...(profile.is_own_profile ? [
                { key: "likes", label: "الإعجابات" },
                { key: "saved", label: "المحفوظات" },
              ] : []),
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as Tab)}
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

          {/* محتوى التبويب */}
          {activeTab === "posts" && (
            <Feed
              key={`${username}-posts`}
              currentUserId={currentUser?.id}
              profileUsername={username}
            />
          )}

          {activeTab === "likes" && profile.is_own_profile && (
            <Feed
              key={`${username}-likes`}
              currentUserId={currentUser?.id}
              profileUsername={username}
              feedType="likes"
            />
          )}

          {activeTab === "saved" && profile.is_own_profile && (
            <Feed
              key={`${username}-saved`}
              currentUserId={currentUser?.id}
              feedType="saved"
            />
          )}
        </div>

        <div className="w-72 shrink-0"><RightSidebar /></div>
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