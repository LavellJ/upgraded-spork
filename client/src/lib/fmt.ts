export function fmtRelative(d: Date){
  const now = new Date()
  const ms = d.getTime() - now.getTime()
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  const abs = Math.abs(ms)
  const table: [Intl.RelativeTimeFormatUnit, number][] = [
    ['second', 1000], 
    ['minute', 60_000], 
    ['hour', 3_600_000], 
    ['day', 86_400_000], 
    ['week', 604_800_000]
  ]
  
  for (let i = table.length - 1; i >= 0; i--){
    const [unit, size] = table[i]
    if (abs >= size) return rtf.format(Math.round(ms / size), unit)
  }
  return rtf.format(0, 'second')
}

export function fmtPercent(n: number){ 
  return `${Math.round(n)}%` 
}

export function fmtDate(d: Date){ 
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(d) 
}