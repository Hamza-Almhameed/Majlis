import { supabase } from "@/lib/supabaseClient";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const { data: user } = await supabase
    .from("users").select("id").eq("username", username).single();

  if (!user) return Response.json({ error: "المستخدم غير موجود" }, { status: 404 });

  const { data, error } = await supabase
    .from("majalis_members")
    .select(`
      role,
      majlis:majalis!majalis_members_majlis_id_fkey(id, name, slug, description, members_count)
    `)
    .eq("user_id", user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}