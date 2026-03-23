import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ error: "غير مسجل" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  const { show_last_seen } = await request.json();

  await supabase
    .from("users")
    .update({ show_last_seen })
    .eq("id", decoded.userId);

  return Response.json({ message: "تم التحديث" });
}