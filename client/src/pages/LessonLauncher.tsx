import { useEffect, useState } from "react";
import { Link } from "wouter";

type TodayLesson = {
  id: string;
  displayTitle: string;
  firstActivityId?: string;
  firstActivityTitle?: string;
};

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

  const activityId = lesson?.firstActivityId || "act-001";

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-amber-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1
          data-testid="lesson-launcher-heading"
          className="text-3xl font-bold text-amber-900 mb-6"
        >
          Today's Quest
        </h1>
        {loading && (
          <div data-testid="lesson-loading" className="text-amber-700">
            Loading…
          </div>
        )}
        {!loading && lesson && (
          <div className="mt-6 rounded-2xl border-2 border-amber-200 p-6 bg-white/80 backdrop-blur-sm shadow-xl">
            <div
              className="text-xl font-semibold mb-4 text-amber-900"
              data-testid="lesson-title"
            >
              {lesson.displayTitle || lesson.id || "Untitled lesson"}
            </div>
            <Link
              href={`/activity/${activityId}`}
              data-testid="start-lesson"
              className="inline-block px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold shadow-lg hover:bg-emerald-700 transition-colors"
            >
              Start lesson
            </Link>
          </div>
        )}
        {!loading && !lesson && (
          <div className="mt-6 text-sm text-amber-700">No lesson assigned.</div>
        )}
      </div>
    </div>
  );
}
