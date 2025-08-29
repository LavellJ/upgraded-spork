import { useMemo, useState } from "react";
import TrailMap from "./components/TrailMap";
import JournalTimer from "./components/JournalTimer";
import LessonRunner from "./features/LessonRunner";
import MusicToggle from "./components/MusicToggle";
import ProfileSelector from "./components/ProfileSelector";
import StreakBadge from "./components/StreakBadge";
import Badges from "./components/Badges";
import NewBadgeModal from "./components/NewBadgeModal";
import ParentView from "./components/ParentView";
import { defaultProfiles, type Profile } from "./store/profiles";
import { checkBadges } from "./utils/badges";
import { loadEarned, saveEarned, diffNewBadges } from "./utils/badgeStore";
import { allBadges } from "./store/badges";
import { getNote, setNote } from "./utils/journalStore";
import { validationErrors } from "./content/index.js";

// ---- localStorage helpers ----
function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem("campfire-progress-v1") || "{}");
  } catch {
    return {};
  }
}
function saveProgress(obj: any) {
  localStorage.setItem("campfire-progress-v1", JSON.stringify(obj));
}

type Screen = "trail" | "journal" | "lesson" | "success";

export default function App() {
  const [screen, setScreen] = useState<Screen>("trail");
  const [currentLesson, setCurrentLesson] = useState<any>(null);

  // Selected profile
  const [profile, setProfile] = useState<Profile | null>(null);

  // Parent view toggle
  const [showParent, setShowParent] = useState(false);

  // Progress per profile (loaded from localStorage)
  const [progressByProfile, setProgressByProfile] = useState<
    Record<string, { completed: Array<{ lessonId: string; date: string }> }>
  >(loadProgress());

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // New badge popup state
  const [newBadgeTitles, setNewBadgeTitles] = useState<
    Array<{ icon: string; title: string }>
  >([]);

  // Journal note state
  const [journalText, setJournalText] = useState<string>("");

  // Convenience: current profile's progress
  const progress =
    profile && progressByProfile[profile.id]
      ? progressByProfile[profile.id]
      : { completed: [] as Array<{ lessonId: string; date: string }> };

  function startLessonFlow(lesson: any) {
    setCurrentLesson(lesson);
    // load today's note for this profile
    setJournalText(profile ? getNote(profile.id, today) : "");
    setScreen("journal");
  }

  function onLessonDone() {
    if (!profile) return; // safety guard

    // 1) update progress state + localStorage
    setProgressByProfile((prev) => {
      const cur =
        prev[profile.id] || { completed: [] as Array<{ lessonId: string; date: string }> };
      const already = cur.completed.some(
        (c) => c.lessonId === currentLesson.id && c.date === today
      );
      const completed = already
        ? cur.completed
        : [...cur.completed, { lessonId: currentLesson.id, date: today }];

      const next = { ...prev, [profile.id]: { completed } };
      saveProgress(next);
      return next;
    });

    // 2) check for newly earned badges using what the state will be after this update
    const updated = (() => {
      const cur =
        progressByProfile[profile.id] || { completed: [] as Array<{ lessonId: string; date: string }> };
      const already = cur.completed.some(
        (c) => c.lessonId === currentLesson.id && c.date === today
      );
      const completed = already
        ? cur.completed
        : [...cur.completed, { lessonId: currentLesson.id, date: today }];
      return { ...progressByProfile, [profile.id]: { completed } };
    })();

    const earnedNow = checkBadges(updated[profile.id]);
    const earnedIdsNow = earnedNow.map((b) => b.id);
    const alreadyEarned = loadEarned(profile.id);
    const fresh = diffNewBadges(alreadyEarned, earnedIdsNow, today);

    if (fresh.length > 0) {
      saveEarned(profile.id, [...alreadyEarned, ...fresh]);
      const lookup = new Map(allBadges.map((b) => [b.id, b]));
      setNewBadgeTitles(
        fresh
          .map((f) => lookup.get(f.id))
          .filter(Boolean)
          .map((b) => ({ icon: b!.icon, title: b!.title }))
      );
    }

    // 3) go to success screen
    setScreen("success");
  }

  // if no profile chosen yet
  if (!profile) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Select Your Profile</h2>
        <ProfileSelector onSelect={(p) => setProfile(p)} />
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      {/* Content validation banner (if any files were skipped) */}
      {validationErrors.length > 0 && (
        <div
          style={{
            background: "#ffdddd",
            color: "#900",
            padding: "10px 14px",
            border: "1px solid #d00",
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          <strong>⚠️ Content Errors Detected:</strong>
          <ul style={{ margin: "6px 0", paddingLeft: 20 }}>
            {validationErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* badge popup modal */}
      <NewBadgeModal
        titles={newBadgeTitles}
        onClose={() => setNewBadgeTitles([])}
      />

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Campfire Learning Trail</h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div>
            {profile.avatar} {profile.name} — Lessons done: {progress.completed.length}
          </div>
          <StreakBadge dates={progress.completed.map((c) => c.date)} />
          <button
            style={{
              padding: "6px 10px",
              border: "1px solid #ccc",
              borderRadius: 8,
            }}
            onClick={() => setShowParent((s) => !s)}
          >
            {showParent ? "Parent ▲" : "Parent ▼"}
          </button>
          <MusicToggle />
        </div>
      </header>

      {showParent && (
        <ParentView
          profiles={defaultProfiles}
          progressByProfile={progressByProfile}
          onClose={() => setShowParent(false)}
        />
      )}

      {screen === "trail" && (
        <TrailMap onSelect={startLessonFlow} progress={progress} />
      )}

      {screen === "journal" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            maxWidth: 520,
            margin: "0 auto",
          }}
        >
          <h2>Scout’s Journal</h2>
          <p>Focus time! When the timer ends, your lesson begins.</p>

          {/* Note box */}
          <div style={{ width: "100%" }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
              Today’s note
            </label>
            <textarea
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              placeholder="What did you learn / notice today?"
              style={{
                width: "100%",
                minHeight: 90,
                padding: 10,
                border: "1px solid #ccc",
                borderRadius: 10,
                fontSize: 14,
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button
                onClick={() => {
                  if (profile) setNote(profile.id, today, journalText);
                }}
                style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 8 }}
              >
                Save Note
              </button>
            </div>
          </div>

          <JournalTimer seconds={15} onComplete={() => setScreen("lesson")} />
          <button
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              border: "1px solid #ccc",
            }}
            onClick={() => setScreen("lesson")}
          >
            Skip timer
          </button>

          {/* badges inside journal */}
          <div style={{ marginTop: 20, width: "100%" }}>
            <h3>Stickers Collected</h3>
            <Badges progress={progress} />
          </div>
        </div>
      )}

      {screen === "lesson" && currentLesson && (
        <LessonRunner lesson={currentLesson} onDone={onLessonDone} />
      )}

      {screen === "success" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <h2>Nice work! ⭐</h2>
          <button
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              border: "1px solid #ccc",
            }}
            onClick={() => {
              setCurrentLesson(null);
              setScreen("trail");
            }}
          >
            Back to Trail
          </button>
        </div>
      )}
    </div>
  );
}