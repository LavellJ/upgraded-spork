import React from "react";

const SUBJECTS = {
  forest: { label: "Literacy", color: "#3B7D44" },
  desert: { label: "Math", color: "#C96A2B" },
  ocean: { label: "Science", color: "#3BA7B6" },
  night: { label: "HASS", color: "#404A73" },
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

function getLessonMeta(biome: string, id: string, framework = 'Generic') {
  const base = {
    forest: { icon: "📘", est: "5–7 min", objectives: ["Identify sounds", "Blend simple words", "Read aloud"], standard: "Foundational phonics & fluency" },
    desert: { icon: "➕", est: "6–8 min", objectives: ["Add within 10", "Use number bonds", "Apply to word problems"], standard: "Number sense & operations" },
    ocean: { icon: "⚙️", est: "5–7 min", objectives: ["Observe forces", "Use simple terms", "Predict outcomes"], standard: "Physical forces & inquiry" },
    night: { icon: "🧭", est: "5–7 min", objectives: ["Read symbols", "Use directions", "Locate places"], standard: "Human geography basics" },
  }[biome] || { icon: "📘", est: "5–7 min", objectives: ["Learn"], standard: "Core skill" };
  
  const reg = registryEntry(biome, id);
  
  // Get the mapped standard based on selected framework
  const mappedStd = 
    (reg?.standards && framework && reg.standards[framework]) ||
    (reg?.standards?.Generic) ||
    (STANDARDS[framework]?.[biome]) ||
    base.standard;

  return { 
    ...base, 
    est: reg?.est || base.est, 
    standard: mappedStd, 
    id, 
    biome 
  };
}

interface LessonDetailProps {
  open: boolean;
  onClose: () => void;
  biome: string;
  lesson: { id: string; title: string } | null;
  onMarkComplete: (id: string) => void;
  onStart: (lesson: { id: string; title: string }) => void;
  teacherMode: boolean;
  framework: string;
  protoOnly: boolean;
  calmTip?: boolean;
}

export function LessonDetail({ open, onClose, biome, lesson, onMarkComplete, onStart, teacherMode, framework, protoOnly, calmTip }: LessonDetailProps) {
  if (!open || !lesson) return null;
  const meta = getLessonMeta(biome, lesson.id, framework);
  const accent = SUBJECTS[biome].color;
  const hasLink = !protoOnly && !!registryEntry(biome, lesson.id)?.url?.trim();
  
  // Get framework-specific standard text
  const reg = registryEntry(biome, lesson.id);
  const standardText = reg?.standards?.[framework] || STANDARDS[framework]?.[biome] || meta.standard;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-stone-900/40" onClick={onClose} />
      <div className="relative z-10 w-[min(92vw,36rem)] rounded-3xl bg-white/95 backdrop-blur border border-stone-900/10 shadow-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: accent + "22" }}>{meta.icon}</div>
          <div><div className="text-lg font-extrabold" style={{ color: accent }}>{lesson.title}</div><div className="text-xs text-stone-600">Est. {meta.est} • {SUBJECTS[biome].label}</div></div>
          <button onClick={onClose} className="ml-auto text-stone-600 hover:text-stone-900 text-lg">×</button>
        </div>
        <div className="mt-3 text-sm">
          <div className="font-semibold mb-1">Objectives</div>
          {calmTip && (
            <div className="mt-2 mb-2 text-[11px] text-stone-500">
              🪶 Tip: Take a slow breath. You can preview or start when ready.
            </div>
          )}
          <ul className="list-disc pl-5 space-y-1 text-stone-700">{meta.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
          <div className="mt-3 text-xs text-stone-600">Aligned to: {standardText}</div>
          {teacherMode && <div className="mt-2 text-xs text-stone-600">Teacher tools: Quick-complete available.</div>}
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={() => onStart(lesson)} className="px-3 py-2 rounded-full bg-amber-700/90 hover:bg-amber-700 text-amber-50 transition ease-out">{hasLink ? 'Start (opens tab)' : 'Start'}</button>
          <button onClick={() => { onMarkComplete(lesson.id); onClose(); }} className="px-3 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition ease-out">Mark complete</button>
        </div>
      </div>
    </div>
  );
}