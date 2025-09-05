import React from 'react';
import { useLocation } from 'wouter';
import { HeroLessonLoader } from '../lesson/HeroLessonLoader';

/**
 * Demo page to showcase the Hero Lesson system
 */
export function HeroLessonDemo() {
  const [, setLocation] = useLocation();

  const handleComplete = (results: any) => {
    console.log('Lesson completed with results:', results);
    
    // Show completion message and redirect
    alert(`Great job! You completed the lesson with a score of ${Math.round(results.score * 100)}%\nTime spent: ${Math.round(results.timeSpent / 60)} minutes`);
    
    // Navigate back to the demo selection
    setLocation('/hero-demo');
  };

  const handleExit = () => {
    setLocation('/hero-demo');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <HeroLessonLoader
        packId="core-math-hero"
        lessonId="hero_fractions_numberline"
        onComplete={handleComplete}
        onExit={handleExit}
      />
    </div>
  );
}

/**
 * Hero Lesson Demo Selection Page
 */
export function HeroLessonDemoIndex() {
  const [, setLocation] = useLocation();

  const startDemo = () => {
    setLocation('/hero-demo/lesson');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎯 Hero Lesson Demo
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Experience LearnOz's production-ready hero lesson system
          </p>
        </div>

        {/* Demo Lesson Card */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 mb-8 border-2 border-orange-200">
          <div className="flex items-center justify-center mb-4">
            <div className="text-4xl mr-4">📊</div>
            <div>
              <h3 className="text-xl font-bold text-orange-900">Unit Fractions on a Number Line</h3>
              <p className="text-orange-700">Year 3-4 Mathematics • Australian Curriculum</p>
            </div>
          </div>
          
          <div className="text-sm text-orange-800 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Duration:</strong> ~5 minutes
              </div>
              <div>
                <strong>Activities:</strong> 4 blocks
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Video Instruction</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Guided Practice</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">Independent Practice</span>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">Exit Ticket</span>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="text-center p-4">
            <div className="text-2xl mb-2">🧭</div>
            <h4 className="font-semibold text-gray-800">Scout AI Guide</h4>
            <p className="text-sm text-gray-600">Contextual encouragement and guidance</p>
          </div>
          
          <div className="text-center p-4">
            <div className="text-2xl mb-2">📈</div>
            <h4 className="font-semibold text-gray-800">Smart Branching</h4>
            <p className="text-sm text-gray-600">Adaptive responses to common errors</p>
          </div>
          
          <div className="text-center p-4">
            <div className="text-2xl mb-2">🎯</div>
            <h4 className="font-semibold text-gray-800">Compass Routing</h4>
            <p className="text-sm text-gray-600">Personalized next-step recommendations</p>
          </div>
          
          <div className="text-center p-4">
            <div className="text-2xl mb-2">📊</div>
            <h4 className="font-semibf text-gray-800">Rich Analytics</h4>
            <p className="text-sm text-gray-600">Comprehensive learning insights</p>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={startDemo}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg transform transition-all duration-200 hover:scale-105"
        >
          🚀 Start Hero Lesson
        </button>

        <div className="mt-6 text-sm text-gray-500">
          <p>This demo showcases the complete hero lesson experience with all production features enabled.</p>
        </div>
      </div>
    </div>
  );
}