import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ error: "غير مسجل" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

  const { data } = await supabase
    .from("blocks")
    .select(`
      blocked:users!blocks_blocked_id_fkey(id, username, avatar_url)
    `)
    .eq("blocker_id", decoded.userId);

  return Response.json(data || []);
}