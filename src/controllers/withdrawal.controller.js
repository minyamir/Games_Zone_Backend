import { User } from '../models/User.model.js';
// ⚡ ከ withdrawal.service ፈንታ ከ wallet.service እንዲያመጣ ማድረግ
import { processWithdrawalService } from '../services/withdrawal.service.js';

export const handleWithdrawalSubmission = async (telegramId, amount, bankName, accountInfo) => {
  try {
    const user = await User.findOne({ telegramId }).lean();
    if (!user) throw new Error('USER_NOT_FOUND');

    const result = await processWithdrawalService(user, amount, bankName, accountInfo);
    return result;
  } catch (err) {
    console.error('❌ Error in withdrawal controller:', err);
    throw err;
  }
};