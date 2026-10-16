import path from 'path';
import { fromPath } from 'node-telegram-bot-api/node';
import { User } from '../../models/User.model.js';
import { Wallet } from '../../models/Wallet.model.js';
import { Transaction } from '../../models/Transaction.model.js';
import { phoneRequestKeyboard, getMainMenuKeyboard } from '../keyboards.js';
import { referralService } from '../../services/referral.service.js'; 
import crypto from 'crypto';

// ⚡ Static cached photo file_id to avoid disk reading lag and achieve zero-latency
let cachedPhotoFileId = null; 

// ⚡ ጊዜያዊ ሜሞሪ (Pending referrals mapping: telegramId -> referralCode)
const pendingReferrals = new Map();

/**
 * Handle /start command optimized for Zero-Latency & High Performance with Debug Mode
 */
export const handleStartCommand = async (ctx) => {
  try {
    const telegramId = String(ctx.from?.id);
    const text = ctx.message?.text || '';
    console.log(`🔍 [DEBUG START] User ${telegramId} sent text: "${text}"`);
    
    const referralCode = text.split(' ')[1];
    if (referralCode) {
      pendingReferrals.set(telegramId, referralCode);
      console.log(`✅ [DEBUG START] Referral code captured and stored in memory: "${referralCode}" for user ${telegramId}`);
    } else {
      console.log(`ℹ️ [DEBUG START] No referral code found in start command for user ${telegramId}`);
    }

    const user = await User.findOne({ telegramId }).lean();
    const lang = user?.language || 'am';

    if (!user || !user.phoneNumber) {
      const welcomeTexts = {
        am: `🟢 ቢንጎ ⚪️ ሀበሻ\n\n👋 እንኳን ወደ BINGO HABESHA መጡ!\n\nጌሙን ለመጀመር ከታች ያለውን ቁልፍ በመንካት ስልክ ቁጥርዎን ያጋሩ።`,
        en: `🟢 Bingo ⚪️ Habesha\n\n👋 Welcome to BINGO HABESHA!\n\nTo start the game, please share your phone number by tapping the button below.`,
        om: `🟢 BiiNGO ⚪️ Habesha\n\n👋 Gara BiiNGO HABESHAtti nagaan dhuftan!\n\nTaphicha jalqabuuf tuqaa armaan gadii tuquun lakkoofsa bilbilaa keessan qoodaa.`,
        so: `🟢 Bingo ⚪️ Habesha\n\n👋 Kusoo dhowow BINGO HABESHA!\n\nSi aad u bilowdo ciyaarta, fadlan la wadaag lambarkaaga telefoonka adoo riixaya badhanka hoose.`
      };

      const welcomeText = welcomeTexts[lang] || welcomeTexts['am'];
      const keyboardMarkup = phoneRequestKeyboard(lang);
      const chatId = ctx.chat?.id || ctx.message?.chat?.id;

      if (cachedPhotoFileId) {
        await ctx.api.sendPhoto({
          chat_id: chatId,
          photo: cachedPhotoFileId,
          caption: welcomeText,
          reply_markup: keyboardMarkup.reply_markup,
        });
      } else {
        const imagePath = path.resolve('src/assets/images/image.png');
        const sentMessage = await ctx.api.sendPhoto({
          chat_id: chatId,
          photo: await fromPath(imagePath),
          caption: welcomeText,
          reply_markup: keyboardMarkup.reply_markup,
        });

        if (sentMessage?.photo) {
          cachedPhotoFileId = sentMessage.photo[sentMessage.photo.length - 1].file_id;
        }
      }
    } else {
      const wallet = await Wallet.findOne({ user: user._id }).lean();
      const mainMenuMarkup = getMainMenuKeyboard(lang);

      const registeredTexts = {
        am: `🟢 ቢንጎ ⚪ ሀበሻ\n\n🎉 እንኳን ደህና መጡ ${user.firstName}!\n\n🟢 ዋና ቦርሳ (Main): ${wallet?.mainWallet || 0}.00 ETB\n🟡 የጨዋታ ቦርሳ (Play): ${wallet?.playWallet || 0}.00 ETB\n\n👇 ጨዋታውን ለመጀመር '🎮 ጌም ጨወቱ (PLAY)' የሚለውን ይጫኑ።`,
        en: `🟢 Bingo ⚪ Habesha\n\n🎉 Welcome back ${user.firstName}!\n\n🟢 Main Wallet: ${wallet?.mainWallet || 0}.00 ETB\n🟡 Play Wallet: ${wallet?.playWallet || 0}.00 ETB\n\n👇 To start playing, tap '🎮 Play Game'.`,
        om: `🟢 BiiNGO ⚪ Habesha\n\n🎉 Baga deebitan ${user.firstName}!\n\n🟢 Herrega Guddaa: ${wallet?.mainWallet || 0}.00 ETB\n🟡 Herrega Taphaa: ${wallet?.playWallet || 0}.00 ETB\n\n👇 Taphicha jalqabuuf '🎮 Taphocha Taphadhuu (PLAY)' tuqaa.`,
        so: `🟢 Bingo ⚪ Habesha\n\n🎉 Kusoo dhowow ${user.firstName}!\n\n🟢 Boorso Weyn: ${wallet?.mainWallet || 0}.00 ETB\n🟡 Boorso Ciyaar: ${wallet?.playWallet || 0}.00 ETB\n\n👇 Si aad u bilowdo ciyaarta riix '🎮 Ciyaar (PLAY)'.`
      };

      const registeredText = registeredTexts[lang] || registeredTexts['am'];
      await ctx.reply(registeredText, mainMenuMarkup);
    }
  } catch (err) {
    console.error('❌ [DEBUG ERROR] in start.handler (start command):', err);
  }
};

