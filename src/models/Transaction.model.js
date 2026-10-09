import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'deposit', 
        'withdrawal', 
        'game_buy_in', 
        'game_win', 
        'bonus',            // 🟢 የምዝገባ ቦነስ የሚመዘገብበት 
        'referral_bonus', 
        'admin_adjustment'
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    fee: {
      type: Number,
      default: 0,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      // Can reference Deposit, Withdrawal, or BingoGame dynamically
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    description: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const Transaction = mongoose.model('Transaction', transactionSchema);