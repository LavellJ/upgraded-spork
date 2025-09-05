import { ReactNode, useMemo } from 'react'
import { StickyTable } from './StickyTable'
import { useDensity } from '../guide/teacher/density'
import clsx from 'clsx'

export type Column<T> = {
  key: keyof T | string
  header: string
  width?: string
  align?: 'left'|'right'|'center'
  render?: (row: T) => ReactNode
  sort?: (a: T, b: T) => number
}

export function DataTable<T extends { id: string | number }>({
  rows, columns, sortKey, sortDir='asc', onSort, onRowClick, empty
}:{
  rows: T[]
  columns: Column<T>[]
  sortKey?: string
  sortDir?: 'asc'|'desc'
  onSort?: (key:string)=>void
  onRowClick?: (row: T)=>void
  empty?: ReactNode
}){
  const { density } = useDensity()
  const rh = density === 'compact' ? 'h-10' : 'h-12'
  const td = density === 'compact' ? 'py-2' : 'py-3'

  const colStyles = (c: Column<T>) => ({ width: c.width })
  const sorted = useMemo(()=> {
    if (!sortKey) return rows
    const col = columns.find(c => c.key === sortKey)
    if (!col || !col.sort) return rows
    const copy = [...rows].sort(col.sort)
    return sortDir==='asc' ? copy : copy.reverse()
  }, [rows, columns, sortKey, sortDir])

  if (!rows.length && empty) return <>{empty}</>

  return (
    <StickyTable
      header={
        <tr className={rh}>
          {columns.map(c => (
            <th key={String(c.key)} style={colStyles(c)}
                className={clsx('px-3 text-left text-xs font-semibold text-gray-600',
                                c.align==='right' && 'text-right', c.align==='center' && 'text-center')}>
              <button type="button" className="hover:underline"
                      onClick={()=>onSort?.(String(c.key))} aria-label={`Sort by ${c.header}`}>
                {c.header}{sortKey===c.key ? (sortDir==='asc'?' ▲':' ▼') : ''}
              </button>
            </th>
          ))}
        </tr>
      }
    >
      {sorted.map(row => (
        <tr key={String(row.id)} className={clsx('border-b border-gray-200 hover:bg-gray-50 cursor-pointer', rh)}
            onClick={()=>onRowClick?.(row)} role={onRowClick?'button':undefined}>
          {columns.map(c => (
            <td key={String(c.key)} className={clsx('px-3 text-sm', td,
              c.align==='right' && 'text-right', c.align==='center' && 'text-center')}>
              {c.render ? c.render(row) : (row as any)[c.key]}
            </td>
          ))}
        </tr>
      ))}
    </StickyTable>
  )
}