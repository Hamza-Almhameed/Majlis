import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ error: "غير مسجل" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

  const { data: comment } = await supabase
    .from("comments").select("user_id").eq("id", id).single();

  if (!comment || comment.user_id !== decoded.userId)
    return Response.json({ error: "غير مصرح" }, { status: 403 });

  await supabase.from("comments").delete().eq("id", id);
  return Response.json({ message: "تم الحذف" });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ error: "غير مسجل" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  const { content } = await request.json();

  if (!content?.trim()) return Response.json({ error: "المحتوى فارغ" }, { status: 400 });

  const { data: comment } = await supabase
    .from("comments").select("user_id").eq("id", id).single();

  if (!comment || comment.user_id !== decoded.userId)
    return Response.json({ error: "غير مصرح" }, { status: 403 });

  await supabase.from("comments").update({ content: content.trim() }).eq("id", id);
  return Response.json({ message: "تم التعديل" });
}