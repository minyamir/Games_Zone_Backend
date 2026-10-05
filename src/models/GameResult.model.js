import mongoose from 'mongoose';

const gameResultSchema = new mongoose.Schema(
  {
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BingoGame',
      required: true,
      unique: true,
      index: true,
    },
    roomNumber: {
      type: Number,
      required: true,
      index: true,
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    winningTicket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BingoTicket',
      required: true,
    },
    totalPlayers: {
      type: Number,
      required: true,
    },
    prizePool: {
      type: Number,
      required: true,
    },
    calledNumbersCount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for high-speed user history lookups
gameResultSchema.index({ winner: 1, createdAt: -1 });

export const GameResult = mongoose.model('GameResult', gameResultSchema);