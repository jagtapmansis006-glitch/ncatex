// Polyfill global, process, and $_TSR for third-party dependencies and TanStack Router hydration
if (typeof window !== "undefined") {
  const win = window as any;
  win.global = window;
  win.process = win.process || { env: {} };
  win.$_TSR = win.$_TSR || {
    h: function () { this.hydrated = true; },
    e: function () { this.streamEnded = true; },
    c: function () {},
    p: function (s: any) { if (!this.initialized) { this.buffer.push(s); } else { s(); } },
    buffer: [],
    t: new Map(),
    initialized: true,
    router: { manifest: {}, matches: [] },
  };
}

import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import "./styles.css";

const router = getRouter();

const rootElement = document.getElementById("root");

if (rootElement) {
  const app = (
    <React.StrictMode>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </React.StrictMode>
  );

  // If SSR or static content is already rendered inside root, hydrate safely; otherwise render fresh
  if (rootElement.hasChildNodes()) {
    hydrateRoot(rootElement, app);
  } else {
    createRoot(rootElement).render(app);
  }
}

export default router;
