import React, { useState } from 'react';
import { Download, Settings, Plus, BarChart3 } from 'lucide-react';
import { GuideShell } from './GuideShell';
import { PageHeader } from './PageHeader';
import { SubTabs } from './SubTabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

export function LayoutDemo() {
  const [activeTab, setActiveTab] = useState('insights');

  const tabs = [
    { id: 'insights', label: 'Insights', badge: '3' },
    { id: 'reports', label: 'Reports' },
    { id: 'assignments', label: 'Assignments', badge: '12' },
    { id: 'learners', label: 'Learners', badge: '24' },
    { id: 'classes', label: 'Classes' },
    { id: 'settings', label: 'Settings' }
  ];

  const actions = [
    {
      label: 'Export Data',
      icon: Download,
      onClick: () => console.log('Export clicked'),
      variant: 'outline' as const
    },
    {
      label: 'Add Assignment',
      icon: Plus,
      onClick: () => console.log('Add clicked'),
      variant: 'default' as const
    },
    {
      label: 'Generate Report',
      icon: BarChart3,
      onClick: () => console.log('Report clicked'),
      variant: 'secondary' as const
    },
    {
      label: 'Settings',
      icon: Settings,
      onClick: () => console.log('Settings clicked'),
      variant: 'ghost' as const
    }
  ];

  const breadcrumbs = [
    { label: 'Dashboard', onClick: () => console.log('Dashboard') },
    { label: 'Teacher Panel', onClick: () => console.log('Teacher Panel') },
    { label: 'Current Section' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'insights':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Progress</CardTitle>
                <CardDescription>Overall class performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand">78%</div>
                <p className="text-sm text-fg-muted">Average completion rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Active Learners</CardTitle>
                <CardDescription>Students engaged this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-positive">24</div>
                <p className="text-sm text-fg-muted">Out of 28 students</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Assignments Due</CardTitle>
                <CardDescription>Upcoming deadlines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">5</div>
                <p className="text-sm text-fg-muted">Due this week</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'reports':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Progress Reports</CardTitle>
              <CardDescription>Detailed analytics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-fg-muted">Report generation and analysis tools would go here.</p>
            </CardContent>
          </Card>
        );
      case 'assignments':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Assignment Management</CardTitle>
              <CardDescription>Create and manage student assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-fg-muted">Assignment creation and tracking interface would go here.</p>
            </CardContent>
          </Card>
        );
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>{tabs.find(t => t.id === activeTab)?.label}</CardTitle>
              <CardDescription>Section content</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-fg-muted">Content for {activeTab} section would go here.</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <GuideShell>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Teacher Dashboard"
          subtitle="Manage your classroom and track student progress"
          breadcrumbs={breadcrumbs}
          actions={actions}
        />

        {/* Sub Navigation */}
        <SubTabs
          items={tabs}
          activeId={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Content Area */}
        <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
          {renderContent()}
        </div>
      </div>
    </GuideShell>
  );
}