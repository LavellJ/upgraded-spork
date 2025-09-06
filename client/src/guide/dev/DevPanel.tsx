import React from 'react'
import { useFlags, Flags } from '../../config/flags'
import { SimpleLayout } from '../../ui2/SimpleLayout'
import { ListCard, ListRow, ListSection } from '../../ui2/List'
import { Ic } from '../../ui2/icons'

function LegacyDevPanel() {
  return (
    <div className="card p-4 md:p-6">
      <h2 className="page-title mb-2">Development</h2>
      <p className="subtle mb-4">Diagnostics & feature flags.</p>
    </div>
  )
}

export default function DevPanel() {
  const f = useFlags()

  const set = (p: Partial<typeof f>) => Flags.set(p)

  return (
    <SimpleLayout title="Dev" subtitle="Diagnostics & feature flags">
      <ListSection title="Feature flags" />
      <ListCard>
        <ListRow icon={<Ic.star className="list-icon" />} title="Final Art"
                 meta="Swap to final assets" value={f.finalArt ? 'On' : 'Off'}
                 onClick={() => set({ finalArt: !f.finalArt })} />
        <div className="divider" />
        <ListRow icon={<Ic.star className="list-icon" />} title="Teacher Theme v2"
                 meta="Tokenized palette (TP5)" value={f.teacherThemeV2 ? 'On' : 'Off'}
                 onClick={() => set({ teacherThemeV2: !f.teacherThemeV2 })} />
        <div className="divider" />
        <ListRow icon={<Ic.star className="list-icon" />} title="Appearance v3"
                 meta="Removed in TP6 final" value="Retired"
                 onClick={() => console.log('Appearance v3 permanently enabled')} />
      </ListCard>
    </SimpleLayout>
  )
}