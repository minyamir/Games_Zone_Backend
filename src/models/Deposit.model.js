import mongoose from 'mongoose';

const depositSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    paymentAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentAccount',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    transactionReference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    receiptImage: {
      type: String,
      default: '', // URL or path to uploaded screenshot/receipt
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    adminNote: {
      type: String,
      trim: true,
      default: '',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Deposit = mongoose.model('Deposit', depositSchema);