import crypto from 'crypto';
import { telegramConfig } from '../config/telegram.js';

export const verifyTelegramInitData = (initDataString) => {
  if (!initDataString) return null;

  try {
    const urlParams = new URLSearchParams(initDataString);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    // Sort parameters alphabetically as required by Telegram's spec
    const paramsList = [];
    urlParams.sort();
    for (const [key, value] of urlParams.entries()) {
      paramsList.push(`${key}=${value}`);
    }
    const dataCheckString = paramsList.join('\n');

    // Create secret key using HMAC-SHA256 with "WebAppData" and bot token
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(telegramConfig.botToken)
      .digest();

    // Calculate hash to compare against Telegram's hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      return null; // Invalid signature
    }

    // Extract the embedded user object
    const userJson = urlParams.get('user');
    if (!userJson) return null;

    return JSON.parse(userJson);
  } catch (error) {
    console.error('Telegram verification exception:', error.message);
    return null;
  }
};