import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ error: "غير مسجل" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

  const { data: targetUser } = await supabase
    .from("users").select("id").eq("username", username).single();

  if (!targetUser) return Response.json({ error: "المستخدم غير موجود" }, { status: 404 });
  if (targetUser.id === decoded.userId) return Response.json({ error: "لا يمكنك حظر نفسك" }, { status: 400 });

  // تحقق إذا محظور مسبقاً
  const { data: existing } = await supabase
    .from("blocks")
    .select("blocker_id")
    .eq("blocker_id", decoded.userId)
    .eq("blocked_id", targetUser.id)
    .single();

  if (existing) {
    // إلغاء الحظر
    await supabase.from("blocks").delete()
      .eq("blocker_id", decoded.userId)
      .eq("blocked_id", targetUser.id);
    return Response.json({ blocked: false });
  } else {
    // حظر
    await supabase.from("blocks").insert({
      blocker_id: decoded.userId,
      blocked_id: targetUser.id,
    });
    return Response.json({ blocked: true });
  }
}