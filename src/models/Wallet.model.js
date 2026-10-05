import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lockedBalance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    bonusBalance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'ETB', // Ethiopian Birr default per platform payment accounts
    },
  },
  {
    timestamps: true,
  }
);

export const Wallet = mongoose.model('Wallet', walletSchema);