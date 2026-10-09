import { Transaction } from '../models/Transaction.model.js';
import { Wallet } from '../models/Wallet.model.js';

/**
 * 1. ተጠቃሚው የዲፖዚት ጥያቄ ሲልክ (Pending Transaction መፍጠር)
 */
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

/**
 * 2. አድሚኑ ዲፖዚቱን ሲያጸድቅ ወደ Play Wallet መጨመር
 */
export const approveDepositService = async (transactionId, adminId) => {
  try {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction || transaction.type !== 'deposit') {
      throw new Error('DEPOSIT_TRANSACTION_NOT_FOUND');
    }

    if (transaction.status === 'completed') {
      throw new Error('DEPOSIT_ALREADY_APPROVED');
    }

    let wallet = await Wallet.findOne({ user: transaction.user });
    if (!wallet) {
      wallet = await Wallet.create({ user: transaction.user, mainWallet: 0, playWallet: 0 });
    }

    // ⚡ ቁልፉ ህግ፡ ዲፖዚት የተደረገው ገንዘብ የሚገባው ወደ playWallet ነው (mainWallet አይደለም!)
    wallet.playWallet += transaction.amount;
    await wallet.save();

    // ትራንዛክሽኑን ወደ completed መቀየር
    transaction.status = 'completed';
    transaction.metadata = {
      ...transaction.metadata,
      approvedBy: adminId,
      approvedAt: new Date()
    };
    await transaction.save();

    return { wallet, transaction };
  } catch (err) {
    throw new Error('Error approving deposit: ' + err.message);
  }
};