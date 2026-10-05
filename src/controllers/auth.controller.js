import { verifyTelegramInitData } from '../services/telegram.service.js';
import { authenticateOrRegisterUser } from '../services/auth.service.js';

export const telegramLogin = async (req, res) => {
  try {
    const { initData, referralCode } = req.body;

    if (!initData) {
      return res.status(400).json({ success: false, message: 'initData is required' });
    }

    // 1. Verify Telegram signature
    const telegramUser = verifyTelegramInitData(initData);
    if (!telegramUser) {
      return res.status(401).json({ success: false, message: 'Invalid Telegram authentication signature' });
    }

    // 2. Authenticate or register user & generate JWT
    const { user, token } = await authenticateOrRegisterUser(telegramUser, referralCode);

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during authentication' });
  }
};