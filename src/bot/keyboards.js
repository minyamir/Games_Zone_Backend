// ስልክ ቁጥር ለማጋራት የሚያስችል ኪቦርድ
export const phoneRequestKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: '📱 ለመመዝገብ ስልክ ቁጥር ያጋሩ', request_contact: true }]
    ],
    resize_keyboard: true,
    one_time_keyboard: true,
  },
};

// ዋናው የሜኑ ቁልፍ ሰሌዳ (ከኖትቡኩ የተወሰደ)
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

// '🎮 ጌም ጨወቱ (PLAY)' ሲጫን ሚኒ አፑን እንዲከፍት የሚደረግ የኢንላይን ቁልፍ
export const playWebAppKeyboard = (miniAppUrl) => {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🎮 አሁኑኑ ይጫወቱ (Play Bingo)',
            web_app: { url: miniAppUrl }
          }
        ]
      ]
    }
  };
};

// የታችኛው ሜኑ ሲዘጋ የሚታየው የ 'ወደ ኋላ ተመለስ' ኪቦርድ
export const backKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: '🔙 ወደ ኋላ ተመለስ' }]
    ],
    resize_keyboard: true,
    is_persistent: true,
  },
};