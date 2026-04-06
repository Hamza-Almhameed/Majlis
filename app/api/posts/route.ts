import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const FEED_PAGE_SIZE = 10;
const FEED_POOL_MULTIPLIER = 6;
const FEED_POOL_MAX = 240;

// Extra score for brand-new posts (decays with age). Keeps 0-engagement new posts visible without changing how engagement competes once posts are older.
const NEW_POST_BOOST = 2.75;
const NEW_POST_DECAY_HOURS = 42;

function calculateFeedScore(params: {
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  createdAt: string;
  majlisFactor: number;
}) {
  const { likesCount, commentsCount, savesCount, createdAt, majlisFactor } = params;
  const hoursSincePosting = Math.max(
    0,
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
  );
  const engagementNumerator = likesCount * 1 + commentsCount * 1.5 + savesCount * 2;
  const denominator = Math.pow(hoursSincePosting + 2, 1.2);
  const engagementScore = engagementNumerator / denominator;
  // Decaying bonus so fresh posts are not stuck at 0 when engagement is still 0.
  const freshnessBoost =
    NEW_POST_BOOST * Math.exp(-hoursSincePosting / NEW_POST_DECAY_HOURS);
  return (engagementScore + freshnessBoost) * majlisFactor;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "0");
  const limit = FEED_PAGE_SIZE;
  const from = page * limit;
  const to = from + limit - 1;
  const rankingPoolSize = Math.min((page + 1) * limit * FEED_POOL_MULTIPLIER, FEED_POOL_MAX);

  
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let currentUserId: string | null = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      currentUserId = decoded.userId;
    } catch {}
  }

  
  let blockedIds: string[] = [];
  if (currentUserId) {
    const { data: blocks } = await supabase
      .from("blocks")
      .select("blocked_id, blocker_id")
      .or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`);

    blockedIds = (blocks || []).map((b) =>
      b.blocker_id === currentUserId ? b.blocked_id : b.blocker_id
    );
  }

  
  const { data: privateMajalis } = await supabase
    .from("majalis")
    .select("id")
    .eq("is_private", true);

  const privateMajalisIds = privateMajalis?.map((m) => m.id) || [];

  
  let userPrivateMajalisIds: string[] = [];
  if (currentUserId && privateMajalisIds.length > 0) {
    const { data: memberOf } = await supabase
      .from("majalis_members")
      .select("majlis_id")
      .eq("user_id", currentUserId)
      .in("majlis_id", privateMajalisIds);

    userPrivateMajalisIds = memberOf?.map((m) => m.majlis_id) || [];
  }

  let joinedMajalisIds = new Set<string>();
  if (currentUserId) {
    const { data: joinedMajalis } = await supabase
      .from("majalis_members")
      .select("majlis_id")
      .eq("user_id", currentUserId);

    joinedMajalisIds = new Set((joinedMajalis || []).map((m) => m.majlis_id));
  }

  
  const excludedMajalisIds = privateMajalisIds.filter(
    (id) => !userPrivateMajalisIds.includes(id)
  );

  
  let query = supabase
    .from("posts")
    .select(`
      id, user_id, content, media_url, media_type,
      is_temporary, created_at,
      majlis_id,
      user:users!posts_user_id_fkey(username, avatar_url, last_seen, show_last_seen),
      majlis:majalis!posts_majlis_id_fkey(name, slug),
      likes_count:likes(count),
      comments_count:comments(count),
      saves_count:saved_posts(count)
    `)
    .order("created_at", { ascending: false })
    .range(0, rankingPoolSize - 1);

    
  if (excludedMajalisIds.length > 0) {
    query = query.or(
      `majlis_id.is.null,majlis_id.not.in.(${excludedMajalisIds.join(",")})`
    );
  }

  
  if (blockedIds.length > 0) {
    query = query.not("user_id", "in", `(${blockedIds.join(",")})`);
  }

  const { data: posts, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const ranked = (posts || [])
    .map((post) => {
      const likesCount = post.likes_count[0]?.count || 0;
      const commentsCount = post.comments_count[0]?.count || 0;
      const savesCount = post.saves_count[0]?.count || 0;
      const majlisFactor =
        post.majlis_id && joinedMajalisIds.has(post.majlis_id) ? 1.5 : 1;

      return {
        ...post,
        likes_count: likesCount,
        comments_count: commentsCount,
        saves_count: savesCount,
        score: calculateFeedScore({
          likesCount,
          commentsCount,
          savesCount,
          createdAt: post.created_at,
          majlisFactor,
        }),
      };
    })
    .sort((a, b) => {
      if (b.score === a.score) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return b.score - a.score;
    });

  const formatted = ranked.slice(from, to + 1).map(({ score: _score, ...post }) => post);

  
  let userSaved: Set<string> = new Set();
  if (currentUserId && formatted.length > 0) {
    const postIds = formatted.map((p) => p.id);
    const { data: saved } = await supabase
      .from("saved_posts")
      .select("post_id")
      .eq("user_id", currentUserId)
      .in("post_id", postIds);

    userSaved = new Set(saved?.map((s) => s.post_id) || []);
  }

  
  let userLikes: Set<string> = new Set();
  if (currentUserId && formatted.length > 0) {
    const postIds = formatted.map((p) => p.id);
    const { data: likes } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", currentUserId)
      .in("post_id", postIds);

    userLikes = new Set(likes?.map((l) => l.post_id) || []);
  }

  const withLikeStatus = formatted.map((post) => ({
    ...post,
    is_liked: userLikes.has(post.id),
    is_saved: userSaved.has(post.id),
    user: {
      ...post.user,
      last_seen: (post.user as any).show_last_seen ? (post.user as any).last_seen : null,
    },
  }));

  return Response.json(withLikeStatus);
}