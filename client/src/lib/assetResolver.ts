/**
 * Asset resolver utility for LearnOz
 * Provides predictable asset paths with fallback support
 */

// Asset type definitions
export type AssetType = 'biome' | 'pin' | 'ui' | 'tool' | 'audio';

export type BiomeId = 'forest' | 'desert' | 'ocean' | 'night';
export type UIId = 'backpack' | 'balloon' | 'lock' | 'progress' | 'treasuremap' | 'campfire' | 
                  'scout-default' | 'scout-excited' | 'scout-thinking';
export type ToolId = 'compass' | 'binocs' | 'journal' | 'timer';
export type AudioId = 'ambient-morning' | 'ambient-day' | 'ambient-evening' | 'ambient-night' |
                     'music-background' | 'music-celebration' | 'music-focus' |
                     'sfx-ui-open' | 'sfx-pin-unlock' | 'sfx-award-get' | 'sfx-step-nav' |
                     'sfx-collect' | 'sfx-unlock' | 'sfx-complete' | 'sfx-error' | 'sfx-success';

// Asset path configurations
const ASSET_PATHS = {
  biome: 'biomes',
  pin: 'biomes', 
  ui: 'ui',
  tool: 'tools',
  audio: 'audio'
} as const;

// File extensions by asset type
const ASSET_EXTENSIONS = {
  biome: 'png',
  pin: 'png', 
  ui: 'png',
  tool: 'png',
  audio: 'mp3'
} as const;

// Fallback assets for missing content
const FALLBACK_ASSETS = {
  biome: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI0MDAiIHk9IjMwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5YTNhZiIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxNHB4Ij5CaW9tZSBQbGFjZWhvbGRlcjwvdGV4dD48L3N2Zz4=',
  pin: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSIyMCIgZmlsbD0iI2Y5ZmJmZiIgc3Ryb2tlPSIjZDFkNWRiIiBzdHJva2Utd2lkdGg9IjIiLz48dGV4dCB4PSIyNCIgeT0iMjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2Yjc0ODAiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTBweCI+UGluPC90ZXh0Pjwvc3ZnPg==',
  ui: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSI4IiBmaWxsPSIjZjNmNGY2IiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiIvPjx0ZXh0IHg9IjMyIiB5PSIzNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZiNzQ4MCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMHB4Ij5VSTwvdGV4dD48L3N2Zz4=',
  tool: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIyOCIgZmlsbD0iI2Y5ZmJmZiIgc3Ryb2tlPSIjZDFkNWRiIiBzdHJva2Utd2lkdGg9IjIiLz48dGV4dCB4PSIzMiIgeT0iMzYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2Yjc0ODAiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTBweCI+VG9vbDwvdGV4dD48L3N2Zz4=',
  audio: '' // No fallback for audio
} as const;

// Migration map for existing assets to new system
const LEGACY_ASSET_MAP: Record<string, { type: AssetType; id: string }> = {
  // Scout/Explorer states
  'image_1756014874313.png': { type: 'ui', id: 'scout-default' },
  'scout-excited.png': { type: 'ui', id: 'scout-excited' },
  'scout-thinking.png': { type: 'ui', id: 'scout-thinking' },
  
  // Biomes
  '93d1f38d-b62e-45ff-ba28-513648083209_1756280426905.png': { type: 'biome', id: 'forest' },
  '1596b76d-9d32-4f53-81cb-17b6a9d3f4c5_1756280188364.png': { type: 'biome', id: 'ocean' },
  '21ffafcd-859d-41f3-af58-d7eb82341f22_1756280344496.png': { type: 'biome', id: 'desert' },
  '530f43b9-b747-4b3f-b133-32f866bee0fe_1756280261658.png': { type: 'biome', id: 'night' },
  
  // UI Elements
  'fd4dc3d1-ed79-4c91-a0b1-e71382387485_1756182003955_1756275864806.png': { type: 'ui', id: 'backpack' },
  '097fe560-b8ac-4192-b450-4f106e9ff693_1756279378478.png': { type: 'ui', id: 'balloon' },
  '9252541e-bdfc-4bfa-ab60-c69c63a4297e_1756279935456.png': { type: 'ui', id: 'lock' },
  '925fba67-25bb-45e9-8e91-eb6e19d9394c_1756186426342_1756275909668.png': { type: 'ui', id: 'progress' },
  'generated_images/Scout_general_exploration_5819cb00.png': { type: 'ui', id: 'treasuremap' },
  '2099b094-0d20-474a-9c0c-067c38a47fe7_1756291587519.png': { type: 'ui', id: 'campfire' },
  
  // Audio
  'bg-music.mp3': { type: 'audio', id: 'music-background' }
};

/**
 * Detect device pixel ratio for high-DPI support
 */
function getDevicePixelRatio(): number {
  return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
}

/**
 * Build asset path from type and ID
 */
function buildAssetPath(type: AssetType, id: string, useDPI = true): string {
  const subdir = ASSET_PATHS[type];
  const ext = ASSET_EXTENSIONS[type];
  
  // Handle DPI scaling for image assets
  if (type !== 'audio' && useDPI) {
    const dpr = getDevicePixelRatio();
    const dpiSuffix = dpr >= 2 ? '@2x' : '@1x';
    
    if (type === 'biome') {
      return `/src/assets/${subdir}/biome-${id}${dpiSuffix}.${ext}`;
    } else if (type === 'pin') {
      return `/src/assets/${subdir}/pin-${id}.${ext}`;
    } else {
      return `/src/assets/${subdir}/${type}-${id}.${ext}`;
    }
  }
  
  // Audio and non-DPI assets
  if (type === 'audio') {
    return `/src/assets/${subdir}/${id}.${ext}`;
  } else if (type === 'pin') {
    return `/src/assets/${subdir}/pin-${id}.${ext}`;
  } else {
    return `/src/assets/${subdir}/${type}-${id}.${ext}`;
  }
}

/**
 * Get asset URL with fallback support
 */
export function getAsset(type: AssetType, id: string): string {
  try {
    const path = buildAssetPath(type, id);
    
    // In development, return the path as-is and let Vite handle module resolution
    if (typeof import.meta.env !== 'undefined' && import.meta.env.DEV) {
      return path;
    }
    
    // In production, assets are processed by Vite and available via import
    return path;
  } catch (error) {
    console.warn(`Failed to load asset ${type}:${id}, using fallback`);
    return FALLBACK_ASSETS[type] || '';
  }
}

/**
 * Get legacy asset using migration map
 */
export function getLegacyAsset(filename: string): string {
  const mapping = LEGACY_ASSET_MAP[filename];
  if (mapping) {
    return getAsset(mapping.type, mapping.id);
  }
  
  console.warn(`Legacy asset ${filename} not found in migration map`);
  return FALLBACK_ASSETS.ui; // Default fallback
}

/**
 * Preload critical assets for performance
 */
export function preloadAssets(assets: Array<{ type: AssetType; id: string }>): void {
  if (typeof window === 'undefined') return;
  
  assets.forEach(({ type, id }) => {
    if (type === 'audio') {
      // Preload audio
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.src = getAsset(type, id);
    } else {
      // Preload images
      const img = new Image();
      img.src = getAsset(type, id);
    }
  });
}

/**
 * Asset validation utility for development
 */
export function validateAsset(type: AssetType, id: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (type === 'audio') {
      const audio = new Audio();
      audio.oncanplaythrough = () => resolve(true);
      audio.onerror = () => resolve(false);
      audio.src = getAsset(type, id);
    } else {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = getAsset(type, id);
    }
  });
}