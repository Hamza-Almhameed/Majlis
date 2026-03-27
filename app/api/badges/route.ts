import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function getUserStats(userId: string) {
  const [
    { count: postsCount },
    { count: commentsCount },
    { count: likesGiven },
    { count: likesReceived },
    { count: majalisJoined },
    { count: majalisCreated },
    { data: userData },
  ] = await Promise.all([
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("comments").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("likes").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("likes").select("*", { count: "exact", head: true })
      .in("post_id", (await supabase.from("posts").select("id").eq("user_id", userId)).data?.map(p => p.id) || []),
    supabase.from("majalis_members").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("majalis").select("*", { count: "exact", head: true }).eq("created_by", userId),
    supabase.from("users").select("created_at").eq("id", userId).single(),
  ]);

  const accountAgeDays = userData
    ? Math.floor((Date.now() - new Date(userData.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    posts_count: postsCount || 0,
    comments_count: commentsCount || 0,
    likes_given: likesGiven || 0,
    likes_received: likesReceived || 0,
    majalis_joined: majalisJoined || 0,
    majalis_created: majalisCreated || 0,
    account_age_days: accountAgeDays,
  };
}

function getProgress(stats: Record<string, number>, requirementType: string, requirementValue: number) {
  const current = stats[requirementType] || 0;
  return {
    current: Math.min(current, requirementValue),
    required: requirementValue,
    percentage: Math.min(Math.round((current / requirementValue) * 100), 100),
    completed: current >= requirementValue,
  };
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ error: "غير مسجل" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

  // جيب كل الشارات
  const { data: allBadges } = await supabase
    .from("badges")
    .select("*")
    .order("requirement_value", { ascending: true });

  // جيب شارات المستخدم
  const { data: userBadges } = await supabase
    .from("user_badges")
    .select("badge_id, earned_at, is_displayed, display_order")
    .eq("user_id", decoded.userId);

  // جيب إحصائيات المستخدم
  const stats = await getUserStats(decoded.userId);

  const userBadgesMap = new Map(userBadges?.map((b) => [b.badge_id, b]) || []);

  // تحقق من شارات جديدة وأضفها
  const newlyEarned: string[] = [];
  for (const badge of allBadges || []) {
    const progress = getProgress(stats, badge.requirement_type, badge.requirement_value);
    if (progress.completed && !userBadgesMap.has(badge.id)) {
      await supabase.from("user_badges").insert({
        user_id: decoded.userId,
        badge_id: badge.id,
        is_displayed: false,
      });
      newlyEarned.push(badge.id);
      userBadgesMap.set(badge.id, { badge_id: badge.id, earned_at: new Date().toISOString(), is_displayed: false, display_order: null });
    }
  }

  // أرسل إشعارات للشارات الجديدة
  for (const badgeId of newlyEarned) {
    const badge = allBadges?.find((b) => b.id === badgeId);
    if (badge) {
      await supabase.from("notifications").insert({
        user_id: decoded.userId,
        actor_id: decoded.userId,
        type: "badge_earned",
        post_id: null,
        comment_id: null,
      });
    }
  }

  // رتب الشارات
  const badgesWithProgress = (allBadges || []).map((badge) => {
    const userBadge = userBadgesMap.get(badge.id);
    const progress = getProgress(stats, badge.requirement_type, badge.requirement_value);
    return {
      ...badge,
      earned: !!userBadge,
      earned_at: userBadge?.earned_at || null,
      is_displayed: userBadge?.is_displayed || false,
      display_order: userBadge?.display_order || null,
      progress,
      newly_earned: newlyEarned.includes(badge.id),
    };
  });

  return Response.json({ badges: badgesWithProgress, stats, newly_earned: newlyEarned });
}