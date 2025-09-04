import { PropsWithChildren, ReactNode } from 'react'

type GuideShellProps = PropsWithChildren<{
  topbar?: ReactNode
}>

export default function GuideShell({ topbar, children }: GuideShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_oklab,rgba(var(--bg-page),1)_75%,transparent)] bg-[rgb(var(--bg-page))]/80 border-b border-[rgb(var(--border))]">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 h-14 flex items-center justify-between">
          {topbar ?? <div className="text-sm subtle">Guide</div>}
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-4 md:py-6">
          {children}
        </div>
      </main>
    </div>
  )
}