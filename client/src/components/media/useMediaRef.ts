import { useRef } from 'react';

export function useMediaRef() {
  const ref = useRef<HTMLVideoElement | null>(null);
  
  const seekTo = (seconds: number) => {
    if (ref.current) {
      ref.current.currentTime = seconds;
    }
  };
  
  return { 
    mediaRef: ref,
    seekTo
  };
}