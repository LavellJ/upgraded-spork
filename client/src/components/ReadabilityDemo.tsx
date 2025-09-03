import React from 'react';
import { useReadability } from '../hooks/useReadability';

/**
 * Demo component showing readability features in action
 * Only available in development mode
 */
export function ReadabilityDemo() {
  const { settings } = useReadability();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 font-readable max-line-length">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h2 className="text-scalable-xl font-semibold text-yellow-900 mb-2">
          Readability Settings Demo
        </h2>
        <p className="text-scalable text-yellow-800 mb-4">
          This component demonstrates how readability settings affect text appearance:
        </p>
        
        <div className="space-y-2 text-scalable-sm text-yellow-700">
          <div>Dyslexia Mode: <strong>{settings.dyslexiaMode ? 'Enabled' : 'Disabled'}</strong></div>
          <div>Text Scale: <strong>{Math.round(settings.textScale * 100)}%</strong></div>
          <div>Line Length Limit: <strong>{settings.maxLineLength ? 'Enabled (~65ch)' : 'Disabled'}</strong></div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-scalable-lg font-medium text-blue-900 mb-4">
          Sample Learning Content
        </h3>
        
        <div className="space-y-4">
          <p className="text-scalable text-blue-800">
            Ocean waves are created by wind moving across the water surface. The energy from the wind 
            transfers to the water, creating the rolling motion we see. This process begins when air 
            molecules collide with water molecules, transferring kinetic energy.
          </p>
          
          <p className="text-scalable text-blue-800">
            Tides, on the other hand, are caused by gravitational forces. The moon and sun pull on 
            Earth's oceans, creating a bulge of water that moves around the planet as celestial bodies 
            orbit. High tide occurs when the water bulge reaches your location.
          </p>
        </div>

        <div className="mt-6 p-4 bg-white rounded border">
          <h4 className="text-scalable font-medium text-gray-900 mb-2">
            Question: What causes ocean waves?
          </h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="radio" name="wave-cause" className="text-blue-600" />
              <span className="text-scalable-sm text-gray-700">Wind energy transferring to water</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="wave-cause" className="text-blue-600" />
              <span className="text-scalable-sm text-gray-700">Gravitational forces from the moon</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="wave-cause" className="text-blue-600" />
              <span className="text-scalable-sm text-gray-700">Underwater earthquakes</span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-scalable-lg font-medium text-green-900 mb-2">
          Instructions
        </h3>
        <ol className="list-decimal list-inside space-y-1 text-scalable text-green-800">
          <li>Press '?' to open the help panel</li>
          <li>Find the "Readability" section</li>
          <li>Toggle dyslexia mode to see enhanced letter spacing</li>
          <li>Adjust text size with the slider (90% - 130%)</li>
          <li>Enable line length limit for optimal reading width</li>
          <li>Settings persist across page reloads</li>
        </ol>
      </div>
    </div>
  );
}