import { useState } from "react";

interface BreakActivity {
  id: string;
  name: string;
  description: string;
  duration: string;
  icon: string;
  color: string;
}

const breakActivities: BreakActivity[] = [
  {
    id: "breathing",
    name: "Deep Breathing",
    description: "Follow the gentle rhythm of nature with guided breathing exercises set against peaceful landscapes.",
    duration: "3-5 minutes",
    icon: "fas fa-wind",
    color: "from-sky-blue to-accent-teal",
  },
  {
    id: "movement",
    name: "Gentle Movement",
    description: "Simple stretches and movements to refresh your body and mind, animated by flowing natural elements.",
    duration: "5-7 minutes",
    icon: "fas fa-walking",
    color: "from-success-green to-accent-teal",
  },
  {
    id: "mindfulness",
    name: "Mindful Moments",
    description: "Connect with the present moment through guided awareness exercises in serene digital environments.",
    duration: "2-4 minutes",
    icon: "fas fa-leaf",
    color: "from-soft-purple to-deep-purple",
  },
];

interface BreakActivitiesProps {
  onActivitySelect?: (activityId: string) => void;
}

export function BreakActivities({ onActivitySelect }: BreakActivitiesProps) {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  const handleActivitySelect = (activityId: string) => {
    setSelectedActivity(activityId);
    if (onActivitySelect) {
      onActivitySelect(activityId);
    }
  };

  return (
    <div className="max-w-6xl mx-auto text-center" data-testid="break-activities">
      <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6" data-testid="text-break-title">
        Mindful
        <span className="bg-gradient-to-r from-accent-teal to-sky-blue bg-clip-text text-transparent">
          {" "}Breaks
        </span>
      </h2>
      <p className="text-xl text-white/80 mb-16 max-w-3xl mx-auto" data-testid="text-break-description">
        Restore your focus with guided break activities designed to refresh your mind and enhance learning retention.
      </p>
      
      {/* Break Activity Cards */}
      <div className="grid md:grid-cols-3 gap-8" data-testid="activity-cards">
        {breakActivities.map((activity) => (
          <div
            key={activity.id}
            className={`floating-ui rounded-3xl p-8 hover:scale-105 transition-all duration-500 cursor-pointer ${
              selectedActivity === activity.id ? 'ring-2 ring-accent-teal' : ''
            }`}
            onClick={() => handleActivitySelect(activity.id)}
            data-testid={`card-activity-${activity.id}`}
          >
            <div className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br ${activity.color} flex items-center justify-center animate-pulse-soft`}>
              <i className={`${activity.icon} text-white text-2xl`} data-testid={`icon-${activity.id}`}></i>
            </div>
            <h3 className="font-display text-xl font-semibold text-white mb-4" data-testid={`text-activity-name-${activity.id}`}>
              {activity.name}
            </h3>
            <p className="text-white/70 text-sm mb-6" data-testid={`text-activity-description-${activity.id}`}>
              {activity.description}
            </p>
            <div className="text-white/60 text-xs" data-testid={`text-activity-duration-${activity.id}`}>
              {activity.duration}
            </div>
            
            {selectedActivity === activity.id && (
              <div className="mt-4" data-testid={`selected-indicator-${activity.id}`}>
                <button className="bg-gradient-to-r from-accent-teal to-sky-blue text-white px-6 py-2 rounded-lg text-sm hover:scale-105 transition-all duration-300">
                  <i className="fas fa-play mr-2"></i>
                  Start Activity
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
