import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase
  .from("majalis")
  .select("id, name, slug, description, icon_url, cover_url, members_count")
  .limit(50);

  if (error) {
    return Response.json({ error: "حدث خطأ" }, { status: 500 });
  }

  // رتب عشوائياً
  const shuffled = data.sort(() => Math.random() - 0.5).slice(0, 3);

  return Response.json(shuffled);
}