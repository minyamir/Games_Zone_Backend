import { Bot } from 'node-telegram-bot-api';
import { run } from 'node-telegram-bot-api/node';
import { config } from '../config/env.js';
import { handleStartCommand, handleContactShare } from './start.handler.js';
import { User } from '../models/User.model.js';
import { mainMenuKeyboard } from './keyboards.js';

let botInstance = null;

export const initTelegramBot = () => {
  if (botInstance) return botInstance;

  if (!config.telegramBotToken) {
    console.warn('⚠ Telegram Bot token missing. Bot service skipped.');
    return null;
  }

  botInstance = new Bot(config.telegramBotToken);

  // 🛑 deleteMyCommands እና setMyCommands ሙሉ በሙሉ ተወግደዋል!

  // 1. የ /start ትዕዛዝ ማስተናገጃ
  botInstance.command('start', async (ctx) => {
    await handleStartCommand(ctx);
  });

  // 2. ጽሑፍ መልዕክቶችን እና የሜኑ ቁልፎችን መቆጣጠር
  botInstance.on('message', async (ctx) => {
    try {
      // ሀ) ተጠቃሚው ስልክ ቁጥር ካጋራ
      if (ctx.message?.contact) {
        console.log('📱 Contact detected in message handler');
        await handleContactShare(ctx);
        return;
      }

      // ለ) የጽሑፍ መልዕክቶች / የቁልፍ ሰሌዳ ትዕዛዞች
      const text = ctx.message?.text;
      if (!text) return;

      const telegramId = String(ctx.from?.id);
      const user = await User.findOne({ telegramId });

      // ተጠቃሚው ካልተመዘገበ ሜኑ እንዲጠቀም አይፈቀድለትም (ምንም ምላሽ አይሰጥም ወይም የማስጠንቀቂያ መልዕክት ይሰጣል)
      if (!user || !user.phoneNumber) {
        await ctx.reply('⚠️ እባክዎ መጀመሪያ ከላይ ያለውን ቁልፍ በመጫን ስልክ ቁጥርዎን ያጋሩ።');
        return;
      }

      // ሐ) የተመዘገበ ተጠቃሚ የሚጫናቸው ዋና ዋና ቁልፎች / ትዕዛዞች
      if (text === '🎮 ጌም ጨወቱ (PLAY)' || text === '/play') {
        await ctx.reply('🎮 ጨዋታውን ለመጀመር ከታች ያለውን ሚኒ አፕ (Mini App) ይክፈቱ።', mainMenuKeyboard);
      } else if (text === '👤 ፕሮፋይል' || text === '💰 ሒሳብ' || text === '/account') {
        await ctx.reply(`👤 ስም: ${user.firstName}\n🔹 ሪፈራል ኮድ: ${user.referralCode}\n💰 ሒሳብዎ በመረጋገጥ ላይ ይገኛል።`, mainMenuKeyboard);
      } else if (text === '📥 ገቢ (Deposit)' || text === '/deposit') {
        await ctx.reply('📥 ገንዘብ ለማስገባት በቴሌብር (TeleBirr) ወይም በ CBE በኩል ጥያቄ ያስገቡ።', mainMenuKeyboard);
      } else if (text === '📤 ወጪ (Withdraw)' || text === '/withdraw') {
        await ctx.reply('📤 ገንዘብ ከኪስ ቦርሳዎ ማውጣት የሚችሉበትን ቅጽ ይሙሉ።', mainMenuKeyboard);
      } else if (text === '🔗 ጋብዝ & አግኝ' || text === '/referral') {
        await ctx.reply(`🔗 የእርስዎ የሪፈራል ሊንክ:\nhttps://t.me/${ctx.botInfo?.username}?start=${user.referralCode}`, mainMenuKeyboard);
      } else if (text === '🆘 እርዳታ' || text === '/help') {
        await ctx.reply('🆘 ማንኛውም ጥያቄ ካሎት ከአስተዳዳሪው ጋር ይነጋገሩ።', mainMenuKeyboard);
      }
    } catch (err) {
      console.error('❌ Error handling message/contact in bot.js:', err);
    }
  });

  // 3. ቦቱን ማስኬጃ (Runner)
  run(botInstance);

  console.log('Telegram Bot v2 polling service initialized securely.');
  return botInstance;
};