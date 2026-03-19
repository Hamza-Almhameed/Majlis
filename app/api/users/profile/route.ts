import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ error: "غير مسجل" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

  const { data, error } = await supabase
    .from("users")
    .select("id, username, bio, avatar_url, email")
    .eq("id", decoded.userId)
    .single();

  if (error) return Response.json({ error: "حدث خطأ" }, { status: 500 });

  return Response.json(data);
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ error: "غير مسجل" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

  const contentType = request.headers.get("content-type") || "";
  const updates: Record<string, string> = {};
  let avatarFile: File | null = null;

  if (contentType.includes("application/json")) {
    const body = await request.json();
    if (body.bio !== undefined) updates.bio = body.bio;
    if (body.email) updates.email = body.email;
  } else {
    const formData = await request.formData();
    if (formData.has("bio")) updates.bio = formData.get("bio") as string;
    if (formData.has("email") && formData.get("email")) updates.email = formData.get("email") as string;
    avatarFile = formData.get("avatar") as File | null;
  }

  // تحقق من الإيميل لو موجود
  if (updates.email) {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", updates.email)
      .neq("id", decoded.userId)
      .single();

    if (existing) {
      return Response.json({ error: "الإيميل مستخدم مسبقاً" }, { status: 409 });
    }
  }

  // رفع الصورة لو موجودة
  if (avatarFile && avatarFile.size > 0) {
    const ext = avatarFile.name.split(".").pop();
    const fileName = `avatars/${decoded.userId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("posts-media")
      .upload(fileName, avatarFile, {
        contentType: avatarFile.type,
        upsert: true,
      });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("posts-media")
        .getPublicUrl(fileName);
      updates.avatar_url = urlData.publicUrl;
    }
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ message: "لا يوجد تغييرات" });
  }

  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", decoded.userId);

  if (error) return Response.json({ error: "حدث خطأ" }, { status: 500 });

  return Response.json({ message: "تم التحديث بنجاح" });
}