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

  if (!token) {
    return Response.json({ error: "غير مسجل" }, { status: 401 });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
    userId: string;
  };

  // جيب بيانات المنشور مع الصور
  const { data: post } = await supabase
    .from("posts")
    .select("user_id, media_url, media_type")
    .eq("id", id)
    .single();

  if (!post || post.user_id !== decoded.userId) {
    return Response.json({ error: "غير مصرح" }, { status: 403 });
  }

  // احذف الصور من الـ bucket لو موجودة
  if (post.media_type === "image" && post.media_url) {
    try {
      const urls: string[] = JSON.parse(post.media_url);
      console.log("URLs:", urls);
      
      const paths = urls.map((url) => {
        const parts = url.split("/posts-media/");
        console.log("parts:", parts);
        return parts[1];
      }).filter(Boolean);

      console.log("paths to delete:", paths);

      if (paths.length > 0) {
        const { error } = await supabase.storage.from("posts-media").remove(paths);
        console.log("delete error:", error);
      }
    } catch (e) {
      console.log("catch error:", e);
    }
  }

  // احذف المنشور
  await supabase.from("posts").delete().eq("id", id);

  return Response.json({ message: "تم الحذف" });
}


//edit post
export async function PATCH(
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
  
    const { content } = await request.json();
  
    if (!content?.trim()) {
      return Response.json({ error: "المحتوى لا يمكن أن يكون فارغاً" }, { status: 400 });
    }
  
    // تحقق إن المنشور للمستخدم الحالي
    const { data: post } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", id)
      .single();
  
    if (!post || post.user_id !== decoded.userId) {
      return Response.json({ error: "غير مصرح" }, { status: 403 });
    }
  
    const { error } = await supabase
      .from("posts")
      .update({ content: content.trim() })
      .eq("id", id);
  
    if (error) {
      return Response.json({ error: "حدث خطأ" }, { status: 500 });
    }
  
    return Response.json({ message: "تم التعديل بنجاح" });
  }


//get post details
  export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { id } = await params;
  
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    let currentUserId: string | null = null;
  
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        currentUserId = decoded.userId;
      } catch {}
    }
  
    const { data: post, error } = await supabase
      .from("posts")
      .select(`
        id,
        user_id,
        content,
        media_url,
        media_type,
        is_temporary,
        created_at,
        user:users!posts_user_id_fkey(username, avatar_url),
        majlis:majalis!posts_majlis_id_fkey(name, slug),
        likes_count:likes(count),
        comments_count:comments(count)
      `)
      .eq("id", id)
      .single();
  
    if (error || !post) {
      return Response.json({ error: "المنشور غير موجود" }, { status: 404 });
    }
  
    const formatted = {
      ...post,
      likes_count: (post.likes_count as any)[0]?.count || 0,
      comments_count: (post.comments_count as any)[0]?.count || 0,
      is_liked: false,
    };
  
    if (currentUserId) {
      const { data: like } = await supabase
        .from("likes")
        .select("user_id")
        .eq("user_id", currentUserId)
        .eq("post_id", id)
        .single();
  
      formatted.is_liked = !!like;
    }
  
    return Response.json(formatted);
  }