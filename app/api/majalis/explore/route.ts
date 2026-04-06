import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: T[], seed: number) {
  const rnd = mulberry32(seed);
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(0, parseInt(searchParams.get("page") || "0", 10));
  const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "9", 10));
  const seed = parseInt(searchParams.get("seed") || String(Date.now()), 10) || Date.now();

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let currentUserId: string | null = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      currentUserId = decoded.userId;
    } catch {}
  }

  
  const MAX_MAJALIS = 5000;

  const { data: allMajalis, error } = await supabase
    .from("majalis")
    .select("id, name, slug, description, icon_url, cover_url, members_count, is_private")
    .limit(MAX_MAJALIS);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const shuffled = seededShuffle(allMajalis || [], seed);
  const start = page * pageSize;
  const end = start + pageSize;

  const pageMajalis = shuffled.slice(start, end);
  const pageIds = pageMajalis.map((m) => m.id);

  const membershipByMajlisId = new Map<string, string>(); // majlis_id -> role
  const joinStatusByMajlisId = new Map<string, string>(); // majlis_id -> status

  if (currentUserId && pageIds.length > 0) {
    const [{ data: members }, { data: joinRequests }] = await Promise.all([
      supabase
        .from("majalis_members")
        .select("majlis_id, role")
        .eq("user_id", currentUserId)
        .in("majlis_id", pageIds),
      supabase
        .from("majalis_join_requests")
        .select("majlis_id, status")
        .eq("user_id", currentUserId)
        .in("majlis_id", pageIds),
    ]);

    (members || []).forEach((m) => membershipByMajlisId.set(m.majlis_id, m.role));
    (joinRequests || []).forEach((r) => joinStatusByMajlisId.set(r.majlis_id, r.status));
  }

  const items = pageMajalis.map((m) => {
    const current_user_role = membershipByMajlisId.get(m.id) || null;
    const join_request_status =
      current_user_role ? null : joinStatusByMajlisId.get(m.id) || null;

    return {
      ...m,
      current_user_role,
      join_request_status,
    };
  });

  return Response.json({
    items,
    page,
    pageSize,
    total: shuffled.length,
    hasMore: end < shuffled.length,
  });
}

