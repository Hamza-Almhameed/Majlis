"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RightSidebar from "@/components/home/RightSidebar";
import Feed from "@/components/home/Feed";
import LeftSidebar from "@/components/home/LeftSidebar";
import CreatePostBox from "@/components/home/CreatePostBox";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; username: string; avatar_url?: string } | null>(null);
  const [feedKey, setFeedKey] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data));
  }, []);

  function refreshFeed() {
    setFeedKey((prev) => prev + 1);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data));
  }, []);

  return (
    <main className="bg-background min-h-screen flex justify-center p-3 sm:p-6 pb-24 lg:pb-6">
      <div className="flex flex-col lg:flex-row-reverse gap-4 lg:gap-6 w-full">
        
        <div className="hidden lg:block w-72 min-w-[18rem]" />
        <LeftSidebar />
        
        <div className="flex-1">
        {user && (
            <CreatePostBox
              username={user.username}
              avatarUrl={user.avatar_url}
              onPost={refreshFeed}
            />
          )}
          <Feed key={feedKey} currentUserId={user?.id} onDelete={refreshFeed}/>
        </div>
        
        <div className="hidden lg:block w-72 min-w-[18rem]" aria-hidden="true" />
        <RightSidebar />
      </div>
    </main>
  );
}