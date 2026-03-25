import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "0");
  const limit = 10;
  const from = page * limit;
  const to = from + limit - 1;

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

  const { data: user } = await supabase
    .from("users").select("id").eq("username", username).single();

  if (!user) return Response.json({ error: "المستخدم غير موجود" }, { status: 404 });

  // جيب المجالس الخاصة
  const { data: privateMajalis } = await supabase
    .from("majalis")
    .select("id")
    .eq("is_private", true);

  const privateMajalisIds = privateMajalis?.map((m) => m.id) || [];

  // جيب المجالس الخاصة اللي المستخدم الحالي عضو فيها
  let userPrivateMajalisIds: string[] = [];
  if (currentUserId && privateMajalisIds.length > 0) {
    const { data: memberOf } = await supabase
      .from("majalis_members")
      .select("majlis_id")
      .eq("user_id", currentUserId)
      .in("majlis_id", privateMajalisIds);

    userPrivateMajalisIds = memberOf?.map((m) => m.majlis_id) || [];
  }

  const excludedMajalisIds = privateMajalisIds.filter(
    (id) => !userPrivateMajalisIds.includes(id)
  );

  // بناء الـ query
  let query = supabase
    .from("posts")
    .select(`
      id, user_id, content, media_url, media_type,
      is_temporary, created_at,
      user:users!posts_user_id_fkey(username, avatar_url),
      majlis:majalis!posts_majlis_id_fkey(name, slug),
      likes_count:likes(count),
      comments_count:comments(count)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  // استثني منشورات المجالس الخاصة اللي المستخدم مش عضو فيها
  if (excludedMajalisIds.length > 0) {
    query = query.or(
      `majlis_id.is.null,majlis_id.not.in.(${excludedMajalisIds.join(",")})`
    );
  }

  const { data, error } = await query;

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const formatted = data.map((post) => ({
    ...post,
    likes_count: (post.likes_count as any)[0]?.count || 0,
    comments_count: (post.comments_count as any)[0]?.count || 0,
    is_liked: false,
    is_saved: false,
  }));

  return Response.json(formatted);
}