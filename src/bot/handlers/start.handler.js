import path from 'path';
import { fromPath } from 'node-telegram-bot-api/node';
import { User } from '../../models/User.model.js';
import { Wallet } from '../../models/Wallet.model.js';
import { Transaction } from '../../models/Transaction.model.js';
import { Referral } from '../../models/Referral.model.js';
import { phoneRequestKeyboard, getMainMenuKeyboard } from '../keyboards.js';
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
    
    // 🔍 DEBUG: ሙሉውን የሜሴጅ ቴክስት እና ሪፈራል ፕሎድ መመርመር
    const text = ctx.message?.text || '';
    console.log(`🔍 [DEBUG START] User ${telegramId} sent text: "${text}"`);
    
    const referralCode = text.split(' ')[1];
    if (referralCode) {
      pendingReferrals.set(telegramId, referralCode);
      console.log(`✅ [DEBUG START] Referral code captured and stored in memory: "${referralCode}" for user ${telegramId}`);
    } else {
      console.log(`ℹ️ [DEBUG START] No referral code found in start command for user ${telegramId}`);
    }

    // ⚡ High-speed non-blocking lean query
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

      // ⚡ FAST PHOTO SENDING: Use cached file_id if available, otherwise read from path once and cache it
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

        // 💡 Capture file_id for instant subsequent deliveries without disk reading
        if (sentMessage?.photo) {
          cachedPhotoFileId = sentMessage.photo[sentMessage.photo.length - 1].file_id;
        }
      }
    } else {
      // ⚡ Fetch wallet with updated dual-wallet fields (mainWallet & playWallet)
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
 * and processing referral reward (10 ETB to referrer) with Debug Mode
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

      // 2. ⚡ Create Wallet and credit 15 ETB Registration Bonus to Play Wallet
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

      // ⚡ 4. PROCESS REFERRAL REWARD (10 ETB for Referrer) with DEBUG
      const refCodeFromMemory = pendingReferrals.get(telegramId);
      console.log(`🔍 [DEBUG REFERRAL] Checking pending referral code in memory for user ${telegramId}:`, refCodeFromMemory);

      if (refCodeFromMemory) {
        try {
          const referrerUser = await User.findOne({ referralCode: refCodeFromMemory });
          
          if (referrerUser) {
            console.log(`✅ [DEBUG REFERRAL] Referrer found in DB: ID ${referrerUser._id}, Username: ${referrerUser.username}`);
            
            // ራሱንም ሆነ የሌላ ሰውን ሐሰተኛ ሪፈራል እንዳይጠቀም ማረጋገጥ
            if (referrerUser._id.toString() !== user._id.toString()) {
              const existingRef = await Referral.findOne({ referred: user._id });
              
              if (!existingRef) {
                // ሪፈራል መመዝገብ
                await Referral.create({
                  referrer: referrerUser._id,
                  referred: user._id,
                  bonusEarned: 10,
                  status: 'rewarded'
                });
                console.log(`🎉 [DEBUG REFERRAL] Referral document created successfully!`);

                // ለጋባዡ (Referrer) 10 ብር ወደ Play Wallet መጨመር
                let referrerWallet = await Wallet.findOne({ user: referrerUser._id });
                if (!referrerWallet) {
                  referrerWallet = await Wallet.create({ user: referrerUser._id, mainWallet: 0, playWallet: 0 });
                }
                referrerWallet.playWallet += 10;
                await referrerWallet.save();
                console.log(`💰 [DEBUG REFERRAL] 10 ETB added to referrer's playWallet. New balance: ${referrerWallet.playWallet}`);

                // የትራንዛክሽን ሪኮርድ ለጋባዡ መመዝገብ
                await Transaction.create({
                  user: referrerUser._id,
                  wallet: referrerWallet._id,
                  type: 'bonus',
                  amount: 10,
                  status: 'completed',
                  description: `Referral bonus for inviting ${firstName}`
                });
              } else {
                console.warn(`⚠️ [DEBUG REFERRAL] User ${user._id} is already referred by someone else.`);
              }
            } else {
              console.warn(`⚠️ [DEBUG REFERRAL] Self-referral attempt detected for user ${user._id}. Ignored.`);
            }
          } else {
            console.warn(`❌ [DEBUG REFERRAL] Referrer with code "${refCodeFromMemory}" not found in database.`);
          }
        } catch (refErr) {
          console.error('❌ [DEBUG ERROR] Error processing referral reward on contact share:', refErr.message);
        } finally {
          pendingReferrals.delete(telegramId); // ከሜሞሪ ማጽዳት
          console.log(`🧹 [DEBUG REFERRAL] Cleared pending referral memory for user ${telegramId}`);
        }
      } else {
        console.log(`ℹ️ [DEBUG REFERRAL] No pending referral found in memory map for user ${telegramId}`);
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