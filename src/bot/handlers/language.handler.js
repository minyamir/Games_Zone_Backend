export const handleLanguageCommand = async (ctx) => {
  try {
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🇪🇹 አማርኛ (Amharic)', callback_data: 'lang_am' }],
          [{ text: '🇬🇧 English', callback_data: 'lang_en' }]
        ]
      }
    };

    await ctx.reply('🌐 እባክዎ የሚፈልጉትን ቋንቋ ይምረጡ / Please choose your preferred language:', keyboard);
  } catch (err) {
    console.error('❌ Error in language.handler:', err);
  }
};

export const handleLanguageCallback = async (botInstance, query) => {
  const data = query.data;
  const chatId = query.message?.chat?.id || query.chat?.id;
  const lang = data === 'lang_am' ? 'አማርኛ' : 'English';

  if (query.id) {
    await botInstance.api.answerCallbackQuery({
      callback_query_id: query.id,
      text: `ቋንቋ ወደ ${lang} ተቀይሯል!`
    });
  }

  await botInstance.api.sendMessage({
    chat_id: chatId,
    text: `✅ ቋንቋዎ በተሳካ ሁኔታ ወደ **${lang}** ተቀይሯል!`,
    parse_mode: 'Markdown'
  });
};