"use client";

import { useEffect } from "react";

// Registers the service worker only in production-capable browsers.
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline support is progressive enhancement; the marketplace still works online.
      });
    }
  }, []);

  return null;
}
