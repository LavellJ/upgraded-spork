import { useEffect } from 'react';
import { useActiveClass } from './useActiveClass';

/**
 * Component that applies projector presets globally by setting HTML data attributes
 * and CSS variables based on the active class configuration.
 * 
 * This component should be mounted once at the app level to ensure
 * projector settings are applied consistently across the entire application.
 */
export function ProjectorPresetApplier() {
  const { activeClass } = useActiveClass();

  useEffect(() => {
    const htmlElement = document.documentElement;
    
    if (activeClass?.projectorPreset) {
      const { 
        fontScale = 1.0, 
        hideNames = false, 
        muteSFX = false, 
        largeCursor = false 
      } = activeClass.projectorPreset;
      
      // Apply font scale via CSS variable and data attribute
      htmlElement.style.setProperty('--projector-font-scale', fontScale.toString());
      htmlElement.setAttribute('data-projector-font-scale', fontScale.toString());
      
      // Apply hide names setting
      htmlElement.setAttribute('data-projector-hide-names', hideNames.toString());
      
      // Apply SFX muting
      htmlElement.setAttribute('data-projector-mute-sfx', muteSFX.toString());
      
      // Apply large cursor setting
      htmlElement.setAttribute('data-projector-large-cursor', largeCursor.toString());
      
      console.log('🎥 Projector presets applied:', { fontScale, hideNames, muteSFX, largeCursor });
    } else {
      // Clear projector settings when no active class
      htmlElement.style.removeProperty('--projector-font-scale');
      htmlElement.removeAttribute('data-projector-font-scale');
      htmlElement.removeAttribute('data-projector-hide-names');
      htmlElement.removeAttribute('data-projector-mute-sfx');
      htmlElement.removeAttribute('data-projector-large-cursor');
      
      console.log('🎥 Projector presets cleared (no active class)');
    }
  }, [activeClass]);

  // This component renders nothing - it only manages global state
  return null;
}