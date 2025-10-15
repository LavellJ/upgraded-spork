import React from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppRouter } from "@/AppRouter";
import { useAmbientTheme } from "@/hooks/useAmbientTheme";
import "./index.css";

function Root() {
  const ref = React.useRef<HTMLDivElement>(null);
  useAmbientTheme(ref.current);
  return (
    <div ref={ref} className="min-h-screen bg bg-gradient-to-b from-transparent to-[rgb(var(--ambient-overlay)/0.08)]">
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