/**
 * Handle shared contact for instant registration with 15 ETB Registration Bonus to Play Wallet
 * and processing referral reward using referral.service.js
 */
export const handleContactShare = async (ctx) => {
  try {
    const contact = ctx.message?.contact;
    if (!contact) return;

    const telegramId = String(ctx.from?.id || contact.user_id);
    const phoneNumber = contact.phone_number;
    const firstName = ctx.from?.first_name || 'Player';
    const username = ctx.from?.username || `user_${telegramId}`;

    console.log(`🔍 [DEBUG CONTACT] Processing contact share for Telegram ID: ${telegramId}, Phone: ${phoneNumber}`);

    let user = await User.findOne({ telegramId });
    const lang = user?.language || 'am';
    
    if (!user) {
      const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      
      // 1. Create User
      user = await User.create({ 
        telegramId, 
        phoneNumber, 
        firstName, 
        username, 
        referralCode,
        language: lang
      });
      console.log(`✅ [DEBUG CONTACT] New user created with ID: ${user._id} and Referral Code: ${referralCode}`);

      // 2. Create Wallet and credit 15 ETB Registration Bonus to Play Wallet
      const registrationBonus = 15;
      const wallet = await Wallet.create({ 
        user: user._id, 
        mainWallet: 0,          
        playWallet: registrationBonus, 
        lockedBalance: 0, 
        currency: 'ETB' 
      });

      // 3. Register bonus transaction record
      await Transaction.create({
        user: user._id,
        wallet: wallet._id,
        type: 'bonus',
        amount: registrationBonus,
        status: 'completed',
        description: 'Welcome registration bonus credited to Play Wallet'
      });

      // ⚡ 4. PROCESS REFERRAL REWARD USING referral.service.js
      const refCodeFromMemory = pendingReferrals.get(telegramId);
      if (refCodeFromMemory) {
        try {
          // ሰርቪሱን በመጥራት ሪፈራና እና ቦነሱን እናስተናግዳለን
          await referralService.processReferralOnStart(user._id, refCodeFromMemory, firstName);
          console.log(`🎉 [DEBUG REFERRAL] Referral processed successfully via service!`);
        } catch (refErr) {
          console.error('❌ [DEBUG ERROR] Error processing referral reward:', refErr.message);
        } finally {
          pendingReferrals.delete(telegramId);
          console.log(`🧹 [DEBUG REFERRAL] Cleared pending referral memory for user ${telegramId}`);
        }
      }

    } else {
      user.phoneNumber = phoneNumber;
      await user.save();
      console.log(`ℹ️ [DEBUG CONTACT] Existing user updated with phone number: ${telegramId}`);
    }

    const mainMenuMarkup = getMainMenuKeyboard(lang);
    const successTexts = {
      am: `🎉 ምዝገባዎ በተሳካ ሁኔታ ተጠናቋል!\n🎁 የ 15 ETB የምዝገባ ቦነስ ወደ Play Walletዎ ገብቷል!`,
      en: `🎉 Registration completed successfully!\n🎁 15 ETB registration bonus has been credited to your Play Wallet!`,
      om: `🎉 Galmeen keessan milkaa'inaan xumurameera!\n🎁 Boonasni galmee 15 ETB Play Wallet keessanitti galteera!`,
      so: `🎉 Diiwaangelintaadu si guul ah ayay ku dhammaatay!\n🎁 15 ETB oo ah bonus diiwaangelin ah ayaa lagu daray Play Wallet-kaaga!`
    };

    await ctx.reply(successTexts[lang] || successTexts['am'], {
      parse_mode: 'Markdown',
      ...mainMenuMarkup
    });
  } catch (err) {
    console.error('❌ [DEBUG ERROR] in start.handler (contact share):', err);
  }
};