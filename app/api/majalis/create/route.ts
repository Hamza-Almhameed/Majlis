import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ error: "غير مسجل" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const rules = formData.get("rules") as string;
  const iconFile = formData.get("icon") as File | null;
  const coverFile = formData.get("cover") as File | null;

  if (!name?.trim() || !slug?.trim() || !description?.trim()) {
    return Response.json({ error: "جميع الحقول المطلوبة يجب تعبئتها" }, { status: 400 });
  }


  const slugRegex = /^[\u0600-\u0652\u0660-\u0669a-zA-Z0-9_-]+$/;
  if (!slugRegex.test(slug)) {
    return Response.json({ error: "الرابط يجب أن يحتوي على أحرف وأرقام وشرطات فقط" }, { status: 400 });
  }


  const { data: existing } = await supabase
    .from("majalis").select("id").eq("slug", slug).single();

  if (existing) {
    return Response.json({ error: "هذا الرابط مستخدم مسبقاً" }, { status: 409 });
  }


  let icon_url: string | null = null;
  if (iconFile && iconFile.size > 0) {
    const ext = iconFile.name.split(".").pop();
    const fileName = `majalis/icons/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("posts-media")
      .upload(fileName, iconFile, { contentType: iconFile.type, upsert: true });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("posts-media").getPublicUrl(fileName);
      icon_url = urlData.publicUrl;
    }
  }

  
  let cover_url: string | null = null;
  if (coverFile && coverFile.size > 0) {
    const ext = coverFile.name.split(".").pop();
    const fileName = `majalis/icons/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("posts-media")
      .upload(fileName, coverFile, { contentType: coverFile.type, upsert: true });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("posts-media").getPublicUrl(fileName);
      cover_url = urlData.publicUrl;
    }
  }

  
  const { data: majlis, error } = await supabase
    .from("majalis")
    .insert({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      rules: rules?.trim() || null,
      icon_url,
      cover_url,
      created_by: decoded.userId,
      members_count: 1,
      is_private: false,
    })
    .select("id, slug")
    .single();

  if (error) return Response.json({ error: "حدث خطأ" }, { status: 500 });

  
  await supabase.from("majalis_members").insert({
    user_id: decoded.userId,
    majlis_id: majlis.id,
    role: "owner",
  });

  return Response.json({ message: "تم إنشاء المجلس", slug: majlis.slug }, { status: 201 });
}