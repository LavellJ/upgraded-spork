import React, { useState } from 'react';
import { srtToVtt, downloadVtt } from '../../tools/captions';

// Sample SRT content for demonstration
const sampleSrt = `1
00:00:00,000 --> 00:00:03,500
Welcome to our lesson on ocean waves and tides.

2
00:00:03,500 --> 00:00:08,000
Ocean waves are created by wind moving across the water surface.

3
00:00:08,000 --> 00:00:12,500
The energy from the wind transfers to the water, creating the rolling motion we see.

4
00:00:12,500 --> 00:00:17,000
Tides, on the other hand, are caused by gravitational forces.`;

/**
 * Development component demonstrating SRT to VTT conversion
 * Only available in development mode
 */
export function SrtToVttDemo() {
  const [srtInput, setSrtInput] = useState(sampleSrt);
  const [vttOutput, setVttOutput] = useState('');

  const handleConvert = () => {
    try {
      const converted = srtToVtt(srtInput);
      setVttOutput(converted);
    } catch (error) {
      console.error('Conversion error:', error);
    }
  };

  const handleDownload = () => {
    if (vttOutput) {
      downloadVtt(vttOutput, 'converted-captions');
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">SRT to VTT converter is only available in development mode.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">SRT to VTT Converter</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SRT Input */}
        <div className="space-y-2">
          <label htmlFor="srt-input" className="block text-sm font-medium text-gray-700">
            SRT Input
          </label>
          <textarea
            id="srt-input"
            value={srtInput}
            onChange={(e) => setSrtInput(e.target.value)}
            className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Paste SRT content here..."
          />
        </div>

        {/* VTT Output */}
        <div className="space-y-2">
          <label htmlFor="vtt-output" className="block text-sm font-medium text-gray-700">
            WebVTT Output
          </label>
          <textarea
            id="vtt-output"
            value={vttOutput}
            readOnly
            className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50"
            placeholder="Converted VTT will appear here..."
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={handleConvert}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Convert SRT to VTT
        </button>
        
        {vttOutput && (
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Download VTT File
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">How to use:</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Paste your SRT content in the left textarea</li>
          <li>Click "Convert SRT to VTT" to process the content</li>
          <li>The WebVTT format will appear in the right textarea</li>
          <li>Click "Download VTT File" to save the converted file</li>
          <li>Use the downloaded .vtt file in your video captions</li>
        </ol>
      </div>
    </div>
  );
}