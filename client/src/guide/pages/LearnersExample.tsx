import TeacherLayout from '../teacher/Layout'
import { Card } from '../../ui2/Card'

export default function LearnersExample(){
  return (
    <TeacherLayout title="Learners" subtitle="Manage students, groups and assignments">
      <Card title="All learners">
        <div className="text-center py-8 text-[rgb(var(--fg-muted))]">
          <p>Learners management interface will be here.</p>
          <p className="text-sm mt-2">This demonstrates the new Teacher Panel v2 layout with sidebar navigation.</p>
        </div>
      </Card>
    </TeacherLayout>
  )
}