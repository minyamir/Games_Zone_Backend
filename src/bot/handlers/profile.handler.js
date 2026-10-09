import { User } from '../../models/User.model.js';
import { Wallet } from '../../models/Wallet.model.js';
import { getMainMenuKeyboard } from '../keyboards.js';

// Helper function to escape markdown special characters if using Markdown mode
const escapeMarkdown = (text) => {
  if (!text) return '';
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
};

// ⚡ O(1) Static Profile Translations for zero-latency execution (Updated for Dual-Wallet)
const PROFILE_TEXTS = {
  am: {
    title: '👤 *የተጠቃሚ ፕሮፋይል (Profile)*',
    id: '🆔 *መለያ ቁጥር:*',
    name: '📛 *ስም:*',
    phone: '📱 *ስልክ ቁጥር:*',
    noPhone: 'አልተመዘገበም',
    referral: '🔗 *የእርስዎ ሪፈራል ኮድ:*',
    regDate: '📅 *የተመዘገቡበት ቀን:*',
    mainWallet: '🟢 *ዋና ቦርሳ (Main - Withdrawable):*',
    playWallet: '🟡 *የጨዋታ ቦርሳ (Play - Non-withdrawable):*',
    errorNotFound: '⚠️ እባክዎ መጀመሪያ /start በመጫን ይመዝገቡ።',
    errorGeneral: '⚠️ ፕሮፋይልዎን ማምጣት አልተቻለም። እባክዎ እንደገና ይሞክሩ።'
  },
  en: {
    title: '👤 *User Profile*',
    id: '🆔 *Telegram ID:*',
    name: '📛 *Name:*',
    phone: '📱 *Phone Number:*',
    noPhone: 'Not registered',
    referral: '🔗 *Your Referral Code:*',
    regDate: '📅 *Registration Date:*',
    mainWallet: '🟢 *Main Wallet (Withdrawable):*',
    playWallet: '🟡 *Play Wallet (Non-withdrawable):*',
    errorNotFound: '⚠️ Please register by pressing /start first.',
    errorGeneral: '⚠️ Could not retrieve your profile. Please try again.'
  },
  om: {
    title: '👤 *Proofaayilii Fayyadamaa*',
    id: '🆔 *Lakkoofsa Eenyummaa:*',
    name: '📛 *Maqaa:*',
    phone: '📱 *Lakkoofsa Bilbilaa:*',
    noPhone: 'Hin galmoofne',
    referral: '🔗 *Koodii Referaalaa Keessan:*',
    regDate: '📅 *Guyyaa Galmee:*',
    mainWallet: '🟢 *Herrega Guddaa (Main Wallet):*',
    playWallet: '🟡 *Herrega Taphaa (Play Wallet):*',
    errorNotFound: '⚠️ Maaloo dura /start tuquun galmaaʼaa.',
    errorGeneral: '⚠️ Proofaayilii keessan fiduu hin dandaʼamre. Irra deebi\'aa yaalaa.'
  },
  so: {
    title: '👤 *Profile-ka Isticmaalaha*',
    id: '🆔 *Aqoonsiga:*',
    name: '📛 *Magaca:*',
    phone: '📱 *Lambarka Telefoonka:*',
    noPhone: 'Lama diiwaangelin',
    referral: '🔗 *Koodkaaga Tixraaca:*',
    regDate: '📅 *Taariikhda Diiwaangelinta:*',
    mainWallet: '🟢 *Boorso Weyn (Main Wallet):*',
    playWallet: '🟡 *Boorso Ciyaar (Play Wallet):*',
    errorNotFound: '⚠️ Fadlan marka hore iska diiwaangeli adoo riixaya /start.',
    errorGeneral: '⚠️ Waan soo celin kari waayay profile-kaaga. Fadlan dib u tijaabi.'
  }
};

export const handleProfileCommand = async (ctx, telegramId) => {
  try {
    // ⚡ High-speed non-blocking lean query
    const user = await User.findOne({ telegramId }).lean();
    const lang = user?.language || 'am';
    const t = PROFILE_TEXTS[lang] || PROFILE_TEXTS['am'];
    const mainMenuMarkup = getMainMenuKeyboard(lang);

    if (!user) {
      await ctx.reply(t.errorNotFound, mainMenuMarkup);
      return;
    }

    const wallet = await Wallet.findOne({ user: user._id }).lean();

    const text = `${t.title}

${t.id} ${user.telegramId}
${t.name} ${escapeMarkdown(user.firstName)}
${t.phone} ${escapeMarkdown(user.phoneNumber || t.noPhone)}
${t.referral} \`${user.referralCode}\`
${t.regDate} ${new Date(user.createdAt).toLocaleDateString()}

${t.mainWallet} ${wallet?.mainWallet || 0}.00 ETB
${t.playWallet} ${wallet?.playWallet || 0}.00 ETB`;

    await ctx.reply(text, { parse_mode: 'Markdown', ...mainMenuMarkup });
  } catch (err) {
    console.error('❌ Error in profile.handler:', err);
    await ctx.reply('⚠️ ፕሮፋይልዎን ማምጣት አልተቻለም። እባክዎ እንደገና ይሞክሩ።');
  }
};