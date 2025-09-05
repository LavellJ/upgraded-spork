export type FeatureFlags = {
  finalArt: boolean
}

const KEY = 'qi.flags.v1'

function load(): FeatureFlags {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { finalArt: false, ...JSON.parse(raw) }
  } catch {}
  return { finalArt: false }
}

function save(next: FeatureFlags) {
  localStorage.setItem(KEY, JSON.stringify(next))
}

export const Flags = {
  get: load,
  set(partial: Partial<FeatureFlags>) {
    const cur = load()
    const next = { ...cur, ...partial }
    save(next)
    return next
  }
}