import path from 'path';
import { fromPath } from 'node-telegram-bot-api/node';
import { User } from '../../models/User.model.js';
import { Referral } from '../../models/Referral.model.js';
import { getMainMenuKeyboard } from '../keyboards.js';
import { config } from '../../config/env.js';

// ⚡ Static cached photo file_id for zero-latency delivery
let cachedReferralPhotoId = null;

// ⚡ O(1) Static Referral Translations with HTML formatting
const REFERRAL_TEXTS = {
  am: {
    errorNotRegistered: '⚠️ እባክዎ መጀመሪያ ይመዝገቡ።',
    errorGeneral: '⚠️ ሪፈራል መረጃውን ማምጣት አልተቻለም። እባክዎ እንደገና ይሞክሩ።',
    title: '🔗 <b>የጋብዝ & አግኝ ፕሮግራም (Referral Program)</b>',
    subtitle: 'ጓደኞችዎን ወደ ቢንጎ ሀበሻ በመጋበዝ እያንዳንዱ ሰው ሲጀምር 10 ብር ያግኙ!',
    invitedCount: '👥 <b>እስከአሁን የጋበዟቸው:</b>',
    peopleCount: 'ሰዎች',
    totalEarned: '💰 <b>ያገኙት ጠቅላላ ቦነስ:</b>',
    benefit: '🎁 <b>የሚያገኙት ጥቅም:</b> ጓደኛዎ ቦቱን ሲጀምር (Start ሲያደርግ) 10 ብር ወደ ኪስዎ ይገባል።',
    linkPrompt: '👇 <b>የእርስዎ ልዩ ሪፈራል ሊንክ (ለመንካት ይጫኑ):</b>',
    clickHere: '👉 እዚህ በመጫን ሊንኩን ያጋሩ',
    footer: '<i>(ሊንኩን በመንካት ለጓደኞችዎ ማጋራት ይችላሉ)</i>'
  },
  en: {
    errorNotRegistered: '⚠️ Please register first.',
    errorGeneral: '⚠️ Could not retrieve referral data. Please try again.',
    title: '🔗 <b>Invite & Earn Program (Referral)</b>',
    subtitle: 'Invite your friends to Bingo Habesha and earn 10 ETB for each user who joins!',
    invitedCount: '👥 <b>You have invited so far:</b>',
    peopleCount: 'people',
    totalEarned: '💰 <b>Total Earned:</b>',
    benefit: '🎁 <b>Your Benefit:</b> You receive 10 ETB when your friend starts the bot.',
    linkPrompt: '👇 <b>Your unique referral link:</b>',
    clickHere: '👉 Click here to share your link',
    footer: '<i>(You can share this link with your friends)</i>'
  },
  om: {
    errorNotRegistered: '⚠️ Maaloo dura galmaa\'aa.',
    errorGeneral: '⚠️ Odeeffannoo referaalaa fiduu hin danda\'amre. Irra deebi\'aa yaalaa.',
    title: '🔗 <b>Sagantaa Affeerii & Badhaasaa (Referral)</b>',
    subtitle: 'Hiriyoota keessan gara BiiNGO Habeshaatti affeeruun nama tokkoof qarshii 10 argadhaa!',
    invitedCount: '👥 <b>Namoota hanga ammaatti affeertan:</b>',
    peopleCount: 'namoota',
    totalEarned: '💰 <b>Maallaqa Waliigalaa Argatte:</b>',
    benefit: '🎁 <b>Bu\'aa Argattan:</b> Hiriyaan keessan yeroo bot-icha eegalu qarshii 10 argattu.',
    linkPrompt: '👇 <b>Koodii/Liinkii referaalaa keessan addaa:</b>',
    clickHere: '👉 Liinkii kana qoodachuuf as tuqaa',
    footer: '<i>(Liinkii kana tuquun hiriyoota keessaniif qooduu dandeessu)</i>'
  },
  so: {
    errorNotRegistered: '⚠️ Fadlan marka hore is diiwaangeli.',
    errorGeneral: '⚠️ Waan soo celin kari waayay xogta tixraaca. Fadlan dib u tijaabi.',
    title: '🔗 <b>Barnaamijka Casuumaadda (Referral Program)</b>',
    subtitle: 'Ku casuum saaxiibadaada Bingo Habesha oo hel 10 ETB qof walba oo soo biira!',
    invitedCount: '👥 <b>Dadka aad ilaa iyo hadda casuuntay:</b>',
    peopleCount: 'qof',
    totalEarned: '💰 <b>Wadarta La Helay:</b>',
    benefit: '🎁 <b>Faa\'iidadaada:</b> Waxaad heleysaa 10 ETB marka saaxiibkaa uu bilaabo bot-ka.',
    linkPrompt: '👇 <b>Link-gaaga gaarka ah ee tixraaca:</b>',
    clickHere: '👉 Halkan riix si aad u wadaagto linkiga',
    footer: '<i>(Waxaad la wadaagi kartaa link-gan saaxiibadaada)</i>'
  }
};

