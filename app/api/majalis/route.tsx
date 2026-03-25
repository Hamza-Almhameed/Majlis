import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const myMajalis = searchParams.get("my") === "true";

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let currentUserId: string | null = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      currentUserId = decoded.userId;
    } catch {}
  }

  if (myMajalis && currentUserId) {
    // جيب مجالس المستخدم فقط
    const { data, error } = await supabase
      .from("majalis_members")
      .select(`majlis:majalis!majalis_members_majlis_id_fkey(id, name, slug)`)
      .eq("user_id", currentUserId);

    if (error) return Response.json({ error: "حدث خطأ" }, { status: 500 });

    return Response.json(data?.map((m) => m.majlis) || []);
  }

  // المجالس العامة للـ LeftSidebar
  const { data, error } = await supabase
    .from("majalis")
    .select("id, name, slug, description, icon_url, cover_url, members_count")
    .limit(50);

  if (error) return Response.json({ error: "حدث خطأ" }, { status: 500 });

  const shuffled = data.sort(() => Math.random() - 0.5).slice(0, 3);
  return Response.json(shuffled);
}