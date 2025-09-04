/**
 * Asset Preflight System
 * 
 * Validates lesson assets by checking URLs, file sizes, and compliance.
 * Prevents broken or oversized assets in content packs.
 */

import { LessonV2 } from './schema';

// Asset size limits (in bytes)
const SIZE_LIMITS = {
  IMAGE_WARN: 1.5 * 1024 * 1024,    // 1.5MB - warn for images
  VIDEO_WARN: 6 * 1024 * 1024,      // 6MB - warn for videos (allow but mark)
  AUDIO_WARN: 3 * 1024 * 1024,      // 3MB - warn for audio
  DOCUMENT_WARN: 2 * 1024 * 1024,   // 2MB - warn for documents/PDFs
} as const;

// File type mappings
const FILE_TYPES = {
  IMAGE: /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i,
  VIDEO: /\.(mp4|webm|mov|avi|mkv|m4v)$/i,
  AUDIO: /\.(mp3|wav|ogg|m4a|aac|flac)$/i,
  DOCUMENT: /\.(pdf|doc|docx|txt|html|htm)$/i,
  CAPTION: /\.vtt$/i,
} as const;

export interface AssetIssue {
  path: string;
  type: 'error' | 'warning';
  message: string;
  size?: number;
  code: string;
}

export interface PreflightResult {
  ok: boolean;
  issues: AssetIssue[];
  sizes: { [path: string]: number };
  summary: {
    totalAssets: number;
    totalSize: number;
    errors: number;
    warnings: number;
  };
}

/**
 * Extract all asset URLs from a lesson
 */
function extractAssetUrls(lesson: LessonV2): string[] {
  const urls: string[] = [];
  
  // Extract from activities
  for (const activity of lesson.activities) {
    // Video activities
    if (activity.kind === 'video') {
      if (activity.src) urls.push(activity.src);
      if (activity.audiodescription) urls.push(activity.audiodescription);
      if (activity.captions) {
        activity.captions.forEach(caption => {
          if (caption.src) urls.push(caption.src);
        });
      }
      if (activity.transcript?.src) urls.push(activity.transcript.src);
    }
    
    // Read activities (content is text, no direct src)
    if (activity.kind === 'read') {
      // Read activities contain text content, not asset URLs
      // Assets would need to be referenced in lesson.assets array
    }
    
    // Manipulation activities 
    if (activity.kind === 'manip') {
      // Manip activities may reference assets through config
      // Assets would typically be in lesson.assets array
    }
    
    // Quiz activities
    if (activity.kind === 'quiz') {
      // Quiz content is referenced by questionSetId
      // Individual question assets would be in external question sets
    }
  }
  
  // Extract from lesson assets array
  if (lesson.assets) {
    urls.push(...lesson.assets);
  }
  
  return [...new Set(urls)]; // Remove duplicates
}

/**
 * Resolve relative URLs against base URL
 */
function resolveUrl(url: string, baseUrl: string): string {
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url; // Already absolute
    }
    
    // Ensure baseUrl ends with /
    const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return new URL(url, base).href;
  } catch (error) {
    return url; // Return original if URL construction fails
  }
}

/**
 * Check if URL is accessible and get content length
 */
