import { Bot } from 'node-telegram-bot-api';
import { run } from 'node-telegram-bot-api/node';
import { config } from '../config/env.js';
import { handleStartCommand, handleContactShare } from './handlers/start.handler.js';
import { handleDepositCallback } from './handlers/deposit.handler.js';
import { handleWithdrawalCallback } from './handlers/withdrawal.handler.js';
import { handleLanguageCallback } from './handlers/language.handler.js';
import { handleMenuMessage } from './handlers/menu.handler.js';
import { getMainMenuKeyboard } from './keyboards.js';
import { userService } from '../services/user.service.js';

let botInstance = null;
const userStates = new Map(); // ለከፍተኛ ፍጥነት በ Memory የሚይዘው ስቴት

export const initTelegramBot = () => {
  if (botInstance) return botInstance;
  if (!config.telegramBotToken) return null;

  botInstance = new Bot(config.telegramBotToken);

  // 1. /start 
  botInstance.command('start', async (ctx) => {
    await handleStartCommand(ctx);
  });

  // 2. Callback Queries (Inline Buttons)
  botInstance.on('callback_query', async (msg) => {
    try {
      const query = msg.update?.callback_query || msg;
      const data = query.data;
      const chatId = query.message?.chat?.id || query.chat?.id;
      const telegramId = String(query.from?.id);

      if (data?.startsWith('deposit_')) {
        await handleDepositCallback(botInstance, query, userStates);
      } else if (data?.startsWith('withdraw_')) {
        await handleWithdrawalCallback(botInstance, query, userStates);
      } else if (data?.startsWith('lang_')) {
        await handleLanguageCallback(botInstance, query);
      } else if (data === 'back_to_menu') {
        userStates.delete(telegramId);

        // ከካሽ ወይም ከዳታቤዝ ቋንቋውን ፈጣን በሆነ መንገድ ማግኘት
        const userState = userStates.get(telegramId);
        const user = userState || await userService.getUserByTelegramId(telegramId);
        const lang = user?.language || 'am';
        const mainMenuMarkup = getMainMenuKeyboard(lang);

        const menuTexts = {
          am: '🔙 ወደ ዋናው ሜኑ ተመልሰዋል።',
          en: '🔙 Returned to the main menu.',
          om: '🔙 Gara menuu guddaatti deebi\'ataniittu.',
          so: '🔙 Waxaad ku noqotay menu-ga główni.'
        };

        await botInstance.api.sendMessage({
          chat_id: chatId,
          text: menuTexts[lang] || menuTexts['am'],
          reply_markup: mainMenuMarkup.reply_markup
        });

        if (query.id) {
          await botInstance.api.answerCallbackQuery({ callback_query_id: query.id });
        }
      }
    } catch (err) {
      console.error('❌ Callback Error:', err);
    }
  });

  // 3. Messages & States
  botInstance.on('message', async (ctx) => {
    try {
      if (ctx.message?.contact) {
        await handleContactShare(ctx);
        return;
      }

      const text = ctx.message?.text;
      if (!text) return;

      const telegramId = String(ctx.from?.id);
      const cleanText = text.trim();

      // ⚡ የኋላ መመለሻ ቁልፍን (Back Button) በ 4 ቋንቋዎች በቀጥታ በглобаል ደረጃ መጥለፍ
      const backTriggers = ['🔙 ወደ ኋላ ተመለስ', '🔙 Back', '🔙 Duubatti Deebi\'i', '🔙 Dib u noqo'];
      if (backTriggers.some(trigger => cleanText.includes(trigger))) {
        userStates.delete(telegramId);

        // ቋንቋውን ከሜሞሪ ካሽ ወይም ከዳታቤዝ በአጭር ጊዜ ማምጣት
        const userState = userStates.get(telegramId);
        const user = userState || await userService.getUserByTelegramId(telegramId);
        const lang = user?.language || 'am';
        const mainMenuMarkup = getMainMenuKeyboard(lang);

        const menuTexts = {
          am: '🔙 ወደ ዋናው ሜኑ ተመለሰዋል:',
          en: '🔙 Returned to the main menu:',
          om: '🔙 Gara menuu guddaatti deebi\'ataniittu:',
          so: '🔙 Waxaad ku noqotay menu-ga:'
        };

        await ctx.reply(menuTexts[lang] || menuTexts['am'], mainMenuMarkup);
        return;
      }

      const menuTriggers = [
        '🎮 ጌም', '👤 ፕሮፋይል', '💰 ሒሳብ', '📥 ገቢ', '📤 ወጪ', 
        '🔗 ጋብዝ', '📢 ድርጅቱን', '🎁 ፕሮሞ', '🌐 ቋንቋ', '📖 መመሪያ', '🆘 እርዳታ', '📜 ደንቦች',
        'Play', 'Taphocha', 'Ciyaar', 'Profile', 'Proofaayilii', 'Account', 'Herrega', 'Xisaabta',
        'Deposit', 'Galii', 'Dhigasho', 'Withdraw', 'Baasii', 'Kala', 'Invite', 'Affeerii', 'Casuuno',
        'Promote', 'Beeksisaa', 'Xayeysii', 'Promo', 'Koodii', 'Language', 'Afaan', 'Luuqada',
        'Guide', 'Qajeelfama', 'Hagaha', 'Help', 'Gargaarsa', 'Caawin', 'Rules', 'Seerota', 'Xeerarka',
        '/play', '/profile', '/account', '/deposit', '/withdraw', '/referral', '/promote', '/promocode', '/language', '/guide', '/help', '/rules'
      ];

      const isMenuClick = menuTriggers.some(trigger => cleanText.includes(trigger));
      if (isMenuClick) {
        userStates.delete(telegramId);
      }

      const userState = userStates.get(telegramId);

      if (userState) {
        if (userState.type === 'deposit') {
          const { handleDepositMessage } = await import('./handlers/deposit.handler.js');
          if (await handleDepositMessage(ctx, telegramId, userState, userStates)) return;
        } else if (userState.type === 'withdrawal') {
          const { handleWithdrawalMessage } = await import('./handlers/withdrawal.handler.js');
          if (await handleWithdrawalMessage(ctx, telegramId, userState, userStates)) return;
        }
      }

      // ⚡ ለምናሌ ሃንድለር የተጠቃሚውን ቋንቋ ልኮ በፍጥነት ማስተናገድ
      const cachedUser = userState || await userService.getUserByTelegramId(telegramId);
      const userLang = cachedUser?.language || 'am';

      await handleMenuMessage(ctx, text, telegramId, userLang);
    } catch (err) {
      console.error('❌ Message Error:', err);
    }
  });

  run(botInstance);
  console.log('🚀 High-performance Telegram Bot initialized successfully.');
  return botInstance;
};

export const getUserStates = () => userStates;