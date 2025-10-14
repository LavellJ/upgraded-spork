import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";

type Activity = { id: string; title: string };

function e2eEnabled() {
  try {
    const qs = new URLSearchParams(window.location.search);
    return qs.has("e2e") || localStorage.getItem("E2E_CONTROLS") === "1";
  } catch {
    return false;
  }
}

export default function ActivityPage() {
  const [match, params] = useRoute("/activity/:activityId");
  const activityId = params?.activityId;
  const [activity, setActivity] = useState<Activity | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!activityId) return;
      try {
        const res = await fetch(`/api/activity/${activityId}`);
        const data = (await res.json()) as Activity;
        if (!cancelled) setActivity(data);
      } catch {
        if (!cancelled) setActivity(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activityId]);

  const onComplete = () => {
    window.dispatchEvent(
      new CustomEvent("activity-step-completed", { detail: { activityId } }),
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 data-testid="activity-heading" className="text-2xl font-semibold">
        {activity?.title ?? "Loading…"}
      </h1>

      {e2eEnabled() && (
        <button
          data-testid="complete-step"
          onClick={onComplete}
          className="mt-4 rounded-lg px-4 py-2 border"
        >
          Complete lesson
        </button>
      )}

      <Link href="/island">
        <a
          data-testid="back-to-island"
          className="inline-block mt-6 text-indigo-700"
        >
          Back to Island
        </a>
      </Link>
    </div>
  );
}
