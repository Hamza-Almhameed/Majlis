import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase
    .from("majalis")
    .select("id, name, slug")
    .order("members_count", { ascending: false });

  if (error) {
    return Response.json({ error: "حدث خطأ" }, { status: 500 });
  }

  return Response.json(data);
}