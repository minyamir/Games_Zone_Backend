import { Bot } from 'node-telegram-bot-api';
import { run } from 'node-telegram-bot-api/node'; // Correct path for Node managed runner
import { config } from '../config/env.js';
import { handleStartCommand, handleContactShare } from './start.handler.js';

let botInstance = null;

export const initTelegramBot = () => {
  if (botInstance) return botInstance;

  if (!config.telegramBotToken) {
    console.warn('⚠ Telegram Bot token missing. Bot service skipped.');
    return null;
  }

  botInstance = new Bot(config.telegramBotToken);

  // 1. Register the start command handler
  botInstance.command('start', async (ctx) => {
    await handleStartCommand(ctx);
  });

  // 2. Listen for incoming messages to catch shared contact registrations
  botInstance.on('message', async (ctx) => {
    try {
      if (ctx.message?.contact) {
        console.log('📱 Contact detected in message handler');
        await handleContactShare(ctx);
      }
    } catch (err) {
      console.error('❌ Error handling message/contact in bot.js:', err);
    }
  });

  // Run the managed bot runner
  run(botInstance);

  console.log('Telegram Bot v2 polling service initialized.');
  return botInstance;
};