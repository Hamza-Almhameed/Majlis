import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; userId: string }> }
) {
  const { slug, userId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ error: "غير مسجل" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

  const { data: majlis } = await supabase
    .from("majalis").select("id, created_by").eq("slug", slug).single();

  if (!majlis || majlis.created_by !== decoded.userId) {
    return Response.json({ error: "غير مصرح - المؤسس فقط" }, { status: 403 });
  }

  const { role } = await request.json();

  await supabase
    .from("majalis_members")
    .update({ role })
    .eq("user_id", userId)
    .eq("majlis_id", majlis.id);

  return Response.json({ message: "تم التحديث" });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string; userId: string }> }
) {
  const { slug, userId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ error: "غير مسجل" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

  const { data: majlis } = await supabase
    .from("majalis").select("id, created_by").eq("slug", slug).single();

    
  const { data: requesterMember } = await supabase
    .from("majalis_members")
    .select("role")
    .eq("user_id", decoded.userId)
    .eq("majlis_id", majlis!.id)
    .single();

  if (!requesterMember || requesterMember.role === "member") {
    return Response.json({ error: "غير مصرح" }, { status: 403 });
  }

  
  if (userId === majlis!.created_by) {
    return Response.json({ error: "لا يمكن طرد المؤسس" }, { status: 403 });
  }

  await supabase
    .from("majalis_members")
    .delete()
    .eq("user_id", userId)
    .eq("majlis_id", majlis!.id);

    
  const { count } = await supabase
    .from("majalis_members")
    .select("*", { count: "exact", head: true })
    .eq("majlis_id", majlis!.id);

  await supabase.from("majalis").update({ members_count: count || 0 }).eq("id", majlis!.id);

  return Response.json({ message: "تم الطرد" });
}