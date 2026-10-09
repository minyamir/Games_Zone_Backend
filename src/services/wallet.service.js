import { Wallet } from '../models/Wallet.model.js';
import { Transaction } from '../models/Transaction.model.js';

/**
 * 🎁 ምዝገባ ሲያደርግ ወይም ሪፈራል ቦነስ ሲያገኝ ወደ Play Wallet ማስገባት
 */
export const creditPlayWalletService = async (userId, amount, type, description) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId, mainWallet: 0, playWallet: 0 });
  }

  // ቦነሱ የሚገባው ወደ playWallet ነው (ማውጣት አይቻልም)
  wallet.playWallet += amount;
  await wallet.save();

  // ትራንዛክሽን መመዝገብ
  await Transaction.create({
    user: userId,
    wallet: wallet._id,
    type: type || 'bonus',
    amount,
    status: 'completed',
    description: description || 'Bonus credited to Play Wallet'
  });

  return wallet;
};

/**
 * 🏆 ጨዋታ ሲያሸንፍ (Win Game) ወደ Main Wallet ማዛወር (ማውጣት የሚችለው)
 */
export const creditMainWalletService = async (userId, winningsAmount) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId, mainWallet: 0, playWallet: 0 });
  }

  // አሸናፊው ገንዘብ ወደ mainWallet ይገባል
  wallet.mainWallet += winningsAmount;
  await wallet.save();

  // ትራንዛክሽን መመዝገብ
  await Transaction.create({
    user: userId,
    wallet: wallet._id,
    type: 'game_win',
    amount: winningsAmount,
    status: 'completed',
    description: 'Game win payout credited to Main Wallet'
  });

  return wallet;
};

/**
 * 🎮 ጨዋታ ሲጫወት (Bet/Entry Fee) ከ Play Wallet መቀነስ
 */
export const deductPlayWalletService = async (userId, betAmount) => {
  const wallet = await Wallet.findOne({ user: userId });
  if (!wallet || wallet.playWallet < betAmount) {
    throw new Error('INSUFFICIENT_PLAY_WALLET_BALANCE');
  }

  wallet.playWallet -= betAmount;
  await wallet.save();

  await Transaction.create({
    user: userId,
    wallet: wallet._id,
    type: 'game_bet',
    amount: betAmount,
    status: 'completed',
    description: 'Game entry fee deducted from Play Wallet'
  });

  return wallet;
};