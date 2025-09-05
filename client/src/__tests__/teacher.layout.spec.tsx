import { render, screen } from '@testing-library/react'
import TeacherLayout from '../guide/teacher/Layout'
import { Flags } from '../config/flags'

// Mock wouter
jest.mock('wouter', () => ({
  useLocation: () => ['/guide/learners', () => {}],
  Link: ({ children, to, className, ...props }: any) => 
    <a href={to} className={className} {...props}>{children}</a>
}))

test('renders legacy when flag off', () => {
  Flags.set({ teacherPanelV2: false })
  render(<TeacherLayout title="Test Title"><div>Body Content</div></TeacherLayout>)
  expect(screen.getByText('Body Content')).toBeInTheDocument()
  expect(screen.queryByText('Teacher Panel')).not.toBeInTheDocument()
})

test('renders sidebar when flag on', () => {
  Flags.set({ teacherPanelV2: true })
  render(<TeacherLayout title="Learners"><div>Body Content</div></TeacherLayout>)
  expect(screen.getByText('Teacher Panel')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Learners/i })).toBeInTheDocument()
  expect(screen.getByText('Body Content')).toBeInTheDocument()
})