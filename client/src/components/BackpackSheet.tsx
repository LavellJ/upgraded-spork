import React from "react";
import { BottomSheet } from "./BottomSheet";
import { BackpackItem } from "../hooks/useBackpack";

const cx = (...s: (string | false | undefined)[]): string => s.filter(Boolean).join(" ");

interface BackpackSheetProps {
  open: boolean;
  onClose: () => void;
  bp: {
    items: BackpackItem[];
    equipped: string[];
    toggleEquip: (id: string) => void;
    equipLimit: number;
  };
}

export function BackpackSheet({ open, onClose, bp }: BackpackSheetProps) {
  const { items, equipped, toggleEquip, equipLimit } = bp;
  const equippedSet = new Set(equipped);
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="text-stone-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">🎒</div>
          <div className="font-extrabold">Scout's Backpack</div>
          <button onClick={onClose} className="ml-auto text-xs px-2 py-1 rounded-full border bg-white hover:bg-stone-50">Close</button>
        </div>
        <div className="mt-2 text-xs text-stone-600">Equip up to {equipLimit} items.</div>
        {items.length === 0 && <div className="mt-4 text-sm text-stone-600">No items yet. Complete lessons to earn collectibles.</div>}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {items.map(it => (
            <div key={it.id} className="rounded-xl border bg-white/80 p-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">{it.kind === 'tool' ? '🧰' : it.kind === 'badge' ? '🏅' : '🖋️'}</div>
              <div className="min-w-0"><div className="font-semibold text-sm truncate">{it.name}</div><div className="text-[11px] text-stone-500 truncate">{it.kind}</div></div>
              <button onClick={() => toggleEquip(it.id)} className={cx("ml-auto text-xs px-2 py-1 rounded-full border transition ease-out", equippedSet.has(it.id) ? "bg-emerald-600 text-white border-emerald-700" : "bg-white hover:bg-stone-50")}>{equippedSet.has(it.id) ? 'Equipped' : 'Equip'}</button>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="mt-2 text-[11px] text-stone-600">Equipped: {equipped.length}/{equipLimit}</div>
        )}
      </div>
    </BottomSheet>
  );
}