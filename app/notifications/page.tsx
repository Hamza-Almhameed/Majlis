"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faHeart, faComment, faReply, faStar } from "@fortawesome/free-solid-svg-icons";
import Avatar from "@/components/ui/Avatar";
import RightSidebar from "@/components/home/RightSidebar";
import LeftSidebar from "@/components/home/LeftSidebar";

interface Notification {
  id: string;
  type: "like_post" | "comment_post" | "reply_comment" | "like_comment" | "badge_earned";
  is_read: boolean;
  created_at: string;
  post_id: string | null;
  comment_id: string | null;
  actor: { username: string; avatar_url: string | null };
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(Array.isArray(data) ? data : []);
        setLoading(false);
      });

    // علم كل الإشعارات كمقروءة
    fetch("/api/notifications", { method: "PATCH" });
  }, []);

  function getNotificationText(n: Notification) {
    switch (n.type) {
      case "like_post": return "أعجب بمنشورك";
      case "comment_post": return "علق على منشورك";
      case "reply_comment": return "رد على تعليقك";
      case "like_comment": return "أعجب بتعليقك";
      case "badge_earned": return "حصلت على شارة جديدة!";
    }
  }

  function getNotificationIcon(type: Notification["type"]) {
    switch (type) {
      case "like_post":
      case "like_comment":
        return <FontAwesomeIcon icon={faHeart} className="w-4 h-4 text-red-400" />;
      case "comment_post":
        return <FontAwesomeIcon icon={faComment} className="w-4 h-4 text-primary" />;
      case "reply_comment":
        return <FontAwesomeIcon icon={faReply} className="w-4 h-4 text-primary" />;
      case "badge_earned":
        return <FontAwesomeIcon icon={faStar} className="w-4 h-4 text-yellow-400" />;
    }
  }

  function getNotificationLink(n: Notification) {
    if (n.post_id) return `/post/${n.post_id}`;
    if (n.type === "badge_earned") return "/badges";
    return "#";
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
            <h1 className="text-white font-tajawal font-bold text-xl">التنبيهات</h1>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-shade2 rounded-2xl p-4 animate-pulse h-16" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-shade2 border border-border rounded-2xl p-8 text-center" dir="rtl">
              <p className="text-white/40 font-tajawal">لا يوجد تنبيهات</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={getNotificationLink(n)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-colors hover:bg-shade3 ${
                    n.is_read ? "bg-shade2 border-border" : "bg-primary/5 border-primary/20"
                  }`}
                  dir="rtl"
                >
                  <div className="relative">
                    <Avatar username={n.actor.username} avatarUrl={n.actor.avatar_url} size={44} />
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-shade2 flex items-center justify-center">
                      {getNotificationIcon(n.type)}
                    </div>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <p className="text-white font-tajawal text-sm">
                      <span className="font-bold">{n.actor.username}</span>
                      {" "}
                      {getNotificationText(n)}
                    </p>
                    <span className="text-white/40 font-tajawal text-xs">{timeAgo(n.created_at)}</span>
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  )}
                </Link>
              ))}
            </div>
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