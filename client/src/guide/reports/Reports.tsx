import React, { useState } from 'react';
import { Trends } from './Trends';
import { Growth } from './Growth';
import { AuditViewer } from '../dev/AuditViewer';
import SubTabs, { type TabItem } from '../layout/SubTabs';
import { isPrivacyStrictModeEnabled } from '../../utils/featureFlags';

export function Reports() {
  const [activeTab, setActiveTab] = useState<string>('trends');
  const privacyStrictMode = isPrivacyStrictModeEnabled();

  // Filter Growth tab when privacy strict mode is enabled
  const REPORT_TABS: TabItem[] = [
    { id: 'trends', label: 'Trends' },
    ...(privacyStrictMode ? [] : [{ id: 'growth', label: 'Growth' }]),
    { id: 'audit', label: 'Audit' },
  ];

  // Reset to trends if Growth tab was selected but is now hidden
  React.useEffect(() => {
    if (privacyStrictMode && activeTab === 'growth') {
      setActiveTab('trends');
    }
  }, [privacyStrictMode, activeTab]);

  return (
    <div className="space-y-6">
      <SubTabs tabs={REPORT_TABS} value={activeTab} onChange={setActiveTab} />
      
      <div>
        {activeTab === 'trends' && <Trends />}
        {activeTab === 'growth' && !privacyStrictMode && <Growth />}
        {activeTab === 'audit' && <AuditViewer />}
      </div>
    </div>
  );
}