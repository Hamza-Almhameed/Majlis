"use client";

import { useEffect } from "react";

export default function PresenceTracker() {
  useEffect(() => {
    function updatePresence() {
      fetch("/api/auth/presence", { method: "POST" });
    }

    // حدث عند فتح الصفحة
    updatePresence();

    // حدث كل دقيقتين
    const interval = setInterval(updatePresence, 2 * 60 * 1000);

    // حدث عند العودة للصفحة
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) updatePresence();
    });

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", updatePresence);
    };
  }, []);

  return null;
}