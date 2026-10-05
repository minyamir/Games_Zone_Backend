import crypto from 'crypto';
import { User } from '../models/User.model.js';
import { Wallet } from '../models/Wallet.model.js';
import { generateToken } from '../utils/generateToken.js';

export const authenticateOrRegisterUser = async (telegramUser, referralCodeInput = null) => {
  const telegramId = String(telegramUser.id);

  let user = await User.findOne({ telegramId });

  if (!user) {
    // Generate unique referral code for the new user
    const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    let referredBy = null;
    if (referralCodeInput) {
      const referrer = await User.findOne({ referralCode: referralCodeInput });
      if (referrer) {
        referredBy = referrer._id;
      }
    }

    // Create User
    user = await User.create({
      telegramId,
      firstName: telegramUser.first_name || 'Player',
      lastName: telegramUser.last_name || '',
      username: telegramUser.username || `user_${telegramId}`,
      photoUrl: telegramUser.photo_url || '',
      referralCode,
      referredBy,
    });

    // Create associated Wallet
    await Wallet.create({
      user: user._id,
      balance: 0,
      lockedBalance: 0,
      bonusBalance: 0,
      currency: 'ETB',
    });
  } else {
    // Update last login details
    user.lastLoginAt = new Date();
    user.firstName = telegramUser.first_name || user.firstName;
    user.lastName = telegramUser.last_name || user.lastName;
    user.username = telegramUser.username || user.username;
    await user.save();
  }

  // Generate JWT session token
  const token = generateToken(user);

  return { user, token };
};