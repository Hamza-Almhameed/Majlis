import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  const { username, password, confirmPassword } = await request.json();


  if (!username || !password || !confirmPassword) {
    return Response.json(
      { error: "جميع الحقول مطلوبة" },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return Response.json(
      { error: "كلمتا المرور غير متطابقتين" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return Response.json(
      { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" },
      { status: 400 }
    );
  }

  
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .single();

  if (existingUser) {
    return Response.json(
      { error: "اسم المستخدم مستخدم مسبقاً" },
      { status: 409 }
    );
  }


  const arabicUsernameRegex = /^[\u0600-\u0652\u0660-\u0669_0-9]+$/;
  if (!arabicUsernameRegex.test(username)) {
    return Response.json(
      { error: "اسم المستخدم يمكن أن يكون بالعربية فقط ويحتوي على شرطات _ او ارقام" },
      { status: 400 }
    );
  }


  const password_hash = await bcrypt.hash(password, 12);


  const { data: newUser, error } = await supabase
    .from("users")
    .insert({ username, password_hash })
    .select("id, username")
    .single();

  if (error) {
    return Response.json(
      { error: "حدث خطأ، حاول مجدداً" },
      { status: 500 }
    );
  }


  const token = jwt.sign(
    { userId: newUser.id, username: newUser.username },
    process.env.JWT_SECRET!,
    { expiresIn: "30d" }
  );


  const response = Response.json(
    { message: "تم إنشاء الحساب بنجاح" },
    { status: 201 }
  );

  response.headers.set(
    "Set-Cookie",
    `token=${token}; HttpOnly; Path=/; Max-Age=2592000; SameSite=Strict`
  );

  return response;
}