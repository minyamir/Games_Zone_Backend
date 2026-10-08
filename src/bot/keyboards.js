export const phoneRequestKeyboard = (lang = 'am') => {
  const texts = {
    am: '📱 ለመመዝገብ ስልክ ቁጥር ያጋሩ',
    en: '📱 Share phone number to register',
    om: '📱 Galmaa\'uuf lakkoofsa bilbilaa qoodaa',
    so: '📱 La wadaag lambarka telefoonka si aad u diiwangeliso'
  };
  return {
    reply_markup: {
      keyboard: [
        [{ text: texts[lang] || texts['am'], request_contact: true }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  };
};


export const getMainMenuKeyboard = (lang = 'am') => {
  const menus = {
    am: [
      [{ text: '🎮 ጌም ጨወቱ (PLAY)' }],
      [{ text: '👤 ፕሮፋይል' }, { text: '💰 ሒሳብ' }],
      [{ text: '📥 ገቢ (Deposit)' }, { text: '📤 ወጪ (Withdraw)' }],
      [{ text: '🔗 ጋብዝ & አግኝ' }, { text: '📢 ድርጅቱን አስተዋውቅ' }],
      [{ text: '🎁 ፕሮሞ ኮድ' }, { text: '🌐 ቋንቋ (Language)' }],
      [{ text: '📖 መመሪያ' }, { text: '🆘 እርዳታ' }, { text: '📜 ደንቦች' }]
    ],
    en: [
      [{ text: '🎮 Play Game' }],
      [{ text: '👤 Profile' }, { text: '💰 Account' }],
      [{ text: '📥 Deposit' }, { text: '📤 Withdraw' }],
      [{ text: '🔗 Invite & Earn' }, { text: '📢 Promote' }],
      [{ text: '🎁 Promo Code' }, { text: '🌐 Language' }],
      [{ text: '📖 Guide' }, { text: '🆘 Help' }, { text: '📜 Rules' }]
    ],
    om: [
      [{ text: '🎮 Taphocha Taphadhuu (PLAY)' }],
      [{ text: '👤 Proofaayilii' }, { text: '💰 Herrega' }],
      [{ text: '📥 Galii (Deposit)' }, { text: '📤 Baasii (Withdraw)' }],
      [{ text: '🔗 Affeerii' }, { text: '📢 Beeksisaa' }],
      [{ text: '🎁 Koodii Promo' }, { text: '🌐 Afaan (Language)' }],
      [{ text: '📖 Qajeelfama' }, { text: '🆘 Gargaarsa' }, { text: '📜 Seerota' }]
    ],
    so: [
      [{ text: '🎮 Ciyaar (PLAY)' }],
      [{ text: '👤 Profile' }, { text: '💰 Xisaabta' }],
      [{ text: '📥 Dhigasho' }, { text: '📤 Kala bixid' }],
      [{ text: '🔗 Casuuno' }, { text: '📢 Xayeysii' }],
      [{ text: '🎁 Promo Code' }, { text: '🌐 Luuqada (Language)' }],
      [{ text: '📖 Hagaha' }, { text: '🆘 Caawin' }, { text: '📜 Xeerarka' }]
    ]
  };

  return {
    reply_markup: {
      keyboard: menus[lang] || menus['am'],
      resize_keyboard: true,
      is_persistent: true,
    },
  };
};


export const mainMenuKeyboard = getMainMenuKeyboard('am');


export const playWebAppKeyboard = (miniAppUrl, lang = 'am') => {
  const texts = {
    am: '🎮 አሁኑኑ ይጫወቱ (Play Bingo)',
    en: '🎮 Play Now (Play Bingo)',
    om: '🎮 Ammaan Taphadhu (Play Bingo)',
    so: '🎮 Hadda Ciyaar (Play Bingo)'
  };
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: texts[lang] || texts['am'],
            web_app: { url: miniAppUrl }
          }
        ]
      ]
    }
  };
};


export const getBackKeyboard = (lang = 'am') => {
  const texts = {
    am: '🔙 ወደ ኋላ ተመለስ',
    en: '🔙 Back',
    om: '🔙 Duubatti Deebi\'i',
    so: '🔙 Dib u noqo'
  };
  return {
    reply_markup: {
      keyboard: [
        [{ text: texts[lang] || texts['am'] }]
      ],
      resize_keyboard: true,
      is_persistent: true,
    },
  };
};

export const backKeyboard = getBackKeyboard('am');