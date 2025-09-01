import React, { useEffect, useState } from "react";

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

// Simple bottom sheet used across Backpack / Lessons / Teacher Panel
function BottomSheet({open,onClose,children}){
  useEffect(()=>{
    if(!open) return;
    const onKey = (e)=>{ if(e.key==='Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return ()=> window.removeEventListener('keydown', onKey);
  },[open,onClose]);
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-stone-900/40" onClick={onClose} />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[min(96vw,42rem)] max-h-[88vh] overflow-auto rounded-t-3xl bg-white/95 backdrop-blur border border-stone-900/10 shadow-2xl p-4">
        {children}
      </div>
    </div>
  );
}

// --------------------------------------
// Backpack state & UI
// --------------------------------------
function useBackpack(){
  const [items,setItems]=useState(()=>{ try{return JSON.parse(localStorage.getItem(KEYS.bpItems)||'[]');}catch{return[]} });
  const [equipped,setEquipped]=useState(()=>{ try{return JSON.parse(localStorage.getItem(KEYS.bpEq)||'[]');}catch{return[]} });
  const equipLimit=3;
  const award=(it)=> setItems(p=> p.some(x=>x.id===it.id)? p : [...p,it]);
  const toggleEquip=(id)=> setEquipped(p=> p.includes(id)? p.filter(x=>x!==id) : (p.length<equipLimit?[...p,id]:p));
  useEffect(()=>{ try{localStorage.setItem(KEYS.bpItems,JSON.stringify(items));}catch{} },[items]);
  useEffect(()=>{ try{localStorage.setItem(KEYS.bpEq,JSON.stringify(equipped));}catch{} },[equipped]);
  return {items,equipped,toggleEquip,award,equipLimit,setItems,setEquipped};
}

function BackpackSheet({open,onClose,bp}){
  const {items,equipped,toggleEquip,equipLimit}=bp;
  const equippedSet = new Set(equipped);
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="text-stone-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">🎒</div>
          <div className="font-extrabold">Scout's Backpack</div>
          <button onClick={onClose} className="ml-auto text-xs px-2 py-1 rounded-full border bg-white hover:bg-stone-50">Close</button>
        </div>
        <div className="mt-2 text-xs text-stone-600">Equip up to {equipLimit} items.</div>
        {items.length===0 && <div className="mt-4 text-sm text-stone-600">No items yet. Complete lessons to earn collectibles.</div>}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {items.map(it=> (
            <div key={it.id} className="rounded-xl border bg-white/80 p-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">{it.kind==='tool'? '🧰' : it.kind==='badge'? '🏅' : '🖋️'}</div>
              <div className="min-w-0"><div className="font-semibold text-sm truncate">{it.name}</div><div className="text-[11px] text-stone-500 truncate">{it.kind}</div></div>
              <button onClick={()=>toggleEquip(it.id)} className={cx("ml-auto text-xs px-2 py-1 rounded-full border transition ease-out", equippedSet.has(it.id)?"bg-emerald-600 text-white border-emerald-700":"bg-white hover:bg-stone-50")}>{equippedSet.has(it.id)? 'Equipped' : 'Equip'}</button>
            </div>
          ))}
        </div>
        {items.length>0 && (
          <div className="mt-2 text-[11px] text-stone-600">Equipped: {equipped.length}/{equipLimit}</div>
        )}
      </div>
    </BottomSheet>
  );
}

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

const findLesson = (biome,id)=> (LOOP1[biome]||[]).find(l=>l.id===id)||null;

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

