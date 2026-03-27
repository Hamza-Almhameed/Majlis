import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ error: "غير مسجل" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

  
  const { data: majlis } = await supabase
    .from("majalis")
    .select("id, created_by")
    .eq("slug", slug)
    .single();

  if (!majlis) return Response.json({ error: "المجلس غير موجود" }, { status: 404 });
  if (majlis.created_by !== decoded.userId) return Response.json({ error: "غير مصرح" }, { status: 403 });

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const rules = formData.get("rules") as string;
  const is_private = formData.get("is_private") === "true";
  const iconFile = formData.get("icon") as File | null;
  const coverFile = formData.get("cover") as File | null;

  const updates: Record<string, any> = {};
  if (name) updates.name = name.trim().replace(/^مجلس\s*/g, "");
  if (description) updates.description = description.trim();
  if (formData.has("rules")) updates.rules = rules?.trim() || null;
  updates.is_private = is_private;

  
  if (iconFile && iconFile.size > 0) {
    const ext = iconFile.name.split(".").pop();
    const fileName = `majalis/icons/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("posts-media")
      .upload(fileName, iconFile, { contentType: iconFile.type, upsert: true });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("posts-media").getPublicUrl(fileName);
      updates.icon_url = urlData.publicUrl;
    }
  }

  
  if (coverFile && coverFile.size > 0) {
    const ext = coverFile.name.split(".").pop();
    const fileName = `majalis/covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("posts-media")
      .upload(fileName, coverFile, { contentType: coverFile.type, upsert: true });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("posts-media").getPublicUrl(fileName);
      updates.cover_url = urlData.publicUrl;
    }
  }

  const { error } = await supabase
    .from("majalis")
    .update(updates)
    .eq("id", majlis.id);

  if (error) return Response.json({ error: "حدث خطأ" }, { status: 500 });

  return Response.json({ message: "تم التحديث بنجاح" });
}