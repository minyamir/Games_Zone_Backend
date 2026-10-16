export const generateBingoTicketMatrix = () => {
  // 5x5 Standard Bingo Matrix generation logic (B:1-15, I:16-30, N:31-45, G:46-60, O:61-75)
  const matrix = [];
  const ranges = [
    [1, 15], [16, 30], [31, 45], [46, 60], [61, 75]
  ];

  for (let col = 0; col < 5; col++) {
    const [min, max] = ranges[col];
    const columnNumbers = [];
    while (columnNumbers.length < 5) {
      const rand = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!columnNumbers.includes(rand)) {
        columnNumbers.push(rand);
      }
    }
    matrix.push(columnNumbers);
  }

  // Transpose to make it row-major (5x5) and set center (2,2) as FREE
  const rows = [];
  for (let r = 0; r < 5; r++) {
    const row = [];
    for (let c = 0; c < 5; c++) {
      row.push(matrix[c][r]);
    }
    rows.push(row);
  }
  rows[2][2] = 'FREE'; // Center spot
  return rows;
};