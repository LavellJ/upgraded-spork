import { useState } from 'react'
import { useFlags } from '../../config/flags'
import TeacherLayout from '../teacher/Layout'
import { Card } from '../../ui2/Card'
import { Line } from '../../ui2/Skeleton'

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
            <Card key={metric.title}>
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
      </div>
    </TeacherLayout>
  )
}