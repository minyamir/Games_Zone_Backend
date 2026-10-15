import { Transaction } from '../models/Transaction.model.js';
import { Wallet } from '../models/Wallet.model.js';
import { User } from '../models/User.model.js'; // ⚡ ተጠቃሚውን ለማግኘት
import { getIO } from '../sockets/socket.js'; // ⚡ Real-time Socket instance
import { getBotInstance } from '../bot/bot.js'; // ⚡ የቴሌግራም ቦት ኢንስታንስ ለማግኘት

/**
 * 1. ተጠቃሚው የገንዘብ ማውጫ ጥያቄ ሲልክ
 */
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

  // ⚡ Push real-time event to Admin Web Dashboard via Socket.io
  try {
    const io = getIO();
    io.emit('new_withdrawal_request', {
      transactionId: transaction._id,
      telegramId: user.telegramId,
      username: user.username || user.firstName,
      amount,
      bankName,
      accountInfo,
      createdAt: transaction.createdAt
    });
  } catch (socketErr) {
    console.warn('⚠️ Socket emission skipped:', socketErr.message);
  }

  return { wallet, transaction };
};

/**
 * 2. አድሚኑ የዊዝድሮዋል ጥያቄውን ሲያጸድቅ (Approve)
 */
export const approveWithdrawalService = async (transactionId, adminId) => {
  try {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction || transaction.type !== 'withdrawal') {
      throw new Error('WITHDRAWAL_TRANSACTION_NOT_FOUND');
    }

    if (transaction.status === 'completed') {
      throw new Error('WITHDRAWAL_ALREADY_APPROVED');
    }

    const wallet = await Wallet.findOne({ user: transaction.user });
    if (!wallet) throw new Error('WALLET_NOT_FOUND');

    // ከ Locked Balance መቀነስ (ገንዘቡ ለአድሚን ስለተላለፈ)
    if (wallet.lockedBalance >= transaction.amount) {
      wallet.lockedBalance -= transaction.amount;
    } else {
      wallet.lockedBalance = 0;
    }
    await wallet.save();

    // ትራንዛክሽኑን ወደ completed መቀየር
    transaction.status = 'completed';
    transaction.metadata = {
      ...transaction.metadata,
      approvedBy: adminId,
      approvedAt: new Date()
    };
    await transaction.save();

    // ⚡ የተጠቃሚውን ቋንቋ እና ቴሌግራም ID ማግኘት
    const userDoc = await User.findById(transaction.user);
    const lang = userDoc?.language || 'en'; 
    const telegramId = userDoc?.telegramId;
    const bankName = transaction.metadata?.bankName || 'Bank';

    let message = '';
    if (lang === 'am') {
      message = `✅ የገንዘብ ማውጫ (Withdrawal) ጥያቄዎ ጸድቋል!\n\nየተወጣው መጠን: ${transaction.amount} ብር\nባንክ: ${bankName}\n\nገንዘቡ ወደ አካውንትዎ ተልኳል። እናመሰግናለን!`;
    } else if (lang === 'om') {
      message = `✅ Gaaffiin baasii maallaqa kee mirkanaa'eera!\n\nQarshiin baafame: ${transaction.amount}\nBaankii: ${bankName}\n\nMaallaqni gara herrega keetti ergamaa jira. Galatoomaa!`;
    } else if (lang === 'so') {
      message = `✅ Codsigaaga lacag kala bixashada waa la oggolaaday!\n\nLacagta la bixiyay: ${transaction.amount} ETB\nBangiga: ${bankName}\n\nLacagtii waa la kuu diray. Waad mahadsan tahay!`;
    } else {
      message = `✅ Withdrawal Request Approved!\n\nAmount: ${transaction.amount} ETB\nBank: ${bankName}\n\nFunds have been sent to your account. Thank you!`;
    }

    // ⚡ Broadcast resolved status to admin web dashboard
    try {
      const io = getIO();
      io.emit('withdrawal_resolved', {
        transactionId: transaction._id,
        status: 'completed'
      });
    } catch (socketErr) {
      console.warn('⚠️ Admin Socket emission skipped:', socketErr.message);
    }

    // ⚡ ለተጠቃሚው በቴሌግራም ቦት በኩል ማሳወቂያ መላክ
    if (telegramId) {
      try {
        const bot = getBotInstance();
        if (bot) {
          await bot.api.sendMessage({
            chat_id: telegramId,
            text: message
          });
        }
      } catch (tgErr) {
        console.warn('⚠️ Telegram bot message sending failed:', tgErr.message);
      }
    }

    return { wallet, transaction };
  } catch (err) {
    throw new Error('Error approving withdrawal: ' + err.message);
  }
};

