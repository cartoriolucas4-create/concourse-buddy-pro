import { Component, StrictMode, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { QuestionPlatform } from "./routes/index";
import "./styles.css";

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: string }> {
  state = { error: "" };

  static getDerivedStateFromError(error: Error) {
    return { error: error?.stack || error?.message || String(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Concurso Central render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ fontFamily: "Arial, sans-serif", maxWidth: 900, margin: "12vh auto", padding: 24, color: "#222" }}>
          <h1 style={{ color: "#b42318" }}>O Concurso Central encontrou um erro ao abrir</h1>
          <p>O deploy está acessível, mas a aplicação falhou durante a renderização. Detalhes para corrigirmos:</p>
          <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", padding: 16, background: "#f5f5f5", border: "1px solid #ddd", borderRadius: 8 }}>{this.state.error}</pre>
          <button onClick={() => window.location.reload()} style={{ padding: "10px 16px", cursor: "pointer" }}>Recarregar página</button>
        </main>
      );
    }
    return this.props.children;
  }
}

window.addEventListener("error", (event) => {
  console.error("Concurso Central window error:", event.error || event.message);
});
window.addEventListener("unhandledrejection", (event) => {
  console.error("Concurso Central async error:", event.reason);
});

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <QuestionPlatform />
    </AppErrorBoundary>
  </StrictMode>,
);
