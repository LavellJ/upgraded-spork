import React from 'react'
import { useFlags } from '../config/flags'
import { SimpleLayout } from '../ui2/SimpleLayout'
import { ListCard, ListRow, ListSection } from '../ui2/List'
import { Ic } from '../ui2/icons'

// Test component to verify appearance v3 flag is working
export default function TestAppearance(){
  const { teacherPanelV2, teacherAppearanceV3, teacherThemeV2 } = useFlags()
  
  const handleTestClick = () => {
    console.log('Test click - flags:', { teacherPanelV2, teacherAppearanceV3, teacherThemeV2 })
  }
  
  return (
    <SimpleLayout title="Test Appearance v3" subtitle="Verify the new list UI is working">
      <div className="space-y-6">
        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-2">Current Flag Status</h3>
          <ul className="space-y-1 text-sm">
            <li>Teacher Panel v2: <strong>{teacherPanelV2 ? '✅ Enabled' : '❌ Disabled'}</strong></li>
            <li>Teacher Theme v2: <strong>{teacherThemeV2 ? '✅ Enabled' : '❌ Disabled'}</strong></li>
            <li>Teacher Appearance v3: <strong>{teacherAppearanceV3 ? '✅ Enabled' : '❌ Disabled'}</strong></li>
          </ul>
          <p className="text-xs text-gray-600 mt-2">
            All three flags should be enabled to see the full new UI experience.
          </p>
        </div>

        {teacherPanelV2 && teacherAppearanceV3 ? (
          <div>
            <ListSection title="Test List UI"/>
            <ListCard>
              <ListRow 
                icon={<Ic.star className="list-icon"/>} 
                title="Test List Row" 
                meta="This should show the new list UI styling" 
                onClick={handleTestClick}
                data-testid="test-list-row"
              />
              <div className="divider" />
              <ListRow 
                icon={<Ic.palette className="list-icon"/>} 
                title="Another test row" 
                meta="With proper dividers and chevrons" 
                value="Working!"
                onClick={handleTestClick}
                data-testid="test-list-row-2"
              />
            </ListCard>
          </div>
        ) : (
          <div className="card p-4 border-orange-200 bg-orange-50">
            <h3 className="text-lg font-semibold mb-2 text-orange-800">Enable Required Flags</h3>
            <p className="text-orange-700 mb-4">
              To see the new list UI, please enable these flags in the Pilot tab:
            </p>
            <ul className="space-y-2 text-sm text-orange-600">
              {!teacherPanelV2 && <li>• Teacher Panel v2 (enhanced layout)</li>}
              {!teacherAppearanceV3 && <li>• Teacher Appearance v3 (list UI)</li>}
            </ul>
          </div>
        )}
      </div>
    </SimpleLayout>
  )
}