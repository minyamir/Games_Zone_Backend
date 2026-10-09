import { Transaction } from '../models/Transaction.model.js';
import { Wallet } from '../models/Wallet.model.js';

export const createDepositRecord = async (user, amount, bankName, accountInfo) => {
  try {
    // ⚡ የተጠቃሚውን የኪስ ቦርሳ (Wallet) ማግኘት ግዴታ ነው
    const wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) throw new Error('WALLET_NOT_FOUND');

    const transaction = await Transaction.create({
      user: user._id,
      wallet: wallet._id,
      type: 'deposit', // ሞዴሉ ላይ እንዳለው በትንንሾቹ (lowercase) ፊደላት
      amount,
      fee: 0,
      status: 'pending',
      description: `Deposit via ${bankName}`,
      metadata: {
        bankName,
        accountInfo
      }
    });

    return transaction;
  } catch (err) {
    throw new Error('Error creating deposit transaction: ' + err.message);
  }
};