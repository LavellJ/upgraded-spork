export function KV({ items }:{ items: Array<{k:string; v:string|number|JSX.Element}> }){
  return (
    <dl className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
      {items.map(({k,v},i)=>(
        <div key={i} className="contents">
          <dt className="text-gray-600">{k}</dt>
          <dd className="col-span-2">{v}</dd>
        </div>
      ))}
    </dl>
  )
}