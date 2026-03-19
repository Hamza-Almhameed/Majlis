"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import Avatar from "@/components/ui/Avatar";

interface Majlis {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  members_count: number;
}

interface SearchResult {
  type: "user" | "majlis";
  id: string;
  name: string;
  sub: string;
  avatar_url: string | null;
}

export default function LeftSidebar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [majalis, setMajalis] = useState<Majlis[]>([]);

  useEffect(() => {
    fetch("/api/majalis")
      .then((res) => res.json())
      .then((data) => setMajalis(data.slice(0, 5)));
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
      setSearching(false);
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <aside
      className="hidden lg:flex fixed top-1/2 left-6 w-72 min-w-[18rem] h-[calc(100%-48px)] overflow-y-auto flex-col gap-4 py-6 px-4 rounded-xl bg-linear-to-b from-shade3/60 to-shade2/50 backdrop-blur-sm border border-border shadow-lg z-40 -translate-y-1/2"
      dir="rtl"
      aria-label="شريط جانبي - البحث والمجالس"
    >

      {/* البحث */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-shade2 border border-border rounded-lg px-3 py-2">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="ابحث عن مستخدم أو مجلس"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent text-white placeholder-white/40 font-tajawal outline-none w-full text-sm"
            aria-label="بحث"
          />
        </div>

        {/* نتائج البحث */}
        {(results.length > 0 || searching) && (
          <div className="absolute top-12 left-0 right-0 bg-shade2 border border-border rounded-lg overflow-hidden z-20 shadow-md">
            {searching ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              results.map((result) => (
                <Link
                  key={result.id}
                  href={result.type === "user" ? `/u/${result.name}` : `/m/${result.sub}`}
                  onClick={() => setQuery("")}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-shade3 transition-colors"
                >
                  <Avatar username={result.name} avatarUrl={result.avatar_url} size={32} />
                  <div className="flex flex-col">
                    <span className="text-white font-tajawal text-sm">{result.name}</span>
                    <span className="text-white/40 font-tajawal text-xs">
                      {result.type === "user" ? "مستخدم" : "مجلس"}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {/* المجالس المقترحة */}
      <section className="bg-shade2 border border-border rounded-lg overflow-hidden">
        <header className="px-4 py-3 border-b border-border">
          <h2 className="text-white font-tajawal font-bold text-sm">المجالس المقترحة ✦</h2>
        </header>
        <div className="flex flex-col">
          {majalis.map((majlis) => (
            <Link
              key={majlis.id}
              href={`/m/${majlis.slug}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-shade3 transition-colors border-b border-border last:border-0"
            >
              <div className="flex flex-col gap-1">
                <span className="text-primary font-tajawal text-sm font-bold">مجلس {majlis.name}</span>
                {majlis.description && (
                  <span className="text-white/40 font-tajawal text-xs line-clamp-1">{majlis.description}</span>
                )}
                <span className="text-white/30 font-tajawal text-xs">{majlis.members_count} عضو</span>
              </div>
              <Avatar username={majlis.name} size={40} />
            </Link>
          ))}
        </div>
      </section>
    </aside>
  );
}