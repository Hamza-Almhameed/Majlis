import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return Response.json({ error: "غير مسجل" }, { status: 401 });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
    userId: string;
    username: string;
  };

  const contentType = request.headers.get("content-type") || "";

  let content = "";
  let majlis_id = "";
  let is_temporary = false;
  let visibility = "public";
  let images: File[] = [];

  if (contentType.includes("application/json")) {
    const body = await request.json();
    content = body.content || "";
    majlis_id = body.majlis_id || "";
    is_temporary = body.is_temporary || false;
    visibility = body.visibility || "public";
  } else {
    const formData = await request.formData();
    content = formData.get("content") as string || "";
    majlis_id = formData.get("majlis_id") as string || "";
    is_temporary = formData.get("is_temporary") === "true";
    visibility = formData.get("visibility") as string || "public";
    images = formData.getAll("images") as File[];
  }

  if (!content?.trim() && images.length === 0) {
    return Response.json({ error: "المنشور لا يمكن أن يكون فارغاً" }, { status: 400 });
  }

  let media_url: string | null = null;
  let media_type = "text";

  if (images.length > 0) {
    const uploadedUrls: string[] = [];

    for (const image of images) {
      const ext = image.name.split(".").pop();
      const fileName = `${decoded.userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("posts-media")
        .upload(fileName, image, { contentType: image.type });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("posts-media")
          .getPublicUrl(fileName);
        uploadedUrls.push(urlData.publicUrl);
      }
    }

    if (uploadedUrls.length > 0) {
      media_url = JSON.stringify(uploadedUrls);
      media_type = "image";
    }
  }

  const expires_at = is_temporary
    ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      user_id: decoded.userId,
      majlis_id: majlis_id || null,
      content: content?.trim() || "",
      media_url,
      media_type,
      is_temporary,
      expires_at,
      visibility: visibility || "public",
    })
    .select("id")
    .single();

  if (error) {
    return Response.json({ error: "حدث خطأ" }, { status: 500 });
  }

  return Response.json({ message: "تم النشر بنجاح", id: post.id }, { status: 201 });
}