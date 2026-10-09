import { User } from '../models/User.model.js';
import { processWithdrawalService } from '../services/withdrawal.service.js';

export const handleWithdrawalSubmission = async (telegramId, amount, bankName, accountInfo) => {
  try {
    const user = await User.findOne({ telegramId }).lean();
    if (!user) throw new Error('USER_NOT_FOUND');

    const result = await processWithdrawalService(user, amount, bankName, accountInfo);
    return result;
  } catch (err) {
    // 💡 Avoid logging expected business logic validation errors as severe server crashes
    if (err.message !== 'INSUFFICIENT_MAIN_BALANCE' && err.message !== 'USER_NOT_FOUND') {
      console.error('❌ Error in withdrawal controller:', err);
    }
    throw err;
  }
};