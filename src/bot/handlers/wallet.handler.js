import { Wallet } from '../../models/Wallet.model.js';
import { User } from '../../models/User.model.js';
import { getMainMenuKeyboard } from '../keyboards.js';

// ⚡ O(1) Static Wallet Translations for high speed and zero latency
const WALLET_TEXTS = {
  am: {
    errorNotRegistered: '⚠️ እባክዎ መጀመሪያ ይመዝገቡ።',
    errorGeneral: '⚠️ የሒሳብ መግለጫውን ማምጣት አልተቻለም። እባክዎ እንደገና ይሞክሩ።',
    title: '💰 **የሒሳብ መግለጫ (Wallet)**',
    balance: '💵 **ዋና ሒሳብ (Balance):**',
    locked: '🔒 **የታገደ ሒሳብ (Locked):**',
    bonus: '🎁 **ቦነስ ሒሳብ (Bonus):**',
    currency: '💱 **ምንዛሬ:**',
    depositPrompt: "📥 ገቢ ለማድረግ ከታች ካለው ሜኑ 'ገቢ (Deposit)' የሚለውን ይጫኑ።",
    btnDeposit: '📥 ገቢ (Deposit)',
    btnWithdraw: '📤 ወጪ (Withdraw)'
  },
  en: {
    errorNotRegistered: '⚠️ Please register first.',
    errorGeneral: '⚠️ Could not retrieve wallet statement. Please try again.',
    title: '💰 **Wallet Statement**',
    balance: '💵 **Main Balance:**',
    locked: '🔒 **Locked Balance:**',
    bonus: '🎁 **Bonus Balance:**',
    currency: '💱 **Currency:**',
    depositPrompt: "📥 To make a deposit, tap 'Deposit' from the menu below.",
    btnDeposit: '📥 Deposit',
    btnWithdraw: '📤 Withdraw'
  },
  om: {
    errorNotRegistered: '⚠️ Maaloo dura galmaa\'aa.',
    errorGeneral: '⚠️ Herrega keessan fiduu hin danda\'amre. Irra deebi\'aa yaalaa.',
    title: '💰 **Ibsa Herregaa (Wallet)**',
    balance: '💵 **Herrega Guddaa (Balance):**',
    locked: '🔒 **Herrega Cufame (Locked):**',
    bonus: '🎁 **Herrega Boonasii (Bonus):**',
    currency: '💱 **Maallaqa:**',
    depositPrompt: "📥 Galii gochuuf gadii irraa 'Galii (Deposit)' tuqaa.",
    btnDeposit: '📥 Galii (Deposit)',
    btnWithdraw: '📤 Baasii (Withdraw)'
  },
  so: {
    errorNotRegistered: '⚠️ Fadlan marka hore is diiwaangeli.',
    errorGeneral: '⚠️ Waan soo celin kari waayay xogtaada xisaabta. Fadlan dib u tijaabi.',
    title: '💰 **Bayaanka Xisaabta (Wallet)**',
    balance: '💵 **Hadhaaga Weyn (Balance):**',
    locked: '🔒 **Hadhaaga Xiran (Locked):**',
    bonus: '🎁 **Hadhaaga Boonooska (Bonus):**',
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

${t.balance} ${wallet?.balance || 0}.00 ETB
${t.locked} ${wallet?.lockedBalance || 0}.00 ETB
${t.bonus} ${wallet?.bonusBalance || 0}.00 ETB
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