function MCActivity({biome,lesson,onSolved}){
  const accent=SUBJECTS[biome].color; const tpl=getTemplate(biome,lesson.id); const [sel,setSel]=useState(-1); const [checked,setChecked]=useState(false); const ok=checked&&sel===tpl.correct;
  return (
    <div className="p-3">
      <div className="text-sm text-stone-700 mb-2">Prototype activity</div>
      <div className="text-lg font-bold mb-3" style={{color:accent}}>{tpl.q}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{tpl.options.map((opt,i)=> (
        <button key={i} onClick={()=>{setSel(i);setChecked(false);}} className={cx("text-left px-3 py-2 rounded-xl border bg-white hover:bg-stone-50 transition ease-out", sel===i&&"ring-2 ring-amber-500")}>{String.fromCharCode(65+i)}. {opt}</button>
      ))}</div>
      <div className="mt-3 flex items-center gap-2">
        <button disabled={sel<0} onClick={()=>setChecked(true)} className={cx("px-3 py-2 rounded-full transition ease-out", sel<0?"bg-stone-200 text-stone-500":"bg-amber-700/90 text-white hover:bg-amber-700")}>Check answer</button>
        {checked&&(<span className={cx("text-sm", ok?"text-emerald-700":"text-rose-700")}>{ok?"Correct!":"Try again"}</span>)}
      </div>
      {checked&&!ok&&<div className="mt-1 text-xs text-stone-600">Hint: {tpl.explain}</div>}
      {ok&&<div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">Nice! Mark complete when you're ready.</div>}
      {ok&&<div className="mt-3"><button onClick={onSolved} className="px-3 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition ease-out">Mark complete</button></div>}
    </div>
  );
}

// --------------------------------------
// Activity Player, Lesson Detail/Sheet, Nodes
// --------------------------------------
function ActivityPlayer({open,onClose,biome,lesson,onMarkComplete, protoOnly}){
  if(!open||!lesson) return null; const url=resolveActivityUrl(biome,lesson.id, protoOnly); const accent=SUBJECTS[biome].color; const external= !protoOnly && typeof url==='string' && !url.includes('player.example');
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="text-stone-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:accent+"22"}}>▶️</div>
          <div className="font-extrabold" style={{color:accent}}>{lesson.title}</div>
          {external? <a href={url} target="_blank" rel="noreferrer" className="ml-auto text-xs px-2 py-1 rounded-full bg-white border hover:bg-stone-50 transition ease-out">Open in new tab</a> : <span className="ml-auto text-[11px] px-2 py-1 rounded-full bg-white/70 border">Using in-app prototype</span>}
        </div>
        <div className="mt-3 rounded-xl overflow-hidden border bg-white">
          <MCActivity biome={biome} lesson={lesson} onSolved={()=>{ onMarkComplete(lesson.id); onClose(); }} />
        </div>
        <div className="mt-3 flex items-center justify-end"><button onClick={onClose} className="px-3 py-2 rounded-full border bg-white hover:bg-stone-50 text-stone-700 transition ease-out">Close</button></div>
      </div>
    </BottomSheet>
  );
}

function LessonDetail({open,onClose,biome,lesson,onMarkComplete,onStart,teacherMode,standardText, protoOnly}){
  if(!open||!lesson) return null; const meta=getLessonMeta(biome,lesson.id); const accent=SUBJECTS[biome].color; const hasLink = !protoOnly && !!registryEntry(biome,lesson.id)?.url?.trim();
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-stone-900/40" onClick={onClose}/>
      <div className="relative z-10 w-[min(92vw,36rem)] rounded-3xl bg-white/95 backdrop-blur border border-stone-900/10 shadow-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:accent+"22"}}>{meta.icon}</div>
          <div><div className="text-lg font-extrabold" style={{color:accent}}>{lesson.title}</div><div className="text-xs text-stone-600">Est. {meta.est} • {SUBJECTS[biome].label}</div></div>
          <button onClick={onClose} className="ml-auto text-stone-600 hover:text-stone-900 text-lg">×</button>
        </div>
        <div className="mt-3 text-sm">
          <div className="font-semibold mb-1">Objectives</div>
          <ul className="list-disc pl-5 space-y-1 text-stone-700">{meta.objectives.map((o,i)=> <li key={i}>{o}</li>)}</ul>
          <div className="mt-3 text-xs text-stone-600">Aligned to: {standardText||meta.standard}</div>
          {teacherMode&&<div className="mt-2 text-xs text-stone-600">Teacher tools: Quick-complete available.</div>}
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={()=>onStart(lesson)} className="px-3 py-2 rounded-full bg-amber-700/90 hover:bg-amber-700 text-amber-50 transition ease-out">{hasLink ? 'Start (opens tab)' : 'Start'}</button>
          <button onClick={()=>{ onMarkComplete(lesson.id); onClose(); }} className="px-3 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition ease-out">Mark complete</button>
        </div>
      </div>
    </div>
  );
}

