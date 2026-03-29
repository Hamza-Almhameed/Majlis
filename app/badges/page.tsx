"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faArrowRight, faTrophy, faStar, faLock, faCircleCheck, faComment, faCalendar, faHeart, faUsers, faPen } from "@fortawesome/free-solid-svg-icons";
import RightSidebar from "@/components/home/RightSidebar";
import LeftSidebar from "@/components/home/LeftSidebar";

interface Badge {
  id: string;
  name: string;
  description: string;
  requirement_type: string;
  requirement_value: number;
  tier: "bronze" | "silver" | "gold";
  icon: string;
  earned: boolean;
  earned_at: string | null;
  is_displayed: boolean;
  newly_earned: boolean;
  progress: {
    current: number;
    required: number;
    percentage: number;
    completed: boolean;
  };
}

const tierColors = {
  bronze: "from-amber-700/20 to-amber-600/10 border-amber-700/30 text-amber-600",
  silver: "from-slate-400/20 to-slate-300/10 border-slate-400/30 text-slate-300",
  gold: "from-yellow-500/20 to-yellow-400/10 border-yellow-500/30 text-yellow-400",
};

const tierLabels = {
  bronze: "برونزي",
  silver: "فضي",
  gold: "ذهبي",
};

const iconMap: Record<string, IconDefinition> = {
    'trophy': faTrophy,
    'star': faStar,
    'lock': faLock,
    'account_age_days': faCalendar,
    'comments_count': faComment,
    'likes_given': faHeart,
    'likes_received': faStar,
    'majalis_created': faUsers,
    'majalis_joined': faUsers,
    'posts_count': faPen,
};

export default function BadgesPage() {
  const router = useRouter();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [displayedCount, setDisplayedCount] = useState(0);

  useEffect(() => {
    fetch("/api/badges")
      .then((r) => r.json())
      .then((data) => {
        setBadges(data.badges || []);
        setDisplayedCount(data.badges?.filter((b: Badge) => b.is_displayed).length || 0);
        setLoading(false);
      });
  }, []);

  async function toggleDisplay(badgeId: string, currentDisplayed: boolean) {
    if (!currentDisplayed && displayedCount >= 5) return;
    setUpdating(badgeId);

    const res = await fetch("/api/badges/display", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badge_id: badgeId, is_displayed: !currentDisplayed }),
    });

    if (res.ok) {
      setBadges((prev) => prev.map((b) =>
        b.id === badgeId ? { ...b, is_displayed: !currentDisplayed } : b
      ));
      setDisplayedCount((prev) => currentDisplayed ? prev - 1 : prev + 1);
    }
    setUpdating(null);
  }

  const activeBadges = badges.filter((b) => b.earned && b.is_displayed);
  const earnedBadges = badges.filter((b) => b.earned && !b.is_displayed);
  const lockedBadges = badges.filter((b) => !b.earned);

  if (loading) return (
    <main className="bg-background min-h-screen p-3 sm:p-6 pb-24 lg:pb-6">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full mx-auto">
        <div className="w-full lg:w-72 lg:shrink-0"><LeftSidebar /></div>
        <div className="flex-1 bg-shade2 rounded-2xl animate-pulse h-64" />
        <div className="w-full lg:w-72 lg:shrink-0"><RightSidebar /></div>
      </div>
    </main>
  );

  return (
    <main className="bg-background min-h-screen p-3 sm:p-6 pb-24 lg:pb-6">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full mx-auto">
        <div className="w-full lg:w-72 lg:shrink-0"><LeftSidebar /></div>

        <div className="flex-1 flex flex-col gap-6">
          <div className="flex items-center gap-3" dir="rtl">
            <button onClick={() => router.back()} className="text-white/50 hover:text-white transition-colors">
              <FontAwesomeIcon icon={faArrowRight} className="w-5 h-5" />
            </button>
            <h1 className="text-white font-tajawal font-bold text-xl">الشارات</h1>
            <span className="text-white/40 font-tajawal text-sm">({displayedCount}/5 معروضة)</span>
          </div>

          {/* active badges */}
          {activeBadges.length > 0 && (
            <Section title="الشارات الفعالة" emoji="star" color="text-primary">
              {activeBadges.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  onToggle={() => toggleDisplay(badge.id, badge.is_displayed)}
                  updating={updating === badge.id}
                  canAdd={displayedCount < 5}
                />
              ))}
            </Section>
          )}

          {/* earned badges */}
          {earnedBadges.length > 0 && (
            <Section title="الشارات المنجزة" emoji="trophy" color="text-yellow-400">
              {earnedBadges.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  onToggle={() => toggleDisplay(badge.id, badge.is_displayed)}
                  updating={updating === badge.id}
                  canAdd={displayedCount < 5}
                />
              ))}
            </Section>
          )}

          {/* locked badges */}
          {lockedBadges.length > 0 && (
            <Section title="الشارات المقفلة" emoji="lock" color="text-white/40">
              {lockedBadges.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  onToggle={() => {}}
                  updating={false}
                  canAdd={false}
                />
              ))}
            </Section>
          )}
        </div>

        <div className="w-full lg:w-72 lg:shrink-0"><RightSidebar /></div>
      </div>
    </main>
  );
}

function Section({ title, emoji, color, children }: {
  title: string; emoji: string; color: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3" dir="rtl">
      <h2 className={`font-tajawal font-bold text-lg flex items-center gap-2 ${color}`}>
        <FontAwesomeIcon icon={iconMap[emoji]} className="w-5 h-5" />
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {children}
      </div>
    </div>
  );
}

function BadgeCard({ badge, onToggle, updating, canAdd }: {
  badge: Badge;
  onToggle: () => void;
  updating: boolean;
  canAdd: boolean;
}) {
  const tierColor = tierColors[badge.tier];

  return (
    <div className={`bg-linear-to-r ${tierColor} border rounded-2xl p-4 flex items-center gap-4`} dir="rtl">
      <div className="text-3xl shrink-0"><FontAwesomeIcon icon={iconMap[badge.requirement_type]} /></div>

      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-tajawal font-bold">{badge.name}</h3>
          <span className={`text-xs font-tajawal px-2 py-0.5 rounded-full bg-black/20 ${tierColors[badge.tier].split(' ').pop()}`}>
            {tierLabels[badge.tier]}
          </span>
        </div>
        <p className="text-white/60 font-tajawal text-sm">{badge.description}</p>

        {badge.earned ? (
          <p className="text-white/40 font-tajawal text-xs">
            <FontAwesomeIcon icon={faCircleCheck} className="text-primary/40"/> تم الإنجاز {badge.earned_at ? `في ${new Date(badge.earned_at).toLocaleDateString("ar")}` : ""}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-white/40 font-tajawal text-xs">
                {badge.progress.current} / {badge.progress.required}
              </span>
              <span className="text-white/40 font-tajawal text-xs">{badge.progress.percentage}%</span>
            </div>
            <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${badge.progress.percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {badge.earned && (
        <button
          onClick={onToggle}
          disabled={updating || (!badge.is_displayed && !canAdd)}
          className={`shrink-0 px-3 py-2 rounded-xl font-tajawal text-xs font-bold transition-colors disabled:opacity-40 ${
            badge.is_displayed
              ? "bg-primary/20 text-primary hover:bg-primary/30"
              : "bg-shade3 text-white/60 hover:bg-border"
          }`}
        >
          {updating ? "..." : badge.is_displayed ? "إخفاء" : canAdd ? "عرض" : "يمكن عرض 5 شارات كحد أقصى"}
        </button>
      )}
    </div>
  );
}