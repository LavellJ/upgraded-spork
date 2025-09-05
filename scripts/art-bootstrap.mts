import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

const root = path.resolve(process.cwd(), 'public', 'art')
const inbox = path.resolve(root, 'inbox') // drop your real PNG/JPG/WebP here later

const ensureDir = async (p:string) => fsp.mkdir(p, { recursive: true })
const exists = (p:string) => fs.existsSync(p)
const rmIf = async (p:string) => exists(p) ? fsp.unlink(p) : null

type Target = { out:string; w:number; h:number; svg?:string; inboxName?:string }

const svg = {
  backpack: (w=128,h=128)=>`
    <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
      <rect x="28" y="34" width="72" height="74" rx="14" fill="#f4f7fb" stroke="#334155" stroke-width="4"/>
      <rect x="40" y="18" width="48" height="24" rx="8" fill="#e2e8f0" stroke="#334155" stroke-width="4"/>
      <rect x="38" y="56" width="52" height="34" rx="8" fill="#c7f9e9" stroke="#1e293b" stroke-width="3"/>
      <circle cx="64" cy="78" r="6" fill="#10b981"/>
      <path d="M28 58 q-10 8 -8 20" stroke="#334155" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M100 58 q10 8 8 20" stroke="#334155" stroke-width="4" fill="none" stroke-linecap="round"/>
    </svg>`,
  parchment: (w=256,h=256)=>`
    <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#faf3e0"/>
          <stop offset="100%" stop-color="#f1e4c7"/>
        </linearGradient>
      </defs>
      <rect x="24" y="24" width="208" height="208" rx="16" fill="url(#g)" stroke="#b08968" stroke-width="3"/>
      <path d="M56 72 h144 M56 104 h144 M56 136 h120" stroke="#ccb38b" stroke-width="3" opacity="0.65"/>
    </svg>`,
  scoutNeutral: (w=256,h=256)=>`
    <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <circle cx="128" cy="128" r="84" fill="#f2f5f8" stroke="#1f2937" stroke-width="5"/>
      <circle cx="104" cy="120" r="6" fill="#1f2937"/>
      <circle cx="152" cy="120" r="6" fill="#1f2937"/>
      <path d="M100 156 q28 18 56 0" stroke="#1f2937" stroke-width="5" fill="none" stroke-linecap="round"/>
      <circle cx="128" cy="212" r="8" fill="#22c55e"/>
    </svg>`,
  plate: (c1:string,c2:string)=>`
    <svg viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${c1}"/>
          <stop offset="100%" stop-color="${c2}"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#bg)"/>
      <g opacity="0.25">
        <circle cx="300" cy="200" r="140" fill="#ffffff"/>
        <circle cx="750" cy="350" r="220" fill="#ffffff"/>
        <circle cx="1200" cy="180" r="110" fill="#ffffff"/>
      </g>
    </svg>`
}

const targets: Target[] = [
  { out: 'ui/backpack.webp',           w: 128, h: 128, svg: svg.backpack() },
  { out: 'spots/map-parchment.webp',    w: 256, h: 256, svg: svg.parchment() },
  { out: 'scout/scout-neutral.webp',    w: 256, h: 256, svg: svg.scoutNeutral() },

  // Reef
  { out: 'biomes/reef/bg-far.webp',     w: 1600, h: 900, svg: svg.plate('#9be6ff','#0177a8') },
  { out: 'biomes/reef/bg-mid.webp',     w: 1600, h: 900, svg: svg.plate('#76d9ff','#026893') },
  { out: 'biomes/reef/bg-near.webp',    w: 1600, h: 900, svg: svg.plate('#55cfff','#03587b') },

  // Alpine
  { out: 'biomes/alpine/bg-far.webp',   w: 1600, h: 900, svg: svg.plate('#d6ecff','#6ba4ea') },
  { out: 'biomes/alpine/bg-mid.webp',   w: 1600, h: 900, svg: svg.plate('#c1e0ff','#3b82f6') },
  { out: 'biomes/alpine/bg-near.webp',  w: 1600, h: 900, svg: svg.plate('#a7d2ff','#2563eb') },

  // Forest
  { out: 'biomes/forest/bg-far.webp',   w: 1600, h: 900, svg: svg.plate('#c8facc','#1c7a3a') },
  { out: 'biomes/forest/bg-mid.webp',   w: 1600, h: 900, svg: svg.plate('#aaf0b1','#166534') },
  { out: 'biomes/forest/bg-near.webp',  w: 1600, h: 900, svg: svg.plate('#8be696','#14532d') },

  // Desert
  { out: 'biomes/desert/bg-far.webp',   w: 1600, h: 900, svg: svg.plate('#ffe9b3','#f8b13a') },
  { out: 'biomes/desert/bg-mid.webp',   w: 1600, h: 900, svg: svg.plate('#ffd98a','#ea9a1b') },
  { out: 'biomes/desert/bg-near.webp',  w: 1600, h: 900, svg: svg.plate('#ffc85a','#d97706') },
]

// If a file exists in inbox with same leaf name (png/jpg/webp), use it instead of SVG
async function sourceFor(outPath:string){
  const leaf = path.basename(outPath).replace(/\.webp$/,'')
  const candidates = ['png','jpg','jpeg','webp'].map(ext => path.join(inbox, leaf + '.' + ext))
  for (const c of candidates) if (exists(c)) return await fsp.readFile(c)
  return null
}

async function makeOne(t: Target){
  const fullOut = path.join(root, t.out)
  await ensureDir(path.dirname(fullOut))

  // remove any .txt placeholder next to it
  await rmIf(fullOut + '.txt')

  if (exists(fullOut)) { console.log('✓ exists', t.out); return }
  const buf = await sourceFor(t.out)
  if (buf){
    console.log('→ ingest', t.out, '(from inbox)')
    await sharp(buf).resize(t.w, t.h, { fit:'cover' }).webp({ quality: 85 }).toFile(fullOut)
  } else if (t.svg){
    console.log('→ synth', t.out)
    await sharp(Buffer.from(t.svg))
      .resize(t.w, t.h, { fit:'cover' })
      .webp({ quality: 85 })
      .toFile(fullOut)
  } else {
    console.warn('! skipped (no source or svg)', t.out)
  }
}

async function run(){
  await ensureDir(root)
  for (const t of targets) await makeOne(t)
  console.log('Done. Files at /public/art/**')
}
run().catch(e => { console.error(e); process.exit(1) })