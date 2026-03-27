import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  const { username, password } = await request.json();


  if (!username || !password) {
    return Response.json(
      { error: "جميع الحقول مطلوبة" },
      { status: 400 }
    );
  }

  
  const { data: user } = await supabase
    .from("users")
    .select("id, username, password_hash")
    .eq("username", username)
    .single();

  if (!user) {
    return Response.json(
      { error: "اسم المستخدم أو كلمة المرور غير صحيحة" },
      { status: 401 }
    );
  }


  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    return Response.json(
      { error: "اسم المستخدم أو كلمة المرور غير صحيحة" },
      { status: 401 }
    );
  }


  const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET!,
    { expiresIn: "30d" }
  );

  const response = Response.json(
    { message: "تم تسجيل الدخول بنجاح" },
    { status: 200 }
  );

  response.headers.set(
    "Set-Cookie",
    `token=${token}; HttpOnly; Path=/; Max-Age=2592000; SameSite=Strict`
  );

  return response;
}