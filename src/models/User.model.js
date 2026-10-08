import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    telegramId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
      default: '',
    },
    username: {
      type: String,
      trim: true,
      index: true,
    },
    photoUrl: {
      type: String,
      default: '',
    },
    referralCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'banned'],
      default: 'active',
    },
    // ቋንቋዎችን ለማስቀመጥ ይህንን እዚህ እንጨምራለን (Default: amharic 'am')
    language: {
      type: String,
      enum: ['am', 'en', 'om', 'so'],
      default: 'am',
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model('User', userSchema);