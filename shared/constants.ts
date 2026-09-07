// Constants for max lengths of data fields
// IMPORTANT NOTE: Changing these values will automatically apply everywhere, 
// EXCEPT for the database schema. That must be changed manually.
export const MAX_LENGTHS = {
    userEmail: 255,
    treeTitle: 80,
    treeDescription: 500,
    statusLabel: 30,
    skillLabel: 60,
    skillDescription: 500,
    displayName: 50
} as const;

export const PASSWORD_MIN_LENGTH = 8;

// Regex for hex color values
export const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;