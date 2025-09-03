import React from 'react';
import { loadEvents } from '../progress/events';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { CheckCircle, Circle, Calendar, Users, TrendingUp } from 'lucide-react';

interface FunnelViewerProps {
  learnerId?: string;
}

const FUNNEL_STEPS = [
  { id: 'onboard', label: 'Onboarding Complete', icon: Users, color: 'bg-blue-500' },
  { id: 'first_lesson_start', label: 'First Lesson Started', icon: Circle, color: 'bg-green-500' },
  { id: 'first_lesson_finish', label: 'First Lesson Completed', icon: CheckCircle, color: 'bg-green-600' },
  { id: 'first_journal', label: 'First Journal Session', icon: Calendar, color: 'bg-purple-500' },
  { id: 'assignment_received', label: 'Assignment Received', icon: TrendingUp, color: 'bg-orange-500' },
  { id: 'three_completions', label: 'Three Lessons Completed', icon: CheckCircle, color: 'bg-emerald-600' }
];

export function FunnelViewer({ learnerId }: FunnelViewerProps) {
  const events = loadEvents(learnerId);
  const funnelEvents = events.filter(event => event.kind === 'funnel');
  
  // Calculate funnel metrics
  const completedSteps = new Set(
    funnelEvents
      .map(event => 'step' in event ? event.step : '')
      .filter((step): step is string => step !== '')
  );
  const totalUsers = 1; // For demo purposes, assuming one user
  
  const stepData = FUNNEL_STEPS.map((step, index) => {
    const isCompleted = completedSteps.has(step.id);
    const stepEvent = funnelEvents.find(event => 'step' in event && event.step === step.id);
    const completedAt = stepEvent ? new Date(stepEvent.at) : null;
    
    // Calculate conversion rate (simplified for single user)
    const conversionRate = isCompleted ? 100 : 0;
    
    return {
      ...step,
      isCompleted,
      completedAt,
      conversionRate,
      dropoffRate: 100 - conversionRate
    };
  });

  const formatTime = (date: Date | null) => {
    if (!date) return 'Not reached';
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Learning Funnel Analytics</h2>
        <p className="text-gray-600">Track key learning milestones and conversion rates</p>
      </div>

      {/* Funnel Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Funnel Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{completedSteps.size}</div>
              <div className="text-sm text-gray-600">Steps Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((completedSteps.size / FUNNEL_STEPS.length) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Overall Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{funnelEvents.length}</div>
              <div className="text-sm text-gray-600">Total Events</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funnel Steps */}
      <div className="space-y-4">
        {stepData.map((step, index) => {
          const Icon = step.icon;
          const prevStepCompleted = index === 0 || stepData[index - 1].isCompleted;
          
          return (
            <Card key={step.id} className={`transition-all duration-200 ${
              step.isCompleted ? 'border-green-200 bg-green-50' : 
              prevStepCompleted ? 'border-gray-200' : 'border-gray-100 opacity-60'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.isCompleted ? step.color : 'bg-gray-200'
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        step.isCompleted ? 'text-white' : 'text-gray-500'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{step.label}</h3>
                      <p className="text-sm text-gray-600">
                        {formatTime(step.completedAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant={step.isCompleted ? 'default' : 'secondary'}>
                      {step.isCompleted ? 'Completed' : 'Pending'}
                    </Badge>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {step.conversionRate}%
                      </div>
                      <div className="text-sm text-gray-600">conversion</div>
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${step.color}`}
                    style={{ width: `${step.conversionRate}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Raw Events */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Funnel Events</CardTitle>
        </CardHeader>
        <CardContent>
          {funnelEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No funnel events recorded yet</p>
          ) : (
            <div className="space-y-2">
              {funnelEvents.map((event, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-mono text-sm">
                    {'step' in event ? event.step : 'unknown'}
                  </span>
                  <span className="text-sm text-gray-600">
                    {new Date(event.at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}