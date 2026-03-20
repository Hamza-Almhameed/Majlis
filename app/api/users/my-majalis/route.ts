import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ error: "غير مسجل" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

  const { data, error } = await supabase
    .from("majalis_members")
    .select(`
      role,
      joined_at,
      majlis:majalis!majalis_members_majlis_id_fkey(
        id, name, slug, description,
        icon_url, cover_url, members_count,
        is_private, created_at
      )
    `)
    .eq("user_id", decoded.userId)
    .order("joined_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}