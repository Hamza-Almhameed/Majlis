"use client";

import LeftSidebar from "@/components/home/LeftSidebar";

export default function ExplorePage() {
  return (
    <main className="bg-background min-h-screen p-3 sm:p-6">
      <div className="w-full max-w-3xl mx-auto">
        <LeftSidebar mobileVisible={true} />
      </div>
    </main>
  );
}
