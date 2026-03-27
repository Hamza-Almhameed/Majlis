"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight, faUsers, faChartBar,
  faCheck, faXmark, faShield, faUser, faCrown, faTrash
} from "@fortawesome/free-solid-svg-icons";
import Avatar from "@/components/ui/Avatar";
import RightSidebar from "@/components/home/RightSidebar";
import LeftSidebar from "@/components/home/LeftSidebar";

interface Member {
  role: string;
  joined_at: string;
  user: { id: string; username: string; avatar_url: string | null };
}

interface JoinRequest {
  id: string;
  status: string;
  created_at: string;
  user: { id: string; username: string; avatar_url: string | null };
}

interface ManageData {
  members: Member[];
  joinRequests: JoinRequest[];
  stats: { posts_count: number; posts_this_week: number; members_count: number };
  current_user_role: string;
  majlis_owner_id: string;
}

export default function ManageMajlisPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [data, setData] = useState<ManageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stats" | "members" | "requests">("stats");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setCurrentUserId(d.id));
    fetchData();
  }, [slug]);

  async function fetchData() {
    const res = await fetch(`/api/majalis/${slug}/manage`);
    if (!res.ok) { router.push(`/m/${slug}`); return; }
    const d = await res.json();
    setData(d);
    setLoading(false);
  }

  async function handleMemberAction(userId: string, action: "promote" | "demote" | "kick") {
    if (action === "kick" && !confirm("هل أنت متأكد من طرد هذا العضو؟")) return;

    if (action === "kick") {
      await fetch(`/api/majalis/${slug}/members/${userId}`, { method: "DELETE" });
    } else {
      await fetch(`/api/majalis/${slug}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: action === "promote" ? "moderator" : "member" }),
      });
    }
    fetchData();
  }

  async function handleRequest(requestId: string, action: "approve" | "reject") {
    await fetch(`/api/majalis/${slug}/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    fetchData();
  }

  if (loading) return (
    <main className="bg-background min-h-screen p-6">
      <div className="flex gap-6 w-full mx-auto">
        <div className="w-72 shrink-0"><LeftSidebar /></div>
        <div className="flex-1 bg-shade2 rounded-2xl animate-pulse h-64" />
        <div className="w-72 shrink-0"><RightSidebar /></div>
      </div>
    </main>
  );

  const isOwner = data?.current_user_role === "owner";

  return (
    <main className="bg-background min-h-screen p-6">
      <div className="flex gap-6 w-full mx-auto">
        <div className="w-72 shrink-0"><LeftSidebar /></div>

        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between" dir="rtl">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="text-white/50 hover:text-white transition-colors">
                <FontAwesomeIcon icon={faArrowRight} className="w-5 h-5" />
              </button>
              <h1 className="text-white font-tajawal font-bold text-xl">إدارة المجلس</h1>
            </div>
            {isOwner && (
              <Link href={`/m/${slug}/edit`}
                className="text-primary font-tajawal text-sm hover:underline">
                تعديل المجلس
              </Link>
            )}
          </div>


          <div className="flex border-b border-border" dir="rtl">
            {[
              { key: "stats", label: "الإحصائيات", icon: faChartBar },
              { key: "members", label: `الأعضاء (${data?.stats.members_count})`, icon: faUsers },
              { key: "requests", label: `الطلبات (${data?.joinRequests.length})`, icon: faUser },
            ].map((tab) => (
              <button key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-5 py-3 font-tajawal text-sm transition-colors border-b-2 ${
                  activeTab === tab.key ? "text-primary border-primary" : "text-white/40 border-transparent hover:text-white"
                }`}
              >
                <FontAwesomeIcon icon={tab.icon} className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>


          {activeTab === "stats" && (
            <div className="grid grid-cols-3 gap-4" dir="rtl">
              {[
                { label: "إجمالي المنشورات", value: data?.stats.posts_count },
                { label: "منشورات هذا الأسبوع", value: data?.stats.posts_this_week },
                { label: "عدد الأعضاء", value: data?.stats.members_count },
              ].map((stat, i) => (
                <div key={i} className="bg-shade2 border border-border rounded-2xl p-5 flex flex-col gap-1 items-center text-center">
                  <span className="text-white font-tajawal font-bold text-3xl">{stat.value}</span>
                  <span className="text-white/40 font-tajawal text-sm">{stat.label}</span>
                </div>
              ))}
            </div>
          )}


          {activeTab === "members" && (
            <div className="flex flex-col gap-2">
              {data?.members.map((member) => (
                <div key={member.user.id} className="bg-shade2 border border-border rounded-2xl p-4 flex items-center justify-between" dir="rtl">
                  <div className="flex items-center gap-3">
                  <Avatar username={member.user.username} avatarUrl={member.user.avatar_url} size={40} />
                    <div className="flex flex-col">
                      <Link href={`/u/${member.user.username}`} className="text-white font-tajawal font-bold text-sm hover:underline">
                        {member.user.username}
                      </Link>
                      <span className={`font-tajawal text-xs ${
                        member.role === "owner" ? "text-yellow-400" :
                        member.role === "moderator" ? "text-primary" : "text-white/40"
                      }`}>
                        {member.role === "owner" ? "المؤسس" : member.role === "moderator" ? "مشرف" : "عضو"}
                      </span>
                    </div>
                    
                  </div>
                  
                  <div className="flex items-center gap-3">
                    
                    {isOwner && member.user.id !== currentUserId && member.role !== "owner" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMemberAction(member.user.id, member.role === "moderator" ? "demote" : "promote")}
                          className={`p-2 rounded-lg text-xs font-tajawal transition-colors ${
                            member.role === "moderator"
                              ? "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                              : "bg-primary/10 text-primary hover:bg-primary/20"
                          }`}
                          title={member.role === "moderator" ? "إزالة من الإشراف" : "ترقية لمشرف"}
                        >
                          <FontAwesomeIcon icon={member.role === "moderator" ? faUser : faShield} className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMemberAction(member.user.id, "kick")}
                          className="p-2 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors"
                          title="طرد"
                        >
                          <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  
                </div>
              ))}
            </div>
          )}


          {activeTab === "requests" && (
            <div className="flex flex-col gap-2">
              {data?.joinRequests.length === 0 ? (
                <div className="bg-shade2 border border-border rounded-2xl p-8 text-center" dir="rtl">
                  <p className="text-white/40 font-tajawal">لا يوجد طلبات انضمام معلقة</p>
                </div>
              ) : (
                data?.joinRequests.map((req) => (
                  <div key={req.id} className="bg-shade2 border border-border rounded-2xl p-4 flex items-center justify-between" dir="rtl">
                    <div className="flex items-center gap-3">
                    <Avatar username={req.user.username} avatarUrl={req.user.avatar_url} size={40} />
                      <div className="flex flex-col items-start">
                        <Link href={`/u/${req.user.username}`} className="text-white font-tajawal font-bold text-sm hover:underline">
                          {req.user.username}
                        </Link>
                        <span className="text-white/40 font-tajawal text-xs">{timeAgo(req.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRequest(req.id, "approve")}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary/10 text-primary font-tajawal text-sm hover:bg-primary/20 transition-colors"
                      >
                        <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                        قبول
                      </button>
                      <button
                        onClick={() => handleRequest(req.id, "reject")}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-400/10 text-red-400 font-tajawal text-sm hover:bg-red-400/20 transition-colors"
                      >
                        <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
                        رفض
                      </button>
                    </div>
                  </div>
                ))
              )}
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
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}