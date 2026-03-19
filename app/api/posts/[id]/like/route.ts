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

  // تحقق إذا كان الإعجاب موجود مسبقاً
  const { data: existing } = await supabase
    .from("likes")
    .select("user_id")
    .eq("user_id", decoded.userId)
    .eq("post_id", id)
    .single();

  if (existing) {
    // إلغاء الإعجاب
    await supabase
      .from("likes")
      .delete()
      .eq("user_id", decoded.userId)
      .eq("post_id", id);

    // جيب العدد الجديد
    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", id);

    return Response.json({ liked: false, count: count || 0 });
  } else {
    // إضافة إعجاب
    await supabase
      .from("likes")
      .insert({ user_id: decoded.userId, post_id: id });

    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", id);

    return Response.json({ liked: true, count: count || 0 });
  }
}