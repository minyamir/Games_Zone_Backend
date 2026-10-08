import { User } from '../../models/User.model.js';
import { getBackKeyboard, getMainMenuKeyboard } from '../keyboards.js';

// Helper function to fetch user language
const getUserLanguage = async (telegramId) => {
  try {
    const user = await User.findOne({ telegramId });
    return user?.language || 'am';
  } catch {
    return 'am';
  }
};

export const handleDepositCallback = async (botInstance, query, userStates) => {
  const data = query.data;
  const chatId = query.message?.chat?.id || query.chat?.id;
  const telegramId = String(query.from?.id);
  const bankName = data === 'deposit_telebirr' ? 'TeleBirr' : 'CBEBirr';

  const lang = await getUserLanguage(telegramId);
  userStates.set(telegramId, { type: 'deposit', step: 'WAITING_AMOUNT', bank: bankName, language: lang });

  // Multi-language text templates for deposit introduction
  const texts = {
    am: `🏦 **ባንክ: ${bankName}**\n\nእባክዎ ብሩን ወደዚህ ያስገቡ:\n👤 **ስም:** Selemon Mebrat\n👉 **ቁጥር:** ${bankName === 'TeleBirr' ? '0953839231' : '1000123456789'}\n\nያገባጉትን **የብር መጠን** ብቻ ይጻፉ:`,
    en: `🏦 **Bank: ${bankName}**\n\nPlease transfer money to:\n👤 **Name:** Selemon Mebrat\n👉 **Number:** ${bankName === 'TeleBirr' ? '0953839231' : '1000123456789'}\n\nEnter the **amount** you sent:`,
    om: `🏦 **Baankii: ${bankName}**\n\nMaaloo gara kanaatti dabarsaa:\n👤 **Maqaa:** Selemon Mebrat\n👉 **Lakkoofsa:** ${bankName === 'TeleBirr' ? '0953839231' : '1000123456789'}\n\nHaqa **herrega maallaqaa** ergitan qofa barreessaa:`,
    so: `🏦 **Bangiga: ${bankName}**\n\nFadlan lacagta u soo wareeji:\n👤 **Magaca:** Selemon Mebrat\n👉 **Lambarka:** ${bankName === 'TeleBirr' ? '0953839231' : '1000123456789'}\n\nGeli **qadarka lacagta** aad dirtay oo kaliya:`
  };

  const backKeyboardMarkup = getBackKeyboard(lang);

  await botInstance.api.sendMessage({ 
    chat_id: chatId, 
    text: texts[lang] || texts['am'], 
    parse_mode: 'Markdown',
    reply_markup: backKeyboardMarkup.reply_markup
  });
  
  if (query.id) await botInstance.api.answerCallbackQuery({ callback_query_id: query.id });
};

export const handleDepositMessage = async (ctx, telegramId, state, userStates) => {
  const lang = state.language || await getUserLanguage(telegramId);

  // Back button text translations
  const backTexts = {
    am: '🔙 ወደ ኋላ ተመለስ',
    en: '🔙 Back',
    om: '🔙 Duubatti Deebi\'i',
    so: '🔙 Dib u noqo'
  };

  if (ctx.message?.text === backTexts[lang] || ctx.message?.text === '🔙 ወደ ኋላ ተመለስ') {
    userStates.delete(telegramId);
    const mainMenuMarkup = getMainMenuKeyboard(lang);
    
    const menuTexts = {
      am: '🔙 ወደ ዋናው ሜኑ ተመለሰዋል:',
      en: '🔙 Returned to the main menu:',
      om: '🔙 Gara menuu guddaatti deebi\'ataniittu:',
      so: '🔙 Waxaad ku noqotay menu-ga główni:'
    };

    await ctx.reply(menuTexts[lang] || menuTexts['am'], mainMenuMarkup);
    return true;
  }

  const backKeyboardMarkup = getBackKeyboard(lang);

  if (state.step === 'WAITING_AMOUNT') {
    userStates.set(telegramId, { type: 'deposit', step: 'WAITING_SMS', bank: state.bank, amount: ctx.message.text, language: lang });
    
    const promptTexts = {
      am: `መጠን: ${ctx.message.text} ETB\n\nእባክዎ የባንክ SMS ማረጋገጫ (Tx Ref) ይላኩ:`,
      en: `Amount: ${ctx.message.text} ETB\n\nPlease send the Bank SMS confirmation (Tx Ref):`,
      om: `Hanga: ${ctx.message.text} ETB\n\nMaaloo mirkaneessa SMS baankii (Tx Ref) ergai:`,
      so: `Cadadka: ${ctx.message.text} ETB\n\nFadlan soo dir xaqiijinta SMS-ka bangiga (Tx Ref):`
    };

    await ctx.reply(promptTexts[lang] || promptTexts['am'], {
      reply_markup: backKeyboardMarkup.reply_markup
    });
    return true;
    
  } else if (state.step === 'WAITING_SMS') {
    userStates.delete(telegramId);
    
    const mainMenuMarkup = getMainMenuKeyboard(lang);
    const successTexts = {
      am: `✅ የክፍያ ጥያቄዎ ተመዝግቧል! አስተዳዳሪው ያረጋግጥለታል።`,
      en: `✅ Your deposit request has been submitted! An admin will verify it.`,
      om: `✅ Gaaffiin kaffaltii keessan galmeeffameera! Bulchaan ni mirkaneessa.`,
      so: `✅ Codsigaaga dhigashada waa la gudbiyay! Maamuluhu wuu xaqiijin doonaa.`
    };

    await ctx.reply(successTexts[lang] || successTexts['am'], mainMenuMarkup);
    return true;
  }
  
  return false;
};