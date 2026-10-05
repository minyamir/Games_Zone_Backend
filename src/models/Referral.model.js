import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referred: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // A user can only be referred once
      index: true,
    },
    bonusEarned: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'rewarded'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for lightning-fast aggregation queries by referrer
referralSchema.index({ referrer: 1, status: 1 });

export const Referral = mongoose.model('Referral', referralSchema);