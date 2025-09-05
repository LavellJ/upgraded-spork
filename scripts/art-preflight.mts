import fs from 'fs'
import path from 'path'

const KB = 1024
const LIMITS = {
  svg: 150 * KB,
  webp: 150 * KB,
  png: 150 * KB,
  plate: 300 * KB,
}
const ROOT = path.resolve(process.cwd(), 'public', 'art')
const FAILS: string[] = []
const WARN: string[] = []

function isPlate(p: string) {
  return /biome|plate|background/i.test(p)
}

function checkFile(filePath: string) {
  const stat = fs.statSync(filePath)
  const ext = path.extname(filePath).toLowerCase().slice(1)
  const base = path.basename(filePath)
  const size = stat.size
  const limit = isPlate(base) ? LIMITS.plate : (LIMITS as any)[ext]
  
  if (!limit) { 
    WARN.push(`Unknown type: ${filePath}`)
    return 
  }

  if (size > limit) {
    FAILS.push(`${base} is ${Math.round(size/KB)}KB > ${Math.round(limit/KB)}KB`)
  }

  if (ext === 'svg') {
    const txt = fs.readFileSync(filePath, 'utf8')
    if (/filter=|feGaussianBlur|<filter/i.test(txt)) {
      FAILS.push(`${base} contains raster-like filters (no glows/shadows)`)
    }
    if (/<text\b/i.test(txt)) {
      FAILS.push(`${base} contains <text> (no baked labels)`)
    }
    if (!/viewBox=/.test(txt)) {
      FAILS.push(`${base} missing viewBox`)
    }
  }
}

function walk(dir: string) {
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry)
    const st = fs.statSync(p)
    if (st.isDirectory()) {
      walk(p)
    } else {
      checkFile(p)
    }
  }
}

if (fs.existsSync(ROOT)) {
  walk(ROOT)
}

if (WARN.length) {
  console.warn('Art preflight warnings:\n - ' + WARN.join('\n - '))
}

if (FAILS.length) {
  console.error('Art preflight FAIL:\n - ' + FAILS.join('\n - '))
  process.exit(1)
} else {
  console.log('Art preflight OK')
}