export function MiniProgress({ value }:{ value:number }){
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className="h-2 rounded bg-gray-200">
      <div className="h-full rounded bg-blue-500" style={{ width: `${v}%` }} />
    </div>
  )
}