import React, { useState, useEffect, useRef } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { useProfile } from '../profile/context';
import { AVATARS, type AvatarId } from '../assets/ui/avatars';
import { getCleanNameOrFallback, containsProfanity } from './profanityFilter';
import { track } from '../telemetry/events';
import type { AgeBand } from '../profile/model';

interface OnboardingProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'welcome' | 'avatar' | 'name' | 'age' | 'settings';

export function Onboarding({ open, onClose }: OnboardingProps) {
  const { profile, updateProfile } = useProfile();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState('');
  const [selectedAge, setSelectedAge] = useState<AgeBand | null>(null);
  
  // Focus management
  const mainHeadingRef = useRef<HTMLHeadingElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  
  // Focus the main heading when step changes
  useEffect(() => {
    if (open && mainHeadingRef.current) {
      mainHeadingRef.current.focus();
    }
  }, [currentStep, open]);

  // Track onboarding start
  useEffect(() => {
    if (open && currentStep === 'welcome') {
      track('onboarding_start', { 
        timestamp: new Date().toISOString()
      });
    }
  }, [open]);

  const handleNext = () => {
    switch (currentStep) {
      case 'welcome':
        setCurrentStep('avatar');
        break;
      case 'avatar':
        if (selectedAvatar) {
          updateProfile({ avatarId: selectedAvatar });
          setCurrentStep('name');
        }
        break;
      case 'name':
        const cleanName = getCleanNameOrFallback(nameInput);
        if (containsProfanity(nameInput) && nameInput.trim()) {
          setNameError('Please choose a different name');
          return;
        }
        updateProfile({ name: cleanName });
        setCurrentStep('age');
        break;
      case 'age':
        if (selectedAge) {
          updateProfile({ ageBand: selectedAge });
          setCurrentStep('settings');
        }
        break;
      case 'settings':
        // Final save and close
        updateProfile({ 
          calmMode: true, 
          reducedMotion: true 
        });
        // Track onboarding completion
        track('onboarding_complete', {
          completedAt: new Date().toISOString(),
          finalProfile: {
            hasName: !!nameInput || !!getCleanNameOrFallback(nameInput),
            ageBand: selectedAge,
            avatarId: selectedAvatar
          }
        });
        onClose();
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'avatar':
        setCurrentStep('welcome');
        break;
      case 'name':
        setCurrentStep('avatar');
        break;
      case 'age':
        setCurrentStep('name');
        break;
      case 'settings':
        setCurrentStep('age');
        break;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'welcome':
        return true;
      case 'avatar':
        return !!selectedAvatar;
      case 'name':
        return true; // We handle fallback in handleNext
      case 'age':
        return !!selectedAge;
      case 'settings':
        return true;
      default:
        return false;
    }
  };

  const getStepNumber = () => {
    const steps = ['welcome', 'avatar', 'name', 'age', 'settings'];
    return steps.indexOf(currentStep) + 1;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">🌟</div>
            <h1 ref={mainHeadingRef} tabIndex={-1} className="text-2xl font-bold text-gray-800">
              Welcome to Quest Island!
            </h1>
            <p className="text-gray-600 text-lg">
              Let's set up your learning adventure. This will only take a minute!
            </p>
            <div className="text-sm text-gray-500">
              Step {getStepNumber()} of 5
            </div>
          </div>
        );

      case 'avatar':
        return (
          <div className="space-y-4">
            <h2 ref={mainHeadingRef} tabIndex={-1} className="text-xl font-bold text-gray-800 text-center">
              Choose Your Avatar
            </h2>
            <p className="text-gray-600 text-center">
              Pick an avatar that represents you!
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={`p-4 rounded-lg border-2 text-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    selectedAvatar === avatar.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  data-testid={`avatar-${avatar.id}`}
                  aria-pressed={selectedAvatar === avatar.id}
                  aria-describedby={`avatar-${avatar.id}-desc`}
                >
                  <div className="text-3xl mb-2">{avatar.emoji}</div>
                  <div className="font-medium text-sm">{avatar.name}</div>
                  <div id={`avatar-${avatar.id}-desc`} className="text-xs text-gray-500 mt-1">
                    {avatar.description}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="text-sm text-gray-500 text-center">
              Step {getStepNumber()} of 5
            </div>
          </div>
        );

      case 'name':
        return (
          <div className="space-y-4">
            <h2 ref={mainHeadingRef} tabIndex={-1} className="text-xl font-bold text-gray-800 text-center">
              What should we call you?
            </h2>
            <p className="text-gray-600 text-center">
              Enter your name or nickname
            </p>
            
            <div className="space-y-2">
              <label htmlFor="learner-name-input" className="block text-sm font-medium text-gray-700">
                Name or Nickname
              </label>
              <input
                ref={firstInputRef}
                id="learner-name-input"
                type="text"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  setNameError('');
                }}
                placeholder="Enter your name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="input-name"
                maxLength={20}
              />
              {nameError && (
                <div className="text-red-600 text-sm" role="alert">
                  {nameError}
                </div>
              )}
              <div className="text-xs text-gray-500">
                If you don't enter a name, we'll call you "Explorer"
              </div>
            </div>
            
            <div className="text-sm text-gray-500 text-center">
              Step {getStepNumber()} of 5
            </div>
          </div>
        );

      case 'age':
        return (
          <div className="space-y-4">
            <h2 ref={mainHeadingRef} tabIndex={-1} className="text-xl font-bold text-gray-800 text-center">
              How old are you?
            </h2>
            <p className="text-gray-600 text-center">
              This helps us choose the right learning activities
            </p>
            
            <div className="space-y-2">
              <fieldset>
                <legend className="text-sm font-medium text-gray-700 mb-3">
                  Select your age group
                </legend>
                <div className="space-y-2">
                  {([
                    { value: '5-6' as AgeBand, label: '5-6 years old' },
                    { value: '7-8' as AgeBand, label: '7-8 years old' },
                    { value: '9-10' as AgeBand, label: '9-10 years old' },
                    { value: '11-12' as AgeBand, label: '11-12 years old' }
                  ]).map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="age-band"
                        value={option.value}
                        checked={selectedAge === option.value}
                        onChange={(e) => setSelectedAge(e.target.value as AgeBand)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        data-testid={`age-${option.value}`}
                      />
                      <span className="text-sm font-medium">{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            
            <div className="text-sm text-gray-500 text-center">
              Step {getStepNumber()} of 5
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-3">✨</div>
              <h2 ref={mainHeadingRef} tabIndex={-1} className="text-xl font-bold text-gray-800">
                You're all set!
              </h2>
              <p className="text-gray-600">
                We've enabled Calm Mode for a peaceful learning experience
              </p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h3 className="text-sm font-medium text-purple-800 mb-3">
                Learning Preferences
              </h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={true}
                    readOnly
                    className="w-4 h-4 text-purple-600 rounded"
                    data-testid="checkbox-calm-mode-final"
                  />
                  <div>
                    <div className="text-sm font-medium text-purple-800">Calm Mode</div>
                    <div className="text-xs text-purple-600">Gentle animations and peaceful sounds</div>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={true}
                    readOnly
                    className="w-4 h-4 text-purple-600 rounded"
                    data-testid="checkbox-reduced-motion-final"
                  />
                  <div>
                    <div className="text-sm font-medium text-purple-800">Reduced Motion</div>
                    <div className="text-xs text-purple-600">Minimal movement for comfort</div>
                  </div>
                </label>
              </div>
              <div className="text-xs text-purple-600 mt-3">
                You can change these settings anytime in the Guide panel
              </div>
            </div>
            
            <div className="text-sm text-gray-500 text-center">
              Step {getStepNumber()} of 5
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!open) return null;

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div
        className="p-6 max-w-md mx-auto"
        role="dialog"
        aria-labelledby="onboarding-title"
        aria-modal="true"
        onKeyDown={handleKeyDown}
      >
        <div className="space-y-6">
          {renderStepContent()}
          
          <div className="flex gap-3 pt-4">
            {currentStep !== 'welcome' && (
              <button
                onClick={handleBack}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                data-testid="button-back"
              >
                Back
              </button>
            )}
            
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex-1 px-4 py-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                canProceed()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              data-testid="button-next"
            >
              {currentStep === 'settings' ? 'Start Learning!' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}