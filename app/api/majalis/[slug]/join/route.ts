import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ error: "غير مسجل" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

  const { data: majlis } = await supabase
    .from("majalis").select("id, is_private").eq("slug", slug).single();

  if (!majlis) return Response.json({ error: "المجلس غير موجود" }, { status: 404 });

  // تحقق إن مش عضو مسبقاً
  const { data: existing } = await supabase
    .from("majalis_members")
    .select("role")
    .eq("user_id", decoded.userId)
    .eq("majlis_id", majlis.id)
    .single();

  if (existing) return Response.json({ error: "أنت عضو مسبقاً" }, { status: 409 });

  if (majlis.is_private) {
    // أرسل طلب انضمام
    const { data: existingRequest } = await supabase
      .from("majalis_join_requests")
      .select("status")
      .eq("user_id", decoded.userId)
      .eq("majlis_id", majlis.id)
      .single();

    if (existingRequest) {
      return Response.json({ error: "لديك طلب انضمام سابق" }, { status: 409 });
    }

    await supabase.from("majalis_join_requests").insert({
      user_id: decoded.userId,
      majlis_id: majlis.id,
    });

    return Response.json({ message: "تم إرسال طلب الانضمام", status: "pending" });
  } else {
    // انضم مباشرة
    await supabase.from("majalis_members").insert({
      user_id: decoded.userId,
      majlis_id: majlis.id,
      role: "member",
    });

    await supabase.from("majalis")
      .update({ members_count: majlis.is_private ? 0 : supabase.rpc })
      .eq("id", majlis.id);

    // حدث عدد الأعضاء
    const { count } = await supabase
      .from("majalis_members")
      .select("*", { count: "exact", head: true })
      .eq("majlis_id", majlis.id);

    await supabase.from("majalis")
      .update({ members_count: count || 0 })
      .eq("id", majlis.id);

    return Response.json({ message: "تم الانضمام بنجاح", status: "member" });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ error: "غير مسجل" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

  const { data: majlis } = await supabase
    .from("majalis").select("id, created_by").eq("slug", slug).single();

  if (!majlis) return Response.json({ error: "المجلس غير موجود" }, { status: 404 });

  if (majlis.created_by === decoded.userId) {
    return Response.json({ error: "المؤسس لا يمكنه مغادرة المجلس" }, { status: 403 });
  }

  await supabase.from("majalis_members")
    .delete()
    .eq("user_id", decoded.userId)
    .eq("majlis_id", majlis.id);

  const { count } = await supabase
    .from("majalis_members")
    .select("*", { count: "exact", head: true })
    .eq("majlis_id", majlis.id);

  await supabase.from("majalis")
    .update({ members_count: count || 0 })
    .eq("id", majlis.id);

  return Response.json({ message: "تم المغادرة بنجاح" });
}