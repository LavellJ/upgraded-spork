import React, { useState } from "react";
import { BottomSheet } from "./BottomSheet";

const cx = (...s: (string | false | undefined)[]): string => s.filter(Boolean).join(" ");

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

const TEMPLATES = {
  forest: {
    f1: { q: "Pick the word that starts with /m/:", options: ["mat", "sun", "dog"], correct: 0, explain: "/m/ as in mat" },
    f2: { q: "Blend c-a-t:", options: ["cat", "cap", "cot"], correct: 0, explain: "c+a+t = cat" },
    f3: { q: "Tap the sight word 'the':", options: ["the", "cat", "dog"], correct: 0, explain: "'the' is a common sight word" },
    f4: { q: "Complete: 'I ___ a book'", options: ["read", "blue", "happy"], correct: 0, explain: "'read' completes the sentence" },
    f5: { q: "Which rhymes with 'log'?", options: ["frog", "sun", "cup"], correct: 0, explain: "frog / log" }
  },
  desert: {
    d1: { q: "Which makes 5?", options: ["2+3", "1+1", "4+4"], correct: 0, explain: "2 and 3 make 5" },
    d2: { q: "Number bond to 5 — pick a pair:", options: ["4 & 1", "3 & 3", "5 & 5"], correct: 0, explain: "4 and 1" },
    d3: { q: "Which equals 9?", options: ["7+2", "4+1", "3+3"], correct: 0, explain: "7+2=9" },
    d4: { q: "Which is a double?", options: ["4+4", "3+5", "2+3"], correct: 0, explain: "A double is the same number twice" },
    d5: { q: "You have 2 apples and get 3 more. How many?", options: ["4", "5", "6"], correct: 1, explain: "2+3=5" }
  },
  ocean: {
    o1: { q: "Push or pull opens a door?", options: ["push", "pull", "neither"], correct: 1, explain: "You pull most doors open" },
    o2: { q: "Gravity pulls objects ___", options: ["down", "sideways", "up"], correct: 0, explain: "Gravity pulls toward Earth" },
    o3: { q: "Which has MORE friction?", options: ["carpet", "ice", "glass"], correct: 0, explain: "Rough surfaces have more friction" },
    o4: { q: "Sound is made by ___", options: ["vibrations", "light", "colors"], correct: 0, explain: "Vibrations make sound" },
    o5: { q: "A shadow forms when light is ___", options: ["blocked", "made louder", "only reflected"], correct: 0, explain: "Blocking light creates a shadow" }
  },
  night: {
    n1: { q: "Which symbol means school on a map legend?", options: ["🏫", "🌳", "🏠"], correct: 0, explain: "🏫 usually marks a school" },
    n2: { q: "What is a legend used for?", options: ["explaining map symbols", "finding treasure", "telling a story"], correct: 0, explain: "A legend explains symbols" },
    n3: { q: "Which shows your street best?", options: ["local map", "world map", "weather map"], correct: 0, explain: "Local maps show streets" },
    n4: { q: "Which direction is opposite East?", options: ["West", "North", "South"], correct: 0, explain: "West is opposite East" },
    n5: { q: "Which is water on a map?", options: ["lake", "forest", "mountain"], correct: 0, explain: "A lake is water" }
  }
};

const getTemplate = (biome: string, id: string) => TEMPLATES[biome]?.[id] || { q: "Prototype — placeholder:", options: ["Option A", "Option B"], correct: 0, explain: "We'll replace this later." };

// Activity URL (respects Prototype-only mode)
const resolveActivityUrl = (biome: string, lessonId: string, protoOnly: boolean) => {
  if (protoOnly) return `https://player.example/${biome}/${lessonId}`;
  const reg = registryEntry(biome, lessonId);
  const url = (reg && typeof reg.url === 'string' && reg.url.trim().length > 0) ? reg.url : `https://player.example/${biome}/${lessonId}`;
  return url;
};

interface MCActivityProps {
  biome: string;
  lesson: { id: string; title: string };
  onSolved: () => void;
}

function MCActivity({ biome, lesson, onSolved }: MCActivityProps) {
  const accent = SUBJECTS[biome].color;
  const tpl = getTemplate(biome, lesson.id);
  const [sel, setSel] = useState(-1);
  const [checked, setChecked] = useState(false);
  const ok = checked && sel === tpl.correct;
  return (
    <div className="p-3">
      <div className="text-sm text-stone-700 mb-2">Prototype activity</div>
      <div className="text-lg font-bold mb-3" style={{ color: accent }}>{tpl.q}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{tpl.options.map((opt, i) => (
        <button key={i} onClick={() => { setSel(i); setChecked(false); }} className={cx("text-left px-3 py-2 rounded-xl border bg-white hover:bg-stone-50 transition ease-out", sel === i && "ring-2 ring-amber-500")}>{String.fromCharCode(65 + i)}. {opt}</button>
      ))}</div>
      <div className="mt-3 flex items-center gap-2">
        <button disabled={sel < 0} onClick={() => setChecked(true)} className={cx("px-3 py-2 rounded-full transition ease-out", sel < 0 ? "bg-stone-200 text-stone-500" : "bg-amber-700/90 text-white hover:bg-amber-700")}>Check answer</button>
        {checked && (<span className={cx("text-sm", ok ? "text-emerald-700" : "text-rose-700")}>{ok ? "Correct!" : "Try again"}</span>)}
      </div>
      {checked && !ok && <div className="mt-1 text-xs text-stone-600">Hint: {tpl.explain}</div>}
      {ok && <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">Nice! Mark complete when you're ready.</div>}
      {ok && <div className="mt-3"><button onClick={onSolved} className="px-3 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition ease-out">Mark complete</button></div>}
    </div>
  );
}

interface ActivityPlayerProps {
  open: boolean;
  onClose: () => void;
  biome?: string;
  lesson?: { id: string; title: string };
  onMarkComplete: (id: string) => void;
  protoOnly: boolean;
}

export function ActivityPlayer({ open, onClose, biome, lesson, onMarkComplete, protoOnly }: ActivityPlayerProps) {
  if (!open || !lesson) return null;
  const url = resolveActivityUrl(biome!, lesson.id, protoOnly);
  const accent = SUBJECTS[biome!].color;
  const external = !protoOnly && typeof url === 'string' && !url.includes('player.example');
  return (
    <BottomSheet open={open} onClose={onClose} titleId="activity-title">
      <div className="text-stone-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: accent + "22" }}>▶️</div>
          <h2 id="activity-title" className="font-extrabold" style={{ color: accent }} tabIndex={-1} data-autofocus>{lesson.title}</h2>
          {external ? <a href={url} target="_blank" rel="noreferrer" className="ml-auto text-xs px-2 py-1 rounded-full bg-white border hover:bg-stone-50 transition ease-out">Open in new tab</a> : <span className="ml-auto text-[11px] px-2 py-1 rounded-full bg-white/70 border">Using in-app prototype</span>}
        </div>
        <div className="mt-3 rounded-xl overflow-hidden border bg-white">
          <MCActivity biome={biome!} lesson={lesson} onSolved={() => { onMarkComplete(lesson.id); onClose(); }} />
        </div>
        <div className="mt-3 flex items-center justify-end"><button onClick={onClose} className="px-3 py-2 rounded-full border bg-white hover:bg-stone-50 text-stone-700 transition ease-out">Close</button></div>
      </div>
    </BottomSheet>
  );
}