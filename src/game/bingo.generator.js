import { BINGO_CONSTANTS } from './game.constants.js';

export const generateBingoCard = (ticketNumber = null) => {
  if (BINGO_CONSTANTS.DEBUG_MODE) {
    console.log(`[DEBUG]: Generating 5x5 Bingo card matrix${ticketNumber ? ` for Ticket #${ticketNumber}` : ''}`);
  }

  const card = [];
  const colKeys = ['B', 'I', 'N', 'G', 'O'];

  const colArrays = colKeys.map((key) => {
    const { min, max } = BINGO_CONSTANTS.COLUMNS[key];
    const nums = [];
    for (let i = min; i <= max; i++) nums.push(i);
    
    // Shuffle numbers for randomization
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    return nums.slice(0, 5);
  });

  for (let row = 0; row < 5; row++) {
    const rowNums = [];
    for (let col = 0; col < 5; col++) {
      if (col === 2 && row === 2) {
        rowNums.push('FREE'); // Center free space marker
      } else {
        rowNums.push(colArrays[col][row]);
      }
    }
    card.push(rowNums);
  }

  if (BINGO_CONSTANTS.DEBUG_MODE) {
    console.log(`[DEBUG]: Bingo card generated successfully:`, card);
  }

  // Return structure supporting both standalone matrix use or ticket-bound objects
  return ticketNumber ? { ticketNumber, matrix: card } : card;
};