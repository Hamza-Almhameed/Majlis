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

  // تحقق إن المستخدم الحالي هو نفسه صاحب البروفايل
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ error: "غير مسجل" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

  const { data: profileUser } = await supabase
    .from("users").select("id").eq("username", username).single();

  if (!profileUser || profileUser.id !== decoded.userId) {
    return Response.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("likes")
    .select(`
      post:posts!likes_post_id_fkey(
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
      )
    `)
    .eq("user_id", decoded.userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const formatted = data
    .map((item) => item.post)
    .filter(Boolean)
    .map((post: any) => ({
      ...post,
      likes_count: post.likes_count[0]?.count || 0,
      comments_count: post.comments_count[0]?.count || 0,
      is_liked: true,
      is_saved: false,
    }));

  return Response.json(formatted);
}