import React from "react";
import { useRoute, Link } from "wouter";

export default function ActivityStub() {
  const [, params] = useRoute("/activity/:activityId");
  const activityId = params?.activityId ?? "unknown";
  const title =
    activityId === "act-001" ? "Patterns Intro" : `Activity ${activityId}`;

  return (
    <div className="p-6" data-testid="activity-root">
      <h1
        className="text-2xl font-semibold mb-2"
        data-testid="activity-heading"
      >
        {title}
      </h1>
      <p className="mb-4">Activity ID: {activityId}</p>
      <button
        className="px-3 py-2 rounded bg-indigo-600 text-white"
        data-testid="complete-step"
      >
        Complete step
      </button>
      <div className="mt-4">
        <Link href="/lesson" className="underline">
          Back to Lesson
        </Link>
      </div>
    </div>
  );
}
