import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    bonusType: {
      type: String,
      enum: ['deposit_match', 'free_ticket', 'cashback'],
      required: true,
    },
    bonusValue: {
      type: Number,
      required: true, // Percentage or fixed amount
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Promotion = mongoose.model('Promotion', promotionSchema);