function LessonSheet({open,onClose,biome,lessons,completed,onComplete,canPreview,teacherMode,framework,onStart, protoOnly}){
  const subject=SUBJECTS[biome]; const [detail,setDetail]=useState(null); const allDone= completed.size===lessons.length && lessons.length>0; const standardText= STANDARDS[framework]?.[biome] || getLessonMeta(biome, lessons[0]?.id||'x').standard;
  return (
    <BottomSheet open={open} onClose={()=>{setDetail(null); onClose();}}>
      <div className="text-stone-800">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2"><span className="text-xl">📍</span><h3 className="text-xl font-extrabold" style={{color:subject.color}}>{subject.label}</h3></div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-stone-900/5">{completed.size}/{lessons.length} complete</span>
            {teacherMode&&<button onClick={()=>{ lessons.forEach(l=>{ if(!completed.has(l.id)) onComplete(l.id); }); }} disabled={allDone} className={cx("text-xs px-2 py-1 rounded-full border transition ease-out", allDone?"bg-stone-100 text-stone-400":"bg-white hover:bg-stone-50")}>Complete all</button>}
          </div>
        </div>
        {teacherMode&&<div className="mt-2 text-[11px] text-stone-600">Standards ({framework}): <b>{standardText}</b></div>}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {lessons.map((l,i)=>{ const isDone= completed?.has?.(l.id)||false; const hasDeepLink = !!(!protoOnly && registryEntry(biome,l.id)?.url?.trim()); return (
            <div key={l.id} className={cx("rounded-xl border border-amber-900/20 bg-white/70 p-3 flex items-center gap-3 transition-colors ease-out", isDone&&"opacity-70")}> 
              <button onClick={()=>setDetail(l)} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{background:subject.color+"22"}} aria-label="Open lesson details">{isDone?"✅":"📘"}</button>
              <div className="min-w-0">
                <div className="font-semibold truncate">{i+1}. {l.title}</div>
                {canPreview&&!isDone&&<div className="text-[11px] text-stone-600">👀 Preview unlocked</div>}
                {hasDeepLink&&!protoOnly&&<div className="text-[10px] text-stone-500">🔗 External lesson available</div>}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={()=>onStart(l)} className="text-xs px-2 py-1 rounded-full bg-amber-700/90 hover:bg-amber-700 text-white transition ease-out">Start</button>
                <button disabled={isDone} onClick={(e)=>{e.stopPropagation?.(); onComplete(l.id);}} className={cx("text-xs px-2 py-1 rounded-full transition ease-out", isDone?"bg-stone-200":"bg-emerald-600 text-white hover:bg-emerald-700")}>{isDone?"Done":"Complete"}</button>
              </div>
            </div>
          );})}
        </div>
        <LessonDetail open={!!detail} onClose={()=>setDetail(null)} biome={biome} lesson={detail} onMarkComplete={onComplete} onStart={onStart} teacherMode={teacherMode} standardText={standardText} protoOnly={protoOnly}/>
      </div>
    </BottomSheet>
  );
}

