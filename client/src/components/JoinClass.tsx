import React, { useState, useEffect } from 'react';
import { Users, Check, ArrowLeft } from 'lucide-react';
import { findByCode } from '../roster/classes';

interface JoinClassState {
  classCode: string;
  joinedClassName: string | null;
  error: string | null;
  isLoading: boolean;
}

export function JoinClass() {
  const [state, setState] = useState<JoinClassState>({
    classCode: '',
    joinedClassName: null,
    error: null,
    isLoading: false
  });

  // Check if we have a previously joined class
  useEffect(() => {
    const lastClassCode = localStorage.getItem('qi.lastClassCode');
    if (lastClassCode) {
      const userId = 'local-1'; // TODO: Get from user context
      const classInfo = findByCode(userId, lastClassCode);
      if (classInfo) {
        setState(prev => ({ ...prev, joinedClassName: classInfo.name }));
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.classCode.trim()) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const userId = 'local-1'; // TODO: Get from user context
      const classInfo = findByCode(userId, state.classCode.toUpperCase());
      
      if (classInfo) {
        // Save the class code locally
        localStorage.setItem('qi.lastClassCode', state.classCode.toUpperCase());
        localStorage.setItem('qi.lastClassName', classInfo.name);
        
        setState(prev => ({
          ...prev,
          joinedClassName: classInfo.name,
          error: null,
          isLoading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: 'Class code not found. Please check the code and try again.',
          isLoading: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Something went wrong. Please try again.',
        isLoading: false
      }));
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleReset = () => {
    localStorage.removeItem('qi.lastClassCode');
    localStorage.removeItem('qi.lastClassName');
    setState({
      classCode: '',
      joinedClassName: null,
      error: null,
      isLoading: false
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Join a Class</h1>
          <p className="text-gray-600">
            Enter your teacher's class code to join the learning session
          </p>
        </div>

        {/* Success State */}
        {state.joinedClassName && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-green-800">Joined Successfully!</h3>
                <p className="text-sm text-green-700">
                  You're now part of <strong>{state.joinedClassName}</strong>
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleBack}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
                data-testid="button-continue"
              >
                Continue Learning
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-green-300 text-green-700 rounded-md hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                data-testid="button-change-class"
              >
                Change Class
              </button>
            </div>
          </div>
        )}

        {/* Join Form */}
        {!state.joinedClassName && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="class-code" className="block text-sm font-medium text-gray-700 mb-2">
                  Class Code
                </label>
                <input
                  id="class-code"
                  type="text"
                  value={state.classCode}
                  onChange={(e) => setState(prev => ({ ...prev, classCode: e.target.value.toUpperCase() }))}
                  placeholder="Enter 6-character code (e.g., ABC234)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-wider uppercase"
                  maxLength={6}
                  data-testid="input-class-code"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ask your teacher for the class code
                </p>
              </div>

              {/* Error Message */}
              {state.error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-700">{state.error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!state.classCode.trim() || state.isLoading}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                data-testid="button-join-class"
              >
                {state.isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Joining...
                  </div>
                ) : (
                  'Join Class'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Learning
          </button>
        </div>
      </div>
    </div>
  );
}