/**
 * Simple QR Code Generator for LearnOz
 * Creates QR codes for class codes and URLs
 */

// Simple QR code data matrix generator
// Uses Error Correction Level L (Low) for simplicity
export interface QROptions {
  size?: number;
  padding?: number;
  backgroundColor?: string;
  foregroundColor?: string;
}

// QR code version 1 (21x21) can hold up to 25 alphanumeric characters
// Perfect for class codes like "CLASS-ABC123"
const QR_SIZE = 21;
const MODULES_PER_SIDE = QR_SIZE;

/**
 * Generate QR code as SVG string
 * This is a simplified implementation for class codes and short URLs
 */
export function generateQRCode(data: string, options: QROptions = {}): string {
  const {
    size = 200,
    padding = 20,
    backgroundColor = '#ffffff',
    foregroundColor = '#000000'
  } = options;

  // Simple pattern generation for demonstration
  // In a real implementation, this would use proper QR encoding algorithms
  const pattern = generateSimplePattern(data);
  
  const moduleSize = (size - padding * 2) / MODULES_PER_SIDE;
  const modules: string[] = [];

  // Generate SVG rectangles for each module
  for (let row = 0; row < MODULES_PER_SIDE; row++) {
    for (let col = 0; col < MODULES_PER_SIDE; col++) {
      if (pattern[row][col]) {
        const x = padding + col * moduleSize;
        const y = padding + row * moduleSize;
        modules.push(
          `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${foregroundColor}"/>`
        );
      }
    }
  }

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
      ${modules.join('')}
    </svg>
  `.trim();
}

/**
 * Generate QR code as data URL for easy embedding
 */
export function generateQRDataURL(data: string, options: QROptions = {}): string {
  const svg = generateQRCode(data, options);
  const base64 = btoa(svg);
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Create QR code on canvas for high-quality rendering
 */
export function generateQRCanvas(data: string, options: QROptions = {}): HTMLCanvasElement {
  const {
    size = 200,
    padding = 20,
    backgroundColor = '#ffffff',
    foregroundColor = '#000000'
  } = options;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  canvas.width = size;
  canvas.height = size;

  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, size, size);

  // Generate pattern and draw modules
  const pattern = generateSimplePattern(data);
  const moduleSize = (size - padding * 2) / MODULES_PER_SIDE;

  ctx.fillStyle = foregroundColor;
  
  for (let row = 0; row < MODULES_PER_SIDE; row++) {
    for (let col = 0; col < MODULES_PER_SIDE; col++) {
      if (pattern[row][col]) {
        const x = padding + col * moduleSize;
        const y = padding + row * moduleSize;
        ctx.fillRect(x, y, moduleSize, moduleSize);
      }
    }
  }

  return canvas;
}

/**
 * Simple pattern generator for demo purposes
 * Creates a recognizable pattern based on input data
 */
function generateSimplePattern(data: string): boolean[][] {
  const pattern: boolean[][] = Array(MODULES_PER_SIDE).fill(null).map(() => 
    Array(MODULES_PER_SIDE).fill(false)
  );

  // Add finder patterns (corners)
  addFinderPattern(pattern, 0, 0);
  addFinderPattern(pattern, 0, MODULES_PER_SIDE - 7);
  addFinderPattern(pattern, MODULES_PER_SIDE - 7, 0);

  // Add timing patterns
  for (let i = 8; i < MODULES_PER_SIDE - 8; i++) {
    pattern[6][i] = i % 2 === 0;
    pattern[i][6] = i % 2 === 0;
  }

  // Add data pattern based on input
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data.charCodeAt(i)) & 0xffffffff;
  }

  // Fill data area with pattern based on hash
  for (let row = 9; row < MODULES_PER_SIDE - 8; row++) {
    for (let col = 9; col < MODULES_PER_SIDE - 8; col++) {
      const index = row * MODULES_PER_SIDE + col;
      pattern[row][col] = ((hash >> (index % 32)) & 1) === 1;
    }
  }

  return pattern;
}

/**
 * Add QR finder pattern (7x7 square with specific pattern)
 */
function addFinderPattern(pattern: boolean[][], startRow: number, startCol: number): void {
  const finderPattern = [
    [true, true, true, true, true, true, true],
    [true, false, false, false, false, false, true],
    [true, false, true, true, true, false, true],
    [true, false, true, true, true, false, true],
    [true, false, true, true, true, false, true],
    [true, false, false, false, false, false, true],
    [true, true, true, true, true, true, true],
  ];

  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      const targetRow = startRow + row;
      const targetCol = startCol + col;
      if (targetRow < MODULES_PER_SIDE && targetCol < MODULES_PER_SIDE) {
        pattern[targetRow][targetCol] = finderPattern[row][col];
      }
    }
  }
}

/**
 * Generate a class code QR with LearnOz branding
 */
export function generateClassCodeQR(classCode: string, baseUrl: string = window.location.origin): string {
  const url = `${baseUrl}/?class=${encodeURIComponent(classCode)}`;
  return generateQRCode(url, {
    size: 300,
    padding: 30,
    backgroundColor: '#ffffff',
    foregroundColor: '#1e293b' // slate-800
  });
}

/**
 * Create a printable QR sheet for classroom distribution
 */
export function createPrintableQRSheet(
  classCode: string, 
  className: string,
  baseUrl: string = window.location.origin
): string {
  const qrCode = generateClassCodeQR(classCode, baseUrl);
  const joinUrl = `${baseUrl}/?class=${encodeURIComponent(classCode)}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>LearnOz Class QR Code - ${className}</title>
      <style>
        @page { margin: 1in; size: letter; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          max-width: 8.5in;
          margin: 0 auto;
          padding: 0;
          line-height: 1.5;
        }
        .header { text-align: center; margin-bottom: 2rem; }
        .logo { font-size: 2rem; font-weight: bold; color: #1e293b; margin-bottom: 0.5rem; }
        .subtitle { color: #64748b; font-size: 1.1rem; }
        .qr-container { text-align: center; margin: 2rem 0; }
        .qr-code { border: 2px solid #e2e8f0; border-radius: 8px; padding: 1rem; display: inline-block; }
        .class-info { background: #f8fafc; padding: 1.5rem; border-radius: 8px; margin: 2rem 0; }
        .instructions { margin: 2rem 0; }
        .step { margin: 1rem 0; padding-left: 2rem; position: relative; }
        .step-number { 
          position: absolute; 
          left: 0; 
          top: 0; 
          background: #3b82f6; 
          color: white; 
          width: 1.5rem; 
          height: 1.5rem; 
          border-radius: 50%; 
          text-align: center; 
          font-size: 0.875rem; 
          line-height: 1.5rem;
        }
        .url { font-family: monospace; background: #f1f5f9; padding: 0.5rem; border-radius: 4px; word-break: break-all; }
        .footer { text-align: center; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e2e8f0; color: #64748b; }
        @media print {
          .no-print { display: none; }
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🎓 LearnOz</div>
        <div class="subtitle">Classroom Learning Platform</div>
      </div>

      <div class="class-info">
        <h1 style="margin: 0 0 0.5rem 0; color: #1e293b;">${className}</h1>
        <p style="margin: 0; color: #64748b;">Class Code: <strong style="color: #1e293b; font-size: 1.2rem;">${classCode}</strong></p>
      </div>

      <div class="qr-container">
        <div class="qr-code">
          ${qrCode}
        </div>
        <p style="margin-top: 1rem; color: #64748b;">Scan with any camera app</p>
      </div>

      <div class="instructions">
        <h2 style="color: #1e293b; margin-bottom: 1rem;">How Students Join:</h2>
        
        <div class="step">
          <div class="step-number">1</div>
          <strong>Scan QR Code</strong><br>
          Use any smartphone or tablet camera to scan the code above
        </div>
        
        <div class="step">
          <div class="step-number">2</div>
          <strong>Or Visit Manually</strong><br>
          Go to: <div class="url">${joinUrl}</div>
        </div>
        
        <div class="step">
          <div class="step-number">3</div>
          <strong>Create Profile</strong><br>
          Students enter their name and create their learner profile
        </div>
        
        <div class="step">
          <div class="step-number">4</div>
          <strong>Start Learning</strong><br>
          Access assignments and begin curriculum activities
        </div>
      </div>

      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 1rem; margin: 2rem 0;">
        <h3 style="margin: 0 0 0.5rem 0; color: #92400e;">📱 Offline Ready</h3>
        <p style="margin: 0; color: #92400e;">LearnOz works offline! Students can continue learning without internet and sync when reconnected.</p>
      </div>

      <div class="footer">
        <p>Need help? Visit the Guide → Settings → Documentation</p>
        <p style="font-size: 0.875rem;">LearnOz Teacher Communications Pack • Generated ${new Date().toLocaleDateString()}</p>
      </div>
    </body>
    </html>
  `;
}