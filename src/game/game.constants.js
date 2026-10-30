export const BINGO_CONSTANTS = {
  MIN_BALL: 1,
  MAX_BALL: 75,
  BOARD_SIZE: 5,
  DEBUG_MODE: true, // Global debug toggle for game engines and validators
  COLUMNS: {
    B: { min: 1, max: 15 },
    I: { min: 16, max: 30 },
    N: { min: 31, max: 45 },
    G: { min: 46, max: 60 },
    O: { min: 61, max: 75 }
  },
  DEFAULT_DRAW_INTERVAL_MS: 3000, // Time interval between ball draws (3 seconds)
  PATTERNS: {
    HORIZONTAL_LINE: 'HORIZONTAL_LINE',
    VERTICAL_LINE: 'VERTICAL_LINE',
    DIAGONAL: 'DIAGONAL',
    FOUR_CORNERS: 'FOUR_CORNERS',
    FULL_HOUSE: 'FULL_HOUSE'
  }
};