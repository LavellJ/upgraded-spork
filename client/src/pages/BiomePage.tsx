import React from "react";
import { useLocation } from "wouter";
import { completeLesson } from "../store/progress";
import type { BiomeId } from "../store/progress";

export default function BiomePage() {
  const [, setLocation] = useLocation();

  // derive biome from path
  const parts = window.location.pathname.split("/");
  const biomeId = (parts[2] || "forest") as BiomeId;

  const params = new URLSearchParams(window.location.search);
  const showE2E =
    params.get("e2e") === "1" || localStorage.getItem("E2E_CONTROLS") === "1";

  const handleComplete = () => {
    completeLesson(biomeId);
    // Island listens to 'island-progress-updated' dispatched by saveProgress
  };

  return (
    <div className="p-6 space-y-4">
      <h1 data-testid="biome-heading" className="text-xl font-semibold">
        Biome: {biomeId}
      </h1>

      {showE2E && (
        <div className="flex gap-2">
          <button
            data-testid="complete-lesson"
            className="px-3 py-2 rounded bg-indigo-600 text-white"
            onClick={handleComplete}
          >
            Complete lesson
          </button>
          <button
            data-testid="back-to-island"
            className="px-3 py-2 rounded bg-slate-200"
            onClick={() => setLocation("/island")}
          >
            Back to Island
          </button>
        </div>
      )}
    </div>
  );
}
