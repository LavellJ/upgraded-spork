import React, { useEffect, useState } from "react";
import { BottomSheet } from "./components/BottomSheet";
import { useBackpack, hasEquipped } from "./hooks/useBackpack";
import { BackpackSheet } from "./components/BackpackSheet";
import { ActivityPlayer } from "./components/ActivityPlayer";
import { LessonSheet } from "./components/LessonSheet";
import { TeacherPanel } from "./components/TeacherPanel";
import IslandBackdrop from "./components/IslandBackdrop";
import LOOP2 from "./data/loop2.json";
import { logEvent } from "./lib/analytics";

// Quest Island — Loop 1 (Calm + Prototype-only Mode + Progress Import/Export + Resume)
// - Prototype-only Mode (default ON):
//   • Hides any external lesson hints
//   • Start never says "opens tab"
//   • Player always uses the calm in-app prototype
//   • Toggle in Teacher Mode (persists to localStorage)
// - Import/Export Progress (no backend):
//   • "Copy progress link" → packs state into ?qi= token
//   • "Import" → paste link or token to restore
// - Resume last lesson
//   • When you hit Start on any lesson, we remember it and show a "Resume" button in the header.
//   • Works across refreshes via localStorage.

// --------------------------------------
// Generic utilities & small UI primitives
// --------------------------------------
const KEYS = { loop:'qi_loop', comp:'qi_comp', bpItems:'qi_bp_items', bpEq:'qi_bp_equipped', teacher:'qi_teacher', framework:'qi_framework', calm:'qi_calm', proto:'qi_proto_only', last:'qi_last' };
const cx = (...s) => s.filter(Boolean).join(" ");

// Components extracted to separate files

// Backpack hook extracted to separate file

// BackpackSheet component extracted to separate file

