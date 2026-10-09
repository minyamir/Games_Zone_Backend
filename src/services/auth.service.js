import crypto from 'crypto';
import { User } from '../models/User.model.js';
import { Wallet } from '../models/Wallet.model.js';
import { Transaction } from '../models/Transaction.model.js';
import { generateToken } from '../utils/generateToken.js';

export const authenticateOrRegisterUser = async (telegramUser, referralCodeInput = null) => {
  const telegramId = String(telegramUser.id);

  let user = await User.findOne({ telegramId });
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    // 1. ልዩ የሪፈራል ኮድ ማመንጨት
    const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    let referredBy = null;
    if (referralCodeInput) {
      const referrer = await User.findOne({ referralCode: referralCodeInput });
      if (referrer) {
        referredBy = referrer._id;
      }
    }

    // 2. ተጠቃሚውን መፍጠር
    user = await User.create({
      telegramId,
      firstName: telegramUser.first_name || 'Player',
      lastName: telegramUser.last_name || '',
      username: telegramUser.username || `user_${telegramId}`,
      photoUrl: telegramUser.photo_url || '',
      referralCode,
      referredBy,
    });

    // 3. ⚡ የዋሌት መዝገብ መፍጠር እና የ 100 ETB የምዝገባ ቦነስ ወደ playWallet ማስገባት
    const registrationBonus = 100;
    const wallet = await Wallet.create({
      user: user._id,
      mainWallet: 0,                // ማውጣት የሚቻለው ጨዋታ አሸንፎ ሲገኝ ብቻ ነው
      playWallet: registrationBonus, // 🎁 የምዝገባ ቦነስ ወደ Play Wallet ይገባል (ማውጣት አይቻልም)
      lockedBalance: 0,
      currency: 'ETB',
    });

    // 4. የቦነሱን ትራንዛክሽን መመዝገብ
    await Transaction.create({
      user: user._id,
      wallet: wallet._id,
      type: 'bonus',
      amount: registrationBonus,
      status: 'completed',
      description: 'Welcome registration bonus credited to Play Wallet',
    });

  } else {
    // ተጠቃሚው ቀድሞ ካለ የመጨረሻ የመግቢያ ሰዓቱን እና መረጃዎቹን ማዘመን
    user.lastLoginAt = new Date();
    user.firstName = telegramUser.first_name || user.firstName;
    user.lastName = telegramUser.last_name || user.lastName;
    user.username = telegramUser.username || user.username;
    await user.save();
  }

  // 5. የ JWT ቶከን ማመንጨት
  const token = generateToken(user);

  return { user, token, isNewUser };
};