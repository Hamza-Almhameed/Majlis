import { supabase } from "@/lib/supabaseClient";

export async function POST() {
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("is_temporary", true)
    .lt("expires_at", new Date().toISOString());

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ message: "تم التنظيف" });
}