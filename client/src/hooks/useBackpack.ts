import { useState, useEffect } from "react";

const KEYS = { loop: 'qi_loop', comp: 'qi_comp', bpItems: 'qi_bp_items', bpEq: 'qi_bp_equipped', teacher: 'qi_teacher', framework: 'qi_framework', calm: 'qi_calm', proto: 'qi_proto_only', last: 'qi_last' };

export interface BackpackItem {
  id: string;
  name: string;
  kind: 'tool' | 'badge' | 'charm';
  icon?: string;
}

export function useBackpack() {
  const [items, setItems] = useState<BackpackItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.bpItems) || '[]');
    } catch {
      return [];
    }
  });
  const [equipped, setEquipped] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.bpEq) || '[]');
    } catch {
      return [];
    }
  });
  const equipLimit = 3;
  const award = (it: BackpackItem) => setItems(p => p.some(x => x.id === it.id) ? p : [...p, it]);
  const toggleEquip = (id: string) => setEquipped(p => p.includes(id) ? p.filter(x => x !== id) : (p.length < equipLimit ? [...p, id] : p));
  useEffect(() => {
    try {
      localStorage.setItem(KEYS.bpItems, JSON.stringify(items));
    } catch { }
  }, [items]);
  useEffect(() => {
    try {
      localStorage.setItem(KEYS.bpEq, JSON.stringify(equipped));
    } catch { }
  }, [equipped]);
  return { items, equipped, toggleEquip, award, equipLimit, setItems, setEquipped };
}

export function hasEquipped(bp: ReturnType<typeof useBackpack>, id: string) {
  return bp.equipped?.includes?.(id);
}