// --------------------------------------
// Subjects, Standards, Lessons
// --------------------------------------
const SUBJECTS = {
  forest: { label: "Literacy", color: "#3B7D44" },
  desert: { label: "Math", color: "#C96A2B" },
  ocean:  { label: "Science", color: "#3BA7B6" },
  night:  { label: "HASS", color: "#404A73" },
};
const STANDARDS = {
  frameworkOptions: ["Generic","ACARA","NZC"],
  Generic: { forest: "Foundational phonics & fluency", desert: "Number sense & operations", ocean: "Physical forces & inquiry", night: "Human geography basics" },
  ACARA:   { forest: "ACARA F–2: Phonics & Fluency", desert: "ACARA F–2: Number (add within 10)", ocean: "ACARA F–2: Physical sciences", night: "ACARA F–2: HASS — Places & spaces" },
  NZC:     { forest: "NZC L1: Phonics/Decoding", desert: "NZC L1: Number (to 10)", ocean: "NZC L1: Physical World", night: "NZC L1: Place & Environment" },
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

// ---- Lesson Registry (per-loop → biome → lessonId)
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


// ---- Lesson Registry (per-loop → biome → lessonId)


let CURRENT_LOOP = 1;
const registryEntry = (biome, lessonId) => {
  const current = REGISTRY?.[CURRENT_LOOP]?.[biome]?.[lessonId];
  if (current) return current;
  const loops = Object.keys(REGISTRY || {}).map(Number).sort((a,b)=>b-a);
  for (const L of loops) {
    const e = REGISTRY?.[L]?.[biome]?.[lessonId];
    if (e) return e;
  }
  return null;
};

const findLesson = (biome,id,lessons)=> (lessons[biome]||[]).find(l=>l.id===id)||null;

// Time of day background
const BG_BY_TOD = {
  morning: "from-amber-50 via-rose-50 to-sky-100",
  afternoon: "from-amber-100 via-amber-50 to-stone-200",
  evening: "from-slate-800 via-stone-800 to-slate-900",
};
const inferTimeOfDay = (d = new Date()) => { const h = d.getHours(); return h<5||h>=17?"evening": (h<12?"morning":"afternoon"); };

// Ambient FX (calm-aware)
const AMBIENT_STYLES = `
@keyframes moteFloat {0%{transform:translateY(0);opacity:0}20%{opacity:.55}100%{transform:translateY(-60px);opacity:0}}
@keyframes firefly {0%,100%{opacity:.25;transform:translate(0,0)}50%{opacity:1;transform:translate(6px,-8px)}}
@keyframes shimmer {0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-6px) scaleY(1.03)}}
@keyframes campGlow {0%,100%{opacity:.6}50%{opacity:1}}
.mote{position:absolute;width:6px;height:6px;border-radius:9999px;background:rgba(255,243,200,.6);filter:blur(1px)}
.fly{position:absolute;width:4px;height:4px;border-radius:9999px;background:#ffd35a;box-shadow:0 0 10px 3px rgba(255,211,90,.75)}
.haze{position:absolute;left:0;right:0;bottom:12%;height:34%;background:radial-gradient(100% 60% at 50% 100%, rgba(255,190,90,.12), rgba(255,190,90,.05) 40%, rgba(255,190,90,0) 70%);filter:blur(2px) saturate(110%)}
.glow{position:absolute;left:50%;transform:translateX(-50%);bottom:70px;width:280px;height:280px;border-radius:9999px;background:radial-gradient(closest-side, rgba(255,160,60,.35), rgba(255,110,0,.18), rgba(255,140,0,0) 70%);filter:blur(12px)}
.texture{position:absolute;inset:0;opacity:.12;background-image:radial-gradient(rgba(0,0,0,.06) 1px, transparent 1px);background-size:4px 4px;mix-blend:multiply;pointer-events:none}`;
const DustMotes = () => { const dots = Array.from({length:12},(_,i)=>({l:`${(i*7)%100}%`,b:`${(i*9)%88+6}%`,d:`${i*.6}s`,u:`${8+(i%5)}s`})); return <div aria-hidden className="absolute inset-0">{dots.map((d,i)=><span key={i} className="mote" style={{left:d.l,bottom:d.b,animation:`moteFloat ${d.u} linear ${d.d} infinite alternate`}}/>)}</div>; };
const Fireflies = () => { const dots = Array.from({length:10},(_,i)=>({l:`${(i*11)%100}%`,t:`${10+(i*7)%60}%`,d:`${i*.4}s`,u:`${2+(i%4)*.5}s`})); return <div aria-hidden className="absolute inset-0">{dots.map((d,i)=><span key={i} className="fly" style={{left:d.l,top:d.t,animation:`firefly ${d.u} ease-in-out ${d.d} infinite`}}/>)}</div>; };
const HeatHaze = ({calm=false}) => <div aria-hidden className="haze" style={{animation: calm? 'none' : 'shimmer 5s ease-in-out infinite'}}/>;
const CampfireGlow = ({intensity=.75, calm=false}) => <div aria-hidden className="glow" style={{opacity:intensity,animation: calm? 'none' : 'campGlow 3s ease-in-out infinite'}}/>;
const AmbientLayer = ({tod, calm=false}) => (
  <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
    {tod==='morning'&&!calm&&<DustMotes/>}
    {tod==='afternoon'&&!calm&&<HeatHaze calm={calm}/>}
    {tod==='evening'&&!calm&&<Fireflies/>}
    <CampfireGlow intensity={tod==='evening'?1:.7} calm={calm}/>
    <div className="texture"/>
    <style>{AMBIENT_STYLES}</style>
  </div>
);

// Meta helpers
function getLessonMeta(biome,id){ const base={
  forest:{icon:"📘",est:"5–7 min",objectives:["Identify sounds","Blend simple words","Read aloud"],standard:"Foundational phonics & fluency"},
  desert:{icon:"➕",est:"6–8 min",objectives:["Add within 10","Use number bonds","Apply to word problems"],standard:"Number sense & operations"},
  ocean:{icon:"⚙️",est:"5–7 min",objectives:["Observe forces","Use simple terms","Predict outcomes"],standard:"Physical forces & inquiry"},
  night:{icon:"🧭",est:"5–7 min",objectives:["Read symbols","Use directions","Locate places"],standard:"Human geography basics"},
}[biome] || {icon:"📘",est:"5–7 min",objectives:["Learn"],standard:"Core skill"};
  const reg = registryEntry(biome,id);
  return {...base, est: reg?.est || base.est, standard: reg?.standard || base.standard, id, biome};
}
// Activity URL (respects Prototype-only mode)
const resolveActivityUrl = (biome,lessonId, protoOnly) => {
  if (protoOnly) return `https://player.example/${biome}/${lessonId}`;
  const reg = registryEntry(biome,lessonId);
  const url = (reg && typeof reg.url==='string' && reg.url.trim().length>0) ? reg.url : `https://player.example/${biome}/${lessonId}`;
  return url;
};

// Progress encode/decode helpers (URL-safe Base64)
const b64urlEncode = (s)=>{ const bytes=new TextEncoder().encode(s); let bin=''; bytes.forEach(b=>bin+=String.fromCharCode(b)); return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); };
const b64urlDecode = (s)=>{ const n=s.replace(/-/g,'+').replace(/_/g,'/'); const pad = n.length%4? '='.repeat(4-(n.length%4)) : ''; const str=atob(n+pad); const bytes=new Uint8Array(str.length); for(let i=0;i<str.length;i++) bytes[i]=str.charCodeAt(i); return new TextDecoder().decode(bytes); };
const buildProgressPayload = (loop,comp,bp,framework,protoOnly)=> ({
  v:1,
  loop,
  comp:{
    forest:Array.from(comp.forest||[]),
    desert:Array.from(comp.desert||[]),
    ocean:Array.from(comp.ocean||[]),
    night:Array.from(comp.night||[]),
  },
  bp:{ items: bp.items||[], equipped: bp.equipped||[] },
  framework, protoOnly
});
const makeProgressLink = (payload)=>{ const base=(typeof window!=='undefined')?(window.location.origin+window.location.pathname):'https://example.com/quest'; const token=b64urlEncode(JSON.stringify(payload)); return `${base}?qi=${token}`; };
const extractQiFromInput = (input)=>{ try{ const url=new URL(input); const q=url.searchParams.get('qi'); if(q) return q; }catch{} const m=String(input||'').match(/[?&#]qi=([A-Za-z0-9_-]+)/); return m? m[1] : String(input||'').trim(); };

// --------------------------------------
// Prototype Activities (per-lesson templates)
// --------------------------------------
const TEMPLATES={
  forest:{
    f1:{q:"Pick the word that starts with /m/:",options:["mat","sun","dog"],correct:0,explain:"/m/ as in mat"},
    f2:{q:"Blend c-a-t:",options:["cat","cap","cot"],correct:0,explain:"c+a+t = cat"},
    f3:{q:"Tap the sight word 'the':",options:["the","cat","dog"],correct:0,explain:"'the' is a common sight word"},
    f4:{q:"Complete: 'I ___ a book'",options:["read","blue","happy"],correct:0,explain:"'read' completes the sentence"},
    f5:{q:"Which rhymes with 'log'?",options:["frog","sun","cup"],correct:0,explain:"frog / log"}
  },
  desert:{
    d1:{q:"Which makes 5?",options:["2+3","1+1","4+4"],correct:0,explain:"2 and 3 make 5"},
    d2:{q:"Number bond to 5 — pick a pair:",options:["4 & 1","3 & 3","5 & 5"],correct:0,explain:"4 and 1"},
    d3:{q:"Which equals 9?",options:["7+2","4+1","3+3"],correct:0,explain:"7+2=9"},
    d4:{q:"Which is a double?",options:["4+4","3+5","2+3"],correct:0,explain:"A double is the same number twice"},
    d5:{q:"You have 2 apples and get 3 more. How many?",options:["4","5","6"],correct:1,explain:"2+3=5"}
  },
  ocean:{
    o1:{q:"Push or pull opens a door?",options:["push","pull","neither"],correct:1,explain:"You pull most doors open"},
    o2:{q:"Gravity pulls objects ___",options:["down","sideways","up"],correct:0,explain:"Gravity pulls toward Earth"},
    o3:{q:"Which has MORE friction?",options:["carpet","ice","glass"],correct:0,explain:"Rough surfaces have more friction"},
    o4:{q:"Sound is made by ___",options:["vibrations","light","colors"],correct:0,explain:"Vibrations make sound"},
    o5:{q:"A shadow forms when light is ___",options:["blocked","made louder","only reflected"],correct:0,explain:"Blocking light creates a shadow"}
  },
  night:{
    n1:{q:"Which symbol means school on a map legend?",options:["🏫","🌳","🏠"],correct:0,explain:"🏫 usually marks a school"},
    n2:{q:"What is a legend used for?",options:["explaining map symbols","finding treasure","telling a story"],correct:0,explain:"A legend explains symbols"},
    n3:{q:"Which shows your street best?",options:["local map","world map","weather map"],correct:0,explain:"Local maps show streets"},
    n4:{q:"Which direction is opposite East?",options:["West","North","South"],correct:0,explain:"West is opposite East"},
    n5:{q:"Which is water on a map?",options:["lake","forest","mountain"],correct:0,explain:"A lake is water"}
  }
};
const getTemplate=(biome,id)=> TEMPLATES[biome]?.[id] || {q:"Prototype — placeholder:",options:["Option A","Option B"],correct:0,explain:"We'll replace this later."};

// MCActivity component moved to ActivityPlayer.tsx

// --------------------------------------
// Activity Player, Lesson Detail/Sheet, Nodes
// --------------------------------------
// ActivityPlayer component moved to ActivityPlayer.tsx

// LessonDetail component moved to separate file

// LessonSheet component moved to separate file

function Node({biome,status,onClick,count,total,calm=false}){
  const subject=SUBJECTS[biome];
  const base={forest:"from-green-200 to-green-300",desert:"from-orange-200 to-amber-300",ocean:"from-cyan-200 to-sky-300",night:"from-indigo-300 to-slate-400"}[biome];
  const ringUnlocked = 'ring-2 ring-amber-200/60';
  const ringDone = 'ring-2 ring-emerald-300/70';
  const len = total || 5;              // ← dynamic total
  const arc = (Math.min(count, len) / len) * 289;            // ← dynamic dash
  const wiggleClass = calm ? '' : 'qi-bob';
  
  return (
    <button onClick={onClick} disabled={status==='locked'} className={cx(
      "relative w-36 h-36 sm:w-40 sm:h-40 rounded-full shadow-xl border-2 bg-gradient-to-br overflow-hidden transition-shadow ease-out",
      base, status==='locked'&&'opacity-60 grayscale', status==='unlocked'&&ringUnlocked, status==='done'&&ringDone
    )} style={{borderColor:subject.color+'80'}}>
      <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(rgba(255,255,255,.6) 2px, transparent 2px)',backgroundSize:'6px 6px'}}/>
      <svg className="absolute inset-0" viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(0,0,0,.08)" strokeWidth="8"/>
        <circle cx="50" cy="50" r="46" fill="none" stroke={subject.color} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${arc} 289`} transform="rotate(-90 50 50)"/>
      </svg>
      
      {/* Biome emoji icon with bob animation */}
      <div className={cx("absolute inset-0 flex items-center justify-center text-4xl", wiggleClass)}>
        {biome==='forest'?'🌲':biome==='desert'?'🏜️':biome==='ocean'?'🌊':'🌙'}
      </div>
      
      <span className="absolute left-2 bottom-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-white/70 text-stone-700">{subject.label}</span>
      <span className="absolute right-2 top-2 text-[11px] px-2 py-0.5 rounded-full bg-white/80 text-stone-700 shadow-sm">
        {count}/{total}                                         {/* ← dynamic fraction */}
      </span>
      {status==='locked'&&<span className="absolute -right-2 -bottom-2 text-[11px] px-2 py-1 rounded-full bg-stone-800 text-white shadow">🔒</span>}
      {status==='done'&&<span className="absolute -right-2 -bottom-2 text-[11px] px-2 py-1 rounded-full bg-emerald-600 text-white shadow">✓</span>}
    </button>
  );
}

function LessonNode({biome,lesson,completed,onSelect,pos,locked,isNext,onLocked}){
  const {label,color}=SUBJECTS[biome]; const isDone= completed?.has?.(lesson.id)||false; const accent=color;
  return (
    <div className="absolute cursor-pointer z-10" style={{left:pos.x+'%',top:pos.y+'%'}} onClick={()=>{
      if (locked) { onLocked?.(); return; }
      onSelect(biome,lesson);
    }}>
      <div className={cx("relative flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-all duration-300 ease-out border border-amber-900/20", isDone ? "bg-emerald-100/90 shadow-emerald-200 scale-110" : locked ? "bg-stone-200/70 shadow-stone-200" : "bg-white/95 hover:scale-110 hover:shadow-xl hover:bg-amber-50/95")}>
        <span className="text-xl" style={{color: locked ? '#999' : accent}}>{isDone ? '✅' : '📘'}</span>
        {!isDone && !locked && (
          <div className="absolute -inset-2 rounded-full border-2 opacity-30 animate-pulse" style={{borderColor:accent}}/>
        )}
        {isNext && !isDone && !locked && (
          <div
            className="absolute -inset-3 rounded-full ring-2 animate-pulse"
            style={{ boxShadow: `0 0 0 2px ${color}22` }}
            aria-hidden
          />
        )}
      </div>
      <div className="absolute mt-2 left-1/2 -translate-x-1/2 w-max">
        <div className={cx("text-xs font-semibold px-2 py-1 rounded-lg shadow-sm backdrop-blur border", isDone ? "bg-emerald-100/90 text-emerald-800 border-emerald-200" : locked ? "bg-stone-200/80 text-stone-600 border-stone-300" : "bg-white/95 border-amber-900/20")} style={{color: locked ? '#999' : accent}}>
          {lesson.title}
        </div>
      </div>
    </div>
  );
}

// --------------------------------------
// Teacher Panel UI
// --------------------------------------
// TeacherPanel component moved to separate file

// --------------------------------------
// Main App Component
// --------------------------------------
export default function App(){
  // ---- Global state (localStorage-backed) ----
  const [loop,setLoop]=useState(()=>{ try{return parseInt(localStorage.getItem(KEYS.loop)||'1');}catch{return 1;} });

  // keep registry in sync with current loop for metadata lookup
  CURRENT_LOOP = loop as any;

  // select lessons by active loop
  const LESSONS: any = loop === 2 ? LOOP2 : LOOP1;
  const [comp,setComp]=useState(()=>{ try{const raw=JSON.parse(localStorage.getItem(KEYS.comp)||'{}'); return { forest: new Set(raw.forest||[]), desert: new Set(raw.desert||[]), ocean: new Set(raw.ocean||[]), night: new Set(raw.night||[]) };}catch{return { forest: new Set(), desert: new Set(), ocean: new Set(), night: new Set() };} });
  const [teacherMode,setTeacherMode]=useState(()=>{ try{return JSON.parse(localStorage.getItem(KEYS.teacher)||'false');}catch{return false;} });
  const [framework,setFramework]=useState(()=>{ try{return localStorage.getItem(KEYS.framework)||'Generic';}catch{return 'Generic';} });
  const [calm,setCalm]=useState(()=>{ try{return JSON.parse(localStorage.getItem(KEYS.calm)||'false');}catch{return false;} });
  const [protoOnly,setProtoOnly]=useState(()=>{ try{return JSON.parse(localStorage.getItem(KEYS.proto)||'true');}catch{return true;} });
  const [last,setLast]=useState(()=>{ try{return JSON.parse(localStorage.getItem(KEYS.last)||'null');}catch{return null;} });

  // ---- UI state ----
  const [openBiome,setOpenBiome]=useState<string | null>(null); const [showBP,setShowBP]=useState(false); const [showTeacher,setShowTeacher]=useState(false); const [player,setPlayer]=useState<{biome:string,lesson:any} | null>(null); const [toast,setToast]=useState<string | null>(null); const [celebrate,setCelebrate]=useState(false);

  // ---- Flash toast helper ----
  function flash(msg: string, ms = 1400) {
    setToast(msg);
    window.clearTimeout((flash as any)._t);
    (flash as any)._t = window.setTimeout(() => setToast(null), ms);
  }

  // ---- Backpack ----
  const bp = useBackpack();

  // ---- Time of day ----
  const tod = inferTimeOfDay();

  // ---- Reset handlers for testing ----
  const resetCurrentLoop = () => {
    setComp({ forest: new Set(), desert: new Set(), ocean: new Set(), night: new Set() });
    setLast(null);

    try {
      localStorage.removeItem(KEYS.comp);
      localStorage.removeItem(KEYS.last);
    } catch {}

    // close overlays
    setPlayer(null);
    setOpenBiome(null);
    setShowBP(false);
    setShowTeacher(false);
  };

  const factoryReset = () => {
    // reset loop index
    setLoop(1);

    // clear per-loop progress and resume
    setComp({ forest: new Set(), desert: new Set(), ocean: new Set(), night: new Set() });
    setLast(null);

    // clear backpack
    if (bp?.setItems) bp.setItems([]);
    if (bp?.setEquipped) bp.setEquipped([]);

    try {
      localStorage.setItem(KEYS.loop, '1');
      localStorage.removeItem(KEYS.comp);
      localStorage.removeItem(KEYS.last);
      localStorage.removeItem(KEYS.bpItems);
      localStorage.removeItem(KEYS.bpEq);
    } catch {}

    // close overlays
    setPlayer(null);
    setOpenBiome(null);
    setShowBP(false);
    setShowTeacher(false);
  };

  // ---- Dynamic biome status computation ----
  function computeStatuses(c){
    const lenF=(LESSONS.forest||[]).length||5;
    const lenD=(LESSONS.desert||[]).length||5;
    const lenO=(LESSONS.ocean||[]).length||5;
    const lenN=(LESSONS.night||[]).length||5;
    return {
      forest: c.forest.size===lenF?'done':'unlocked',
      desert: c.forest.size>=3? (c.desert.size===lenD?'done':'unlocked'):'locked',
      ocean:  c.desert.size>=3? (c.ocean.size===lenO?'done':'unlocked'):'locked',
      night:  c.ocean.size>=3 ? (c.night.size===lenN?'done':'unlocked'):'locked',
    };
  }
  const biomeStatuses = computeStatuses(comp);

  // ---- Sync to localStorage ----
  useEffect(()=>{ try{localStorage.setItem(KEYS.loop,loop.toString());}catch{} },[loop]);
  useEffect(()=>{ try{localStorage.setItem(KEYS.comp,JSON.stringify({ forest:Array.from(comp.forest), desert:Array.from(comp.desert), ocean:Array.from(comp.ocean), night:Array.from(comp.night) }));}catch{} },[comp]);
  useEffect(()=>{ try{localStorage.setItem(KEYS.teacher,JSON.stringify(teacherMode));}catch{} },[teacherMode]);
  useEffect(()=>{ try{localStorage.setItem(KEYS.framework,framework);}catch{} },[framework]);
  useEffect(()=>{ try{localStorage.setItem(KEYS.calm,JSON.stringify(calm));}catch{} },[calm]);
  useEffect(()=>{ try{localStorage.setItem(KEYS.proto,JSON.stringify(protoOnly));}catch{} },[protoOnly]);
  useEffect(()=>{ try{localStorage.setItem(KEYS.last,JSON.stringify(last));}catch{} },[last]);

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName || '';
      if (['INPUT','TEXTAREA','SELECT'].includes(tag)) return;

      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setShowBP(v => !v);
        return;
      }
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setTeacherMode(v => !v);
        flash(`Teacher mode ${!teacherMode ? 'on' : 'off'}`);
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        if (last) {
          e.preventDefault();
          const l = last as any;
          setOpenBiome?.(l.biome);
          setPlayer({ biome: l.biome, lesson: (LESSONS[l.biome] || []).find((x:any)=>x.id=== l.id) });
          flash('Resuming lesson…');
        }
        return;
      }
      if (e.key === 'Escape') {
        // close any overlays
        setShowBP(false);
        setShowTeacher(false);
        setPlayer(null);
        setOpenBiome?.(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [teacherMode, last]);

  // Loop-up (gentle toast) — dynamic totals per biome
  useEffect(()=>{
    const totals = {
      forest: (LESSONS.forest||[]).length || 5,
      desert: (LESSONS.desert||[]).length || 5,
      ocean:  (LESSONS.ocean ||[]).length || 5,
      night:  (LESSONS.night ||[]).length || 5,
    };
    const doneCounts={forest:comp.forest.size,desert:comp.desert.size,ocean:comp.ocean.size,night:comp.night.size};
    const allDone = ['forest','desert','ocean','night'].every(b => doneCounts[b] >= totals[b]);

    if (allDone) {
      setCelebrate(true);
      const t=setTimeout(()=>{
        setCelebrate(false);
        setLoop(l=>l+1); // show Loop 2 in header
        logEvent({ ts: new Date().toISOString(), loop: loop + 1, action: 'loop_up' });
        // reset per-loop progress for the next loop
        setComp({forest:new Set<string>(),desert:new Set<string>(),ocean:new Set<string>(),night:new Set<string>()});
        setOpenBiome(null);
        setPlayer(null);
        setLast(null);
      }, 1200);
      return()=>clearTimeout(t);
    }
  }, [comp.forest.size, comp.desert.size, comp.ocean.size, comp.night.size]);

  // ---- URL import on mount ----
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const qi = params.get('qi');
    if(qi){ importFromToken(qi); window.history.replaceState({},'',window.location.pathname); }
  },[]);

  // ---- Import/Export helpers ----
  const exportProgress = ()=> { const link = makeProgressLink(buildProgressPayload(loop,comp,bp,framework,protoOnly)); logEvent({ ts: new Date().toISOString(), loop, action: 'export' }); return link; };
  const importFromToken = (token)=>{ try{ const payload=JSON.parse(b64urlDecode(token)); if(payload.v!==1) return; setLoop(payload.loop||1); setComp({ forest: new Set(payload.comp?.forest||[]), desert: new Set(payload.comp?.desert||[]), ocean: new Set(payload.comp?.ocean||[]), night: new Set(payload.comp?.night||[]) }); if(payload.bp){ bp.setItems(payload.bp.items||[]); bp.setEquipped(payload.bp.equipped||[]); } if(payload.framework) setFramework(payload.framework); if(typeof payload.protoOnly==='boolean') setProtoOnly(payload.protoOnly); logEvent({ ts: new Date().toISOString(), loop: payload.loop ?? loop, action: 'import' }); }catch{} };

  // ---- Event handlers ----
  const markComplete = (biome,lessonId)=>{ const collectibles = ['🧰','🏅','🖋️','🎨','🔍']; const items = ['Field Kit','Merit Badge','Quill Pen','Sketch Pad','Looking Glass']; const kinds = ['tool','badge','tool','tool','tool'] as const; const rnd = Math.floor(Math.random()*collectibles.length); const awardId = `${biome}-${lessonId}`; setComp(p=>({...p,[biome]:new Set([...p[biome],lessonId])})); bp.award({id:awardId,name:items[rnd],kind:kinds[rnd],icon:collectibles[rnd]}); logEvent({ ts: new Date().toISOString(), loop, biome, lessonId, action: 'award', meta: { awardId, name: items[rnd] } }); setToast(`Collected ${items[rnd]}!`); setTimeout(()=>setToast(null),2000); };
  // Is this lesson locked (sequential gating)?
  const isLessonLocked = (biome: string, lessonId: string) => {
    if (teacherMode) return false; // override
    const arr = (LESSONS as any)[biome] || [];
    const idx = arr.findIndex((l: any) => l.id === lessonId);
    if (idx <= 0) return false; // first lesson in biome is always unlocked
    const prevId = arr[idx - 1].id;
    return !(comp[biome as keyof typeof comp] as Set<string>).has(prevId);
  };
  
  const openLessonSheet = (biome)=> setOpenBiome(biome);
  const startLesson = (lesson,biome)=>{ 
    if (isLessonLocked(biome, lesson.id)) {
      flash('Finish the previous lesson to unlock this one');
      return;
    }
    setLast({biome,lesson}); 
    setPlayer({biome,lesson}); 
  };
  const resumeLesson = ()=>{ if(last) { const lesson = findLesson(last.biome,last.id,LESSONS); if(lesson) { logEvent({ ts: new Date().toISOString(), loop, biome: last.biome, lessonId: last.id, action: 'resume' }); startLesson(lesson,last.biome); } } };

  // ---- Layout helpers ----
  const biomePos = { forest:{x:25,y:25}, desert:{x:65,y:30}, ocean:{x:70,y:70}, night:{x:20,y:65} };
  const lessonPos = { forest:[ {x:22,y:18},{x:28,y:22},{x:24,y:28},{x:30,y:25},{x:26,y:32} ], desert:[ {x:62,y:23},{x:68,y:27},{x:65,y:33},{x:71,y:30},{x:67,y:37} ], ocean:[ {x:67,y:63},{x:73,y:67},{x:70,y:73},{x:76,y:70},{x:72,y:77} ], night:[ {x:17,y:58},{x:23,y:62},{x:20,y:68},{x:26,y:65},{x:22,y:72} ] };

  return (
    <div className={cx("relative min-h-screen bg-gradient-to-br overflow-hidden", BG_BY_TOD[tod])}>
      {/* Place the decorative island backdrop behind UI */}
      <IslandBackdrop tod={tod as any} calm={calm} />

      {/* Ambient particles/glow you already have */}
      <AmbientLayer tod={tod} calm={calm}/>
      
      {/* Main UI Layer */}
      <div className="relative z-10 min-h-screen flex flex-col">
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-white/20 backdrop-blur-sm border-b border-white/30">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-extrabold text-stone-900">Quest Island — Loop {loop}</h1>
            {last&&<button onClick={resumeLesson} className="px-3 py-2 rounded-full bg-amber-600 text-white hover:bg-amber-700 transition ease-out text-sm">Resume: {findLesson(last.biome,last.id,LESSONS)?.title}</button>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setCalm(p=>!p)} className={cx("w-10 h-10 rounded-full border transition ease-out", calm?"bg-blue-100 border-blue-300":"bg-white/50 border-white/70")} title={calm?"Disable calm mode":"Enable calm mode"}>😌</button>
            <button onClick={()=>setShowBP(true)} className="w-10 h-10 rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-300 flex items-center justify-center transition ease-out">🎒</button>
            <button onClick={()=>setTeacherMode(p=>!p)} className={cx("px-3 py-2 rounded-full border transition ease-out", teacherMode?"bg-emerald-100 border-emerald-300 text-emerald-800":"bg-white/50 border-white/70 hover:bg-white/70")}>{teacherMode?'Teacher ✓':'Teacher'}</button>
            {teacherMode&&<button onClick={()=>setShowTeacher(true)} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center transition ease-out">⚙️</button>}
          </div>
        </header>

        {/* Quest Island Map */}
        <main className="flex-1 relative p-8">
          <div className="max-w-6xl mx-auto h-full relative min-h-[560px]">
            
            {/* Central Campfire */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-red-600 shadow-2xl flex items-center justify-center animate-pulse">
                <span className="text-2xl">🔥</span>
              </div>
            </div>

            {/* Biome Regions */}
            {Object.entries(biomePos).map(([biome,pos])=>{
              const count = comp[biome].size;
              const status = biomeStatuses[biome];
              const total = (LESSONS[biome] || []).length;
              return (
                <div key={biome} className="absolute z-20" style={{left:pos.x+'%',top:pos.y+'%'}}>
                  <Node biome={biome} status={status} onClick={()=>openLessonSheet(biome)} count={count} total={total} calm={calm}/>
                </div>
              );
            })}

            {/* Lesson Nodes */}
            {Object.entries(lessonPos).map(([biome,positions])=>{
              const lessons=LESSONS[biome]||[]; const biomeDone=comp[biome as keyof typeof comp];
              const nextUnfinishedId = hasEquipped(bp, 'tool_compass') 
                ? lessons.find(l => !biomeDone.has(l.id))?.id ?? null
                : null;
              return lessons.map((lesson,i)=>{
                const pos=positions[i]; const locked=i>0&&!biomeDone.has(lessons[i-1].id)&&!teacherMode;
                const isNext = nextUnfinishedId === lesson.id;
                return <LessonNode key={lesson.id} biome={biome} lesson={lesson} completed={biomeDone} onSelect={(b,l)=>startLesson(l,b)} pos={pos} locked={locked} isNext={isNext} onLocked={() => flash('Finish the previous lesson to unlock this one')}/>;
              });
            })}

          </div>
        </main>

      </div>

      {/* UI Overlays */}
      <BackpackSheet open={showBP} onClose={()=>setShowBP(false)} bp={bp}/>
      <TeacherPanel open={showTeacher} onClose={()=>setShowTeacher(false)} frameworks={STANDARDS.frameworkOptions} framework={framework} setFramework={setFramework} protoOnly={protoOnly} setProtoOnly={setProtoOnly} completed={comp} onExport={exportProgress} onImport={importFromToken} lessons={LESSONS} loop={loop} onResetCurrentLoop={resetCurrentLoop} onFactoryReset={factoryReset}/>
      
      {/* Lesson Sheet */}
      <LessonSheet
        open={!!openBiome}
        onClose={() => setOpenBiome(null)}
        biome={openBiome ?? 'forest'}
        lessons={openBiome ? LESSONS[openBiome as keyof typeof LESSONS] : []}
        completed={openBiome ? comp[openBiome as keyof typeof comp] : new Set()}
        onComplete={(id) => {
          if (!openBiome) return;
          setComp(prev => {
            const nextSet = new Set(prev[openBiome as keyof typeof prev]);
            nextSet.add(id);
            const next = { ...prev, [openBiome]: nextSet };
            
            // Milestones: first completion in each biome
            const wasEmptyBefore = (prevComp: any, biome: string) => {
              const s = prevComp[biome];
              return !(s && s.size && s.size > 0);
            };
            
            if (wasEmptyBefore(prev, 'forest'))  bp.award({ id:'tool_binocs',   name:'Binoculars', kind:'tool',  icon:'🔭' });
            if (wasEmptyBefore(prev, 'desert'))  bp.award({ id:'tool_compass',  name:'Compass',    kind:'tool',  icon:'🧭' });
            if (wasEmptyBefore(prev, 'ocean'))   bp.award({ id:'charm_feather', name:'Feather',    kind:'charm', icon:'🪶' });
            
            return next;
         });
        }}
        canPreview={teacherMode || hasEquipped(bp, 'tool_binocs')}
        teacherMode={teacherMode}
        framework={framework}
        onStart={(lesson) => {
          if (!openBiome) return;
          if (isLessonLocked(openBiome, lesson.id)) {
            flash('Finish the previous lesson to unlock this one');
            return;
          }
          logEvent({ ts: new Date().toISOString(), loop, biome: openBiome, lessonId: lesson.id, action: 'start' });
          setPlayer({ biome: openBiome, lesson });
          setLast({ biome: openBiome, id: lesson.id });   // ← save last
        }}
        protoOnly={protoOnly}
        calmTip={hasEquipped(bp, 'charm_feather')}
        isLocked={(id: string) => isLessonLocked(openBiome!, id)}
        onLocked={() => flash('Finish the previous lesson to unlock this one')}
      />

      <ActivityPlayer
        open={!!player}
        onClose={() => setPlayer(null)}
        biome={player?.biome}
        lesson={player?.lesson}
        onMarkComplete={(id) => {
          if (!player?.biome) return;
          const biome = player.biome;
          logEvent({ ts: new Date().toISOString(), loop, biome, lessonId: id, action: 'complete' });
          setComp(prev => {
            const nextSet = new Set(prev[biome as keyof typeof prev]);
            nextSet.add(id);
            
            // Milestones: first completion in each biome
            const wasEmptyBefore = (prevComp: any, biome: string) => {
              const s = prevComp[biome];
              return !(s && s.size && s.size > 0);
            };
            
            if (wasEmptyBefore(prev, 'forest'))  bp.award({ id:'tool_binocs',   name:'Binoculars', kind:'tool',  icon:'🔭' });
            if (wasEmptyBefore(prev, 'desert'))  bp.award({ id:'tool_compass',  name:'Compass',    kind:'tool',  icon:'🧭' });
            if (wasEmptyBefore(prev, 'ocean'))   bp.award({ id:'charm_feather', name:'Feather',    kind:'charm', icon:'🪶' });
            
            // pick the next unfinished lesson in this biome
            const nextLesson = (LESSONS[biome] || []).find(l => !nextSet.has(l.id));
            setLast(nextLesson ? { biome, id: nextLesson.id } : null);
            return { ...prev, [biome]: nextSet };
          });
        }}
        protoOnly={protoOnly}
      />

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-4 z-[60] px-3 py-1.5 rounded-full bg-stone-900 text-white text-xs shadow-lg">
          {toast}
        </div>
      )}
      
      {/* Bob animation keyframes */}
      <style>{`
        @keyframes qiBob {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-2px); }
        }
        .qi-bob { animation: qiBob 3.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}