import mongoose from 'mongoose';

const bingoGameSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'open_for_bets', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    ticketPrice: {
      type: Number,
      required: true,
      min: 1,
    },
    maxPlayers: {
      type: Number,
      default: 100,
    },
    prizePool: {
      type: Number,
      default: 0,
    },
    calledNumbers: {
      type: [Number],
      default: [],
    },
    currentCalledNumber: {
      type: Number,
      default: null,
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    winningPattern: {
      type: String,
      default: 'full_house',
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.gameSession_id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const BingoGame = mongoose.model('BingoGame', bingoGameSchema);