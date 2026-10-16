import mongoose from 'mongoose';

const bingoTicketSchema = new mongoose.Schema({
  game: { type: mongoose.Schema.Types.ObjectId, ref: 'BingoGame', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ticketNumber: { type: Number, required: true },
  matrix: { type: Array, required: true }, // 5x5 Matrix of numbers
  markedNumbers: [{ type: Number, default: [] }],
  isWinner: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'won', 'lost'], default: 'active' }
}, { timestamps: true });

export const BingoTicket = mongoose.model('BingoTicket', bingoTicketSchema);