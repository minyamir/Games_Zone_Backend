import { BINGO_CONSTANTS } from './game.constants.js';

export const validateBingoWin = (card, drawnNumbers) => {
  if (BINGO_CONSTANTS.DEBUG_MODE) {
    console.log(`[DEBUG]: Validating bingo card against ${drawnNumbers.length} drawn numbers`);
  }

  const drawnSet = new Set(drawnNumbers);
  const size = 5;

  // 1. Check Four Corners (የአራቱን ማዕዘኖች ድል ማረጋገጥ)
  const cornerPositions = [
    { r: 0, c: 0 },         // Top-Left
    { r: 0, c: size - 1 },     // Top-Right
    { r: size - 1, c: 0 },     // Bottom-Left
    { r: size - 1, c: size - 1 } // Bottom-Right
  ];

  let fourCornersWin = true;
  for (const pos of cornerPositions) {
    const val = card[pos.r][pos.c];
    if (val !== 'FREE' && !drawnSet.has(val)) {
      fourCornersWin = false;
      break;
    }
  }

  if (fourCornersWin) {
    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: Four Corners win detected!`);
    }
    return { status: true, pattern: 'FOUR_CORNERS' };
  }

  // 2. Check Horizontal Lines
  for (let r = 0; r < size; r++) {
    let isWin = true;
    for (let c = 0; c < size; c++) {
      const val = card[r][c];
      if (val !== 'FREE' && !drawnSet.has(val)) {
        isWin = false;
        break;
      }
    }
    if (isWin) {
      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.log(`[DEBUG]: Horizontal win detected on row ${r}`);
      }
      return { status: true, pattern: 'HORIZONTAL_LINE', index: r };
    }
  }

  // 3. Check Vertical Lines
  for (let c = 0; c < size; c++) {
    let isWin = true;
    for (let r = 0; r < size; r++) {
      const val = card[r][c];
      if (val !== 'FREE' && !drawnSet.has(val)) {
        isWin = false;
        break;
      }
    }
    if (isWin) {
      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.log(`[DEBUG]: Vertical win detected on column ${c}`);
      }
      return { status: true, pattern: 'VERTICAL_LINE', index: c };
    }
  }

  // 4. Check Diagonals
  let diag1Win = true;
  let diag2Win = true;
  for (let i = 0; i < size; i++) {
    const val1 = card[i][i];
    if (val1 !== 'FREE' && !drawnSet.has(val1)) diag1Win = false;

    const val2 = card[i][size - 1 - i];
    if (val2 !== 'FREE' && !drawnSet.has(val2)) diag2Win = false;
  }
  
  if (diag1Win) {
    if (BINGO_CONSTANTS.DEBUG_MODE) console.log(`[DEBUG]: Diagonal win detected (Top-Left to Bottom-Right)`);
    return { status: true, pattern: 'DIAGONAL', index: 1 };
  }
  if (diag2Win) {
    if (BINGO_CONSTANTS.DEBUG_MODE) console.log(`[DEBUG]: Diagonal win detected (Top-Right to Bottom-Left)`);
    return { status: true, pattern: 'DIAGONAL', index: 2 };
  }

  // 5. Check Full House / Coverall
  let fullHouseWin = true;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const val = card[r][c];
      if (val !== 'FREE' && !drawnSet.has(val)) {
        fullHouseWin = false;
        break;
      }
    }
    if (!fullHouseWin) break;
  }
  
  if (fullHouseWin) {
    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: Full House win detected!`);
    }
    return { status: true, pattern: 'FULL_HOUSE' };
  }

  return { status: false };
};