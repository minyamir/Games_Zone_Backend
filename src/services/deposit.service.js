import { Transaction } from '../models/Transaction.model.js';
import { Wallet } from '../models/Wallet.model.js';
import { User } from '../models/User.model.js'; 
import { getIO } from '../sockets/socket.js'; 
import { getBotInstance } from '../bot/bot.js';

/**
 * 1. ተጠቃሚው የዲፖዚት ጥያቄ ሲልክ (Pending Transaction መፍጠር እና ለአድሚን በቅጽበት ማሳወቅ)
 */
export const createDepositRecord = async (user, amount, bankName, accountInfo) => {
  try {
    const wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) throw new Error('WALLET_NOT_FOUND');

    const transaction = await Transaction.create({
      user: user._id,
      wallet: wallet._id,
      type: 'deposit',
      amount,
      fee: 0,
      status: 'pending',
      description: `Deposit via ${bankName}`,
      metadata: {
        bankName,
        accountInfo
      }
    });

    // ⚡ Push real-time event to Admin Web Dashboard via Socket.io
    try {
      const io = getIO();
      io.emit('new_deposit_request', {
        transactionId: transaction._id,
        telegramId: user.telegramId,
        username: user.username || user.firstName,
        phoneNumber: user.phone || user.phoneNumber,
        amount,
        bankName,
        accountInfo,
        createdAt: transaction.createdAt
      });
    } catch (socketErr) {
      console.warn('⚠️ Socket emission skipped:', socketErr.message);
    }

    return transaction;
  } catch (err) {
    throw new Error('Error creating deposit transaction: ' + err.message);
  }
};

/**
 * 2. አድሚኑ ዲፖዚቱን ሲያጸድቅ ወደ Play Wallet መጨመር (ከ 10% ቦነስ፣ ከሶኬት እና ከቴሌግራም ቦት ማሳወቂያ ጋር)
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

    // 🎁 የ 10% ቦነስ ሎጅክ ስሌት (ዲፖዚቱ >= 50 ሲሆን)
    let creditAmount = transaction.amount;
    let bonusAmount = 0;

    if (transaction.amount >= 50) {
      bonusAmount = transaction.amount * 0.10; // 10% ቦነስ
      creditAmount += bonusAmount; // ዋናው ገንዘብ + 10% ቦነስ
    }

    // ⚡ የተሰላውን አጠቃላይ ገንዘብ (ከቦነስ ጋር) ወደ playWallet መጨመር
    wallet.playWallet += creditAmount;
    await wallet.save();

    // ትራንዛክሽኑን ወደ completed መቀየር እና የቦነስ መረጃዎችን በ metadata መመዝገብ
    transaction.status = 'completed';
    transaction.metadata = {
      ...transaction.metadata,
      baseAmount: transaction.amount,
      bonusAmount: bonusAmount,
      totalCredited: creditAmount,
      approvedBy: adminId,
      approvedAt: new Date()
    };
    await transaction.save();

    // የተጠቃሚውን ቋንቋ እና ቴሌግራም ID ማግኘት
    const userDoc = await User.findById(transaction.user);
    const lang = userDoc?.language || 'en'; 
    const telegramId = userDoc?.telegramId;

    let message = '';
    if (lang === 'am') { // አማርኛ
      message = `✅ ዲፖዚትዎ ጸድቋል!\n\nየላኩት: ${transaction.amount} ብር\nቦነስ (10%): ${bonusAmount} ብር\nአጠቃላይ የገባው: ${creditAmount} ብር\n\nወደ መጫወቻ ኪስዎ (Play Wallet) ገብቷል። መልካም ዕድል!`;
    } else if (lang === 'om') { // አፋርኛ / ኦሮምኛ
      message = `✅ Galii kee mirkanaa'eera!\n\nQarshii erge: ${transaction.amount}\nBuusii (10%): ${bonusAmount}\nWalumaagalatti: ${creditAmount}\n\nGara walalii taphaa keetti galchameera. Tapha gaarii!`;
    } else if (lang === 'so') { // ሶማልኛ
      message = `✅ Lacag-dhigashadiada waa la oggolaaday!\n\nLa diray: ${transaction.amount} ETB\nGunno (10%): ${bonusAmount} ETB\nWadarta guud: ${creditAmount} ETB\n\nWaa lagu shubay jeebkaaga ciyaarta. Nasiib wacan!`;
    } else { // እንግሊዝኛ (ነባሪ)
      message = `✅ Deposit Approved!\n\nAmount: ${transaction.amount} ETB\nBonus (10%): ${bonusAmount} ETB\nTotal Credited: ${creditAmount} ETB\n\nCredited to your play wallet. Good luck!`;
    }

    // 1. ለአድሚን ዳሽቦርድ በሶኬት ማሳወቅ
    try {
      const io = getIO();
      io.emit('deposit_resolved', {
        transactionId: transaction._id,
        status: 'completed',
        totalCredited: creditAmount,
        bonusAmount: bonusAmount
      });
    } catch (socketErr) {
      console.warn('⚠️ Admin Socket emission skipped:', socketErr.message);
    }

   
// 2. ለተጠቃሚው በቀጥታ በቴሌግራም ቦት (Telegram Bot API) ማሳወቂያ መላክ
    if (telegramId) {
      try {
        const bot = getBotInstance();
        if (bot) {
          // 👈 ከ bot.telegram.sendMessage ወደ bot.api.sendMessage እንለውጠዋለን (ልክ እንደ bot.js አጠቃቀምዎ)
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
    throw new Error('Error approving deposit: ' + err.message);
  }
};

/**
 * 3. አድሚኑ ዲፖዚቱን ውድቅ ሲያደርግ (Reject)
 */
export const rejectDepositService = async (transactionId, adminId) => {
  try {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction || transaction.type !== 'deposit') {
      throw new Error('DEPOSIT_TRANSACTION_NOT_FOUND');
    }

    if (transaction.status === 'completed' || transaction.status === 'rejected' || transaction.status === 'failed') {
      throw new Error('DEPOSIT_ALREADY_PROCESSED');
    }

    transaction.status = 'failed'; // 👈 Schema enum ለማስማማት
    transaction.metadata = {
      ...transaction.metadata,
      rejectedBy: adminId,
      rejectedAt: new Date()
    };
    await transaction.save();

    // ⚡ Broadcast failed status to admin web dashboard
    try {
      const io = getIO();
      io.emit('deposit_resolved', {
        transactionId: transaction._id,
        status: 'failed'
      });
    } catch (socketErr) {
      console.warn('⚠️ Socket emission skipped:', socketErr.message);
    }

    return { transaction };
  } catch (err) {
    throw new Error('Error rejecting deposit: ' + err.message);
  }
};