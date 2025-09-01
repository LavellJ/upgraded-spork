import React, { useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { LessonDetail } from "./LessonDetail";

const cx = (...s: (string | false | undefined)[]): string => s.filter(Boolean).join(" ");

const SUBJECTS = {
  forest: { label: "Literacy", color: "#3B7D44" },
  desert: { label: "Math", color: "#C96A2B" },
  ocean: { label: "Science", color: "#3BA7B6" },
  night: { label: "HASS", color: "#404A73" },
};

const STANDARDS = {
  frameworkOptions: ["Generic", "ACARA", "NZC"],
  Generic: { forest: "Foundational phonics & fluency", desert: "Number sense & operations", ocean: "Physical forces & inquiry", night: "Human geography basics" },
  ACARA: { forest: "ACARA F–2: Phonics & Fluency", desert: "ACARA F–2: Number (add within 10)", ocean: "ACARA F–2: Physical sciences", night: "ACARA F–2: HASS — Places & spaces" },
  NZC: { forest: "NZC L1: Phonics/Decoding", desert: "NZC L1: Number (to 10)", ocean: "NZC L1: Physical World", night: "NZC L1: Place & Environment" },
};

const LOOP1 = {
  forest: [
    { id: "f1", title: "First sounds (phonemic)" },
    { id: "f2", title: "CVC blending" },
    { id: "f3", title: "Sight words A" },
    { id: "f4", title: "Build a sentence" },
    { id: "f5", title: "Rhyme pairs" },
  ],
  desert: [
    { id: "d1", title: "Add within 5" },
    { id: "d2", title: "Number bonds to 5" },
    { id: "d3", title: "Add within 10" },
    { id: "d4", title: "Doubles 1–5" },
    { id: "d5", title: "Mini word problems" },
  ],
  ocean: [
    { id: "o1", title: "Push vs Pull" },
    { id: "o2", title: "Gravity goes down" },
    { id: "o3", title: "Friction (smooth vs rough)" },
    { id: "o4", title: "Sound = vibrations" },
    { id: "o5", title: "Light & shadows" },
  ],
  night: [
    { id: "n1", title: "What is a map?" },
    { id: "n2", title: "Symbols & legend" },
    { id: "n3", title: "My place / street" },
    { id: "n4", title: "Directions (N/E/S/W)" },
    { id: "n5", title: "Land vs water" },
  ],
};

const REGISTRY = {
  1: {
    forest: {
      f1: { url: "", est: "5–7 min" },
      f2: { url: "https://replit.com/@your-org/lit-cvc-blending", est: "6–8 min" },
      f3: { url: "", est: "6–8 min" },
      f4: { url: "", est: "6–8 min" },
      f5: { url: "", est: "6–8 min" },
    },
    desert: {
      d1: { url: "", est: "5–7 min" },
      d2: { url: "https://replit.com/@your-org/math-bonds-5", est: "6–8 min" },
      d3: { url: "", est: "6–8 min" },
      d4: { url: "", est: "6–8 min" },
      d5: { url: "", est: "6–8 min" },
    },
    ocean: { o1: { url: "", est: "5–7 min" }, o2: { url: "", est: "5–7 min" }, o3: { url: "", est: "5–7 min" }, o4: { url: "", est: "5–7 min" }, o5: { url: "", est: "5–7 min" } },
    night: { n1: { url: "", est: "5–7 min" }, n2: { url: "", est: "5–7 min" }, n3: { url: "", est: "5–7 min" }, n4: { url: "", est: "5–7 min" }, n5: { url: "", est: "5–7 min" } },
  },
};

let CURRENT_LOOP = 1;
const registryEntry = (biome: string, lessonId: string) => {
  const current = REGISTRY?.[CURRENT_LOOP]?.[biome]?.[lessonId];
  if (current) return current;
  const loops = Object.keys(REGISTRY || {}).map(Number).sort((a, b) => b - a);
  for (const L of loops) {
    const e = REGISTRY?.[L]?.[biome]?.[lessonId];
    if (e) return e;
  }
  return null;
};

function getLessonMeta(biome: string, id: string) {
  const base = {
    forest: { icon: "📘", est: "5–7 min", objectives: ["Identify sounds", "Blend simple words", "Read aloud"], standard: "Foundational phonics & fluency" },
    desert: { icon: "➕", est: "6–8 min", objectives: ["Add within 10", "Use number bonds", "Apply to word problems"], standard: "Number sense & operations" },
    ocean: { icon: "⚙️", est: "5–7 min", objectives: ["Observe forces", "Use simple terms", "Predict outcomes"], standard: "Physical forces & inquiry" },
    night: { icon: "🧭", est: "5–7 min", objectives: ["Read symbols", "Use directions", "Locate places"], standard: "Human geography basics" },
  }[biome] || { icon: "📘", est: "5–7 min", objectives: ["Learn"], standard: "Core skill" };
  const reg = registryEntry(biome, id);
  return { ...base, est: reg?.est || base.est, standard: reg?.standard || base.standard, id, biome };
}

interface LessonSheetProps {
  open: boolean;
  onClose: () => void;
  biome: string;
  lessons: { id: string; title: string }[];
  completed: Set<string>;
  onComplete: (id: string) => void;
  canPreview: boolean;
  teacherMode: boolean;
  framework: string;
  onStart: (lesson: { id: string; title: string }) => void;
  protoOnly: boolean;
  calmTip?: boolean;
}

export function LessonSheet({ open, onClose, biome, lessons, completed, onComplete, canPreview, teacherMode, framework, onStart, protoOnly, calmTip }: LessonSheetProps) {
  const subject = SUBJECTS[biome];
  const [detail, setDetail] = useState<{ id: string; title: string } | null>(null);
  const allDone = completed.size === lessons.length && lessons.length > 0;
  const standardText = STANDARDS[framework]?.[biome] || getLessonMeta(biome, lessons[0]?.id || 'x').standard;
  return (
    <BottomSheet open={open} onClose={() => { setDetail(null); onClose(); }}>
      <div className="text-stone-800">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2"><span className="text-xl">📍</span><h3 className="text-xl font-extrabold" style={{ color: subject.color }}>{subject.label}</h3></div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-stone-900/5">{completed.size}/{lessons.length} complete</span>
            {teacherMode && <button onClick={() => { lessons.forEach(l => { if (!completed.has(l.id)) onComplete(l.id); }); }} disabled={allDone} className={cx("text-xs px-2 py-1 rounded-full border transition ease-out", allDone ? "bg-stone-100 text-stone-400" : "bg-white hover:bg-stone-50")}>Complete all</button>}
          </div>
        </div>
        {teacherMode && <div className="mt-2 text-[11px] text-stone-600">Standards ({framework}): <b>{standardText}</b></div>}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {lessons.map((l, i) => {
            const isDone = completed?.has?.(l.id) || false;
            const hasDeepLink = !!(!protoOnly && registryEntry(biome, l.id)?.url?.trim());
            return (
              <div key={l.id} className={cx("rounded-xl border border-amber-900/20 bg-white/70 p-3 flex items-center gap-3 transition-colors ease-out", isDone && "opacity-70")}>
                <button onClick={() => setDetail(l)} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: subject.color + "22" }} aria-label="Open lesson details">{isDone ? "✅" : "📘"}</button>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{i + 1}. {l.title}</div>
                  {canPreview && !isDone && <div className="text-[11px] text-stone-600">👀 Preview unlocked</div>}
                  {hasDeepLink && !protoOnly && <div className="text-[10px] text-stone-500">🔗 External lesson available</div>}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <button onClick={() => onStart(l)} className="text-xs px-2 py-1 rounded-full bg-amber-700/90 hover:bg-amber-700 text-white transition ease-out">Start</button>
                  <button disabled={isDone} onClick={(e) => { e.stopPropagation?.(); onComplete(l.id); }} className={cx("text-xs px-2 py-1 rounded-full transition ease-out", isDone ? "bg-stone-200" : "bg-emerald-600 text-white hover:bg-emerald-700")}>{isDone ? "Done" : "Complete"}</button>
                </div>
              </div>
            );
          })}
        </div>
        <LessonDetail open={!!detail} onClose={() => setDetail(null)} biome={biome} lesson={detail} onMarkComplete={onComplete} onStart={onStart} teacherMode={teacherMode} standardText={standardText} protoOnly={protoOnly} calmTip={calmTip} />
      </div>
    </BottomSheet>
  );
}