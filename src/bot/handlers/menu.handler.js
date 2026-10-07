import { userService } from '../../services/user.service.js';
import { walletService } from '../../services/wallet.service.js';
import { handleProfileCommand } from './profile.handler.js';
import { handleWalletCommand } from './wallet.handler.js';
import { handleReferralCommand } from './referral.handler.js';
import { handleHelpCommand } from './help.handler.js';
import { handleRulesCommand } from './rules.handler.js';
import { handleLanguageCommand } from './language.handler.js';
import { handlePromotionCommand } from './promotion.handler.js';
import { playWebAppKeyboard, mainMenuKeyboard } from '../keyboards.js';
import { config } from '../../config/env.js';

export const handleMenuMessage = async (ctx, text, telegramId) => {
  try {
    const user = await userService.getUserByTelegramId(telegramId);
    if (!user || !user.phoneNumber) {
      await ctx.reply('⚠️ እባክዎ መጀመሪያ ስልክ ቁጥርዎን ያጋሩ።');
      return;
    }

    // 1. 🎮 ጌም ጨወቱ (PLAY) - ሚኒ አፕ (Mini App) መክፈቻ
    if (text.startsWith('🎮 ጌም') || text === '/play') {
      const miniAppUrl = config.miniAppUrl || 'https://your-mini-app-domain.com';
      await ctx.reply(
        '🎮 **ወደ ቢንጎ ሀበሻ ጨዋታ እንኳን ደህና መጡ!**\n\nጨዋታውን ለመጀመር ከታች ያለውን ቁልፍ ይጫኑ፡',
        {
          parse_mode: 'Markdown',
          ...playWebAppKeyboard(miniAppUrl)
        }
      );
      return;
    }

    // 2. 👤 ፕሮፋይል
    if (text.startsWith('👤 ፕሮፋይል') || text === '/profile') {
      await handleProfileCommand(ctx, telegramId);
      return;
    }

    // 3. 💰 ሒሳብ
    if (text.startsWith('💰 ሒሳብ') || text === '/account') {
      await handleWalletCommand(ctx, telegramId);
      return;
    }

    // 4. 📥 ገቢ (Deposit)
    if (text.startsWith('📥 ገቢ') || text === '/deposit') {
      const depositKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📱 TeleBirr', callback_data: 'deposit_telebirr' },
              { text: '🏦 CBEBirr', callback_data: 'deposit_cbebirr' }
            ]
          ]
        }
      };
      await ctx.reply('🏛 ገንዘብ ማስገቢያ (Deposit) ባንክ ይምረጡ:', depositKeyboard);
      return;
    }

    // 5. 📤 ወጪ (Withdraw)
    if (text.startsWith('📤 ወጪ') || text === '/withdraw') {
      const withdrawKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📱 TeleBirr', callback_data: 'withdraw_telebirr' },
              { text: '🏦 CBEBirr', callback_data: 'withdraw_cbebirr' }
            ]
          ]
        }
      };
      await ctx.reply('📤 ገንዘብ ማውጫ (Withdraw) ባንክ ይምረጡ:', withdrawKeyboard);
      return;
    }

    // 6. 🔗 ጋብዝ & አግኝ
    if (text.startsWith('🔗 ጋብዝ') || text === '/referral') {
      await handleReferralCommand(ctx, telegramId);
      return;
    }

    // 7. 📢 ድርጅቱን አስተዋውቅ
    if (text.startsWith('📢 ድርጅቱን') || text === '/promote') {
      await handlePromotionCommand(ctx);
      return;
    }

    // 8. 🎁 ፕሮሞ ኮድ
    if (text.startsWith('🎁 ፕሮሞ') || text === '/promocode') {
      await ctx.reply('🎁 እባክዎ የሰጡትን የፕሮሞ ኮድ ይጻፉልኝ:', mainMenuKeyboard);
      return;
    }

    // 9. 🌐 ቋንቋ (Language)
    if (text.startsWith('🌐 ቋንቋ') || text === '/language') {
      await handleLanguageCommand(ctx);
      return;
    }

    // 10. 📖 መመሪያ
    if (text.startsWith('📖 መመሪያ') || text === '/guide') {
      await ctx.reply('📖 **የጨዋታ መመሪያ**\n\n1. ሚኒ አፑን ይክፈቱ\n2. የቢንጎ ካርድ ይምረጡ\n3. ቁጥሮች ሲጠሩ ይጫወቱ እና ያሸንፉ!', { parse_mode: 'Markdown', ...mainMenuKeyboard });
      return;
    }

    // 11. 🆘 እርዳታ
    if (text.startsWith('🆘 እርዳታ') || text === '/help') {
      await handleHelpCommand(ctx);
      return;
    }

    // 12. 📜 ደንቦች
    if (text.startsWith('📜 ደንቦች') || text === '/rules') {
      await handleRulesCommand(ctx);
      return;
    }

  } catch (err) {
    console.error('❌ Error in menu.handler:', err);
  }
};