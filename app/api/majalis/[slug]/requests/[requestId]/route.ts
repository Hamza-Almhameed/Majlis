import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; requestId: string }> }
) {
  const { slug, requestId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ error: "غير مسجل" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

  const { data: majlis } = await supabase
    .from("majalis").select("id, created_by").eq("slug", slug).single();

  if (!majlis) return Response.json({ error: "المجلس غير موجود" }, { status: 404 });

  // تحقق إن المستخدم مؤسس أو مشرف
  const { data: member } = await supabase
    .from("majalis_members")
    .select("role")
    .eq("user_id", decoded.userId)
    .eq("majlis_id", majlis.id)
    .single();

  if (!member || member.role === "member") {
    return Response.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { action } = await request.json();

  if (action === "approve") {
    const { data: joinRequest } = await supabase
      .from("majalis_join_requests")
      .select("user_id")
      .eq("id", requestId)
      .single();

    if (joinRequest) {
      await supabase.from("majalis_members").insert({
        user_id: joinRequest.user_id,
        majlis_id: majlis.id,
        role: "member",
      });

      const { count } = await supabase
        .from("majalis_members")
        .select("*", { count: "exact", head: true })
        .eq("majlis_id", majlis.id);

      await supabase.from("majalis").update({ members_count: count || 0 }).eq("id", majlis.id);
    }
  }

  await supabase
    .from("majalis_join_requests")
    .update({ status: action === "approve" ? "approved" : "rejected" })
    .eq("id", requestId);

  return Response.json({ message: "تم" });
}