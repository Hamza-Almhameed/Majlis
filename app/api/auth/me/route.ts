import { supabase } from "@/lib/supabaseClient";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return Response.json({ error: "غير مسجل" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      username: string;
    };

    const { data: user } = await supabase
      .from("users")
      .select("id, username, avatar_url")
      .eq("id", decoded.userId)
      .single();

    return Response.json({
      id: user?.id,
      username: user?.username,
      avatar_url: user?.avatar_url,
    });
  } catch {
    return Response.json({ error: "غير مسجل" }, { status: 401 });
  }
}