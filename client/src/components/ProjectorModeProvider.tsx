import React from 'react';
import { ProjectorModeContext, useProjectorModeState } from '../hooks/useProjectorMode';

interface ProjectorModeProviderProps {
  children: React.ReactNode;
}

export function ProjectorModeProvider({ children }: ProjectorModeProviderProps) {
  const projectorModeState = useProjectorModeState();
  
  return (
    <ProjectorModeContext.Provider value={projectorModeState}>
      {children}
    </ProjectorModeContext.Provider>
  );
}