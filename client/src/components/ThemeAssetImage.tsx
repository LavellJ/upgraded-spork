import { useState } from 'react';
import { motion } from 'framer-motion';
import { getThemeAsset, type ThemeAsset } from '@/assets/themeAssets';

// Import ultra-minimal geometric animal icons matching exact bunny/fox/owl style
import minimalBearImg from '@assets/generated_images/Minimal_geometric_bear_shapes_11a702b1.png';
import minimalDeerImg from '@assets/generated_images/Minimal_geometric_deer_shapes_7440e0a8.png';
import minimalCatImg from '@assets/generated_images/Minimal_geometric_cat_shapes_87d086b3.png';
import minimalButterflyImg from '@assets/generated_images/Minimal_geometric_butterfly_shapes_ef2934a5.png';
import minimalSquirrelImg from '@assets/generated_images/Minimal_geometric_squirrel_shapes_9e7f4586.png';

// Disable all asset mapping - clean slate with no images
const VITE_ASSET_MAP: Record<string, string> = {};

interface ThemeAssetImageProps {
  assetId: string;
  className?: string;
  size?: number | string;
  fallbackEmoji?: string;
  animate?: boolean;
  onClick?: () => void;
}

/**
 * ThemeAssetImage Component
 * 
 * Displays themed illustrations with fallback to emoji if image fails to load.
 * Follows the Alto adventure theme aesthetic and provides smooth animations.
 */
export function ThemeAssetImage({ 
  assetId, 
  className = "", 
  size = 64, 
  fallbackEmoji = "🎯",
  animate = true,
  onClick 
}: ThemeAssetImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const asset = getThemeAsset(assetId);
  
  // Check if we have a Vite-imported image for this asset
  const viteImageSrc = VITE_ASSET_MAP[assetId];
  
  // If no asset found, use fallback emoji
  if (!asset && !viteImageSrc) {
    return (
      <motion.div 
        className={`flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
        initial={animate ? { scale: 0, opacity: 0 } : false}
        animate={animate ? { scale: 1, opacity: 1 } : false}
        transition={{ type: "spring", damping: 15 }}
        onClick={onClick}
      >
        <span className="text-4xl">{fallbackEmoji}</span>
      </motion.div>
    );
  }

  // If we have a Vite image or asset image path and no error, show image
  if ((viteImageSrc || asset?.imagePath) && !imageError) {
    const imageSrc = viteImageSrc || asset!.imagePath;
    return (
      <motion.div
        className={`relative ${className}`}
        style={{ width: size, height: size }}
        initial={animate ? { scale: 0, opacity: 0 } : false}
        animate={animate ? { scale: 1, opacity: 1 } : false}
        transition={{ type: "spring", damping: 15 }}
        onClick={onClick}
      >
        <img
          src={imageSrc}
          alt={asset?.altText || 'Scout illustration'}
          className="w-full h-full object-cover rounded-lg"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          style={{ 
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
        />
        
        {/* Loading placeholder */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-lg flex items-center justify-center">
            <motion.div
              className="w-6 h-6 bg-white/30 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>
        )}
      </motion.div>
    );
  }

  // Fallback to emoji if image fails or doesn't exist
  return (
    <motion.div 
      className={`flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      initial={animate ? { scale: 0, opacity: 0 } : false}
      animate={animate ? { scale: 1, opacity: 1 } : false}
      transition={{ type: "spring", damping: 15 }}
      onClick={onClick}
      title={`Fallback for: ${asset?.fallbackDescription || 'Scout illustration'}`}
    >
      <span className="text-4xl">{fallbackEmoji}</span>
    </motion.div>
  );
}

/**
 * Helper function to get image URL from asset path
 */
export function getAssetImageUrl(assetPath: string): string {
  return assetPath.replace('@assets/', '/attached_assets/');
}