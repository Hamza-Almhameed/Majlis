import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) return Response.json([]);

  const [{ data: users }, { data: majalis }] = await Promise.all([
    supabase
      .from("users")
      .select("id, username, avatar_url")
      .ilike("username", `%${q}%`)
      .limit(5),
    supabase
      .from("majalis")
      .select("id, name, slug")
      .ilike("name", `%${q}%`)
      .limit(5),
  ]);

  const results = [
    ...(users || []).map((u) => ({
      type: "user" as const,
      id: u.id,
      name: u.username,
      sub: u.username,
      avatar_url: u.avatar_url,
    })),
    ...(majalis || []).map((m) => ({
      type: "majlis" as const,
      id: m.id,
      name: m.name,
      sub: m.slug,
      avatar_url: null,
    })),
  ];

  return Response.json(results);
}