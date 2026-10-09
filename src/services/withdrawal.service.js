import { Transaction } from '../models/Transaction.model.js';
import { Wallet } from '../models/Wallet.model.js';

export const processWithdrawalService = async (user, amount, bankName, accountInfo) => {
  // ⚡ Dual-wallet check: Withdrawals are strictly deducted from mainWallet (winnings only)
  const wallet = await Wallet.findOne({ user: user._id });
  if (!wallet || (wallet.mainWallet || 0) < amount) {
    throw new Error('INSUFFICIENT_MAIN_BALANCE'); // ከ Main Wallet ውጪ ማውጣት አይቻልም
  }

  // Deduct from mainWallet and lock it in lockedBalance pending admin approval
  wallet.mainWallet -= amount;
  wallet.lockedBalance = (wallet.lockedBalance || 0) + amount;
  await wallet.save();

  // Create withdrawal transaction record
  const transaction = await Transaction.create({
    user: user._id,
    wallet: wallet._id,
    type: 'withdrawal',
    amount,
    fee: 0,
    status: 'pending',
    description: `Withdrawal request of ${amount} ETB to ${bankName}`,
    metadata: {
      bankName,
      accountInfo
    }
  });

  return { wallet, transaction };
};