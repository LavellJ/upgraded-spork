/**
 * Theme Asset Management System for LearnOz
 * 
 * This file manages all themed illustrations and provides fallback descriptions
 * for AI image generation in the Alto adventure style.
 */

export interface ThemeAsset {
  id: string;
  name: string;
  category: 'subject' | 'activity' | 'feedback' | 'badge' | 'ui';
  imagePath?: string;
  fallbackDescription: string;
  altText: string;
  subject?: string;
}

export const themeAssets: Record<string, ThemeAsset> = {
  // Subject-Aware Activity Icons
  'math-counting': {
    id: 'math-counting',
    name: 'Math Counting Activity',
    category: 'activity',
    imagePath: '/attached_assets/generated_images/Counting_animals_educational_illustration_c431f929.png',
    fallbackDescription: 'A cheerful cartoon Scout character in Alto adventure style holding an abacus with colorful beads, surrounded by floating numbers in soft gradients, mountains in background, clean illustration style',
    altText: 'Scout with counting tools',
    subject: 'mathematics'
  },
  
  'math-shapes': {
    id: 'math-shapes',
    name: 'Shape Recognition Activity', 
    category: 'activity',
    imagePath: '/attached_assets/generated_images/Basic_shapes_educational_illustration_db521999.png',
    fallbackDescription: 'Scout character examining geometric shapes (circles, triangles, squares) with a magnifying glass, shapes have soft glowing effects, Alto adventure mountain landscape, clean cartoon style',
    altText: 'Scout exploring shapes',
    subject: 'mathematics'
  },

  'science-animals': {
    id: 'science-animals',
    name: 'Animal Science Activity',
    category: 'activity', 
    imagePath: '/attached_assets/generated_images/Nature_animals_educational_scene_9f3bd27f.png',
    fallbackDescription: 'Scout character with a nature journal observing cute cartoon animals in a meadow, binoculars around neck, soft atmospheric lighting, Alto adventure art style',
    altText: 'Scout studying animals',
    subject: 'science'
  },

  'literacy-letters': {
    id: 'literacy-letters',
    name: 'Letter Recognition Activity',
    category: 'activity',
    imagePath: '/attached_assets/generated_images/Scout_letter_detective_activity_66ed878a.png',
    fallbackDescription: 'Scout character as detective with magnifying glass searching for letters floating in the air like butterflies, soft mountain backdrop, whimsical Alto adventure style',
    altText: 'Scout as letter detective',
    subject: 'literacy'
  },

  'discovery-exploration': {
    id: 'discovery-exploration',
    name: 'General Discovery Activity',
    category: 'activity',
    imagePath: '/attached_assets/generated_images/Scout_general_exploration_5819cb00.png',
    fallbackDescription: 'Scout character with backpack standing on a hill looking through a telescope at floating islands and magical discoveries, soft sunset lighting, Alto adventure aesthetic',
    altText: 'Scout exploring discoveries',
    subject: 'general'
  },

  // Feedback Icons
  'feedback-success': {
    id: 'feedback-success',
    name: 'Success Celebration',
    category: 'feedback',
    imagePath: '/attached_assets/generated_images/Celebrating_explorer_buddy_b6cc403f.png',
    fallbackDescription: 'Scout character jumping with joy, arms raised in celebration, confetti or sparkles around, bright cheerful expression, Alto adventure style',
    altText: 'Scout celebrating success',
    subject: 'general'
  },

  'feedback-encouragement': {
    id: 'feedback-encouragement',
    name: 'Encouragement Gesture',
    category: 'feedback',
    imagePath: '/attached_assets/generated_images/Scout_encouragement_gesture_3e7ef8a2.png',
    fallbackDescription: 'Scout character with encouraging thumbs up gesture, friendly smile, gentle reassuring expression, Alto adventure style',
    altText: 'Scout giving encouragement',
    subject: 'general'
  },

  'feedback-thinking': {
    id: 'feedback-thinking',
    name: 'Thinking Activity',
    category: 'feedback',
    imagePath: '/attached_assets/generated_images/Scout_thinking_exploration_f0cbbecc.png',
    fallbackDescription: 'Scout character in thoughtful pose looking at discoveries, hand on chin, curious expression, Alto adventure mountain backdrop',
    altText: 'Scout in exploration mode',
    subject: 'general'
  },

  // UI Elements
  'ui-scout-speech': {
    id: 'ui-scout-speech',
    name: 'Scout Speech Icon',
    category: 'ui',
    fallbackDescription: 'Scout character with a speech bubble or megaphone, friendly communicative pose, Alto adventure style',
    altText: 'Scout speaking',
    subject: 'general'
  },

  'ui-camera-discovery': {
    id: 'ui-camera-discovery',
    name: 'Camera Discovery Icon',
    category: 'ui',
    fallbackDescription: 'Scout character holding a vintage camera with a friendly smile, ready to capture memories, Alto adventure style, soft lighting',
    altText: 'Scout with camera',
    subject: 'general'
  },

  // Exploration Activity Icons
  'exploration-counting': {
    id: 'exploration-counting',
    name: 'Counting Exploration',
    category: 'activity',
    imagePath: '/attached_assets/generated_images/Scout_math_counting_activity_6b76e197.png',
    fallbackDescription: 'Mathematical counting theme with Scout holding numbered objects, abacus visible, soft pastel gradients, Alto adventure style',
    altText: 'Counting exploration',
    subject: 'mathematics'
  },

  'exploration-shapes': {
    id: 'exploration-shapes', 
    name: 'Shape Exploration',
    category: 'activity',
    imagePath: '/attached_assets/generated_images/Scout_shapes_exploration_activity_db037fae.png',
    fallbackDescription: 'Geometric shapes floating around Scout character, magnifying glass examining circle/triangle/square, Alto adventure art style',
    altText: 'Shape exploration',
    subject: 'mathematics'
  },

  'exploration-colors': {
    id: 'exploration-colors',
    name: 'Color Matching',
    category: 'activity',
    imagePath: '/attached_assets/generated_images/Scout_general_exploration_5819cb00.png',
    fallbackDescription: 'Scout character with paint palette, mixing beautiful colors, rainbow in background, Alto adventure illustration style',
    altText: 'Color matching activity',
    subject: 'art'
  },

  'exploration-animals': {
    id: 'exploration-animals',
    name: 'Animal Exploration',
    category: 'activity',
    imagePath: '/attached_assets/generated_images/Scout_animal_science_activity_ecc5c7ed.png',
    fallbackDescription: 'Scout character observing forest animals with nature journal, peaceful meadow setting, Alto adventure cartoon style',
    altText: 'Animal exploration',
    subject: 'science'
  },

  'exploration-habitats': {
    id: 'exploration-habitats',
    name: 'Animal Habitats',
    category: 'activity',
    imagePath: '/attached_assets/generated_images/Nature_animals_educational_scene_9f3bd27f.png',
    fallbackDescription: 'Scout discovering different animal homes, tree hollow, pond, mountains visible, nature exploration theme, Alto style',
    altText: 'Animal habitats',
    subject: 'science'
  },

  'exploration-letters': {
    id: 'exploration-letters',
    name: 'Letter Hunt',
    category: 'activity',
    imagePath: '/attached_assets/generated_images/Scout_letter_detective_activity_66ed878a.png',
    fallbackDescription: 'Scout as detective with magnifying glass hunting for letters, alphabet butterflies floating around, Alto adventure style',
    altText: 'Letter hunting',
    subject: 'literacy'
  },

  'exploration-sounds': {
    id: 'exploration-sounds',
    name: 'Sound Recognition',
    category: 'activity',
    fallbackDescription: 'Scout with cupped ear listening to sounds, musical notes and sound waves in air, peaceful expression, Alto adventure style',
    altText: 'Sound exploration',
    subject: 'literacy'
  },

  'exploration-general': {
    id: 'exploration-general',
    name: 'General Exploration',
    category: 'activity',
    imagePath: '/attached_assets/generated_images/Scout_general_exploration_5819cb00.png',
    fallbackDescription: 'Scout character on adventure with backpack, looking through telescope at floating question marks and discoveries, Alto adventure style',
    altText: 'General exploration',
    subject: 'general'
  },

  // Subject Icons  
  'subject-mathematics': {
    id: 'subject-mathematics',
    name: 'Mathematics Subject',
    category: 'subject',
    fallbackDescription: 'Geometric crystal formation with mathematical symbols (numbers, equations) glowing inside, soft blue-purple gradients, floating in misty mountain landscape, Alto adventure style',
    altText: 'Mathematics crystal',
    subject: 'mathematics'
  },

  'subject-science': {
    id: 'subject-science', 
    name: 'Science Subject',
    category: 'subject',
    fallbackDescription: 'Magical telescope pointing at stars and planets, with microscope and beakers nearby, soft teal-green gradients, misty mountain backdrop, Alto adventure illustration style',
    altText: 'Science instruments',
    subject: 'science'
  },

  'subject-literacy': {
    id: 'subject-literacy',
    name: 'Literacy Subject', 
    category: 'subject',
    fallbackDescription: 'Open magical book with letters and words floating out like glowing butterflies, soft warm golden light, mountain silhouettes, Alto adventure art style',
    altText: 'Magical literacy book',
    subject: 'literacy'
  },

  // Badge Icons
  'badge-first-steps': {
    id: 'badge-first-steps',
    name: 'First Steps Badge',
    category: 'badge',
    fallbackDescription: 'Golden medal with Scout character taking first step on a mountain trail, footprints glowing behind, soft morning light, Alto adventure style emblem design',
    altText: 'First steps achievement',
    subject: 'general'
  },

  'badge-daily-learner': {
    id: 'badge-daily-learner', 
    name: 'Daily Learner Badge',
    category: 'badge',
    fallbackDescription: 'Silver badge showing Scout with daily journal and calendar, sunrise over mountains, consistent learning theme, Alto adventure emblem style',
    altText: 'Daily learning achievement',
    subject: 'general'
  },

  'badge-focus-master': {
    id: 'badge-focus-master',
    name: 'Focus Master Badge', 
    category: 'badge',
    fallbackDescription: 'Bronze medallion with Scout meditating under a tree, surrounded by calm energy waves, peaceful mountain setting, Alto adventure style badge',
    altText: 'Focus mastery achievement',
    subject: 'general'
  },

  'achievement-general': {
    id: 'achievement-general',
    name: 'General Achievement',
    category: 'badge',
    fallbackDescription: 'Scout character holding a glowing trophy or medal, proud stance, golden light effects, Alto adventure style',
    altText: 'Scout with achievement',
    subject: 'general'
  }
};

/**
 * Get a theme asset by ID
 */
export function getThemeAsset(id: string): ThemeAsset | undefined {
  return themeAssets[id];
}

/**
 * Get all assets by category
 */
export function getAssetsByCategory(category: ThemeAsset['category']): ThemeAsset[] {
  return Object.values(themeAssets).filter(asset => asset.category === category);
}

/**
 * Get all assets by subject
 */
export function getAssetsBySubject(subject: string): ThemeAsset[] {
  return Object.values(themeAssets).filter(asset => asset.subject === subject);
}