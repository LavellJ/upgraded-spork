import React, { useState, useEffect } from 'react';
import { HeroLessonRunner } from './HeroLessonRunner';
import { validateHeroActivity } from '../authoring/heroSchema';
import { Button } from '../components/ui/button';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

interface HeroLessonLoaderProps {
  packId: string;
  lessonId: string;
  onComplete: (results: any) => void;
  onExit: () => void;
}

/**
 * HeroLessonLoader: Loads and validates hero lesson content packs
 * - Fetches lesson JSON from content pack
 * - Validates lesson structure against hero schema
 * - Handles loading states and error recovery
 * - Provides fallback UI for missing assets
 */
export function HeroLessonLoader({ packId, lessonId, onComplete, onExit }: HeroLessonLoaderProps) {
  const [lessonData, setLessonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    loadLesson();
  }, [packId, lessonId]);

  const loadLesson = async () => {
    setLoading(true);
    setError(null);
    setValidationErrors([]);

    try {
      // Construct lesson URL from pack structure
      const lessonUrl = `/packs/${packId}/lessons/${lessonId}.json`;
      
      // Fetch lesson JSON
      const response = await fetch(lessonUrl);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError(`Lesson not found: ${packId}/${lessonId}`);
        } else {
          setError(`Failed to load lesson: ${response.status} ${response.statusText}`);
        }
        return;
      }

      const rawData = await response.json();

      // Validate lesson structure
      if (rawData.version !== 2) {
        setError(`Unsupported lesson version: ${rawData.version}. Expected version 2.`);
        return;
      }

      // Validate each activity against hero schema
      const activityErrors: string[] = [];
      const validatedActivities = [];

      for (let i = 0; i < rawData.activities.length; i++) {
        const activity = rawData.activities[i];
        const validation = validateHeroActivity(activity, `Activity ${i + 1}`);
        
        if (!validation.success) {
          activityErrors.push(...validation.errors);
        } else {
          validatedActivities.push(validation.data);
        }
      }

      if (activityErrors.length > 0) {
        setValidationErrors(activityErrors);
        setError('Lesson contains invalid activities. Please check the structure.');
        return;
      }

      // Replace activities with validated ones
      const validatedLesson = {
        ...rawData,
        activities: validatedActivities
      };

      setLessonData(validatedLesson);

    } catch (err) {
      console.error('Failed to load hero lesson:', err);
      setError(`Failed to load lesson: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadLesson();
  };

  // Loading state
  if (loading) {
    return (
      <div 
        className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4"
        data-testid="hero-lesson-loading"
      >
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Lesson</h2>
          <p className="text-gray-600">
            Preparing your learning experience...
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Pack: {packId} • Lesson: {lessonId}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || validationErrors.length > 0) {
    return (
      <div 
        className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4"
        data-testid="hero-lesson-error"
      >
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-2xl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Unable to Load Lesson
          </h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-medium mb-2">Error:</p>
              <p className="text-red-700" data-testid="error-message">{error}</p>
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 font-medium mb-2">Validation Errors:</p>
              <ul className="text-left text-yellow-700 text-sm space-y-1">
                {validationErrors.map((validationError, index) => (
                  <li key={index} data-testid={`validation-error-${index}`}>
                    • {validationError}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-sm text-gray-600 mb-6">
            <p>Pack: <code className="bg-gray-100 px-2 py-1 rounded">{packId}</code></p>
            <p>Lesson: <code className="bg-gray-100 px-2 py-1 rounded">{lessonId}</code></p>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="retry-button"
            >
              Try Again
            </Button>
            
            <Button
              onClick={onExit}
              variant="outline"
              data-testid="exit-button"
            >
              <ArrowLeft size={16} className="mr-2" />
              Go Back
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-gray-600 font-medium">
                Developer Details
              </summary>
              <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-3 rounded font-mono">
                <p>Expected URL: {window.location.origin}/packs/{packId}/lessons/{lessonId}.json</p>
                <p>Check that:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>The content pack exists at /packs/{packId}/</li>
                  <li>The lesson file {lessonId}.json exists</li>
                  <li>All activities follow the hero lesson schema</li>
                  <li>Media assets are accessible</li>
                </ul>
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }

  // Success: render the lesson
  if (lessonData) {
    return (
      <HeroLessonRunner
        lessonData={lessonData}
        onComplete={onComplete}
        onExit={onExit}
      />
    );
  }

  // Should not reach here, but fallback
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Unexpected state. Please refresh the page.</p>
    </div>
  );
}