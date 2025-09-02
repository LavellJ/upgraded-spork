// Device memory detection utilities

/**
 * Detect if the device has low memory
 * Uses navigator.deviceMemory when available, falls back to conservative estimate
 */
export function isLowMemory(): boolean {
  // navigator.deviceMemory returns approximate device RAM in GB
  // Not supported everywhere, so we fall back to 4GB assumption
  const deviceMemory = (navigator as any).deviceMemory || 4;
  
  // Consider devices with less than 4GB RAM as low-memory
  return deviceMemory < 4;
}

/**
 * Get device memory info for debugging/settings display
 */
export function getMemoryInfo(): { 
  available: number | null; 
  isLowMemory: boolean; 
  supported: boolean;
} {
  const deviceMemory = (navigator as any).deviceMemory;
  
  return {
    available: deviceMemory || null,
    isLowMemory: isLowMemory(),
    supported: deviceMemory !== undefined
  };
}

/**
 * Check if we should enable prefetching based on device capabilities
 */
export function shouldEnablePrefetch(): boolean {
  // Don't prefetch on low-memory devices by default
  if (isLowMemory()) {
    return false;
  }
  
  // Don't prefetch if we're on a slow connection
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') {
      return false;
    }
  }
  
  return true;
}

/**
 * Get connection info for debugging
 */
export function getConnectionInfo(): {
  effectiveType?: string;
  downlink?: number;
  saveData?: boolean;
} {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return {
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      saveData: connection?.saveData
    };
  }
  
  return {};
}