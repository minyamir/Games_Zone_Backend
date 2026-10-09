import { Transaction } from '../models/Transaction.model.js';
import { Wallet } from '../models/Wallet.model.js';

export const processWithdrawalService = async (user, amount, bankName, accountInfo) => {
  const wallet = await Wallet.findOne({ user: user._id });
  if (!wallet || wallet.balance < amount) {
    throw new Error('INSUFFICIENT_BALANCE');
  }

  wallet.balance -= amount;
  wallet.lockedBalance = (wallet.lockedBalance || 0) + amount;
  await wallet.save();

  const transaction = await Transaction.create({
    user: user._id,
    wallet: wallet._id,
    type: 'withdrawal',
    amount,
    fee: 0,
    status: 'pending',
    description: `Withdrawal request to ${bankName}`,
    metadata: {
      bankName,
      accountInfo
    }
  });

  return { wallet, transaction };
};