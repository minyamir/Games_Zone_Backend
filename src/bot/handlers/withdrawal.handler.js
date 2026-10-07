export const handleWithdrawalCallback = async (botInstance, query, userStates) => {
  const data = query.data;
  const chatId = query.message?.chat?.id || query.chat?.id;
  const telegramId = String(query.from?.id);
  const bankName = data === 'withdraw_telebirr' ? 'TeleBirr' : 'CBEBirr';

  userStates.set(telegramId, { type: 'withdrawal', step: 'WAITING_ACCOUNT', bank: bankName });

  const text = `📤 **ወጪ (Withdraw)**\n🏦 **ባንክ:** ${bankName}\n\nገንዘብ የሚቀበሉበትን **ስልክ/አካውንት ቁጥር እና ስም** ይላኩ:`;
  
  await botInstance.api.sendMessage({ 
    chat_id: chatId, 
    text, 
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [
        [{ text: '🔙 ወደ ኋላ ተመለስ' }]
      ],
      resize_keyboard: true,
      is_persistent: true,
    }
  });
  
  if (query.id) await botInstance.api.answerCallbackQuery({ callback_query_id: query.id });
};

export const handleWithdrawalMessage = async (ctx, telegramId, state, userStates) => {
  // ተጠቃሚው ወደ ኋላ መመለስ ከፈለገ
  if (ctx.message?.text === '🔙 ወደ ኋላ ተመለስ') {
    userStates.delete(telegramId);
    const { mainMenuKeyboard } = await import('../keyboards.js');
    await ctx.reply('🔙 ወደ ዋናው ሜኑ ተመለሰዋል:', mainMenuKeyboard);
    return true;
  }

  const backReplyMarkup = {
    keyboard: [
      [{ text: '🔙 ወደ ኋላ ተመለስ' }]
    ],
    resize_keyboard: true,
    is_persistent: true,
  };

  if (state.step === 'WAITING_ACCOUNT') {
    userStates.set(telegramId, { type: 'withdrawal', step: 'WAITING_AMOUNT', bank: state.bank, accountInfo: ctx.message.text });
    
    await ctx.reply(`ማውጣት የሚፈልጉትን መጠን ያስገቡ (ቢያንስ 100 ብር):`, {
      reply_markup: backReplyMarkup
    });
    return true;
    
  } else if (state.step === 'WAITING_AMOUNT') {
    const amount = Number(ctx.message.text);
    if (isNaN(amount) || amount < 100) {
      await ctx.reply('⚠️ ዝቅተኛው የማውጣት ገደብ 100 ብር ነው።', {
        reply_markup: backReplyMarkup
      });
      return true;
    }
    
    userStates.delete(telegramId);
    
    const { mainMenuKeyboard } = await import('../keyboards.js');
    await ctx.reply(`✅ የወጪ ጥያቄዎ ተመዝግቧል!`, mainMenuKeyboard);
    return true;
  }
  return false;
};