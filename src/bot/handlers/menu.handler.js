import { userService } from '../../services/user.service.js';
import { walletService } from '../../services/wallet.service.js';
import { handleProfileCommand } from './profile.handler.js';
import { handleWalletCommand } from './wallet.handler.js';
import { handleReferralCommand } from './referral.handler.js';
import { handleHelpCommand } from './help.handler.js';
import { handleRulesCommand } from './rules.handler.js';
import { handleLanguageCommand } from './language.handler.js';
import { handlePromotionCommand } from './promotion.handler.js';
import { playWebAppKeyboard, getMainMenuKeyboard } from '../keyboards.js';
import { config } from '../../config/env.js';

export const handleMenuMessage = async (ctx, text, telegramId) => {
  try {
    const user = await userService.getUserByTelegramId(telegramId);
    if (!user || !user.phoneNumber) {
      await ctx.reply('⚠️ እባክዎ መጀመሪያ ስልክ ቁጥርዎን ያጋሩ። / Mee dura lakkoofsa bilbilaa keessan qoodaa / Please share your phone number first.');
      return;
    }

    const lang = user.language || 'am';
    const cleanText = text.trim();
    const mainMenuMarkup = getMainMenuKeyboard(lang);

    // 1. 🎮 ጌም ጨወቱ (Play Game / Taphocha Taphadhuu / Ciyaar)
    if (cleanText.includes('ጌም') || cleanText.includes('Play') || cleanText.includes('Taphocha') || cleanText.includes('Ciyaar') || cleanText === '/play') {
      const miniAppUrl = config.miniAppUrl || 'https://your-mini-app-domain.com';
      
      const gameTexts = {
        am: '🎮 **ወደ ቢንጎ ሀበሻ ጨዋታ እንኳን ደህና መጡ!**\n\nጨዋታውን ለመጀመር ከታች ያለውን ቁልፍ ይጫኑ፡',
        en: '🎮 **Welcome to Bingo Habesha Game!**\n\nClick the button below to start playing:',
        om: '🎮 **Gara Tapha BiiNGO Habeshaatiin Baga nagaan dhuftan!**\n\nTaphicha jalqabuuf tuqaa armaan gadii cuqaasaa:',
        so: '🎮 **Ku soo dhowow ciyaarta BiiNGO Habesha!**\n\nRiix badhanka hoose si aad u bilowdo ciyaarta:'
      };

      await ctx.reply(gameTexts[lang] || gameTexts['am'], {
        parse_mode: 'Markdown',
        ...playWebAppKeyboard(miniAppUrl, lang)
      });
      return;
    }

    // 2. 👤 ፕሮፋይል (Profile / Proofaayilii)
    if (cleanText.includes('ፕሮፋይል') || cleanText.includes('Profile') || cleanText.includes('Proofaayilii') || cleanText === '/profile') {
      await handleProfileCommand(ctx, telegramId);
      return;
    }

    // 3. 💰 ሒሳብ (Account / Herrega / Xisaabta)
    if (cleanText.includes('ሒሳብ') || cleanText.includes('Account') || cleanText.includes('Herrega') || cleanText.includes('Xisaabta') || cleanText === '/account') {
      await handleWalletCommand(ctx, telegramId);
      return;
    }

    // 4. 📥 ገቢ (Deposit / Galii / Dhigasho)
    if (cleanText.includes('ገቢ') || cleanText.includes('Deposit') || cleanText.includes('Galii') || cleanText.includes('Dhigasho') || cleanText === '/deposit') {
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

      const depositPrompts = {
        am: '🏛 ገንዘብ ማስገቢያ (Deposit) ባንክ ይምረጡ:',
        en: '🏛 Choose a bank to deposit money:',
        om: '🏛 Baankii maallaqa itti galitan filadhaa:',
        so: '🏛 Dooro bangiga aad lacagta ku shubayso:'
      };

      await ctx.reply(depositPrompts[lang] || depositPrompts['am'], depositKeyboard);
      return;
    }

    // 5. 📤 ወጪ (Withdraw / Baasii / Kala bax)
    if (cleanText.includes('ወጪ') || cleanText.includes('Withdraw') || cleanText.includes('Baasii') || cleanText.includes('Kala') || cleanText === '/withdraw') {
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

      const withdrawPrompts = {
        am: '📤 ገንዘብ ማውጫ (Withdraw) ባንክ ይምረጡ:',
        en: '📤 Choose a bank to withdraw money:',
        om: '📤 Baankii maallaqa irraa baafatan filadhaa:',
        so: '📤 Dooro bangiga aad lacagta kala baxayso:'
      };

      await ctx.reply(withdrawPrompts[lang] || withdrawPrompts['am'], withdrawKeyboard);
      return;
    }

    // 6. 🔗 ጋብዝ & አግኝ (Invite / Affeerii)
    if (cleanText.includes('ጋብዝ') || cleanText.includes('Invite') || cleanText.includes('Affeerii') || cleanText.includes('Casuuno') || cleanText === '/referral') {
      await handleReferralCommand(ctx, telegramId);
      return;
    }

    // 7. 📢 ድርጅቱን አስተዋውቅ (Promote / Beeksisa)
    if (cleanText.includes('ድርጅቱን') || cleanText.includes('Promote') || cleanText.includes('Beeksisaa') || cleanText.includes('Xayeysii') || cleanText === '/promote') {
      await handlePromotionCommand(ctx);
      return;
    }

    // 8. 🎁 ፕሮሞ ኮድ (Promo Code)
    if (cleanText.includes('ፕሮሞ') || cleanText.includes('Promo') || cleanText.includes('Koodii') || cleanText === '/promocode') {
      const promoPrompts = {
        am: '🎁 እባክዎ የሰጡትን የፕሮሞ ኮድ ይጻፉልኝ:',
        en: '🎁 Please enter your promo code:',
        om: '🎁 Maaloo koodii promo keessan barreessaa:',
        so: '🎁 Fadlan geli koodkaaga promo:'
      };
      await ctx.reply(promoPrompts[lang] || promoPrompts['am'], mainMenuMarkup);
      return;
    }

    // 9. 🌐 ቋንቋ (Language / Afaan / Luuqada)
    if (cleanText.includes('ቋንቋ') || cleanText.includes('Language') || cleanText.includes('Afaan') || cleanText.includes('Luuqada') || cleanText === '/language') {
      await handleLanguageCommand(ctx);
      return;
    }

    // 10. 📖 መመሪያ (Guide / Qajeelfama / Hagaha)
    if (cleanText.includes('መመሪያ') || cleanText.includes('Guide') || cleanText.includes('Qajeelfama') || cleanText.includes('Hagaha') || cleanText === '/guide') {
      const guideTexts = {
        am: '📖 **የጨዋታ መመሪያ**\n\n1. ሚኒ አፑን ይክፈቱ\n2. የቢንጎ ካርድ ይምረጡ\n3. ቁጥሮች ሲጠሩ ይጫወቱ እና ያሸንፉ!',
        en: '📖 **Game Guide**\n\n1. Open the Mini App\n2. Select your Bingo card\n3. Play and win as numbers are called!',
        om: '📖 **Qajeelfama Taphaa**\n\n1. Mini App banaa\n2. Kaardii BiiNGO filadhaa\n3. Lakkoofsi yeroo waamamu taphadhaa injifadhaa!',
        so: '📖 **Hagaha Ciyaarta**\n\n1. Fur Mini App-ka\n2. Dooro kaarkaaga Bingo\n3. Ciyaar oo guulayso marka lambarada la yeero!'
      };

      await ctx.reply(guideTexts[lang] || guideTexts['am'], { parse_mode: 'Markdown', ...mainMenuMarkup });
      return;
    }

    // 11. 🆘 እርዳታ (Help / Gargaarsa / Caawin)
    if (cleanText.includes('እርዳታ') || cleanText.includes('Help') || cleanText.includes('Gargaarsa') || cleanText.includes('Caawin') || cleanText === '/help') {
      await handleHelpCommand(ctx, telegramId);
      return;
    }

    // 12. 📜 ደንቦች (Rules / Seerota / Xeerarka)
    if (cleanText.includes('ደንቦች') || cleanText.includes('Rules') || cleanText.includes('Seerota') || cleanText.includes('Xeerarka') || cleanText === '/rules') {
      await handleRulesCommand(ctx);
      return;
    }

  } catch (err) {
    console.error('❌ Error in menu.handler:', err);
  }
};