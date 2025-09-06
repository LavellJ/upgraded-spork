import { useFlags } from '../../config/flags'
import * as Flags from '../../config/flags'
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
  if (!f.teacherPanelV2 || !f.teacherAppearanceV3) return <LegacyDevPanel />

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
                 meta="List-first settings UI (TP6)" value={f.teacherAppearanceV3 ? 'On' : 'Off'}
                 onClick={() => set({ teacherAppearanceV3: !f.teacherAppearanceV3 })} />
      </ListCard>
    </SimpleLayout>
  )
}