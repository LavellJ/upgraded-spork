import { useTimeOfDay } from "@/hooks/useTimeOfDay";
import { Link, useLocation } from "wouter";

export function FloatingNavigation() {
  const timeOfDay = useTimeOfDay();
  const [location] = useLocation();

  const getTimeIcon = () => {
    switch (timeOfDay) {
      case "morning":
        return "fas fa-sun text-warm-orange";
      case "afternoon":
        return "fas fa-sun text-warm-orange";
      case "evening":
        return "fas fa-moon text-soft-purple";
      default:
        return "fas fa-sun text-warm-orange";
    }
  };

  const getTimeLabel = () => {
    return timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1);
  };

  return (
    <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 floating-ui rounded-2xl px-6 py-3" data-testid="floating-navigation">
      <div className="flex items-center space-x-6">
        <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
          <div className="w-8 h-8 bg-gradient-to-br from-sunset-orange to-warm-orange rounded-lg flex items-center justify-center">
            <i className="fas fa-graduation-cap text-white text-sm"></i>
          </div>
          <span className="font-display font-semibold text-white">LearnOz</span>
        </Link>
        
        <div className="hidden md:flex items-center space-x-4 text-sm">
          <Link 
            href="/quest-island" 
            className={`transition-colors duration-300 ${location === "/quest-island" ? "text-white" : "text-white/80 hover:text-white"}`}
            data-testid="link-quest-island"
          >
            Quest Island
          </Link>
          <Link 
            href="/progress" 
            className={`transition-colors duration-300 ${location === "/progress" ? "text-white" : "text-white/80 hover:text-white"}`}
            data-testid="link-progress"
          >
            Progress
          </Link>
          <button className="text-white/80 hover:text-white transition-colors duration-300" data-testid="button-settings">
            Settings
          </button>
        </div>
        
        {/* Time of Day Indicator */}
        <div className="flex items-center space-x-2 text-white/80" data-testid="time-indicator">
          <i className={getTimeIcon()}></i>
          <span className="text-xs" data-testid="text-time-label">{getTimeLabel()}</span>
        </div>
      </div>
    </nav>
  );
}
