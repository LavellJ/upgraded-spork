// Contrast checking utility for accessibility validation

interface ColorValues {
  r: number;
  g: number;
  b: number;
}

function parseRgb(rgbString: string): ColorValues {
  const match = rgbString.match(/(\d+),?\s*(\d+),?\s*(\d+)/);
  if (!match) throw new Error(`Invalid RGB format: ${rgbString}`);
  
  return {
    r: parseInt(match[1]),
    g: parseInt(match[2]),
    b: parseInt(match[3])
  };
}

function getLuminance(color: ColorValues): number {
  const { r, g, b } = color;
  
  // Convert RGB to relative luminance
  const rs = r / 255;
  const gs = g / 255;
  const bs = b / 255;
  
  const r_sRGB = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
  const g_sRGB = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
  const b_sRGB = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);
  
  return 0.2126 * r_sRGB + 0.7152 * g_sRGB + 0.0722 * b_sRGB;
}

export function getContrastRatio(color1: string, color2: string): number {
  const c1 = parseRgb(color1);
  const c2 = parseRgb(color2);
  
  const l1 = getLuminance(c1);
  const l2 = getLuminance(c2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

export function checkWcagContrast(color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean {
  const ratio = getContrastRatio(color1, color2);
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
}

// Development contrast checker
export function validateThemeContrast(): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  try {
    const style = getComputedStyle(document.documentElement);
    
    const bgBase = style.getPropertyValue('--bg-base').trim();
    const fgBase = style.getPropertyValue('--fg-base').trim();
    const bgCard = style.getPropertyValue('--bg-card').trim();
    const brandColor = style.getPropertyValue('--brand-500').trim();
    
    const checks = [
      { name: 'Body text contrast', color1: fgBase, color2: bgBase, minRatio: 4.5 },
      { name: 'Card text contrast', color1: fgBase, color2: bgCard, minRatio: 3 },
      { name: 'Brand contrast', color1: '255 255 255', color2: brandColor, minRatio: 4.5 }
    ];
    
    checks.forEach(check => {
      const ratio = getContrastRatio(check.color1, check.color2);
      if (ratio < check.minRatio) {
        console.warn(`⚠️ Accessibility: ${check.name} ratio ${ratio.toFixed(2)}:1 below minimum ${check.minRatio}:1`);
      } else {
        console.log(`✅ Accessibility: ${check.name} ratio ${ratio.toFixed(2)}:1 passes`);
      }
    });
  } catch (error) {
    console.warn('Could not validate theme contrast:', error);
  }
}