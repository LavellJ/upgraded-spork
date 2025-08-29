type JournalByProfile = Record<string, Record<string, string>>; 
// { [profileId]: { [YYYY-MM-DD]: "note text" } }

function loadAll(): JournalByProfile {
  try {
    return JSON.parse(localStorage.getItem("campfire-journal-v1") || "{}");
  } catch {
    return {};
  }
}

function saveAll(obj: JournalByProfile) {
  localStorage.setItem("campfire-journal-v1", JSON.stringify(obj));
}

export function getNote(profileId: string, date: string): string {
  const all = loadAll();
  return all[profileId]?.[date] || "";
}

export function setNote(profileId: string, date: string, text: string) {
  const all = loadAll();
  if (!all[profileId]) all[profileId] = {};
  all[profileId][date] = text;
  saveAll(all);
}