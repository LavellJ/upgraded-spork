import { motion } from "framer-motion";
import type { Collectible } from "./QuestIsland";
import explorerDefault from '@assets/image_1756014874313.png';
import { getLearnerName } from "@/utils/learnerName";

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
    case 'lagoon': return 'bg-gradient-to-br from-indigo-300 to-blue-400';
    default: return 'bg-gradient-to-br from-yellow-300 to-amber-400';
  }
};

const getCollectibleGlow = (biome: string) => {
  switch(biome) {
    case 'beach': return 'bg-cyan-200';
    case 'jungle': return 'bg-green-200';
    case 'volcano': return 'bg-orange-200';
    case 'lagoon': return 'bg-blue-200';
    default: return 'bg-yellow-200';
  }
};

export function JourneyJournal({ collectibles, onClose }: JourneyJournalProps) {
  const collectedCount = collectibles.filter(c => c.collected).length;
  const learnerName = getLearnerName();
  
  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      data-testid="journey-journal-modal"
    >
      <div className="flex items-center justify-center max-w-6xl w-full h-full">
        {/* Scout Character - Side Panel */}
        <motion.div
          className="hidden md:flex flex-col items-center mr-8"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Scout Image */}
          <motion.div 
            className="relative mb-4"
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <img 
              src={explorerDefault} 
              alt="Scout"
              className="w-72 h-72 rounded-full border-4 border-white shadow-lg"
            />
          </motion.div>
          
          {/* Scout Speech Bubble */}
          <motion.div
            className="bg-white rounded-2xl p-4 shadow-lg border-2 border-blue-200 max-w-xs relative"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 200, damping: 15 }}
          >
            <p className="text-blue-800 text-sm leading-relaxed font-medium">
              {collectedCount === 0 && `G'day, ${learnerName}! Ready to start our adventure? Each biome has special treasures waiting for you to discover!`}
              {collectedCount > 0 && collectedCount < 10 && `You're doing brilliant, ${learnerName}! Keep exploring to find more amazing collectibles on our island adventure!`}
              {collectedCount >= 10 && `Crikey! You're becoming a real treasure hunter, ${learnerName}! What an amazing collection!`}
            </p>
            {/* Speech bubble arrow */}
            <div className="absolute -top-2 left-8">
              <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white"></div>
              <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-6 border-r-6 border-b-6 border-l-transparent border-r-transparent border-b-blue-200"></div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Journey Journal Content */}
        <motion.div
          className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-3xl p-6 max-w-3xl w-full h-[85vh] overflow-auto shadow-2xl"
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
              Journey Journal
            </h2>
            <p className="text-amber-700">
              Adventure Treasures Collected: {collectedCount}
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

        {/* Decorative Divider */}
        <div className="mb-4">
          <div className="bg-gradient-to-r from-transparent via-amber-300 to-transparent h-0.5 rounded-full"></div>
        </div>

        {/* Collectibles by Biome Categories */}
        <div className="space-y-4">
          {['beach', 'jungle', 'volcano', 'lagoon'].map((biome, biomeIndex) => {
            const biomeCollectibles = collectibles.filter(c => c.biome === biome);
            const collectedInBiome = biomeCollectibles.filter(c => c.collected).length;
            
            return (
              <motion.div
                key={biome}
                className="space-y-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: biomeIndex * 0.15 }}
              >
                {/* Biome Header */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-amber-800 capitalize flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${getCollectibleStyle(biome)}`} />
                    {biome === 'beach' && '🏖️'} {biome === 'jungle' && '🌿'} {biome === 'volcano' && '🌋'} 
                    {biome === 'lagoon' && '🏞️'} {biome.charAt(0).toUpperCase() + biome.slice(1)} Collection
                  </h3>
                  <div className="text-sm text-amber-700 font-medium">
                    {collectedInBiome > 0 ? `${collectedInBiome} discovered` : 'Explore to discover'}
                  </div>
                </div>
                
                {/* Decorative Biome Line */}
                <div className="mb-3">
                  <div className={`bg-gradient-to-r from-transparent via-amber-200 to-transparent h-px rounded-full`}></div>
                </div>
                
                {/* Biome Collectibles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {biomeCollectibles.length > 0 ? (
                    biomeCollectibles.map((collectible, index) => (
                    <motion.div
                      key={collectible.id}
                      className={`bg-white/70 rounded-lg p-3 shadow-md border transition-all duration-300 ${
                        collectible.collected 
                          ? "border-green-300 bg-green-50/80" 
                          : "border-gray-200 bg-gray-50/80"
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (biomeIndex * 0.3) + (index * 0.1) }}
                      data-testid={`collectible-${collectible.id}`}
                    >
                      <div className="flex items-center space-x-2">
                        {/* Compact Collectible Orb */}
                        <motion.div 
                          className={`relative w-8 h-8 rounded-full flex items-center justify-center ${
                            collectible.collected ? "opacity-100" : "opacity-40"
                          }`}
                          animate={collectible.collected ? {
                            y: [0, -4, 0],
                            scale: [1, 1.05, 1]
                          } : {}}
                          transition={collectible.collected ? {
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: index * 0.2
                          } : {}}
                        >
                          {/* Main collectible orb */}
                          <div className={`w-full h-full rounded-full ${getCollectibleStyle(collectible.biome)} border border-white shadow-sm`} />
                          
                          {/* Subtle glow effect for collected items */}
                          {collectible.collected && (
                            <motion.div
                              className={`absolute inset-0 rounded-full ${getCollectibleGlow(collectible.biome)} opacity-50`}
                              animate={{
                                scale: [1, 1.15, 1],
                                opacity: [0.3, 0.7, 0.3]
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: index * 0.15
                              }}
                            />
                          )}
                          
                          {/* Lock Overlay */}
                          {!collectible.collected && (
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                              <i className="fas fa-lock text-white text-xs"></i>
                            </div>
                          )}
                        </motion.div>

                        {/* Compact Collectible Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium text-sm mb-0.5 truncate ${
                            collectible.collected ? "text-green-800" : "text-gray-600"
                          }`}>
                            {collectible.name}
                          </h4>
                          <p className={`text-xs ${
                            collectible.collected ? "text-green-600" : "text-gray-500"
                          }`}>
                            {collectible.description}
                          </p>
                        </div>

                        {/* Compact Status Icon */}
                        <div className={`text-sm ${
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
                            <i className="far fa-circle"></i>
                          )}
                        </div>
                      </div>
                    </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-4">
                      <motion.div
                        className={`w-12 h-12 mx-auto mb-2 rounded-full ${getCollectibleStyle(biome)} opacity-20 border border-dashed border-amber-300`}
                        animate={{ 
                          scale: [1, 1.05, 1],
                          opacity: [0.15, 0.25, 0.15]
                        }}
                        transition={{ 
                          duration: 3, 
                          repeat: Infinity, 
                          ease: "easeInOut" 
                        }}
                      />
                      <p className="text-amber-600 text-xs italic">
                        Complete lessons to discover treasures!
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        </motion.div>
      </div>
    </motion.div>
  );
}