import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ error: "غير مسجل" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  const { password } = await request.json();


  const { data: user } = await supabase
    .from("users")
    .select("password_hash")
    .eq("id", decoded.userId)
    .single();

  if (!user) return Response.json({ error: "المستخدم غير موجود" }, { status: 404 });

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return Response.json({ error: "كلمة المرور غير صحيحة" }, { status: 401 });


  await supabase.from("users").delete().eq("id", decoded.userId);


  const response = Response.json({ message: "تم حذف الحساب" });
  response.headers.set("Set-Cookie", "token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict");

  return response;
}