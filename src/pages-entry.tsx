import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QuestionPlatform } from "./routes/index";
import "./styles.css";

// GitHub Pages: mount the main question platform directly. This avoids the
// router error boundary preventing the entire app from loading on a static host.
createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <QuestionPlatform />
  </StrictMode>,
);
