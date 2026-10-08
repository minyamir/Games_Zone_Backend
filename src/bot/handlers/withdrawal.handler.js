import { User } from '../../models/User.model.js';
import { getMainMenuKeyboard } from '../keyboards.js';

// ⚡ O(1) Static Withdrawal Translations for multi-language support
const WITHDRAWAL_TEXTS = {
  am: {
    backBtn: '🔙 ወደ ኋላ ተመለስ',
    title: '📤 **ወጪ (Withdraw)**',
    bankLabel: '🏦 **ባንክ:**',
    accountPrompt: 'ገንዘብ የሚቀበሉበትን **ስልክ/አካውንት ቁጥር እና ስም** ይላኩ:',
    minAmountError: '⚠️ ዝቅተኛው የማውጣት ገደብ 100 ብር ነው።',
    amountPrompt: 'ማውጣት የሚፈልጉትን መጠን ያስገቡ (ቢያንስ 100 ብር):',
    successMsg: '✅ የወጪ ጥያቄዎ ተመዝግቧል!',
    backToMainMsg: '🔙 ወደ ዋናው ሜኑ ተመለሰዋል:'
  },
  en: {
    backBtn: '🔙 Back',
    title: '📤 **Withdraw**',
    bankLabel: '🏦 **Bank:**',
    accountPrompt: 'Please send your **phone/account number and name** to receive funds:',
    minAmountError: '⚠️ The minimum withdrawal limit is 100 ETB.',
    amountPrompt: 'Enter the amount you want to withdraw (minimum 100 ETB):',
    successMsg: '✅ Your withdrawal request has been submitted!',
    backToMainMsg: '🔙 Returned to the main menu:'
  },
  om: {
    backBtn: '🔙 Duubatti Deebi\'i',
    title: '📤 **Baasii (Withdraw)**',
    bankLabel: '🏦 **Baankii:**',
    accountPrompt: 'Maallaqa itti fudhattan **lakkoofsa bilbilaa/baankii fi maqaa** keessan ergaa:',
    minAmountError: '⚠️ Daangaan baasii xiqqaa Birrii 100 dha.',
    amountPrompt: 'Hanga baasuu fektan galchaa (sharafni xiqqaa 100 Birrii):',
    successMsg: '✅ Gaaffiin baasii keessan galmaa\'eera!',
    backToMainMsg: '🔙 Gara menu guddaatti deebitaniittu:'
  },
  so: {
    backBtn: '🔙 Dib u Noqo',
    title: '📤 **Kala Bixid (Withdraw)**',
    bankLabel: '🏦 **Bangiga:**',
    accountPrompt: 'Fadlan soo dir **lambarka telefoonka/akoonka iyo magaca** aad lacagta ku qaadanaysid:',
    minAmountError: '⚠️ Xadka ugu yar ee la bixin karo waa 100 Birr.',
    amountPrompt: 'Geli xaddiga aad rabto inaad la baxdo (ugu yaraan 100 Birr):',
    successMsg: '✅ Codsigaaga kala bixista waa la gudbiyay!',
    backToMainMsg: '🔙 Waxaad ku noqotay menu-ga główni:'
  }
};

export const handleWithdrawalCallback = async (botInstance, query, userStates) => {
  try {
    const data = query.data;
    const chatId = query.message?.chat?.id || query.chat?.id;
    const telegramId = String(query.from?.id);
    const bankName = data === 'withdraw_telebirr' ? 'TeleBirr' : 'CBEBirr';

    // ⚡ Fast language lookup using lean query
    const user = await User.findOne({ telegramId }).select('language').lean();
    const lang = user?.language || 'am';
    const t = WITHDRAWAL_TEXTS[lang] || WITHDRAWAL_TEXTS['am'];

    userStates.set(telegramId, { type: 'withdrawal', step: 'WAITING_ACCOUNT', bank: bankName });

    const text = `${t.title}\n${t.bankLabel} ${bankName}\n\n${t.accountPrompt}`;
    
    await botInstance.api.sendMessage({ 
      chat_id: chatId, 
      text, 
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [
          [{ text: t.backBtn }]
        ],
        resize_keyboard: true,
        is_persistent: true,
      }
    });
    
    if (query.id) await botInstance.api.answerCallbackQuery({ callback_query_id: query.id });
  } catch (err) {
    console.error('❌ Error in withdrawal.handler (callback):', err);
  }
};

export const handleWithdrawalMessage = async (ctx, telegramId, state, userStates) => {
  try {
    // ⚡ Fast language lookup for user response
    const user = await User.findOne({ telegramId }).select('language').lean();
    const lang = user?.language || 'am';
    const t = WITHDRAWAL_TEXTS[lang] || WITHDRAWAL_TEXTS['am'];
    const mainMenuMarkup = getMainMenuKeyboard(lang);

    // ተጠቃሚው ወደ ኋላ መመለስ ከፈለገ (ማንኛውንም ቋንቋ የኋላ ቁልፍ ይומለکت)
    if (ctx.message?.text === '🔙 ወደ ኋላ ተመለስ' || ctx.message?.text === '🔙 Back' || ctx.message?.text === '🔙 Duubatti Deebi\'i' || ctx.message?.text === '🔙 Dib u Noqo') {
      userStates.delete(telegramId);
      await ctx.reply(`${t.backToMainMsg}`, mainMenuMarkup);
      return true;
    }

    const backReplyMarkup = {
      keyboard: [
        [{ text: t.backBtn }]
      ],
      resize_keyboard: true,
      is_persistent: true,
    };

    if (state.step === 'WAITING_ACCOUNT') {
      userStates.set(telegramId, { type: 'withdrawal', step: 'WAITING_AMOUNT', bank: state.bank, accountInfo: ctx.message.text });
      
      await ctx.reply(t.amountPrompt, {
        reply_markup: backReplyMarkup
      });
      return true;
      
    } else if (state.step === 'WAITING_AMOUNT') {
      const amount = Number(ctx.message.text);
      if (isNaN(amount) || amount < 100) {
        await ctx.reply(t.minAmountError, {
          reply_markup: backReplyMarkup
        });
        return true;
      }
      
      userStates.delete(telegramId);
      
      await ctx.reply(t.successMsg, mainMenuMarkup);
      return true;
    }
    return false;
  } catch (err) {
    console.error('❌ Error in withdrawal.handler (message):', err);
    return false;
  }
};