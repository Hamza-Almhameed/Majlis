import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ error: "غير مسجل" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

  const { data, error } = await supabase
    .from("notifications")
    .select(`
      id,
      type,
      is_read,
      created_at,
      post_id,
      comment_id,
      actor:users!notifications_actor_id_fkey(username, avatar_url)
    `)
    .eq("user_id", decoded.userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}

export async function PATCH() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ error: "غير مسجل" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", decoded.userId)
    .eq("is_read", false);

  return Response.json({ message: "تم" });
}