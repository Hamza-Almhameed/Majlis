import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "0");
  const limit = 10;
  const from = page * limit;
  const to = from + limit - 1;

  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      id,
      user_id,
      content,
      media_url,
      media_type,
      is_temporary,
      created_at,
      user:users!posts_user_id_fkey(username, avatar_url),
      majlis:majalis!posts_majlis_id_fkey(name, slug),
      likes_count:likes(count),
      comments_count:comments(count)
    `)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const formatted = posts.map((post) => ({
    ...post,
    likes_count: post.likes_count[0]?.count || 0,
    comments_count: post.comments_count[0]?.count || 0,
  }));

  // جيب المستخدم الحالي
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let currentUserId: string | null = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      currentUserId = decoded.userId;
    } catch {}
  }

  // جيب المحفوظات الحالية للمستخدم
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

  // جيب إعجابات المستخدم الحالي
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
  }));

  

  return Response.json(withLikeStatus);
}