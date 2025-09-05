/** Build a URL under the app's base (works on Replit/preview/subpaths). */
export function assetUrl(path: string){
  const base = ((import.meta as any).env?.BASE_URL || '/').replace(/\/+$/, '')
  const clean = path.replace(/^\/+/, '')
  return `${base}/${clean}`
}