import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ error: "غير مسجل" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return Response.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return Response.json({ error: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" }, { status: 400 });
  }

  // جيب كلمة المرور الحالية
  const { data: user } = await supabase
    .from("users")
    .select("password_hash")
    .eq("id", decoded.userId)
    .single();

  if (!user) return Response.json({ error: "المستخدم غير موجود" }, { status: 404 });

  // تحقق من كلمة المرور الحالية
  const isValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValid) return Response.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 401 });

  // حدث كلمة المرور
  const password_hash = await bcrypt.hash(newPassword, 12);
  await supabase.from("users").update({ password_hash }).eq("id", decoded.userId);

  return Response.json({ message: "تم تغيير كلمة المرور بنجاح" });
}