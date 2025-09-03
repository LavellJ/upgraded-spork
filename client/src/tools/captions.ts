/**
 * Utilities for working with caption files and formats
 */

/**
 * Convert SRT format to WebVTT format
 * @param srt - SRT format string
 * @returns WebVTT format string
 */
export function srtToVtt(srt: string): string {
  // Start with WebVTT header
  let vtt = "WEBVTT\n\n";
  
  // Split SRT into blocks
  const blocks = srt.trim().split(/\n\s*\n/);
  
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    
    if (lines.length >= 3) {
      // Skip sequence number (first line)
      const timecode = lines[1];
      const text = lines.slice(2).join('\n');
      
      // Convert SRT timecode to WebVTT format
      // SRT: 00:00:20,000 --> 00:00:24,400
      // VTT: 00:00:20.000 --> 00:00:24.400
      const vttTimecode = timecode.replace(/,/g, '.');
      
      vtt += vttTimecode + '\n';
      vtt += text + '\n\n';
    }
  }
  
  return vtt.trim() + '\n';
}

/**
 * Download a string as a .vtt file (DEV helper)
 * @param content - WebVTT content
 * @param filename - Filename without extension
 */
export function downloadVtt(content: string, filename: string): void {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('downloadVtt is only available in development mode');
    return;
  }
  
  try {
    const blob = new Blob([content], { type: 'text/vtt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.vtt`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download VTT file:', error);
  }
}

/**
 * Convert and download SRT as VTT file (DEV helper)
 * @param srt - SRT content
 * @param filename - Filename without extension
 */
export function convertAndDownloadSrt(srt: string, filename: string): void {
  const vtt = srtToVtt(srt);
  downloadVtt(vtt, filename);
}