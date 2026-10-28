"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js. Rendered by app/layout.tsx, so it runs on every page,
 * including merchant pages like /gloworld.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // In development, Next.js chunk URLs are not content-hashed, so the SW's
    // cache-first rule for /_next/static/* serves stale client JS and causes
    // hydration mismatches. Remove any existing SW + its caches and stop here.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
      if ("caches" in window) {
        caches.keys().then((keys) => {
          keys
            .filter((key) => key.startsWith("bnpl-"))
            .forEach((key) => caches.delete(key));
        });
      }
      return;
    }

    // Was this page load handled by the service worker? On a first visit it
    // was not, so the page would never be saved for offline use. In that case
    // we ask the service worker to save it once it is ready.
    const wasControlled = Boolean(navigator.serviceWorker.controller);

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registered with scope:", registration.scope);
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });

    const sendSavePage = (worker: ServiceWorker) => {
      const resources = performance
        .getEntriesByType("resource")
        .map((entry) => entry.name)
        .filter((url) => url.startsWith(window.location.origin));

      worker.postMessage({
        type: "SAVE_PAGE",
        pathname: window.location.pathname,
        resources,
      });
    };

    const whenLoaded = (fn: () => void) => {
      if (document.readyState === "complete") fn();
      else window.addEventListener("load", fn, { once: true });
    };

    // First visit: no service worker handled this page yet.
    if (!wasControlled) {
      navigator.serviceWorker.ready.then((registration) => {
        const worker = registration.active;
        if (worker) whenLoaded(() => sendSavePage(worker));
      });
    }

    // Upgrade: an older service worker handled this page, then a new version
    // took over. The new one has never seen this page, so ask it to save it.
    const onControllerChange = () => {
      const worker = navigator.serviceWorker.controller;
      if (wasControlled && worker) whenLoaded(() => sendSavePage(worker));
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
