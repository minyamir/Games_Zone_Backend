import mongoose from 'mongoose';

const paymentAccountSchema = new mongoose.Schema(
  {
    providerName: {
      type: String,
      required: true,
      enum: ['TeleBirr', 'CBE', 'Awash Bank', 'Dashen Bank', 'Other'],
      index: true,
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    isForDeposit: {
      type: Boolean,
      default: true, // If true, platform displays this to users for deposits
    },
    isForWithdrawal: {
      type: Boolean,
      default: true, // If true, platform uses this or accepts user accounts for payouts
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    instructions: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const PaymentAccount = mongoose.model('PaymentAccount', paymentAccountSchema);