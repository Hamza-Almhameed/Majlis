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
    .from("saved_posts")
    .select("user_id")
    .eq("user_id", decoded.userId)
    .eq("post_id", id)
    .single();

  if (existing) {
    await supabase
      .from("saved_posts")
      .delete()
      .eq("user_id", decoded.userId)
      .eq("post_id", id);

    return Response.json({ saved: false });
  } else {
    await supabase
      .from("saved_posts")
      .insert({ user_id: decoded.userId, post_id: id });

    return Response.json({ saved: true });
  }
}