"use client";

import { useEffect } from "react";

export default function PresenceTracker() {
  useEffect(() => {
    function updatePresence() {
      fetch("/api/auth/presence", { method: "POST" });
    }

    updatePresence();

    const interval = setInterval(updatePresence, 2 * 60 * 1000);

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