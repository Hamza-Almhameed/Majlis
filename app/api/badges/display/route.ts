import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ error: "غير مسجل" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  const { badge_id, is_displayed } = await request.json();

  // تحقق إن المستخدم حاصل على الشارة
  const { data: userBadge } = await supabase
    .from("user_badges")
    .select("badge_id, is_displayed")
    .eq("user_id", decoded.userId)
    .eq("badge_id", badge_id)
    .single();

  if (!userBadge) return Response.json({ error: "لم تحصل على هذه الشارة" }, { status: 403 });

  if (is_displayed) {
    // تحقق إن ما تجاوز 5 شارات
    const { count } = await supabase
      .from("user_badges")
      .select("*", { count: "exact", head: true })
      .eq("user_id", decoded.userId)
      .eq("is_displayed", true);

    if ((count || 0) >= 5) {
      return Response.json({ error: "الحد الأقصى 5 شارات معروضة" }, { status: 400 });
    }
  }

  await supabase
    .from("user_badges")
    .update({ is_displayed })
    .eq("user_id", decoded.userId)
    .eq("badge_id", badge_id);

  return Response.json({ message: "تم التحديث" });
}