export const handleReferralCommand = async (ctx, telegramId) => {
  try {
    const user = await User.findOne({ telegramId }).lean();
    const lang = user?.language || 'am';
    const t = REFERRAL_TEXTS[lang] || REFERRAL_TEXTS['am'];
    const mainMenuMarkup = getMainMenuKeyboard(lang);

    if (!user) {
      await ctx.reply(t.errorNotRegistered, mainMenuMarkup);
      return;
    }

    const botUsernameFromCtx = ctx.botInfo?.username;
    const botUsernameFromEnv = config.telegramBotUsername || process.env.BOT_USERNAME;
    const botUsername = botUsernameFromCtx || botUsernameFromEnv || 'Game_Ethiopia_bot';

    const referralLink = `https://t.me/${botUsername}?start=${user.referralCode}`;

    const invitedCount = await Referral.countDocuments({ 
      referrer: user._id, 
      status: 'rewarded' 
    });
    const totalEarned = invitedCount * 10;

    // 🔗 HTML <code> እና <a href="..."> በመጠቀም ሊንኩ ክሊክ የሚደረግ እንዲሆን ተደርጓል
    const captionText = `${t.title}

${t.subtitle}

${t.invitedCount} <b>${invitedCount}</b> ${t.peopleCount}
${t.totalEarned} <b>${totalEarned} ብር</b>
${t.benefit}

${t.linkPrompt}
👉 <a href="${referralLink}">${referralLink}</a>

${t.footer}`;

    // ⚡ TELEGRAM SHARE URL INLINE BUTTON (ለተጠቃሚዎች ማጋሪያ አዝራር)
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}%0A%0A${encodeURIComponent(t.subtitle)}`;
    
    // ከዋናው ሜኑ ኪቦርድ ጋር የሼር አዝራሩን አንድ ላይ ማቀናጀት
    const customMarkup = {
      reply_markup: {
        inline_keyboard: [
          [{ text: t.clickHere, url: shareUrl }],
          ...(mainMenuMarkup.reply_markup?.inline_keyboard || [])
        ]
      }
    };

    const chatId = ctx.chat?.id || ctx.message?.chat?.id;

    // ⚡ FAST PHOTO SENDING WITH SHARE INLINE BUTTON
    if (cachedReferralPhotoId) {
      await ctx.api.sendPhoto({
        chat_id: chatId,
        photo: cachedReferralPhotoId,
        caption: captionText,
        parse_mode: 'HTML',
        ...customMarkup
      });
    } else {
      const imagePath = path.resolve('src/assets/images/image.png');
      const sentMessage = await ctx.api.sendPhoto({
        chat_id: chatId,
        photo: await fromPath(imagePath),
        caption: captionText,
        parse_mode: 'HTML',
        ...customMarkup
      });

      if (sentMessage?.photo) {
        cachedReferralPhotoId = sentMessage.photo[sentMessage.photo.length - 1].file_id;
      }
    }
  } catch (err) {
    console.error('❌ Error in referral.handler:', err);
    await ctx.reply('⚠️ ሪፈራል መረጃውን ማምጣት አልተቻለም። እባክዎ እንደገና ይሞክሩ።');
  }
};