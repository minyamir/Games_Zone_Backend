import { Bot } from 'node-telegram-bot-api';
import { run } from 'node-telegram-bot-api/node';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ Token is missing!');
  process.exit(1);
}

const bot = new Bot(token);

console.log('🤖 Bot is running and waiting for messages...');

bot.on('message', (ctx) => {
  console.log(`Received message from ${ctx.from?.first_name}: ${ctx.message?.text}`);
  ctx.reply('Hello! Your bot is working correctly.');
});

// Run with built-in managed runner
run(bot);