/**
 * 3. አድሚኑ የዊዝድሮዋል ጥያቄውን ውድቅ ሲያደርግ (Reject - ገንዘቡን ወደ Main Wallet መለስ)
 */
export const rejectWithdrawalService = async (transactionId, adminId) => {
  try {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction || transaction.type !== 'withdrawal') {
      throw new Error('WITHDRAWAL_TRANSACTION_NOT_FOUND');
    }

    if (transaction.status === 'completed' || transaction.status === 'rejected') {
      throw new Error('WITHDRAWAL_ALREADY_PROCESSED');
    }

    const wallet = await Wallet.findOne({ user: transaction.user });
    if (!wallet) throw new Error('WALLET_NOT_FOUND');

    // ውድቅ ሲደረግ ከ Locked Balance አንስተው ተመልሶ ወደ Main Wallet ይጨመራል
    if (wallet.lockedBalance >= transaction.amount) {
      wallet.lockedBalance -= transaction.amount;
    } else {
      wallet.lockedBalance = 0;
    }
    wallet.mainWallet += transaction.amount;
    await wallet.save();

    transaction.status = 'rejected';
    transaction.metadata = {
      ...transaction.metadata,
      rejectedBy: adminId,
      rejectedAt: new Date()
    };
    await transaction.save();

    // ⚡ የተጠቃሚውን ቋንቋ እና ቴሌግራም ID ማግኘት
    const userDoc = await User.findById(transaction.user);
    const lang = userDoc?.language || 'en'; 
    const telegramId = userDoc?.telegramId;

    let message = '';
    if (lang === 'am') {
      message = `❌ የገንዘብ ማውጫ (Withdrawal) ጥያቄዎ ውድቅ ተደርጓል!\n\n${transaction.amount} ብር ወደ ዋና ኪስ ቦርሳዎ (Main Wallet) ተመልሷል።`;
    } else if (lang === 'om') {
      message = `❌ Gaaffiin baasii maallaqa kee hin fudhatamne!\n\nQarshiin ${transaction.amount} gara walalii guddaatti (Main Wallet) deebi'eera.`;
    } else if (lang === 'so') {
      message = `❌ Codsigaaga lacag kala bixashada waa la diiday!\n\n${transaction.amount} ETB ayaa lagugu soo celiyay jeebkaaga ugu weyn.`;
    } else {
      message = `❌ Withdrawal Request Rejected!\n\n${transaction.amount} ETB has been refunded back to your main wallet.`;
    }

    // ⚡ Broadcast rejected status to admin web dashboard
    try {
      const io = getIO();
      io.emit('withdrawal_resolved', {
        transactionId: transaction._id,
        status: 'rejected'
      });
    } catch (socketErr) {
      console.warn('⚠️ Admin Socket emission skipped:', socketErr.message);
    }

    // ⚡ ለተጠቃሚው በቴሌግራም ቦት በኩል የማስተባበያ ማሳወቂያ መላክ
    if (telegramId) {
      try {
        const bot = getBotInstance();
        if (bot) {
          await bot.api.sendMessage({
            chat_id: telegramId,
            text: message
          });
        }
      } catch (tgErr) {
        console.warn('⚠️ Telegram bot message sending failed:', tgErr.message);
      }
    }

    return { wallet, transaction };
  } catch (err) {
    throw new Error('Error rejecting withdrawal: ' + err.message);
  }
};