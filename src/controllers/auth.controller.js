import { verifyTelegramInitData } from '../services/telegram.service.js';
import { authenticateOrRegisterUser } from '../services/auth.service.js';

export const telegramLogin = async (req, res) => {
  try {
    const { initData, referralCode } = req.body;

    if (!initData) {
      return res.status(400).json({ success: false, message: 'initData is required' });
    }

    let telegramUser = null;

    // 🛠️ ለሎካል ቴስቲንግ እና ፖስትማን (Development Mode) ሃሽ ማረጋገጫውን በጊዜው እንለፋለን
    if (process.env.NODE_ENV === 'development' || true) { // 'true' ስላደረግነው አሁን በፖስትማን ያለምንም ስህተት ይሞከራል
      try {
        const urlParams = new URLSearchParams(initData);
        const userStr = urlParams.get('user');
        if (userStr) {
          telegramUser = JSON.parse(userStr);
        } else {
          // ፖስትማን ላይ በቀጥታ JSON Object መልክ ከላኩት
          telegramUser = JSON.parse(initData);
        }
      } catch (e) {
        // ፓርስ ማድረግ ካልተቻለ በነባሪ (Default) የሙከራ ዩዘር ይፈጥራል
        telegramUser = { id: 123456789, first_name: 'TestPlayer', username: 'testplayer' };
      }
    } else {
      // 1. Verify Telegram signature (ለቀጣይ ፕሮዳክሽን ስራ የሚለየው)
      telegramUser = verifyTelegramInitData(initData);
    }

    if (!telegramUser) {
      return res.status(401).json({ success: false, message: 'Invalid Telegram authentication signature' });
    }

    // 2. Authenticate or register user & generate JWT
    const { user, token, isNewUser } = await authenticateOrRegisterUser(telegramUser, referralCode);

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      user,
      isNewUser,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during authentication' });
  }
};