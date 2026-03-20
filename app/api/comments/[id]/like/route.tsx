import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ error: "غير مسجل" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

  const { data: existing } = await supabase
    .from("comment_likes")
    .select("user_id")
    .eq("user_id", decoded.userId)
    .eq("comment_id", id)
    .single();

  if (existing) {
    await supabase.from("comment_likes").delete()
      .eq("user_id", decoded.userId).eq("comment_id", id);
    const { count } = await supabase.from("comment_likes")
      .select("*", { count: "exact", head: true }).eq("comment_id", id);
    return Response.json({ liked: false, count: (count || 1) - 1 });
  } else {
    await supabase.from("comment_likes")
      .insert({ user_id: decoded.userId, comment_id: id });

      const { data: comment } = await supabase
      .from("comments").select("user_id, post_id").eq("id", id).single();

    if (comment && comment.user_id !== decoded.userId) {
      await supabase.from("notifications").insert({
        user_id: comment.user_id,
        actor_id: decoded.userId,
        type: "like_comment",
        comment_id: id,
        post_id: comment.post_id,
      });
    }

    const { count } = await supabase.from("comment_likes")
      .select("*", { count: "exact", head: true }).eq("comment_id", id);
    return Response.json({ liked: true, count: (count || 0) + 1 });
  }
}