import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

// On GitHub Pages the project lives under /concourse-buddy-pro/.
// Ensure the hash router always starts at the app's root route.
if (!window.location.hash) {
  window.location.replace(
    window.location.pathname + window.location.search + "#/",
  );
} else {
  const router = getRouter();
  createRoot(document.getElementById("app")!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
