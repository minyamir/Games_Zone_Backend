export const handleDepositCallback = async (botInstance, query, userStates) => {
  const data = query.data;
  const chatId = query.message?.chat?.id || query.chat?.id;
  const telegramId = String(query.from?.id);
  const bankName = data === 'deposit_telebirr' ? 'TeleBirr' : 'CBEBirr';

  userStates.set(telegramId, { type: 'deposit', step: 'WAITING_AMOUNT', bank: bankName });

  const text = `🏦 **ባንክ: ${bankName}**\n\nእባክዎ ብሩን ወደዚህ ያስገቡ:\n👤 **ስም:** Selemon Mebrat\n👉 **ቁጥር:** ${bankName === 'TeleBirr' ? '0953839231' : '1000123456789'}\n\nያገባጉትን **የብር መጠን** ብቻ ይጻፉ:`;
  
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

export const handleDepositMessage = async (ctx, telegramId, state, userStates) => {
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

  if (state.step === 'WAITING_AMOUNT') {
    userStates.set(telegramId, { type: 'deposit', step: 'WAITING_SMS', bank: state.bank, amount: ctx.message.text });
    
    await ctx.reply(`መጠን: ${ctx.message.text} ETB\n\nእባክዎ የባንክ SMS ማረጋገጫ (Tx Ref) ይላኩ:`, {
      reply_markup: backReplyMarkup
    });
    return true;
    
  } else if (state.step === 'WAITING_SMS') {
    userStates.delete(telegramId);
    
    const { mainMenuKeyboard } = await import('../keyboards.js');
    await ctx.reply(`✅ የክፍያ ጥያቄዎ ተመዝግቧል! አስተዳዳሪው ያረጋግጥለታል።`, mainMenuKeyboard);
    return true;
  }
  return false;
};