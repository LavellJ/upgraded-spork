import { useState, useEffect } from 'react';

export function HealthBadge() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        setIsHealthy(response.ok);
      } catch (error) {
        setIsHealthy(false);
      }
    };

    checkHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isHealthy === null) {
    return <span className="text-gray-500">⏳</span>;
  }

  return (
    <span 
      className={`text-sm ${isHealthy ? 'text-green-600' : 'text-red-600'}`}
      title={isHealthy ? 'API is healthy' : 'API is down'}
      data-testid="health-badge"
    >
      {isHealthy ? '✅' : '❌'}
    </span>
  );
}