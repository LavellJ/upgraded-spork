import React, { useState } from 'react';
import { TranscriptViewer } from './TranscriptViewer';

// Example WebVTT-style transcript with timestamps
const sampleTimestampedTranscript = {
  text: `WEBVTT

1
00:00:00.000 --> 00:00:03.500
Welcome to our lesson on ocean waves and tides.

2
00:00:03.500 --> 00:00:08.000
Ocean waves are created by wind moving across the water surface.

3
00:00:08.000 --> 00:00:12.500
The energy from the wind transfers to the water, creating the rolling motion we see.

4
00:00:12.500 --> 00:00:17.000
Tides, on the other hand, are caused by gravitational forces.

5
00:00:17.000 --> 00:00:22.000
The moon and sun pull on Earth's oceans, creating a bulge of water.

6
00:00:22.000 --> 00:00:26.500
High tide occurs when the water bulge is at your location.

7
00:00:26.500 --> 00:00:30.000
Low tide happens when the bulge is on the opposite side of Earth.`
};

// Example plain text transcript without timestamps
const samplePlainTranscript = {
  text: `This lesson explores the fascinating world of ocean waves and tides.

Ocean waves are a result of wind energy being transferred to water. As wind moves across the surface of the ocean, it creates the characteristic rolling motion that we observe.

Tides are quite different from waves. They are caused by the gravitational pull of celestial bodies, primarily the moon and the sun, on Earth's oceans.

The gravitational forces create a bulge of water that moves around the planet as the moon orbits Earth. When this bulge reaches your coastal location, you experience high tide.

Conversely, when the bulge is on the opposite side of the planet, you experience low tide. This natural rhythm affects marine ecosystems and human coastal activities.`
};

// Example component demonstrating transcript functionality
export function SampleTranscript() {
  const [showTimestamped, setShowTimestamped] = useState(false);
  const [showPlain, setShowPlain] = useState(false);

  const handleSeek = (seconds: number) => {
    console.log(`Seeking to ${seconds} seconds`);
    // In real implementation, this would control the video player
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Transcript Examples</h2>
      
      <div className="flex gap-4">
        <button 
          onClick={() => setShowTimestamped(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Timestamped Transcript
        </button>
        
        <button 
          onClick={() => setShowPlain(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Plain Text Transcript
        </button>
      </div>

      {showTimestamped && (
        <TranscriptViewer
          transcript={sampleTimestampedTranscript}
          title="Ocean Waves - Timestamped Transcript"
          onClose={() => setShowTimestamped(false)}
          onSeek={handleSeek}
        />
      )}

      {showPlain && (
        <TranscriptViewer
          transcript={samplePlainTranscript}
          title="Ocean Waves - Plain Transcript"
          onClose={() => setShowPlain(false)}
        />
      )}
    </div>
  );
}