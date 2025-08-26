import { motion } from "framer-motion";
import type { Collectible } from "./QuestIsland";

interface JourneyJournalProps {
  collectibles: Collectible[];
  onClose: () => void;
}

// Helper functions for collectible styling to match Quest Island
const getCollectibleStyle = (biome: string) => {
  switch(biome) {
    case 'beach': return 'bg-gradient-to-br from-blue-300 to-cyan-400';
    case 'jungle': return 'bg-gradient-to-br from-green-300 to-emerald-400';
    case 'volcano': return 'bg-gradient-to-br from-red-300 to-orange-400';
    case 'meadow': return 'bg-gradient-to-br from-pink-300 to-purple-400';
    case 'lagoon': return 'bg-gradient-to-br from-indigo-300 to-blue-400';
    default: return 'bg-gradient-to-br from-yellow-300 to-amber-400';
  }
};

export function JourneyJournal({ collectibles, onClose }: JourneyJournalProps) {
  const collectedCount = collectibles.filter(c => c.collected).length;
  
  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      data-testid="journey-journal-modal"
    >
      <motion.div
        className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl"
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        onClick={(e) => e.stopPropagation()}
        data-testid="journey-journal-content"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-3xl font-bold text-amber-900 mb-2">
              Scout's Backpack
            </h2>
            <p className="text-amber-700">
              Collectibles Found: {collectedCount} / {collectibles.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-amber-700 hover:text-amber-900 transition-colors duration-300 text-xl"
            data-testid="button-close-journal"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="bg-amber-200 rounded-full h-3 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(collectedCount / collectibles.length) * 100}%` }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
          </div>
        </div>

        {/* Collectibles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {collectibles.map((collectible, index) => (
            <motion.div
              key={collectible.id}
              className={`bg-white/70 rounded-2xl p-6 shadow-lg border-2 transition-all duration-300 ${
                collectible.collected 
                  ? "border-green-300 bg-green-50/80" 
                  : "border-gray-200 bg-gray-50/80"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              data-testid={`collectible-${collectible.id}`}
            >
              <div className="flex items-center space-x-4">
                {/* Collectible Orb - Match Quest Island styling */}
                <div className={`relative w-16 h-16 rounded-full flex items-center justify-center ${
                  collectible.collected ? "opacity-100" : "opacity-30"
                }`}>
                  {/* Main collectible orb */}
                  <div className={`w-full h-full rounded-full ${getCollectibleStyle(collectible.biome)} border-3 border-white shadow-lg`} />
                  
                  {/* Lock Overlay */}
                  {!collectible.collected && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <i className="fas fa-lock text-white text-lg"></i>
                    </div>
                  )}
                  
                  {/* Collected Glow */}
                  {collectible.collected && (
                    <motion.div
                      className="absolute inset-0 bg-yellow-400/30 rounded-full"
                      animate={{ 
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                </div>

                {/* Collectible Info */}
                <div className="flex-1">
                  <h3 className={`font-semibold text-lg mb-1 ${
                    collectible.collected ? "text-green-800" : "text-gray-600"
                  }`}>
                    {collectible.name}
                  </h3>
                  <p className={`text-sm ${
                    collectible.collected ? "text-green-700" : "text-gray-500"
                  }`}>
                    {collectible.description}
                  </p>
                  <div className={`text-xs mt-2 px-2 py-1 rounded-full inline-block ${
                    collectible.collected 
                      ? "bg-green-200 text-green-800" 
                      : "bg-gray-200 text-gray-600"
                  }`}>
                    {collectible.biome.charAt(0).toUpperCase() + collectible.biome.slice(1)}
                  </div>
                </div>

                {/* Status Icon */}
                <div className={`text-2xl ${
                  collectible.collected ? "text-green-500" : "text-gray-400"
                }`}>
                  {collectible.collected ? (
                    <motion.i 
                      className="fas fa-check-circle"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    />
                  ) : (
                    <i className="fas fa-circle"></i>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Scout Message */}
        <motion.div
          className="mt-8 bg-blue-100 rounded-2xl p-6 border-2 border-blue-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-b from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-gradient-to-b from-amber-100 to-amber-200 rounded-full"></div>
            </div>
            <span className="font-semibold text-blue-800">Scout's Message</span>
          </div>
          <p className="text-blue-700 text-sm leading-relaxed">
            {collectedCount === 0 && "G'day, mate! Ready to start our adventure? Each biome has special treasures waiting for you to discover!"}
            {collectedCount > 0 && collectedCount < collectibles.length && "You're doing brilliant, friend! Keep exploring to find more amazing collectibles on our island adventure!"}
            {collectedCount === collectibles.length && "Crikey! You've found everything, legend! You're a true island explorer now!"}
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}