export const copy = {
  actions: { 
    assign: 'Assign', 
    archive: 'Archive', 
    save: 'Save changes', 
    export: 'Export CSV', 
    close: 'Close' 
  },
  states: { 
    assigned: 'Assigned', 
    due: 'Due soon', 
    overdue: 'Overdue', 
    done: 'Done', 
    locked: 'Locked' 
  }
} as const