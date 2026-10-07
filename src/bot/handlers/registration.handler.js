import { User } from '../../models/User.model.js';
import { Wallet } from '../../models/Wallet.model.js';
import crypto from 'crypto';

export const handleRegistrationProcess = async (ctx, phoneNumber, referralCode = null) => {
  try {
    const telegramId = String(ctx.from?.id);
    const firstName = ctx.from?.first_name || 'Player';
    const username = ctx.from?.username || `user_${telegramId}`;

    let user = await User.findOne({ telegramId });
    if (user) {
      user.phoneNumber = phoneNumber;
      await user.save();
    } else {
      let referrerId = null;
      if (referralCode) {
        const referrer = await User.findOne({ referralCode }).lean();
        if (referrer) referrerId = referrer._id;
      }

      const newReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase();

      user = await User.create({
        telegramId,
        phoneNumber,
        firstName,
        username,
        referralCode: newReferralCode,
        referredBy: referrerId
      });

      await Wallet.create({
        user: user._id,
        balance: 0,
        lockedBalance: 0,
        bonusBalance: 0,
        currency: 'ETB'
      });
    }

    return user;
  } catch (err) {
    console.error('❌ Error in registration.handler:', err);
    throw err;
  }
};