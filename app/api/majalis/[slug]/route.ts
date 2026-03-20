import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let currentUserId: string | null = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      currentUserId = decoded.userId;
    } catch {}
  }

  const { data: majlis, error } = await supabase
    .from("majalis")
    .select(`
      id, name, slug, description, rules,
      icon_url, cover_url, members_count,
      is_private, created_at,
      created_by
    `)
    .eq("slug", slug)
    .single();

  if (error || !majlis) {
    return Response.json({ error: "المجلس غير موجود" }, { status: 404 });
  }

  // جيب دور المستخدم الحالي
  let currentUserRole: string | null = null;
  let joinRequestStatus: string | null = null;

  if (currentUserId) {
    const { data: member } = await supabase
      .from("majalis_members")
      .select("role")
      .eq("user_id", currentUserId)
      .eq("majlis_id", majlis.id)
      .single();

    currentUserRole = member?.role || null;

    if (!currentUserRole && majlis.is_private) {
      const { data: joinRequest } = await supabase
        .from("majalis_join_requests")
        .select("status")
        .eq("user_id", currentUserId)
        .eq("majlis_id", majlis.id)
        .single();

      joinRequestStatus = joinRequest?.status || null;
    }
  }

  // إحصائيات
  const { count: postsCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("majlis_id", majlis.id);

  return Response.json({
    ...majlis,
    posts_count: postsCount || 0,
    current_user_role: currentUserRole,
    join_request_status: joinRequestStatus,
  });
}