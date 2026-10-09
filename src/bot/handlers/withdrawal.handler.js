import { User } from '../../models/User.model.js';
import { getBackKeyboard, getMainMenuKeyboard } from '../keyboards.js';
import { handleWithdrawalSubmission } from '../../controllers/withdrawal.controller.js';

// Helper function to fetch user language
const getUserLanguage = async (telegramId) => {
  try {
    const user = await User.findOne({ telegramId }).lean();
    return user?.language || 'am';
  } catch {
    return 'am';
  }
};

export const handleWithdrawalCallback = async (botInstance, query, userStates) => {
  const data = query.data;
  const chatId = query.message?.chat?.id || query.chat?.id;
  const telegramId = String(query.from?.id);
  const bankName = data === 'withdraw_telebirr' ? 'TeleBirr' : 'CBEBirr';

  const lang = await getUserLanguage(telegramId);
  userStates.set(telegramId, { type: 'withdrawal', step: 'WAITING_ACCOUNT_INFO', bank: bankName, language: lang });

  // Multi-language text templates for withdrawal introduction
  const texts = {
    am: `🏦 **ባንክ: ${bankName}**\n\nእባክዎ ገንዘቡ የሚገባበትን **የባንክ አካውንት ቁጥር (Account Number)** ወይም ስም ያስገቡ:`,
    en: `🏦 **Bank: ${bankName}**\n\nPlease enter your **Account Number** or phone number for ${bankName}:`,
    om: `🏦 **Baankii: ${bankName}**\n\nMaaloo lakkoofsa herrega baankii (Account Number) ykn maqaakee galchi:`,
    so: `🏦 **Bangiga: ${bankName}**\n\nFadlan gelilambarka koontada bangiga (Account Number) ama magacaaga:`
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

export const handleWithdrawalMessage = async (ctx, telegramId, state, userStates) => {
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

  if (state.step === 'WAITING_ACCOUNT_INFO') {
    const accountInfo = ctx.message.text;
    userStates.set(telegramId, { 
      type: 'withdrawal', 
      step: 'WAITING_AMOUNT', 
      bank: state.bank, 
      accountInfo, 
      language: lang 
    });
    
    const promptTexts = {
      am: `✅ አካውንት: ${accountInfo}\n\nአሁን ማውጣት የሚፈልጉትን **የብር መጠን** (ETB) ብቻ ያስገቡ (ዝቅተኛው 100 ብር):`,
      en: `✅ Account: ${accountInfo}\n\nNow enter the **amount** you want to withdraw (ETB):`,
      om: `✅ Herrega: ${accountInfo}\n\nAmma hanga maallaqaa baasu barbaaddu barreessaa (ETB):`,
      so: `✅ Koontada: ${accountInfo}\n\nHadda geli cadadka lacagta aad rabto inaad la baxdo (ETB):`
    };

    await ctx.reply(promptTexts[lang] || promptTexts['am'], {
      reply_markup: backKeyboardMarkup.reply_markup
    });
    return true;
    
  } else if (state.step === 'WAITING_AMOUNT') {
    const amount = Number(ctx.message.text);
    if (isNaN(amount) || amount < 100) {
      const errorTexts = {
        am: '⚠️ እባክዎ ትክክለኛ የብር መጠን ያስገቡ (ዝቅተኛው 100 ብር):',
        en: '⚠️ Please enter a valid amount (minimum 100 ETB):',
        om: '⚠️ Maaloo hanga sirrii galchaa (sharafni xiqqaa 100 ETB):',
        so: '⚠️ Fadlan geli cadad sax ah (ugu yaraan 100 ETB):'
      };
      await ctx.reply(errorTexts[lang] || errorTexts['am']);
      return true;
    }

    try {
      // ⚡ Controller ማስተባበሪያውን በመጥራት ዋሌት መቀነስ እና ትራንዛክሽን መመዝገብ
      await handleWithdrawalSubmission(telegramId, amount, state.bank, state.accountInfo);

      userStates.delete(telegramId);
      const mainMenuMarkup = getMainMenuKeyboard(lang);
      
      const successTexts = {
        am: `✅ የወጪ (Withdrawal) ጥያቄዎ በተሳካ ሁኔታ ተመዝግቧል! አስተዳዳሪዎች ሲያረጋግጡት ወደ አካውንትዎ ይላካል።`,
        en: `✅ Your withdrawal request has been successfully submitted! An admin will process it shortly.`,
        om: `✅ Gaaffiin baasii keessan milkaa'inaan galmeeffameera! Bulchaan yeroo mirkaneessu ergarama.`,
        so: `✅ Codsigaaga la bixitaanka waa la gudbiyay! Maamuluhu wuu xaqiijin doonaa.`
      };

      await ctx.reply(successTexts[lang] || successTexts['am'], mainMenuMarkup);
      return true;
    } catch (err) {
      userStates.delete(telegramId);
      const mainMenuMarkup = getMainMenuKeyboard(lang);

      if (err.message === 'INSUFFICIENT_BALANCE') {
        const balTexts = {
          am: '⚠️ በኪስ ቦርሳዎ ውስጥ በቂ ገንዘብ የለም።',
          en: '⚠️ Insufficient balance in your wallet.',
          om: '⚠️ Herrega keessan irratti maallaqni gahaa hin jiru.',
          so: '⚠️ Koontadaada lacag kugu filan kama taagna.'
        };
        await ctx.reply(balTexts[lang] || balTexts['am'], mainMenuMarkup);
      } else {
        const errTexts = {
          am: '⚠️ ስህተት አጋጥሟል። እባክዎ እንደገና ይሞክሩ።',
          en: '⚠️ An error occurred. Please try again later.',
          om: '⚠️ Dogoggorri uumameera. Maaloo irra deebofaa yaalaa.',
          so: '⚠️ Khalad ayaa dhacay. Fadlan markale dib u day.'
        };
        await ctx.reply(errTexts[lang] || errTexts['am'], mainMenuMarkup);
      }
      return true;
    }
  }
  
  return false;
};