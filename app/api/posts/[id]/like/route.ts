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

  if (!token) {
    return Response.json({ error: "غير مسجل" }, { status: 401 });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
    userId: string;
  };

  
  const { data: existing } = await supabase
    .from("likes")
    .select("user_id")
    .eq("user_id", decoded.userId)
    .eq("post_id", id)
    .single();

  if (existing) {
    await supabase
      .from("likes")
      .delete()
      .eq("user_id", decoded.userId)
      .eq("post_id", id);

      
    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", id);

    return Response.json({ liked: false, count: count || 0 });
  } else {
    await supabase
      .from("likes")
      .insert({ user_id: decoded.userId, post_id: id });

      const { data: post } = await supabase
      .from("posts").select("user_id").eq("id", id).single();

    if (post && post.user_id !== decoded.userId) {
      await supabase.from("notifications").insert({
        user_id: post.user_id,
        actor_id: decoded.userId,
        type: "like_post",
        post_id: id,
      });
    }

    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", id);

    return Response.json({ liked: true, count: count || 0 });
  }
}