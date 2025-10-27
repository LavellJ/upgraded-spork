import React from "react";
import { BookOpen, Backpack } from "lucide-react";

export default function SceneChrome() {
  return (
    <div className="flex items-center gap-3">
      <button
        data-testid="journal-btn"
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow border border-amber-200"
        onClick={() => {}}
      >
        <BookOpen className="w-4 h-4 text-amber-700" />
        <span className="text-sm font-medium text-amber-900">Journal</span>
      </button>
      <button
        data-testid="backpack-btn"
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow border border-amber-200"
        onClick={() => {}}
      >
        <Backpack className="w-4 h-4 text-amber-700" />
        <span className="text-sm font-medium text-amber-900">Backpack</span>
      </button>
    </div>
  );
}
