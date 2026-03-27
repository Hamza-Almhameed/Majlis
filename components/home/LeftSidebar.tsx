"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faUsers } from "@fortawesome/free-solid-svg-icons";
import Avatar from "@/components/ui/Avatar";

interface Majlis {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  cover_url: string | null;
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


      <div className="bg-shade2 border border-border rounded-xl">
        <h2 className="text-white font-tajawal font-bold px-4 py-3 border-b border-border text-sm flex items-center">
        <span className="text-primary text-2xl ml-2.5">✦</span>
          المجالس المقترحة
        </h2>
        <div className="flex flex-col">
          {majalis.map((majlis) => (
            <div key={majlis.id} className="flex flex-col border-b border-border last:border-0">
              
              
              {majlis.cover_url ? (
                <div className="relative w-full h-28 overflow-hidden">
                  <img
                    src={majlis.cover_url}
                    alt={majlis.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-shade2 to-transparent" />
                  <div className="absolute bottom-2 right-3 flex items-center gap-2">
                    {majlis.icon_url && (
                      <img src={majlis.icon_url} alt="" className="w-7 h-7 rounded-full border border-border object-cover" />
                    )}
                    <span className="text-white font-tajawal font-bold text-sm">مجلس {majlis.name}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 pt-3">
                  {majlis.icon_url ? (
                    <img src={majlis.icon_url} alt="" className="w-10 h-10 rounded-full border border-border object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-shade3 border border-border flex items-center justify-center shrink-0">
                      <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <span className="text-white font-tajawal font-bold text-sm">مجلس {majlis.name}</span>
                </div>
              )}


              <div className="px-4 pb-3 flex flex-col gap-2 mt-2">
                <div className="flex items-center gap-1 text-white/40 font-tajawal text-xs">
                  <FontAwesomeIcon icon={faUsers} className="w-3 h-3" />
                  <span>{majlis.members_count} عضو</span>
                </div>
                {majlis.description && (
                  <p className="text-white/50 font-tajawal text-xs leading-relaxed line-clamp-2">
                    {majlis.description}
                  </p>
                )}
                <Link
                  href={`/m/${majlis.slug}`}
                  className="w-full text-center bg-primary text-background font-tajawal font-bold text-xs py-2 rounded-lg hover:opacity-90 transition-opacity mt-1"
                >
                  زيارة المجلس
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}