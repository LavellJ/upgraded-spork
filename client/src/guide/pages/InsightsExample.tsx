import { useState } from 'react'
import { useFlags } from '../../config/flags'
import TeacherLayout from '../teacher/Layout'
import { Card } from '../../ui2/Card'
import { Line } from '../../ui2/Skeleton'
import { DetailDrawer } from '../../ui2/DetailDrawer'
import { ActionBar } from '../../ui2/ActionBar'

type MetricCard = {
  title: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
  icon: string
}

const mockMetrics: MetricCard[] = [
  {
    title: 'Minutes on-task',
    value: '1,248',
    change: '+12% vs last week',
    trend: 'up',
    icon: '⏱️'
  },
  {
    title: 'Returns this week',
    value: '89',
    change: '+23% vs last week',
    trend: 'up',
    icon: '🔄'
  },
  {
    title: 'Due/Overdue Summary',
    value: '12/3',
    change: '3 items overdue',
    trend: 'down',
    icon: '📝'
  }
]

export default function InsightsExample(){
  const { teacherPanelV2 } = useFlags()
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeMetric, setActiveMetric] = useState<MetricCard | null>(null)
  
  // Fallback to legacy layout if flag disabled
  if (!teacherPanelV2) {
    return (
      <Card title="Insights">
        <div className="text-center py-8 text-gray-500">
          <p>Weekly insights interface will be here.</p>
          <p className="text-sm mt-2">Enable Teacher Panel v2 to see the enhanced interface.</p>
        </div>
      </Card>
    )
  }

  const getTrendColor = (trend: MetricCard['trend']) => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getTrendIcon = (trend: MetricCard['trend']) => {
    switch (trend) {
      case 'up': return '↗️'
      case 'down': return '↘️'
      default: return '→'
    }
  }

  return (
    <TeacherLayout title="Insights" subtitle="Weekly trends & engagement">
      <div className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mockMetrics.map((metric, index) => (
            <Card 
              key={metric.title}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setActiveMetric(metric)
                setDrawerOpen(true)
              }}
            >
              {loading ? (
                <div className="space-y-3">
                  <Line w="60%" />
                  <Line w="40%" />
                  <Line w="80%" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-600">{metric.title}</h3>
                    <span className="text-xl">{metric.icon}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                  <div className={`text-sm ${getTrendColor(metric.trend)} flex items-center gap-1`}>
                    <span>{getTrendIcon(metric.trend)}</span>
                    <span>{metric.change}</span>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Weekly Activity Chart */}
        <Card title="Weekly Activity">
          {loading ? (
            <div className="space-y-4">
              <div className="flex justify-between">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <Line w="40px" />
                    <div className="bg-gray-200 rounded w-8" style={{ height: `${Math.random() * 80 + 20}px` }} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Daily engagement over the past 7 days
              </div>
              <div className="flex justify-between items-end h-32">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                  const height = Math.random() * 80 + 20
                  return (
                    <div key={day} className="flex flex-col items-center gap-2">
                      <div className="text-xs text-gray-500">{day}</div>
                      <div 
                        className="bg-blue-500 rounded-t w-8 hover:bg-blue-600 transition-colors cursor-pointer"
                        style={{ height: `${height}px` }}
                        title={`${Math.round(height * 2)} minutes`}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
              <div className="text-2xl mb-1">📊</div>
              <div className="text-xs text-gray-600">View Reports</div>
            </button>
            <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
              <div className="text-2xl mb-1">👥</div>
              <div className="text-xs text-gray-600">Manage Learners</div>
            </button>
            <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
              <div className="text-2xl mb-1">📝</div>
              <div className="text-xs text-gray-600">Create Assignment</div>
            </button>
            <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
              <div className="text-2xl mb-1">⚙️</div>
              <div className="text-xs text-gray-600">Settings</div>
            </button>
          </div>
        </Card>

        {/* Metric Detail Drawer */}
        <DetailDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={activeMetric?.title || 'Metric Details'}
          subtitle="Insights"
          footer={
            <ActionBar>
              <button 
                data-autofocus
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                onClick={() => setDrawerOpen(false)}
              >
                Close
              </button>
            </ActionBar>
          }
        >
          {activeMetric && (
            <div className="space-y-6">
              <Card title="Overview">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{activeMetric.icon}</span>
                    <div>
                      <div className="text-2xl font-bold">{activeMetric.value}</div>
                      <div className={`text-sm ${getTrendColor(activeMetric.trend)}`}>
                        {activeMetric.change}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {activeMetric.title === 'Minutes on-task' && (
                      <p>Total time learners spent actively engaged with learning materials across all subjects this week.</p>
                    )}
                    {activeMetric.title === 'Returns this week' && (
                      <p>Number of learners who returned to continue their learning journey after completing previous sessions.</p>
                    )}
                    {activeMetric.title === 'Due/Overdue Summary' && (
                      <p>Current status of assignments with approaching deadlines and items requiring attention.</p>
                    )}
                  </div>
                </div>
              </Card>

              <Card title="Quick Filters">
                <div className="space-y-3">
                  <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="font-medium text-sm">Show last 14 days</div>
                    <div className="text-xs text-gray-500">Extended time range view</div>
                  </button>
                  <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="font-medium text-sm">Filter by Grade 2A</div>
                    <div className="text-xs text-gray-500">Focus on specific class</div>
                  </button>
                  <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="font-medium text-sm">Compare with last month</div>
                    <div className="text-xs text-gray-500">Trend analysis view</div>
                  </button>
                </div>
              </Card>

              {activeMetric.title === 'Due/Overdue Summary' && (
                <Card title="Action Items">
                  <div className="space-y-2">
                    <div className="p-2 bg-red-50 border border-red-200 rounded">
                      <div className="text-sm font-medium text-red-800">3 overdue assignments</div>
                      <div className="text-xs text-red-600">Require immediate attention</div>
                    </div>
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="text-sm font-medium text-yellow-800">12 due this week</div>
                      <div className="text-xs text-yellow-600">Send reminders to learners</div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </DetailDrawer>
      </div>
    </TeacherLayout>
  )
}