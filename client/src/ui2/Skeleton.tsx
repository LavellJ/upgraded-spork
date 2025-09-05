export function Line({ w='100%' }:{ w?: string }){
  return <div className="bg-gray-200 rounded h-3 animate-pulse" style={{ width: w }} />
}

export function TableSkeleton({ rows=6 }:{ rows?: number }){
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      {[...Array(rows)].map((_,i)=>(
        <div key={i} className="grid grid-cols-4 gap-3 p-3 border-b border-gray-200">
          <Line w="20%"/><Line w="30%"/><Line w="15%"/><Line w="10%"/>
        </div>
      ))}
    </div>
  )
}