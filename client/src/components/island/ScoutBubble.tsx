import React from "react";

type ScoutBubbleProps = {
  firstName?: string;
};

export default function ScoutBubble({ firstName }: ScoutBubbleProps) {
  const greeting = firstName ? `G'day, ${firstName}!` : "G'day, Explorer!";

  return (
    <div
      data-testid="scout-bubble"
      className="relative max-w-md rounded-2xl p-4 bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-xl"
    >
      {/* Speech bubble tail */}
      <div className="absolute -left-2 top-6 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-violet-500 border-b-8 border-b-transparent" />

      <div className="font-semibold text-sm mb-1">Scout</div>
      <p className="text-sm leading-relaxed">
        {greeting} Welcome to Quest Island.
      </p>
    </div>
  );
}
