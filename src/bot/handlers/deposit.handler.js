import { User } from '../../models/User.model.js';
import { getBackKeyboard, getMainMenuKeyboard } from '../keyboards.js';
import { handleDepositSubmission } from '../../controllers/deposit.controller.js';

// Helper function to fetch user language with performance optimization (.lean())
const getUserLanguage = async (telegramId) => {
  try {
    const user = await User.findOne({ telegramId }).lean();
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
    const amount = Number(ctx.message.text);
    if (isNaN(amount) || amount <= 0) {
      const errorTexts = {
        am: '⚠️ እባክዎ ትክክለኛ የብር መጠን ያስገቡ:',
        en: '⚠️ Please enter a valid amount:',
        om: '⚠️ Maaloo hanga maallaqaa sirrii galchaa:',
        so: '⚠️ Fadlan geli cadad lacag sax ah:'
      };
      await ctx.reply(errorTexts[lang] || errorTexts['am']);
      return true;
    }

    userStates.set(telegramId, { 
      type: 'deposit', 
      step: 'WAITING_SMS', 
      bank: state.bank, 
      amount: amount, 
      language: lang 
    });
    
    const promptTexts = {
      am: `መጠን: ${amount} ETB\n\nእባክዎ የባንክ SMS ማረጋገጫ (Tx Ref) ይላኩ:`,
      en: `Amount: ${amount} ETB\n\nPlease send the Bank SMS confirmation (Tx Ref):`,
      om: `Hanga: ${amount} ETB\n\nMaaloo mirkaneessa SMS baankii (Tx Ref) ergai:`,
      so: `Cadadka: ${amount} ETB\n\nFadlan soo dir xaqiijinta SMS-ka bangiga (Tx Ref):`
    };

    await ctx.reply(promptTexts[lang] || promptTexts['am'], {
      reply_markup: backKeyboardMarkup.reply_markup
    });
    return true;
    
  } else if (state.step === 'WAITING_SMS') {
    const txRef = ctx.message.text;

    try {
      // ⚡ 1. Controller በመጥራት ዳታቤዝ ላይ የዲፖዚት ትራንዛክሽን መመዝገብ
      await handleDepositSubmission(telegramId, state.amount, state.bank, { txRef });

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
    } catch (err) {
      userStates.delete(telegramId);
      const mainMenuMarkup = getMainMenuKeyboard(lang);
      
      const errTexts = {
        am: '⚠️ ስህተት አጋጥሟል። እባክዎ እንደገና ይሞክሩ።',
        en: '⚠️ An error occurred. Please try again later.',
        om: '⚠️ Dogoggorri uumameera. Maaloo irra deebofaa yaalaa.',
        so: '⚠️ Khalad ayaa dhacay. Fadlan markale dib u day.'
      };
      await ctx.reply(errTexts[lang] || errTexts['am'], mainMenuMarkup);
      return true;
    }
  }
  
  return false;
};