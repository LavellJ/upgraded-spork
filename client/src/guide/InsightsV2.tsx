import React from 'react';
import { InsightsCard } from './InsightsCard';
import { TeacherLayoutV2 } from './teacher/TeacherLayoutV2';
import { useFlags } from '../config/flags';

interface InsightsV2Props {
  timeRange?: number;
}

export function InsightsV2({ timeRange = 30 }: InsightsV2Props) {
  const { teacherPanelV2 } = useFlags();

  const body = <InsightsCard timeRange={timeRange} />;

  return teacherPanelV2 ? (
    <TeacherLayoutV2 
      activeTab="overview" 
      onTabChange={() => {}} 
      onClose={() => {}}
      renderContent={() => (
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-fg-base">Overview</h1>
            <p className="text-fg-muted">Today at a glance</p>
          </div>
          {body}
        </div>
      )}
    />
  ) : body;
}