export const validateBingoWin = (matrix, drawnNumbers) => {
  const drawnSet = new Set([...drawnNumbers, 'FREE']);
  
  // Check Rows
  for (let r = 0; r < 5; r++) {
    if (matrix[r].every(cell => drawnSet.has(cell))) return true;
  }

  // Check Columns
  for (let c = 0; c < 5; c++) {
    let colMatch = true;
    for (let r = 0; r < 5; r++) {
      if (!drawnSet.has(matrix[r][c])) {
        colMatch = false;
        break;
      }
    }
    if (colMatch) return true;
  }

  // Check Diagonals
  const diag1 = [matrix[0][0], matrix[1][1], matrix[2][2], matrix[3][3], matrix[4][4]];
  const diag2 = [matrix[0][4], matrix[1][3], matrix[2][2], matrix[3][1], matrix[4][0]];

  if (diag1.every(cell => drawnSet.has(cell))) return true;
  if (diag2.every(cell => drawnSet.has(cell))) return true;

  return false;
};