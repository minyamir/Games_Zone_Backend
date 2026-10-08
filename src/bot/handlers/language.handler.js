import { User } from '../../models/User.model.js';
import { getMainMenuKeyboard } from '../keyboards.js'; // 💡 ኪቦርዱን ከዚህ እናስመጣለን

export const handleLanguageCommand = async (ctx) => {
  try {
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🇪🇹 አማርኛ (Amharic)', callback_data: 'lang_am' }],
          [{ text: '🇬🇧 English', callback_data: 'lang_en' }],
          [{ text: '🟡 Afaan Oromoo', callback_data: 'lang_om' }],
          [{ text: '🟢 Soomaaliga', callback_data: 'lang_so' }]
        ]
      }
    };

    await ctx.reply('🌐 እባክዎ የሚፈልጉትን ቋንቋ ይምረጡ / Please choose your language / Afaan filadhaa / Dooro luuqada:', keyboard);
  } catch (err) {
    console.error('❌ Error in language.handler:', err);
  }
};

export const handleLanguageCallback = async (botInstance, query) => {
  const data = query.data;
  const chatId = query.message?.chat?.id || query.chat?.id;
  const telegramId = String(query.from?.id);
  
  const langMap = {
    lang_am: 'am',
    lang_en: 'en',
    lang_om: 'om',
    lang_so: 'so'
  };
  const langCode = langMap[data] || 'am';

  const successMessages = {
    am: '✅ ቋንቋዎ በተሳካ ሁኔታ ወደ አማርኛ ተቀይሯል!',
    en: '✅ Your language has been successfully changed to English!',
    om: '✅ Afaan keessan gara Afaan Oromootti jijjiirameera!',
    so: '✅ Luuqadaada si guul ah loogu beddelay Soomaali!'
  };

  try {
    // 1. ቋንቋውን በዳታቤዝ ውስጥ ማዘመን (Update user language in DB)
    await User.findOneAndUpdate({ telegramId }, { language: langCode });

    if (query.id) {
      await botInstance.api.answerCallbackQuery({
        callback_query_id: query.id,
        text: successMessages[langCode]
      });
    }

    // 2. የተመረጠውን ቋንቋ መሰረት በማድረግ አዲሱን ኪቦርድ ማዘጋጀት
    const newMenuKeyboard = getMainMenuKeyboard(langCode);

    // 3. መልዕክቱን ከነአዲሱ ኪቦርድ ለተጠቃሚው መላክ (ይህ ሜኑውን ወዲያውኑ ይቀይረዋል)
    await botInstance.api.sendMessage({
      chat_id: chatId,
      text: successMessages[langCode],
      reply_markup: newMenuKeyboard.reply_markup
    });

  } catch (err) {
    console.error('❌ Error updating language:', err);
  }
};