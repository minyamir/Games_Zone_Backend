import { Bot } from 'node-telegram-bot-api';
import { run } from 'node-telegram-bot-api/node';
import { config } from '../config/env.js';
import { handleStartCommand, handleContactShare } from './handlers/start.handler.js';
import { handleDepositCallback } from './handlers/deposit.handler.js';
import { handleWithdrawalCallback } from './handlers/withdrawal.handler.js';
import { handleMenuMessage } from './handlers/menu.handler.js';
import { mainMenuKeyboard } from './keyboards.js'; // 💡 የዋናውን ሜኑ ኪቦርድ ማስገባት

let botInstance = null;
const userStates = new Map(); // ለከፍተኛ ፍጥነት በ Memory የሚይዘው ስቴት (ለ Production Redis መጠቀም ይመረጣል)

export const initTelegramBot = () => {
  if (botInstance) return botInstance;
  if (!config.telegramBotToken) return null;

  botInstance = new Bot(config.telegramBotToken);

  // 1. /start ትዕዛዝ
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
      } else if (data === 'back_to_menu') {
        // 💡 ተጠቃሚው 'ወደ ኋላ ተመለስ'ን ሲጫን ስቴቱን አጽድተን ዋናውን ሜኑ እንመልሳለን
        userStates.delete(telegramId);

        await botInstance.api.sendMessage({
          chat_id: chatId,
          text: '🔙 ወደ ዋናው ሜኑ ተመልሰዋል።',
          reply_markup: mainMenuKeyboard.reply_markup
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

      // 💡 ማስተካከያ፡ ተጠቃሚው ዋናው ሜኑ ቁልፎችን ሲጫን የቆየውን ስቴት እናጸዳለን (State Reset)
      const menuTriggers = [
        '🎮 ጌም', '👤 ፕሮፋይል', '💰 ሒሳብ', '📥 ገቢ', '📤 ወጪ', 
        '🔗 ጋብዝ', '📢 ድርጅቱን', '🎁 ፕሮሞ', '🌐 ቋንቋ', '📖 መመሪያ', '🆘 እርዳታ', '📜 ደንቦች',
        '/play', '/profile', '/account', '/deposit', '/withdraw', '/referral', '/promote', '/promocode', '/language', '/guide', '/help', '/rules'
      ];

      const isMenuClick = menuTriggers.some(trigger => text.startsWith(trigger));
      if (isMenuClick) {
        userStates.delete(telegramId); // የቆየ ስቴት ካለ ይሰረዛል!
      }

      const userState = userStates.get(telegramId);

      // ስቴት ካለ ለሚመለከተው ሃንድለር መስጠት
      if (userState) {
        if (userState.type === 'deposit') {
          const { handleDepositMessage } = await import('./handlers/deposit.handler.js');
          if (await handleDepositMessage(ctx, telegramId, userState, userStates)) return;
        } else if (userState.type === 'withdrawal') {
          const { handleWithdrawalMessage } = await import('./handlers/withdrawal.handler.js');
          if (await handleWithdrawalMessage(ctx, telegramId, userState, userStates)) return;
        }
      }

      // መደበኛ የሜኑ መልዕክቶች
      await handleMenuMessage(ctx, text, telegramId);
    } catch (err) {
      console.error('❌ Message Error:', err);
    }
  });

  run(botInstance);
  console.log('🚀 High-performance Telegram Bot initialized successfully.');
  return botInstance;
};

export const getUserStates = () => userStates;