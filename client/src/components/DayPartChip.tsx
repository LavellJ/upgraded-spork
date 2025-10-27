import React from "react";

function labelFromHour(h: number) {
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
}

export default function DayPartChip() {
  const label = labelFromHour(new Date().getHours());
  return (
    <span
      data-testid="daypart-chip"
      className="inline-flex items-center rounded-full px-3 py-1 text-sm bg-neutral-100 text-neutral-700"
    >
      {label}
    </span>
  );
}
