import { useState } from 'react'
import ScoutSprite from '@/learning/ScoutSprite'
import { triggerScoutEvent, type ScoutEventType } from '@/learning/scout'

const EXPRS = ['neutral','happy','thinking','encouraging','alert','celebrate'] as const
const EVENTS: Array<{type: ScoutEventType; label: string; detail?: any}> = [
  { type: 'lessonStart', label: 'Lesson Start' },
  { type: 'firstMiss', label: 'First Miss', detail: { hintsUsed: 0 } },
  { type: 'hintUsed', label: 'Hint Used (1)', detail: { hintsUsed: 1 } },
  { type: 'hintUsed', label: 'Hint Used (2+)', detail: { hintsUsed: 2 } },
  { type: 'branchingTaken', label: 'Branching Taken' },
  { type: 'masteryAchieved', label: 'Mastery Achieved' },
  { type: 'encourage', label: 'Encourage' },
  { type: 'alert', label: 'Alert' },
  { type: 'celebrate', label: 'Celebrate' },
]

export default function ScoutGallery(){
  const [expr, setExpr] = useState<(typeof EXPRS)[number]>('neutral')
  
  const handleTriggerEvent = (event: {type: ScoutEventType; detail?: any}) => {
    triggerScoutEvent(event.type, event.detail)
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Manual Expression Test</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {EXPRS.map(e => (
            <button 
              key={e} 
              onClick={()=>setExpr(e)} 
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                expr === e ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Scout Event Triggers</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {EVENTS.map((event, idx) => (
            <button 
              key={idx}
              onClick={() => handleTriggerEvent(event)} 
              className="px-3 py-1.5 rounded-lg border border-green-300 hover:bg-green-50 text-sm font-medium transition-colors"
            >
              {event.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Click these buttons to trigger Scout events and see expression changes (2.5s decay)
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Scout Sprite Sizes</h3>
        <div className="flex items-center gap-8">
          {[48,96,128].map(s => (
            <div key={s} className="flex flex-col items-center gap-2">
              <ScoutSprite size={s} />
              <span className="text-xs text-[rgb(var(--fg-muted))]">{s}px</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium mb-2">Instructions</h4>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>• Manual buttons force specific expressions (for testing)</li>
          <li>• Event triggers simulate real Scout events with automatic expression mapping</li>
          <li>• Enable Final Art flag to see SVG sprite vs emoji fallback</li>
          <li>• Expressions auto-decay to neutral after 2.5 seconds</li>
        </ul>
      </div>
    </div>
  )
}