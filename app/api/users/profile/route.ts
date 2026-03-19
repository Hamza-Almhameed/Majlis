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
  let bio = "";
  let email = "";
  let avatarFile: File | null = null;

  if (contentType.includes("application/json")) {
    const body = await request.json();
    bio = body.bio || "";
    email = body.email || "";
  } else {
    const formData = await request.formData();
    bio = formData.get("bio") as string || "";
    email = formData.get("email") as string || "";
    avatarFile = formData.get("avatar") as File | null;
  }

  // تحقق من الإيميل لو موجود
  if (email) {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .neq("id", decoded.userId)
      .single();

    if (existing) {
      return Response.json({ error: "الإيميل مستخدم مسبقاً" }, { status: 409 });
    }
  }

  let avatar_url: string | null = null;

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
      avatar_url = urlData.publicUrl;
    }
  }

  // بناء الـ update object
  const updates: Record<string, string> = {};
  if (bio !== undefined) updates.bio = bio;
  if (email) updates.email = email;
  if (avatar_url) updates.avatar_url = avatar_url;

  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", decoded.userId);

  if (error) return Response.json({ error: "حدث خطأ" }, { status: 500 });

  return Response.json({ message: "تم التحديث بنجاح" });
}