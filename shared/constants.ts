// Constants for max lengths of data fields
// IMPORTANT NOTE: Changing these values will automatically apply everywhere, 
// EXCEPT for the database schema. That must be changed manually.
export const MAX_LENGTHS = {
    skillLabel: 60,
    treeTitle: 80,
    statusLabel: 30,
    userEmail: 255,
} as const;