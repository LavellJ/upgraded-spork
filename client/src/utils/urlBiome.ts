export function getCurrentBiomeFromUrl(): 'reef' | 'alpine' | 'forest' | 'desert' | null {
  try {
    const url = new URL(window.location.href)
    const biome = url.searchParams.get('biome') || 
                 (url.hash.includes('biome=') ? url.hash.split('biome=')[1]?.split('&')[0] : null)
    
    if (biome === 'reef' || biome === 'alpine' || biome === 'forest' || biome === 'desert') {
      return biome
    }
    
    // Default to reef for now since it's the implemented biome
    return 'reef'
  } catch {
    return 'reef'
  }
}