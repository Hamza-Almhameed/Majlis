import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return Response.json({ ok: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    await supabase
      .from("users")
      .update({ last_seen: new Date().toISOString() })
      .eq("id", decoded.userId);

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false });
  }
}