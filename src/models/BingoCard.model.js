import mongoose from 'mongoose';

const bingoCardSchema = new mongoose.Schema(
  {
    cardId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    grid: {
      type: [[Number]], // 5x5 matrix where column 0 = B (1-15), col 1 = I (16-30), etc.
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const BingoCard = mongoose.model('BingoCard', bingoCardSchema);