async function checkAssetUrl(url: string): Promise<{ ok: boolean; size?: number; error?: string }> {
  try {
    // Try HEAD request first for efficiency
    let response = await fetch(url, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    // Some servers don't support HEAD, fallback to GET with range
    if (!response.ok) {
      response = await fetch(url, {
        method: 'GET',
        headers: { 'Range': 'bytes=0-0' }, // Request just first byte
        signal: AbortSignal.timeout(10000)
      });
    }
    
    if (!response.ok) {
      return {
        ok: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
    
    const contentLength = response.headers.get('content-length');
    const size = contentLength ? parseInt(contentLength, 10) : undefined;
    
    return { ok: true, size };
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { ok: false, error: 'Request timeout (>10s)' };
      }
      return { ok: false, error: error.message };
    }
    return { ok: false, error: 'Unknown error' };
  }
}

/**
 * Get file type category from URL
 */
function getFileType(url: string): keyof typeof FILE_TYPES | 'OTHER' {
  const path = new URL(url, 'http://example.com').pathname.toLowerCase();
  
  if (FILE_TYPES.IMAGE.test(path)) return 'IMAGE';
  if (FILE_TYPES.VIDEO.test(path)) return 'VIDEO';
  if (FILE_TYPES.AUDIO.test(path)) return 'AUDIO';
  if (FILE_TYPES.DOCUMENT.test(path)) return 'DOCUMENT';
  if (FILE_TYPES.CAPTION.test(path)) return 'CAPTION';
  
  return 'OTHER';
}

/**
 * Get size limit for file type
 */
function getSizeLimit(fileType: string): number | null {
  switch (fileType) {
    case 'IMAGE': return SIZE_LIMITS.IMAGE_WARN;
    case 'VIDEO': return SIZE_LIMITS.VIDEO_WARN;
    case 'AUDIO': return SIZE_LIMITS.AUDIO_WARN;
    case 'DOCUMENT': return SIZE_LIMITS.DOCUMENT_WARN;
    default: return null;
  }
}

/**
 * Check for missing caption files
 */
function checkMissingCaptions(lesson: LessonV2, assetResults: Map<string, { ok: boolean; size?: number; error?: string }>): AssetIssue[] {
  const issues: AssetIssue[] = [];
  
  for (const activity of lesson.activities) {
    if (activity.kind === 'video' && activity.captions?.length) {
      for (const captionTrack of activity.captions) {
        if (captionTrack.src) {
          const result = assetResults.get(captionTrack.src);
          if (!result?.ok) {
            issues.push({
              path: captionTrack.src,
              type: 'warning',
              message: `Missing caption file for video: ${activity.src}`,
              code: 'MISSING_CAPTION'
            });
          }
        }
      }
    }
  }
  
  return issues;
}

/**
 * Verify all assets in a lesson
 */
export async function verifyAssets(lesson: LessonV2, baseUrl: string): Promise<PreflightResult> {
  const assetUrls = extractAssetUrls(lesson);
  const issues: AssetIssue[] = [];
  const sizes: { [path: string]: number } = {};
  const assetResults = new Map<string, { ok: boolean; size?: number; error?: string }>();
  
  // Check each asset URL
  for (const relativeUrl of assetUrls) {
    const absoluteUrl = resolveUrl(relativeUrl, baseUrl);
    const result = await checkAssetUrl(absoluteUrl);
    assetResults.set(relativeUrl, result);
    
    if (!result.ok) {
      issues.push({
        path: relativeUrl,
        type: 'error',
        message: result.error || 'Asset not accessible',
        code: 'ASSET_NOT_FOUND'
      });
      continue;
    }
    
    // Record size if available
    if (result.size !== undefined) {
      sizes[relativeUrl] = result.size;
      
      // Check size limits
      const fileType = getFileType(absoluteUrl);
      const sizeLimit = getSizeLimit(fileType);
      
      if (sizeLimit && result.size > sizeLimit) {
        const sizeMB = (result.size / (1024 * 1024)).toFixed(1);
        const limitMB = (sizeLimit / (1024 * 1024)).toFixed(1);
        
        issues.push({
          path: relativeUrl,
          type: 'warning',
          message: `${fileType.toLowerCase()} file is ${sizeMB}MB (>${limitMB}MB recommended)`,
          size: result.size,
          code: 'OVERSIZED_ASSET'
        });
      }
    }
  }
  
  // Check for missing caption files
  const captionIssues = checkMissingCaptions(lesson, assetResults);
  issues.push(...captionIssues);
  
  // Calculate summary
  const totalSize = Object.values(sizes).reduce((sum, size) => sum + size, 0);
  const errors = issues.filter(issue => issue.type === 'error').length;
  const warnings = issues.filter(issue => issue.type === 'warning').length;
  
  return {
    ok: errors === 0,
    issues,
    sizes,
    summary: {
      totalAssets: assetUrls.length,
      totalSize,
      errors,
      warnings
    }
  };
}

/**
 * Verify assets for multiple lessons (batch processing)
 */
export async function verifyLessonsAssets(
  lessons: LessonV2[], 
  baseUrl: string,
  onProgress?: (current: number, total: number, lessonId: string) => void
): Promise<{ [lessonId: string]: PreflightResult }> {
  const results: { [lessonId: string]: PreflightResult } = {};
  
  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    onProgress?.(i + 1, lessons.length, lesson.id);
    
    results[lesson.id] = await verifyAssets(lesson, baseUrl);
  }
  
  return results;
}

/**
 * Generate human-readable summary of preflight results
 */
export function generateSummaryReport(results: { [lessonId: string]: PreflightResult }): string {
  const lessons = Object.keys(results);
  const totalLessons = lessons.length;
  const passedLessons = lessons.filter(id => results[id].ok).length;
  const failedLessons = totalLessons - passedLessons;
  
  let totalAssets = 0;
  let totalSize = 0;
  let totalErrors = 0;
  let totalWarnings = 0;
  
  for (const result of Object.values(results)) {
    totalAssets += result.summary.totalAssets;
    totalSize += result.summary.totalSize;
    totalErrors += result.summary.errors;
    totalWarnings += result.summary.warnings;
  }
  
  const sizeMB = (totalSize / (1024 * 1024)).toFixed(1);
  
  return `
📊 Asset Preflight Summary
═══════════════════════════
📚 Lessons: ${totalLessons} (${passedLessons} passed, ${failedLessons} failed)
📎 Assets: ${totalAssets} (${sizeMB}MB total)
❌ Errors: ${totalErrors}
⚠️  Warnings: ${totalWarnings}

${failedLessons > 0 ? '❌ Preflight FAILED - fix errors before deployment' : '✅ Preflight PASSED - all assets verified'}
`.trim();
}