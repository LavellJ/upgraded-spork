import React from 'react';
import { useReadability } from '../hooks/useReadability';

export function ReadabilityControls() {
  const { 
    settings, 
    toggleDyslexiaMode, 
    setTextScale, 
    toggleMaxLineLength, 
    toggleReducedMotion, 
    setCaptionTextSize,
    setCaptionBackgroundOpacity,
    setCaptionPosition,
    resetSettings 
  } = useReadability();

  const handleTextScaleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTextScale(parseFloat(event.target.value));
  };

  const formatTextScale = (scale: number) => {
    return `${Math.round(scale * 100)}%`;
  };

  return (
    <section>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-lg">📖</span>
        Readability
      </h3>
      
      <div className="space-y-4">
        {/* Dyslexia-friendly mode */}
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="dyslexia-toggle" className="font-medium text-purple-900">
              Dyslexia-friendly mode
            </label>
            <button
              id="dyslexia-toggle"
              onClick={toggleDyslexiaMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                settings.dyslexiaMode 
                  ? 'bg-purple-600' 
                  : 'bg-gray-300'
              }`}
              role="switch"
              aria-checked={settings.dyslexiaMode}
              aria-label={`${settings.dyslexiaMode ? 'Disable' : 'Enable'} dyslexia-friendly mode`}
              data-testid="toggle-dyslexia-mode"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.dyslexiaMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <p className="text-sm text-purple-700">
            Increases letter spacing, word spacing, and line height for better readability
          </p>
        </div>

        {/* Text size slider */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="mb-3">
            <label htmlFor="text-scale-slider" className="font-medium text-blue-900 block mb-2">
              Text size: {formatTextScale(settings.textScale)}
            </label>
            <input
              id="text-scale-slider"
              type="range"
              min="0.9"
              max="1.3"
              step="0.05"
              value={settings.textScale}
              onChange={handleTextScaleChange}
              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={`Text size: ${formatTextScale(settings.textScale)}`}
              data-testid="slider-text-scale"
            />
            <div className="flex justify-between text-xs text-blue-600 mt-1">
              <span>90%</span>
              <span>100%</span>
              <span>130%</span>
            </div>
          </div>
          <p className="text-sm text-blue-700">
            Adjust text size across the app for comfortable reading
          </p>
        </div>

        {/* Max line length toggle */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="line-length-toggle" className="font-medium text-green-900">
              Limit line length
            </label>
            <button
              id="line-length-toggle"
              onClick={toggleMaxLineLength}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                settings.maxLineLength 
                  ? 'bg-green-600' 
                  : 'bg-gray-300'
              }`}
              role="switch"
              aria-checked={settings.maxLineLength}
              aria-label={`${settings.maxLineLength ? 'Disable' : 'Enable'} line length limit`}
              data-testid="toggle-line-length"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.maxLineLength ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <p className="text-sm text-green-700">
            Wrap text at ~65 characters for optimal reading comfort
          </p>
        </div>

        {/* Reduced motion toggle */}
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="reduced-motion-toggle" className="font-medium text-orange-900">
              Reduce motion
            </label>
            <button
              id="reduced-motion-toggle"
              onClick={toggleReducedMotion}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                settings.reducedMotion 
                  ? 'bg-orange-600' 
                  : 'bg-gray-300'
              }`}
              role="switch"
              aria-checked={settings.reducedMotion}
              aria-label={`${settings.reducedMotion ? 'Disable' : 'Enable'} reduced motion`}
              data-testid="toggle-reduced-motion"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <p className="text-sm text-orange-700">
            Disable animations and transitions for a calmer experience
          </p>
        </div>

        {/* Caption preferences */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-lg">💬</span>
            Video Captions
          </h4>
          
          {/* Caption text size */}
          <div className="space-y-2 mb-4">
            <label className="text-sm font-medium text-gray-800">Text size</label>
            <div className="flex gap-2">
              {(['S', 'M', 'L'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setCaptionTextSize(size)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    settings.captions.textSize === size
                      ? 'bg-gray-800 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                  data-testid={`caption-size-${size.toLowerCase()}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          
          {/* Background opacity */}
          <div className="space-y-2 mb-4">
            <label htmlFor="caption-opacity" className="text-sm font-medium text-gray-800">
              Background opacity: {settings.captions.backgroundOpacity}%
            </label>
            <input
              id="caption-opacity"
              type="range"
              min="0"
              max="60"
              value={settings.captions.backgroundOpacity}
              onChange={(e) => setCaptionBackgroundOpacity(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              data-testid="caption-opacity-slider"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>0%</span>
              <span>30%</span>
              <span>60%</span>
            </div>
          </div>
          
          {/* Caption position */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-800">Position</label>
            <div className="flex gap-2">
              {([['auto', 'Auto'], ['bottom', 'Bottom']] as const).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setCaptionPosition(value)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    settings.captions.position === value
                      ? 'bg-gray-800 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                  data-testid={`caption-position-${value}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mt-3">
            Customize how video captions appear on screen
          </p>
        </div>

        {/* Reset button */}
        <div className="pt-2">
          <button
            onClick={resetSettings}
            className="text-sm text-gray-600 hover:text-gray-800 underline focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded"
            data-testid="button-reset-readability"
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </section>
  );
}