import { useState, useEffect } from "react";

export type TimeOfDay = "morning" | "afternoon" | "evening";

export function useTimeOfDay(): TimeOfDay {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("morning");

  useEffect(() => {
    const updateTimeOfDay = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) {
        setTimeOfDay("morning");
      } else if (hour >= 12 && hour < 18) {
        setTimeOfDay("afternoon");
      } else {
        setTimeOfDay("evening");
      }
    };

    updateTimeOfDay();
    const interval = setInterval(updateTimeOfDay, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return timeOfDay;
}
