export function Pagination({ page, pages, onPage }:{
  page: number; pages: number; onPage: (n:number)=>void
}){
  const btn = 'px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-50'
  return (
    <div className="flex items-center justify-end gap-2">
      <button className={btn} disabled={page<=1} onClick={()=>onPage(page-1)} aria-label="Previous page">←</button>
      <span className="text-sm text-gray-600">Page {page} of {pages}</span>
      <button className={btn} disabled={page>=pages} onClick={()=>onPage(page+1)} aria-label="Next page">→</button>
    </div>
  )
}