import { useFlags } from '../config/flags'
import { SimpleLayout } from '../ui2/SimpleLayout'
import { ListCard, ListRow, ListSection } from '../ui2/List'
import { Ic } from '../ui2/icons'

function LegacyPrivacy() {
  return (
    <div className="card p-4 md:p-6">
      <h2 className="page-title mb-2">Privacy</h2>
      <p className="subtle mb-4">Data protection and privacy controls.</p>
    </div>
  )
}

export default function Privacy() {
  const { teacherPanelV2, teacherAppearanceV3 } = useFlags()

  // Fallback to legacy screen if v2/v3 not enabled
  if (!teacherPanelV2 || !teacherAppearanceV3) return <LegacyPrivacy />

  async function exportArchive() {
    console.log('Preparing export…')
    // TODO: hook to real export
    setTimeout(() => console.log('Export ready - Downloaded CSV'), 600)
  }

  async function deleteLearner() {
    const ok = confirm('Delete learner? This permanently removes the learner and their data.')
    if (ok) console.log('Learner deleted')
  }

  function openPolicy() {
    // route or open modal
    console.log('Opening policy')
  }

  function sendDPA() {
    console.log('Data processing agreement sent')
  }

  return (
    <SimpleLayout title="Privacy" subtitle="Data, exports and consent">
      <ListSection title="Data & control" />
      <ListCard>
        <ListRow icon={<Ic.shield className="list-icon" />} title="Student data policy"
                 meta="How we handle and store data" onClick={openPolicy} />
        <div className="divider" />
        <ListRow icon={<Ic.doc className="list-icon" />} title="Download data"
                 meta="Export archive for a learner or class" onClick={exportArchive} />
        <div className="divider" />
        <ListRow icon={<Ic.doc className="list-icon" />} title="Send DPA to school"
                 meta="Email a copy of our data processing agreement" onClick={sendDPA} />
        <div className="divider" />
        <ListRow icon={<Ic.shield className="list-icon" />} title="Delete learner"
                 meta="Permanent removal (admin only)" onClick={deleteLearner} />
      </ListCard>

      <ListSection title="Consent" />
      <ListCard>
        <ListRow icon={<Ic.star className="list-icon" />} title="Consent status"
                 meta="Check family approvals" onClick={()=>window.location.assign('/#/guide?tab=consent')} />
      </ListCard>
    </SimpleLayout>
  )
}