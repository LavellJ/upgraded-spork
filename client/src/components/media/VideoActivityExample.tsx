import React, { useState } from 'react';
import { ActivityPlayer } from '../ActivityPlayer';
import type { VideoActivity } from '../../schema/lesson';

// Example video activity data demonstrating the schema structure
const exampleVideoActivity: VideoActivity = {
  kind: 'video',
  title: 'Ocean Waves and Tides',
  src: 'https://example.com/videos/ocean-waves.mp4',
  type: 'video/mp4',
  captions: [
    {
      src: 'https://example.com/captions/ocean-waves-en.vtt',
      srclang: 'en',
      label: 'English',
      default: true
    },
    {
      src: 'https://example.com/captions/ocean-waves-es.vtt',
      srclang: 'es',
      label: 'Español'
    }
  ],
  transcript: {
    text: `In this video, we explore the fascinating world of ocean waves and tides.

Ocean waves are created by wind moving across the water surface. The energy from the wind transfers to the water, creating the rolling motion we see.

Tides, on the other hand, are caused by the gravitational pull of the moon and sun on Earth's oceans. As the moon orbits Earth, it creates a bulge of water that follows it around the planet.

High tide occurs when the water bulge is at your location, while low tide happens when the bulge is on the opposite side of Earth.

This natural rhythm of tides affects marine life, coastal ecosystems, and human activities near the ocean.`
  }
};

// Example component showing how to use the ActivityPlayer with a video activity
export function VideoActivityExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-4">
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Open Video Activity
      </button>

      <ActivityPlayer
        open={isOpen}
        onClose={() => setIsOpen(false)}
        biome="ocean"
        lesson={{ id: 'ocean-waves-001', title: 'Ocean Waves and Tides' }}
        activity={exampleVideoActivity}
        onMarkComplete={(id, outcome) => {
          console.log(`Lesson ${id} completed with outcome: ${outcome}`);
        }}
        protoOnly={false}
      />
    </div>
  );
}