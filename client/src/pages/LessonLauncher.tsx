import { useEffect, useState } from "react";
import { Link } from "wouter";

type TodayLesson = { id: string; displayTitle: string; activityId: string };

export default function LessonLauncher() {
  const [lesson, setLesson] = useState<TodayLesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/lessons/today");
        const data = (await res.json()) as TodayLesson;
        if (!cancelled) setLesson(data);
      } catch {
        if (!cancelled) setLesson(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1
        data-testid="lesson-launcher-heading"
        className="text-2xl font-semibold"
      >
        Today's Quest
      </h1>
      {loading && <div data-testid="lesson-loading">Loading…</div>}
      {!loading && lesson && (
        <div className="mt-4 rounded-xl border p-4">
          <div className="text-lg mb-2" data-testid="lesson-title">
            {lesson.displayTitle}
          </div>
          <Link href={`/activity/${lesson.activityId}?e2e=1`}>
            <a
              className="inline-block rounded-lg px-4 py-2 bg-indigo-600 text-white"
              data-testid="start-lesson"
            >
              Start
            </a>
          </Link>
        </div>
      )}
      {!loading && !lesson && (
        <div className="mt-4 text-sm text-zinc-600">No lesson assigned.</div>
      )}
    </div>
  );
}
