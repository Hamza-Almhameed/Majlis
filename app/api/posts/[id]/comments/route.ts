import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "0");
  const limit = 5;
  const from = page * limit;
  const to = from + limit - 1;

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let currentUserId: string | null = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      currentUserId = decoded.userId;
    } catch {}
  }

  // جيب التعليقات الرئيسية فقط
  const { data, error } = await supabase
    .from("comments")
    .select(`
      id,
      content,
      created_at,
      parent_id,
      user_id,
      user:users!comments_user_id_fkey(username, avatar_url),
      likes_count:comment_likes(count)
    `)
    .eq("post_id", id)
    .is("parent_id", null)
    .order("created_at", { ascending: true })
    .range(from, to);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (data.length === 0) {
    return Response.json([]);
  }

  // جيب الردود لكل التعليقات
  const commentIds = data.map((c) => c.id);
  const { data: replies } = await supabase
    .from("comments")
    .select(`
      id,
      content,
      created_at,
      parent_id,
      user_id,
      user:users!comments_user_id_fkey(username, avatar_url),
      likes_count:comment_likes(count)
    `)
    .in("parent_id", commentIds)
    .order("created_at", { ascending: true });

  // جيب إعجابات المستخدم
  let userLikes: Set<string> = new Set();
  if (currentUserId) {
    const allIds = [...commentIds, ...(replies || []).map((r) => r.id)];
    const { data: likes } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .eq("user_id", currentUserId)
      .in("comment_id", allIds);
    userLikes = new Set(likes?.map((l) => l.comment_id) || []);
  }

  const formatted = data.map((comment) => ({
    ...comment,
    likes_count: (comment.likes_count as any)[0]?.count || 0,
    is_liked: userLikes.has(comment.id),
    replies: (replies || [])
      .filter((r) => r.parent_id === comment.id)
      .map((r) => ({
        ...r,
        likes_count: (r.likes_count as any)[0]?.count || 0,
        is_liked: userLikes.has(r.id),
      })),
  }));

  return Response.json(formatted);
}

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

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  const { content, parent_id } = await request.json();

  if (!content?.trim()) {
    return Response.json({ error: "التعليق لا يمكن أن يكون فارغاً" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: id,
      user_id: decoded.userId,
      content: content.trim(),
      parent_id: parent_id || null,
    })
    .select(`
      id,
      content,
      created_at,
      parent_id,
      user_id,
      user:users!comments_user_id_fkey(username, avatar_url)
    `)
    .single();

  if (error) {
    return Response.json({ error: "حدث خطأ" }, { status: 500 });
  }

  return Response.json({ ...data, likes_count: 0, is_liked: false, replies: [] }, { status: 201 });
}