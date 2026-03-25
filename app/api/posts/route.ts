import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "0");
  const limit = 10;
  const from = page * limit;
  const to = from + limit - 1;

  // جيب المستخدم الحالي أولاً
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let currentUserId: string | null = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      currentUserId = decoded.userId;
    } catch {}
  }

  // جيب قائمة المحظورين
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

  // جيب المجالس الخاصة
  const { data: privateMajalis } = await supabase
    .from("majalis")
    .select("id")
    .eq("is_private", true);

  const privateMajalisIds = privateMajalis?.map((m) => m.id) || [];

  // جيب المجالس الخاصة اللي المستخدم عضو فيها
  let userPrivateMajalisIds: string[] = [];
  if (currentUserId && privateMajalisIds.length > 0) {
    const { data: memberOf } = await supabase
      .from("majalis_members")
      .select("majlis_id")
      .eq("user_id", currentUserId)
      .in("majlis_id", privateMajalisIds);

    userPrivateMajalisIds = memberOf?.map((m) => m.majlis_id) || [];
  }

  // المجالس الخاصة اللي المستخدم مش عضو فيها
  const excludedMajalisIds = privateMajalisIds.filter(
    (id) => !userPrivateMajalisIds.includes(id)
  );

  // بناء الـ query
  let query = supabase
    .from("posts")
    .select(`
      id, user_id, content, media_url, media_type,
      is_temporary, created_at,
      user:users!posts_user_id_fkey(username, avatar_url, last_seen, show_last_seen),
      majlis:majalis!posts_majlis_id_fkey(name, slug),
      likes_count:likes(count),
      comments_count:comments(count)
    `)
    .order("created_at", { ascending: false })
    .range(from, to);

  // استثني منشورات المجالس الخاصة اللي المستخدم مش عضو فيها
  if (excludedMajalisIds.length > 0) {
    query = query.or(
      `majlis_id.is.null,majlis_id.not.in.(${excludedMajalisIds.join(",")})`
    );
  }

  // استثني المحظورين
  if (blockedIds.length > 0) {
    query = query.not("user_id", "in", `(${blockedIds.join(",")})`);
  }

  const { data: posts, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const formatted = posts.map((post) => ({
    ...post,
    likes_count: post.likes_count[0]?.count || 0,
    comments_count: post.comments_count[0]?.count || 0,
  }));

  // جيب المحفوظات
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

  // جيب الإعجابات
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