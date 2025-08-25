import { useState } from 'react';
import { motion } from 'framer-motion';
import { getThemeAsset, type ThemeAsset } from '@/assets/themeAssets';

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
  
  // If no asset found, use fallback emoji
  if (!asset) {
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

  // If image path exists and no error, show image
  if (asset.imagePath && !imageError) {
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
          src={asset.imagePath.replace('@assets/', '/attached_assets/')}
          alt={asset.altText}
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
      title={`Fallback for: ${asset.fallbackDescription}`}
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