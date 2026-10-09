import { User } from '../models/User.model.js';
import { createDepositRecord } from '../services/deposit.service.js';

/**
 * Handle user deposit request process from bot/handlers
 */
export const handleDepositSubmission = async (telegramId, amount, bankName, accountInfo) => {
  try {
    // ⚡ 1. Find user lean for performance
    const user = await User.findOne({ telegramId }).lean();
    if (!user) throw new Error('USER_NOT_FOUND');

    // ⚡ 2. Call deposit service using the updated schema-aligned structure
    const transaction = await createDepositRecord(user, amount, bankName, accountInfo);
    
    return { user, transaction };
  } catch (err) {
    console.error('❌ Error in deposit controller:', err);
    throw err;
  }
};