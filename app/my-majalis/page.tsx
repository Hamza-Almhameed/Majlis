"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight, faUsers, faLock, faGlobe,
  faPlus, faCrown, faShield
} from "@fortawesome/free-solid-svg-icons";
import RightSidebar from "@/components/home/RightSidebar";
import LeftSidebar from "@/components/home/LeftSidebar";

interface MajlisMember {
  role: string;
  joined_at: string;
  majlis: {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon_url: string | null;
    cover_url: string | null;
    members_count: number;
    is_private: boolean;
    created_at: string;
  };
}

export default function MyMajalisPage() {
  const router = useRouter();
  const [majalis, setMajalis] = useState<MajlisMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users/my-majalis")
      .then((r) => r.json())
      .then((data) => {
        setMajalis(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  const owned = majalis.filter((m) => m.role === "owner");
  const moderated = majalis.filter((m) => m.role === "moderator");
  const joined = majalis.filter((m) => m.role === "member");

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
              <h1 className="text-white font-tajawal font-bold text-xl">مجالسي</h1>
            </div>
            <Link href="/create-majlis"
              className="flex items-center gap-2 bg-primary text-background font-tajawal font-bold px-4 py-2 rounded-xl text-sm hover:opacity-90 transition-opacity">
              <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
              مجلس جديد
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-shade2 rounded-2xl animate-pulse h-24" />
              ))}
            </div>
          ) : majalis.length === 0 ? (
            <div className="bg-shade2 border border-border rounded-2xl p-8 text-center flex flex-col gap-3 items-center" dir="rtl">
              <FontAwesomeIcon icon={faUsers} className="w-12 h-12 text-white/20" />
              <p className="text-white/40 font-tajawal">لم تنضم لأي مجلس بعد</p>
              <Link href="/"
                className="text-primary font-tajawal text-sm hover:underline">
                استكشف المجالس
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {owned.length > 0 && (
                <Section title="مجالسي" icon={faCrown} color="text-yellow-400" items={owned} />
              )}
              {moderated.length > 0 && (
                <Section title="أشرف عليها" icon={faShield} color="text-primary" items={moderated} />
              )}
              {joined.length > 0 && (
                <Section title="منضم إليها" icon={faUsers} color="text-white/60" items={joined} />
              )}
            </div>
          )}
        </div>

        <div className="w-72 shrink-0"><RightSidebar /></div>
      </div>
    </main>
  );
}

function Section({ title, icon, color, items }: {
  title: string;
  icon: any;
  color: string;
  items: MajlisMember[];
}) {
  return (
    <div className="flex flex-col gap-3" dir="rtl">
      <div className="flex items-center gap-2 px-1">
        <FontAwesomeIcon icon={icon} className={`w-4 h-4 ${color}`} />
        <h2 className="text-white/60 font-tajawal text-sm">{title}</h2>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <Link
            key={item.majlis.id}
            href={`/m/${item.majlis.slug}`}
            className="bg-shade2 border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-colors"
          >
            {/* غلاف */}
            {item.majlis.cover_url && (
              <img src={item.majlis.cover_url} alt="" className="w-full h-16 object-cover" />
            )}
            <div className="p-4 flex items-center gap-3">
              {item.majlis.icon_url ? (
                <img src={item.majlis.icon_url} alt={item.majlis.name} className="w-12 h-12 rounded-full object-cover border border-border shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-shade3 border border-border flex items-center justify-center shrink-0">
                  <FontAwesomeIcon icon={faUsers} className="w-5 h-5 text-primary" />
                </div>
              )}
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-tajawal font-bold truncate">مجلس {item.majlis.name}</h3>
                  <FontAwesomeIcon
                    icon={item.majlis.is_private ? faLock : faGlobe}
                    className="w-3 h-3 text-white/30 shrink-0"
                  />
                </div>
                <p className="text-white/40 font-tajawal text-xs truncate">{item.majlis.description}</p>
                <span className="text-white/30 font-tajawal text-xs">
                  {item.majlis.members_count} عضو
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}