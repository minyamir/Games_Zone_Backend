import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    telegramId: {
      type: String,
      unique: true,
      sparse: true, // ⚡ አድሚኖች ቴሌግራም ላይኖራቸው ስለሚችል ዩኒክነቱን ጠብቆ እንዲያልፍ ይረዳል
      default: null,
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
    // ⚡ የአድሚን መግቢያ ሚስጥር ቃል (Password) እንዲቀመጥ ይህንን ጨምረናል
    password: {
      type: String,
      required: false,
      default: '',
    },
    photoUrl: {
      type: String,
      default: '',
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true, // ⚡ አድሚኖች ሪፈራል ኮድ ላይፈልጉ ስለሚችሉ አማራጭ እናደርገዋለን
      default: null,
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