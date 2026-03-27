import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function verifyOwnerOrMod(slug: string, userId: string) {
  const { data: majlis } = await supabase
    .from("majalis").select("id, created_by").eq("slug", slug).single();
  if (!majlis) return null;

  const { data: member } = await supabase
    .from("majalis_members")
    .select("role")
    .eq("user_id", userId)
    .eq("majlis_id", majlis.id)
    .single();

  if (!member || member.role === "member") return null;
  return { majlis, role: member.role };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ error: "غير مسجل" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  const auth = await verifyOwnerOrMod(slug, decoded.userId);
  if (!auth) return Response.json({ error: "غير مصرح" }, { status: 403 });

  const { majlis } = auth;

  
  const { data: members } = await supabase
    .from("majalis_members")
    .select(`
      role, joined_at,
      user:users!majalis_members_user_id_fkey(id, username, avatar_url)
    `)
    .eq("majlis_id", majlis.id)
    .order("joined_at", { ascending: true });

    
  const { data: joinRequests } = await supabase
    .from("majalis_join_requests")
    .select(`
      id, status, created_at,
      user:users!majalis_join_requests_user_id_fkey(id, username, avatar_url)
    `)
    .eq("majlis_id", majlis.id)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

    
  const { count: postsCount } = await supabase
    .from("posts").select("*", { count: "exact", head: true }).eq("majlis_id", majlis.id);

  const { count: postsThisWeek } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("majlis_id", majlis.id)
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  return Response.json({
    members: members || [],
    joinRequests: joinRequests || [],
    stats: {
      posts_count: postsCount || 0,
      posts_this_week: postsThisWeek || 0,
      members_count: members?.length || 0,
    },
    current_user_role: auth.role,
    majlis_owner_id: majlis.created_by,
  });
}