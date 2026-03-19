import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return Response.json({ error: "غير مسجل" }, { status: 401 });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
    userId: string;
  };

  const { data, error } = await supabase
    .from("saved_posts")
    .select(`
      saved_at,
      post:posts!saved_posts_post_id_fkey(
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
    .order("saved_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const formatted = data
    .map((item) => ({
      ...item.post,
      likes_count: (item.post as any).likes_count[0]?.count || 0,
      comments_count: (item.post as any).comments_count[0]?.count || 0,
      is_liked: false,
      is_saved: true,
    }));

  return Response.json(formatted);
}