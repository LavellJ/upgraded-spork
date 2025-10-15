import React from "react";
import { useRoute, Link } from "wouter";

export default function ActivityStub() {
  const [, params] = useRoute("/activity/:activityId");
  const activityId = params?.activityId ?? "unknown";
  const title =
    activityId === "act-001" ? "Patterns Intro" : `Activity ${activityId}`;

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-sky-50 to-amber-50 p-8"
      data-testid="activity-root"
    >
      <div className="max-w-3xl mx-auto">
        <h1
          className="text-3xl font-bold text-amber-900 mb-4"
          data-testid="activity-heading"
        >
          {title}
        </h1>
        <p className="mb-6 text-amber-700">Activity ID: {activityId}</p>
        <button
          className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg hover:bg-indigo-700 transition-colors"
          data-testid="complete-step"
        >
          Complete step
        </button>
        <div className="mt-6">
          <Link href="/lesson" className="text-indigo-600 hover:underline">
            Back to Lesson
          </Link>
        </div>
      </div>
    </div>
  );
}
