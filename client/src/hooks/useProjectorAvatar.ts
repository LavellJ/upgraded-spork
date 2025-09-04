import { useActiveClass } from '../guide/useActiveClass';

/**
 * Hook for handling avatar display in projector/class mode
 * When hideNames is true, returns initials instead of full names
 */
export function useProjectorAvatar() {
  const { activeClass } = useActiveClass();
  
  const shouldHideNames = activeClass?.projectorPreset?.hideNames ?? false;
  
  /**
   * Get anonymous initials from a learner name
   * @param name The learner's full name
   * @returns Initials (e.g., "John Smith" -> "JS")
   */
  const getAnonymousInitials = (name: string): string => {
    if (!name || name.trim() === '') return '??';
    
    const words = name.trim().split(/\s+/);
    
    if (words.length === 1) {
      // Single name - use first letter twice or first two letters
      const word = words[0].toUpperCase();
      return word.length >= 2 ? word.slice(0, 2) : word + word;
    } else {
      // Multiple names - use first letter of first two words
      return words.slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('');
    }
  };

  /**
   * Get display name for learner in class mode
   * @param realName The learner's real name
   * @param fallback Fallback name if real name is empty
   * @returns Display name (real name or generic fallback)
   */
  const getDisplayName = (realName: string, fallback: string = 'Student'): string => {
    if (shouldHideNames) {
      return fallback;
    }
    return realName || fallback;
  };

  /**
   * Get avatar display info for learner
   * @param realName The learner's real name
   * @param avatarId The learner's avatar ID
   * @returns Object with display name and initials
   */
  const getAvatarInfo = (realName: string, avatarId?: string) => {
    return {
      displayName: getDisplayName(realName),
      initials: shouldHideNames ? getAnonymousInitials(realName) : null,
      shouldShowInitials: shouldHideNames,
      avatarId
    };
  };

  return {
    shouldHideNames,
    getAnonymousInitials,
    getDisplayName,
    getAvatarInfo
  };
}