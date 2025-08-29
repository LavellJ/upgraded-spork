type Earned = { id: string; date: string }; // badge id + when first earned

function loadAll() {
  try { return JSON.parse(localStorage.getItem("campfire-badges-v1") || "{}"); }
  catch { return {}; }
}
function saveAll(obj: Record<string, Earned[]>) {
  localStorage.setItem("campfire-badges-v1", JSON.stringify(obj));
}

export function loadEarned(profileId: string): Earned[] {
  const all = loadAll();
  return all[profileId] || [];
}
export function saveEarned(profileId: string, earned: Earned[]) {
  const all = loadAll();
  all[profileId] = earned;
  saveAll(all);
}

export function diffNewBadges(
  already: Earned[],
  nowIds: string[],
  today: string
): Earned[] {
  const have = new Set(already.map(e => e.id));
  const fresh = nowIds.filter(id => !have.has(id)).map(id => ({ id, date: today }));
  return fresh;
}