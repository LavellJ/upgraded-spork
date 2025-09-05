import TeacherLayout from '../teacher/Layout'
import { Card } from '../../ui2/Card'
import { StickyTable } from '../../ui2/StickyTable'

export default function AssignmentsExample(){
  return (
    <TeacherLayout title="Assignments" subtitle="Create, manage and track due work">
      <Card title="Recent assignments">
        <StickyTable 
          header={
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-[rgb(var(--fg-muted))] uppercase tracking-wider">
                Assignment
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-[rgb(var(--fg-muted))] uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-[rgb(var(--fg-muted))] uppercase tracking-wider">
                Due Date
              </th>
            </tr>
          }
        >
          <tr>
            <td className="px-4 py-2 text-sm">Math: Fractions</td>
            <td className="px-4 py-2 text-sm">In Progress</td>
            <td className="px-4 py-2 text-sm">Jan 15, 2025</td>
          </tr>
          <tr>
            <td className="px-4 py-2 text-sm">Science: Plants</td>
            <td className="px-4 py-2 text-sm">Completed</td>
            <td className="px-4 py-2 text-sm">Jan 10, 2025</td>
          </tr>
        </StickyTable>
      </Card>
    </TeacherLayout>
  )
}