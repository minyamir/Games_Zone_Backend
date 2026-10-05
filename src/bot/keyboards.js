export const phoneRequestKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: '📱 ለመመዝገብ ስልክ ቁጥር ያጋሩ', request_contact: true }]
    ],
    resize_keyboard: true,
    one_time_keyboard: true,
  },
};

// በምስሉ ላይ የሚታየው ዋናው የሜኑ ቁልፍ ሰሌዳ
export const mainMenuKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: '🎮 ጌም ጨወቱ (PLAY)' }],
      [{ text: '👤 ፕሮፋይል' }, { text: '💰 ሒሳብ' }],
      [{ text: '📥 ገቢ (Deposit)' }, { text: '📤 ወጪ (Withdraw)' }],
      [{ text: '🔗 ጋብዝ & አግኝ' }, { text: '📢 ድርጅቱን አስተዋውቅ' }],
      [{ text: '🎁 ፕሮሞ ኮድ' }, { text: '🌐 ቋንቋ (Language)' }],
      [{ text: '📖 መመሪያ' }, { text: '🆘 እርዳታ' }, { text: '📜 ደንቦች' }]
    ],
    resize_keyboard: true,
    is_persistent: true,
  },
};