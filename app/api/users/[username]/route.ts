import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let currentUserId: string | null = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      currentUserId = decoded.userId;
    } catch {}
  }

  // جيب بيانات المستخدم
  const { data: user, error } = await supabase
    .from("users")
    .select("id, username, bio, avatar_url, badges, created_at, last_seen, show_last_seen")
    .eq("username", username)
    .single();

  if (error || !user) {
    return Response.json({ error: "المستخدم غير موجود" }, { status: 404 });
  }

  if (currentUserId && currentUserId !== user.id) {
    const { data: block } = await supabase
      .from("blocks")
      .select("blocker_id")
      .or(`and(blocker_id.eq.${currentUserId},blocked_id.eq.${user.id}),and(blocker_id.eq.${user.id},blocked_id.eq.${currentUserId})`)
      .single();

    if (block) {
      return Response.json({ error: "محظور", blocked: true }, { status: 403 });
    }
  }

  // إحصائيات
  const [
    { count: postsCount },
    { count: likesReceived },
    { count: majalisCount },
  ] = await Promise.all([
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("likes").select("*", { count: "exact", head: true })
      .in("post_id", 
        (await supabase.from("posts").select("id").eq("user_id", user.id)).data?.map(p => p.id) || []
      ),
    supabase.from("majalis_members").select("*", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  return Response.json({
    ...user,
    last_seen: user.show_last_seen ? user.last_seen : null,
    posts_count: postsCount || 0,
    likes_received: likesReceived || 0,
    majalis_count: majalisCount || 0,
    is_own_profile: currentUserId === user.id,
  });
}