function LessonNode({biome,lesson,completed,onSelect,pos,locked}){
  const {label,color}=SUBJECTS[biome]; const isDone= completed?.has?.(lesson.id)||false; const accent=color;
  return (
    <div className="absolute cursor-pointer" style={{left:pos.x+'%',top:pos.y+'%'}} onClick={()=>onSelect(biome,lesson)}>
      <div className={cx("relative flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-all duration-300 ease-out border border-amber-900/20", isDone ? "bg-emerald-100/90 shadow-emerald-200 scale-110" : locked ? "bg-stone-200/70 shadow-stone-200" : "bg-white/95 hover:scale-110 hover:shadow-xl hover:bg-amber-50/95")}>
        <span className="text-xl" style={{color: locked ? '#999' : accent}}>{isDone ? '✅' : '📘'}</span>
        {!isDone && !locked && (
          <div className="absolute -inset-2 rounded-full border-2 opacity-30 animate-pulse" style={{borderColor:accent}}/>
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
function TeacherPanel({open,onClose,frameworks,framework,setFramework,protoOnly,setProtoOnly,completed,onImport,onExport}){
  const [importValue,setImportValue]=useState(''); const [exportLink,setExportLink]=useState(''); const handleExport=()=>{const link=onExport(); setExportLink(link);}; const handleImport=()=>{ if(importValue.trim()){ onImport(extractQiFromInput(importValue)); setImportValue(''); } };
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="text-stone-800">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">⚙️</span>
          <h3 className="font-extrabold text-lg">Teacher Panel</h3>
          <button onClick={onClose} className="ml-auto text-xs px-2 py-1 rounded-full border bg-white hover:bg-stone-50">Close</button>
        </div>
        <div className="space-y-4">
          <div><label className="block text-sm font-semibold mb-2">Standards Framework</label><select value={framework} onChange={(e)=>setFramework(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white">{frameworks.map(f=><option key={f} value={f}>{f}</option>)}</select></div>
          <div><label className="flex items-center gap-2"><input type="checkbox" checked={protoOnly} onChange={(e)=>setProtoOnly(e.target.checked)} className="rounded"/>Use prototype-only mode</label><div className="text-xs text-stone-600 mt-1">When enabled, all activities use in-app prototypes instead of external links.</div></div>
          <div><div className="text-sm font-semibold mb-2">Progress Overview</div><div className="text-xs text-stone-600 space-y-1"><div>Forest (Literacy): {completed.forest?.size||0}/5</div><div>Desert (Math): {completed.desert?.size||0}/5</div><div>Ocean (Science): {completed.ocean?.size||0}/5</div><div>Night (HASS): {completed.night?.size||0}/5</div></div></div>
          <div><div className="text-sm font-semibold mb-2">Export Progress</div><button onClick={handleExport} className="w-full px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition ease-out">Copy progress link</button>{exportLink&&<div className="mt-2 p-2 bg-stone-100 rounded-lg text-xs break-all">{exportLink}</div>}</div>
          <div><div className="text-sm font-semibold mb-2">Import Progress</div><div className="flex gap-2"><input value={importValue} onChange={(e)=>setImportValue(e.target.value)} placeholder="Paste progress link or token" className="flex-1 px-3 py-2 border rounded-lg"/><button onClick={handleImport} className="px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition ease-out">Import</button></div></div>
        </div>
      </div>
    </BottomSheet>
  );
}

// --------------------------------------
// Main App Component
// --------------------------------------
export default function App(){
  // ---- Global state (localStorage-backed) ----
  const [loop,setLoop]=useState(()=>{ try{return parseInt(localStorage.getItem(KEYS.loop)||'1');}catch{return 1;} });
  const [completed,setCompleted]=useState(()=>{ try{const raw=JSON.parse(localStorage.getItem(KEYS.comp)||'{}'); return { forest: new Set(raw.forest||[]), desert: new Set(raw.desert||[]), ocean: new Set(raw.ocean||[]), night: new Set(raw.night||[]) };}catch{return { forest: new Set(), desert: new Set(), ocean: new Set(), night: new Set() };} });
  const [teacherMode,setTeacherMode]=useState(()=>{ try{return JSON.parse(localStorage.getItem(KEYS.teacher)||'false');}catch{return false;} });
  const [framework,setFramework]=useState(()=>{ try{return localStorage.getItem(KEYS.framework)||'Generic';}catch{return 'Generic';} });
  const [calm,setCalm]=useState(()=>{ try{return JSON.parse(localStorage.getItem(KEYS.calm)||'false');}catch{return false;} });
  const [protoOnly,setProtoOnly]=useState(()=>{ try{return JSON.parse(localStorage.getItem(KEYS.proto)||'true');}catch{return true;} });
  const [lastStarted,setLastStarted]=useState(()=>{ try{return JSON.parse(localStorage.getItem(KEYS.last)||'null');}catch{return null;} });

  // ---- UI state ----
  const [openBiome,setOpenBiome]=useState<string | null>(null); const [showBP,setShowBP]=useState(false); const [showTeacher,setShowTeacher]=useState(false); const [player,setPlayer]=useState<{biome:string,lesson:any} | null>(null); const [toast,setToast]=useState<string | null>(null);

  // ---- Backpack ----
  const bp = useBackpack();

  // ---- Time of day ----
  const tod = inferTimeOfDay();

  // ---- Sync to localStorage ----
  useEffect(()=>{ try{localStorage.setItem(KEYS.loop,loop.toString());}catch{} },[loop]);
  useEffect(()=>{ try{localStorage.setItem(KEYS.comp,JSON.stringify({ forest:Array.from(completed.forest), desert:Array.from(completed.desert), ocean:Array.from(completed.ocean), night:Array.from(completed.night) }));}catch{} },[completed]);
  useEffect(()=>{ try{localStorage.setItem(KEYS.teacher,JSON.stringify(teacherMode));}catch{} },[teacherMode]);
  useEffect(()=>{ try{localStorage.setItem(KEYS.framework,framework);}catch{} },[framework]);
  useEffect(()=>{ try{localStorage.setItem(KEYS.calm,JSON.stringify(calm));}catch{} },[calm]);
  useEffect(()=>{ try{localStorage.setItem(KEYS.proto,JSON.stringify(protoOnly));}catch{} },[protoOnly]);
  useEffect(()=>{ try{localStorage.setItem(KEYS.last,JSON.stringify(lastStarted));}catch{} },[lastStarted]);

  // ---- URL import on mount ----
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const qi = params.get('qi');
    if(qi){ importFromToken(qi); window.history.replaceState({},'',window.location.pathname); }
  },[]);

  // ---- Import/Export helpers ----
  const exportProgress = ()=> makeProgressLink(buildProgressPayload(loop,completed,bp,framework,protoOnly));
  const importFromToken = (token)=>{ try{ const payload=JSON.parse(b64urlDecode(token)); if(payload.v!==1) return; setLoop(payload.loop||1); setCompleted({ forest: new Set(payload.comp?.forest||[]), desert: new Set(payload.comp?.desert||[]), ocean: new Set(payload.comp?.ocean||[]), night: new Set(payload.comp?.night||[]) }); if(payload.bp){ bp.setItems(payload.bp.items||[]); bp.setEquipped(payload.bp.equipped||[]); } if(payload.framework) setFramework(payload.framework); if(typeof payload.protoOnly==='boolean') setProtoOnly(payload.protoOnly); }catch{} };

  // ---- Event handlers ----
  const markComplete = (biome,lessonId)=>{ const collectibles = ['🧰','🏅','🖋️','🎨','🔍']; const items = ['Field Kit','Merit Badge','Quill Pen','Sketch Pad','Looking Glass']; const kinds = ['tool','badge','pen','art','tool']; const rnd = Math.floor(Math.random()*collectibles.length); setCompleted(p=>({...p,[biome]:new Set([...p[biome],lessonId])})); bp.award({id:`${biome}-${lessonId}`,name:items[rnd],kind:kinds[rnd],icon:collectibles[rnd]}); setToast(`Collected ${items[rnd]}!`); setTimeout(()=>setToast(null),2000); };
  const openLessonSheet = (biome)=> setOpenBiome(biome);
  const startLesson = (lesson,biome)=>{ setLastStarted({biome,lesson}); setPlayer({biome,lesson}); };
  const resumeLesson = ()=>{ if(lastStarted) startLesson(lastStarted.lesson,lastStarted.biome); };

  // ---- Layout helpers ----
  const biomePos = { forest:{x:25,y:25}, desert:{x:65,y:30}, ocean:{x:70,y:70}, night:{x:20,y:65} };
  const lessonPos = { forest:[ {x:22,y:18},{x:28,y:22},{x:24,y:28},{x:30,y:25},{x:26,y:32} ], desert:[ {x:62,y:23},{x:68,y:27},{x:65,y:33},{x:71,y:30},{x:67,y:37} ], ocean:[ {x:67,y:63},{x:73,y:67},{x:70,y:73},{x:76,y:70},{x:72,y:77} ], night:[ {x:17,y:58},{x:23,y:62},{x:20,y:68},{x:26,y:65},{x:22,y:72} ] };

  return (
    <div className={cx("relative min-h-screen bg-gradient-to-br overflow-hidden", BG_BY_TOD[tod])}>
      <AmbientLayer tod={tod} calm={calm}/>
      
      {/* Main UI Layer */}
      <div className="relative z-10 min-h-screen flex flex-col">
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-white/20 backdrop-blur-sm border-b border-white/30">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-extrabold text-stone-900">Quest Island — Loop {loop}</h1>
            {lastStarted&&<button onClick={resumeLesson} className="px-3 py-2 rounded-full bg-amber-600 text-white hover:bg-amber-700 transition ease-out text-sm">Resume: {lastStarted.lesson.title}</button>}
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
          <div className="max-w-6xl mx-auto h-full relative">
            
            {/* Central Campfire */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-red-600 shadow-2xl flex items-center justify-center animate-pulse">
                <span className="text-2xl">🔥</span>
              </div>
            </div>

            {/* Biome Regions */}
            {Object.entries(biomePos).map(([biome,pos])=>{
              const subject=SUBJECTS[biome]; const lessons=LOOP1[biome]||[]; const biomeDone=completed[biome]; const canPreview=teacherMode;
              return (
                <div key={biome} className="absolute cursor-pointer" style={{left:pos.x+'%',top:pos.y+'%'}} onClick={()=>openLessonSheet(biome)}>
                  <div className={cx("relative flex items-center justify-center w-20 h-20 rounded-full shadow-lg transition-all duration-300 ease-out border-2 hover:scale-110 hover:shadow-xl", biomeDone.size===lessons.length?"bg-emerald-100/90 border-emerald-300 shadow-emerald-200":"bg-white/90 border-amber-300 hover:bg-amber-50/95")} style={{borderColor:subject.color}}>
                    <div className="text-center">
                      <div className="text-2xl">{biome==='forest'?'🌲':biome==='desert'?'🏜️':biome==='ocean'?'🌊':'🌙'}</div>
                      <div className="text-xs font-bold mt-1" style={{color:subject.color}}>{biomeDone.size}/{lessons.length}</div>
                    </div>
                  </div>
                  <div className="absolute mt-3 left-1/2 -translate-x-1/2 w-max">
                    <div className="text-sm font-extrabold text-center px-3 py-1 rounded-lg bg-white/95 backdrop-blur border border-amber-900/20 shadow-sm" style={{color:subject.color}}>
                      {subject.label}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Lesson Nodes */}
            {Object.entries(lessonPos).map(([biome,positions])=>{
              const lessons=LOOP1[biome]||[]; const biomeDone=completed[biome];
              return lessons.map((lesson,i)=>{
                const pos=positions[i]; const locked=i>0&&!biomeDone.has(lessons[i-1].id)&&!teacherMode;
                return <LessonNode key={lesson.id} biome={biome} lesson={lesson} completed={biomeDone} onSelect={(b,l)=>startLesson(l,b)} pos={pos} locked={locked}/>;
              });
            })}

          </div>
        </main>

      </div>

      {/* UI Overlays */}
      <BackpackSheet open={showBP} onClose={()=>setShowBP(false)} bp={bp}/>
      <TeacherPanel open={showTeacher} onClose={()=>setShowTeacher(false)} frameworks={STANDARDS.frameworkOptions} framework={framework} setFramework={setFramework} protoOnly={protoOnly} setProtoOnly={setProtoOnly} completed={completed} onExport={exportProgress} onImport={importFromToken}/>
      
      {/* Lesson Sheet */}
      <LessonSheet
        open={!!openBiome}
        onClose={() => setOpenBiome(null)}
        biome={openBiome ?? 'forest'}
        lessons={openBiome ? LOOP1[openBiome as keyof typeof LOOP1] : []}
        completed={openBiome ? completed[openBiome as keyof typeof completed] : new Set()}
        onComplete={(id) => {
          if (!openBiome) return;
          setCompleted(prev => {
            const next = { ...prev, [openBiome]: new Set(prev[openBiome]) } as any;
            (next[openBiome] as Set<string>).add(id);
            return next;
          });
        }}
        canPreview={teacherMode}
        teacherMode={teacherMode}
        framework={framework}
        onStart={(lesson) => {
          if (!openBiome) return;
          setPlayer({ biome: openBiome, lesson });
          setLastStarted({ biome: openBiome, lesson });
        }}
        protoOnly={protoOnly}
      />

      <ActivityPlayer
        open={!!player}
        onClose={() => setPlayer(null)}
        biome={player?.biome}
        lesson={player?.lesson}
        onMarkComplete={(id) => {
          if (!player?.biome) return;
          setCompleted(prev => {
            const next = { ...prev, [player.biome]: new Set(prev[player.biome]) } as any;
            (next[player.biome] as Set<string>).add(id);
            return next;
          });
        }}
        protoOnly={protoOnly}
      />

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-4 z-[60] px-3 py-1.5 rounded-full bg-stone-900 text-white text-xs shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}