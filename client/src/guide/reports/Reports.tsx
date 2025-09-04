import React, { useState } from 'react';
import { Trends } from './Trends';
import { Growth } from './Growth';
import SubTabs, { type TabItem } from '../layout/SubTabs';

const REPORT_TABS: TabItem[] = [
  { id: 'trends', label: 'Trends' },
  { id: 'growth', label: 'Growth' },
];

export function Reports() {
  const [activeTab, setActiveTab] = useState<string>('trends');

  return (
    <div className="space-y-6">
      <SubTabs tabs={REPORT_TABS} value={activeTab} onChange={setActiveTab} />
      
      <div>
        {activeTab === 'trends' && <Trends />}
        {activeTab === 'growth' && <Growth />}
      </div>
    </div>
  );
}