import { Wallet } from '../../models/Wallet.model.js';
import { User } from '../../models/User.model.js';
import { getMainMenuKeyboard } from '../keyboards.js';

// ⚡ O(1) Static Wallet Translations for high speed and zero latency (Updated for Dual-Wallet)
const WALLET_TEXTS = {
  am: {
    errorNotRegistered: '⚠️ እባክዎ መጀመሪያ ይመዝገቡ።',
    errorGeneral: '⚠️ የሒሳብ መግለጫውን ማምጣት አልተቻለም። እባክዎ እንደገና ይሞክሩ።',
    title: '💰 **የሒሳብ መግለጫ (Wallet)**',
    mainWallet: '🟢 **ዋና ቦርሳ (Main Wallet - Withdrawable):**',
    playWallet: '🟡 **የጨዋታ ቦርሳ (Play Wallet - Non-withdrawable):**',
    locked: '🔒 **የታገደ ሒሳብ (Locked):**',
    currency: '💱 **ምንዛሬ:**',
    depositPrompt: "📥 ገቢ ለማድረግ ከታች ካለው ሜኑ 'ገቢ (Deposit)' የሚለውን ይጫኑ።",
    btnDeposit: '📥 ገቢ (Deposit)',
    btnWithdraw: '📤 ወጪ (Withdraw)'
  },
  en: {
    errorNotRegistered: '⚠️ Please register first.',
    errorGeneral: '⚠️ Could not retrieve wallet statement. Please try again.',
    title: '💰 **Wallet Statement**',
    mainWallet: '🟢 **Main Wallet (Withdrawable):**',
    playWallet: '🟡 **Play Wallet (Non-withdrawable):**',
    locked: '🔒 **Locked Balance:**',
    currency: '💱 **Currency:**',
    depositPrompt: "📥 To make a deposit, tap 'Deposit' from the menu below.",
    btnDeposit: '📥 Deposit',
    btnWithdraw: '📤 Withdraw'
  },
  om: {
    errorNotRegistered: '⚠️ Maaloo dura galmaa\'aa.',
    errorGeneral: '⚠️ Herrega keessan fiduu hin danda\'amre. Irra deebi\'aa yaalaa.',
    title: '💰 **Ibsa Herregaa (Wallet)**',
    mainWallet: '🟢 **Herrega Guddaa (Main Wallet):**',
    playWallet: '🟡 **Herrega Taphaa (Play Wallet):**',
    locked: '🔒 **Herrega Cufame (Locked):**',
    currency: '💱 **Maallaqa:**',
    depositPrompt: "📥 Galii gochuuf gadii irraa 'Galii (Deposit)' tuqaa.",
    btnDeposit: '📥 Galii (Deposit)',
    btnWithdraw: '📤 Baasii (Withdraw)'
  },
  so: {
    errorNotRegistered: '⚠️ Fadlan marka hore is diiwaangeli.',
    errorGeneral: '⚠️ Waan soo celin kari waayay xogtaada xisaabta. Fadlan dib u tijaabi.',
    title: '💰 **Bayaanka Xisaabta (Wallet)**',
    mainWallet: '🟢 **Boorso Weyn (Main Wallet):**',
    playWallet: '🟡 **Boorso Ciyaar (Play Wallet):**',
    locked: '🔒 **Hadhaaga Xiran (Locked):**',
    currency: '💱 **Lacagta:**',
    depositPrompt: "📥 Si aad dhigasho u samayso, riix 'Deposit' ee ku jira menu-ga hoose.",
    btnDeposit: '📥 Dhigasho (Deposit)',
    btnWithdraw: '📤 Kala Bixid (Withdraw)'
  }
};

export const handleWalletCommand = async (ctx, telegramId) => {
  try {
    let lang = 'am';
    let user = null;

    if (telegramId) {
      user = await User.findOne({ telegramId }).lean();
      if (user?.language) {
        lang = user.language;
      }
    }

    const t = WALLET_TEXTS[lang] || WALLET_TEXTS['am'];
    const mainMenuMarkup = getMainMenuKeyboard(lang);

    if (!user) {
      await ctx.reply(t.errorNotRegistered, mainMenuMarkup);
      return;
    }

    const wallet = await Wallet.findOne({ user: user._id }).lean();

    const text = `${t.title}

${t.mainWallet} ${wallet?.mainWallet || 0}.00 ETB
${t.playWallet} ${wallet?.playWallet || 0}.00 ETB
${t.locked} ${wallet?.lockedBalance || 0}.00 ETB
${t.currency} ${wallet?.currency || 'ETB'}

${t.depositPrompt}`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: t.btnDeposit, callback_data: 'deposit_menu' },
            { text: t.btnWithdraw, callback_data: 'withdraw_menu' }
          ]
        ]
      }
    };

    await ctx.reply(text, { 
      parse_mode: 'Markdown', 
      ...keyboard,
      ...mainMenuMarkup 
    });
  } catch (err) {
    console.error('❌ Error in wallet.handler:', err);
    await ctx.reply('⚠️ የሒሳብ መግለጫውን ማምጣት አልተቻለም። እባክዎ እንደገና ይሞክሩ።');
  }
};