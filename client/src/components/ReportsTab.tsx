import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Calendar, Download, FileText, Users, TrendingUp, Mail } from 'lucide-react';
import { buildWeeklyEngagement, downloadWeeklyEngagementCSV } from '../analytics/weeklyEngagement';
import { Trends } from '../guide/reports/Trends';
import { ParentEmail } from '../reports/parentEmail';

type ReportView = 'overview' | 'trends' | 'weekly' | 'parent-email';

export function ReportsTab() {
  const [currentView, setCurrentView] = useState<ReportView>('overview');
  const [selectedWeek, setSelectedWeek] = useState(() => {
    // Default to current week's Monday
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    return monday.toISOString().split('T')[0];
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<ReturnType<typeof buildWeeklyEngagement> | null>(null);

  const handleGeneratePreview = () => {
    try {
      const data = buildWeeklyEngagement(selectedWeek);
      setPreviewData(data);
    } catch (error) {
      console.error('Failed to generate preview:', error);
      alert('Failed to generate preview. Please try again.');
    }
  };

  const handleDownloadCSV = async () => {
    try {
      setIsGenerating(true);
      downloadWeeklyEngagementCSV(selectedWeek);
    } catch (error) {
      console.error('Failed to download CSV:', error);
      alert('Failed to download CSV. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatWeekRange = (weekStartISO: string) => {
    const start = new Date(weekStartISO);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  // Render the trends view if selected
  if (currentView === 'trends') {
    return <Trends onClose={() => setCurrentView('overview')} />;
  }

  // Render the parent email view if selected
  if (currentView === 'parent-email') {
    return <ParentEmail onClose={() => setCurrentView('overview')} />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Reports
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Analytics and data exports for your classes
          </p>
        </div>
        
        {currentView === 'overview' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView('trends')}
              className="flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Cohort Trends
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView('parent-email')}
              className="flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Parent Email
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView('weekly')}
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Weekly Export
            </Button>
          </div>
        )}
      </div>

      {/* Overview Cards */}
      {currentView === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView('trends')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Cohort Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Multi-week learning analytics with accessible charts and CSV exports. 
                Track engagement, completion rates, and learning streaks across your classes.
              </p>
              <div className="mt-3 flex items-center text-sm text-blue-600">
                <span>View trends →</span>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView('parent-email')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="w-5 h-5 text-purple-600" />
                Parent Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Send weekly learning summaries to parents via email or generate 
                printable HTML reports. Includes progress, accomplishments, and next steps.
              </p>
              <div className="mt-3 flex items-center text-sm text-blue-600">
                <span>Send summaries →</span>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView('weekly')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
                Weekly Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Export detailed learner engagement data for specific weeks. 
                Perfect for weekly reporting and parent communications.
              </p>
              <div className="mt-3 flex items-center text-sm text-blue-600">
                <span>Export data →</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Weekly Engagement Section */}
      {currentView === 'weekly' && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Engagement Export</h3>
            <Button variant="ghost" size="sm" onClick={() => setCurrentView('overview')}>
              ← Back to Reports
            </Button>
          </div>

          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Select Week
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="week-picker" className="block text-sm font-medium text-gray-700 mb-2">
                  Week Starting (Monday)
                </label>
                <input
                  id="week-picker"
                  type="date"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  data-testid="week-picker"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Week range: {formatWeekRange(selectedWeek)}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleGeneratePreview}
                  variant="outline"
                  className="flex items-center gap-2"
                  data-testid="generate-preview"
                >
                  <Users className="w-4 h-4" />
                  Preview Data
                </Button>

                <Button
                  onClick={handleDownloadCSV}
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                  data-testid="download-csv"
                >
                  <Download className="w-4 h-4" />
                  {isGenerating ? 'Generating...' : 'Download CSV'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {previewData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Preview</CardTitle>
                <p className="text-sm text-gray-600">
                  {previewData.length} learner(s) for week of {formatWeekRange(selectedWeek)}
                </p>
              </CardHeader>
              <CardContent>
                {previewData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No learners found for this time period</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-2 font-medium">Learner</th>
                          <th className="text-center p-2 font-medium">Minutes</th>
                          <th className="text-center p-2 font-medium">Sessions</th>
                          <th className="text-center p-2 font-medium">Return 7d</th>
                          <th className="text-center p-2 font-medium">Assignments Done</th>
                          <th className="text-center p-2 font-medium">Due Soon</th>
                          <th className="text-center p-2 font-medium">Overdue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, index) => (
                          <tr key={row.learnerId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                            <td className="p-2 font-medium">{row.learnerName}</td>
                            <td className="p-2 text-center">{row.minutes}</td>
                            <td className="p-2 text-center">{row.sessions}</td>
                            <td className="p-2 text-center">
                              <span className={`px-2 py-1 rounded text-xs ${
                                row.return7d 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {row.return7d ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td className="p-2 text-center">{row.assignmentsDone}</td>
                            <td className="p-2 text-center">
                              {row.dueSoon > 0 && (
                                <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                                  {row.dueSoon}
                                </span>
                              )}
                              {row.dueSoon === 0 && <span className="text-gray-400">0</span>}
                            </td>
                            <td className="p-2 text-center">
                              {row.overdue > 0 && (
                                <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                                  {row.overdue}
                                </span>
                              )}
                              {row.overdue === 0 && <span className="text-gray-400">0</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Data Description */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg text-blue-900">Report Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <h4 className="font-semibold mb-2">Engagement Metrics</h4>
                  <ul className="space-y-1 text-xs">
                    <li><strong>Minutes:</strong> Total active learning time</li>
                    <li><strong>Sessions:</strong> Number of distinct learning sessions</li>
                    <li><strong>Return 7d:</strong> Did learner return within 7 days</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Assignment Tracking</h4>
                  <ul className="space-y-1 text-xs">
                    <li><strong>Assignments Done:</strong> Completed this week</li>
                    <li><strong>Due Soon:</strong> Due in next 7 days</li>
                    <li><strong>Overdue:</strong> Past due date</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}