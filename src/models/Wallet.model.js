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
    mainWallet: {
      type: Number,
      required: true,
      default: 0,
      min: 0, // 🟢 ጨዋታ አሸንፎ የሚገባበት እና ማውጣት (Withdraw) የሚቻልበት
    },
    playWallet: {
      type: Number,
      required: true,
      default: 0,
      min: 0, // 🟡 ዲፖዚት፣ የምዝገባ ቦነስ እና ሪፈራል ቦነስ የሚከማቹበት (ለጨዋታ ብቻ)
    },
    lockedBalance: {
      type: Number,
      required: true,
      default: 0,
      min: 0, // 🔒 በሂደት ላይ ያሉ ዊዝድሮዋሎች የሚታገዱበት
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