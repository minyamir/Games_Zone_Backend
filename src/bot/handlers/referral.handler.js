import { User } from '../../models/User.model.js';
import { getMainMenuKeyboard } from '../keyboards.js';

// ⚡ O(1) Static Referral Translations for high performance and zero latency
const REFERRAL_TEXTS = {
  am: {
    errorNotRegistered: '⚠️ እባክዎ መጀመሪያ ይመዝገቡ።',
    errorGeneral: '⚠️ ሪፈራል መረጃውን ማምጣት አልተቻለም። እባክዎ እንደገና ይሞክሩ።',
    title: '🔗 **የጋብዝ & አግኝ ፕሮግራም (Referral Program)**',
    subtitle: 'ጓደኞችዎን ወደ ቢንጎ ሀበሻ በመጋበዝ አስደናቂ ሽልማቶችን ያግኙ!',
    invitedCount: '👥 **እስከአሁን የጋበዟቸው:**',
    peopleCount: 'ሰዎች',
    benefit: '🎁 **የሚያገኙት ጥቅም:** ጓደኛዎ የመጀመሪያ ዴፖዚት ሲያደርግ ቦነስ ይመሰገንልዎታል።',
    linkPrompt: '👇 **የእርስዎ ልዩ ሪፈራል ሊንክ:**',
    footer: '*(ሊንኩን በመንካት ለጓደኞችዎ ማጋራት ይችላሉ)*'
  },
  en: {
    errorNotRegistered: '⚠️ Please register first.',
    errorGeneral: '⚠️ Could not retrieve referral data. Please try again.',
    title: '🔗 **Invite & Earn Program (Referral)**',
    subtitle: 'Invite your friends to Bingo Habesha and earn amazing rewards!',
    invitedCount: '👥 **You have invited so far:**',
    peopleCount: 'people',
    benefit: '🎁 **Your Benefit:** You will receive a bonus when your friend makes their first deposit.',
    linkPrompt: '👇 **Your unique referral link:**',
    footer: '*(You can share this link with your friends)*'
  },
  om: {
    errorNotRegistered: '⚠️ Maaloo dura galmaa\'aa.',
    errorGeneral: '⚠️ Odeeffannoo referaalaa fiduu hin danda\'amre. Irra deebi\'aa yaalaa.',
    title: '🔗 **Sagantaa Affeerii & Badhaasaa (Referral)**',
    subtitle: 'Hiriyoota keessan gara BiiNGO Habeshaatti affeeruun badhaasa dinqisiisaa argadhaa!',
    invitedCount: '👥 **Namoota hanga ammaatti affeertan:**',
    peopleCount: 'namoota',
    benefit: '🎁 **Bu\'aa Argattan:** Hiriyaan keessan galii jalqabaa yeroo godhu boonaasiin siif kenna.',
    linkPrompt: '👇 **Koodii/Liinkii referaalaa keessan addaa:**',
    footer: '*(Liinkii kana tuquun hiriyoota keessaniif qooduu dandeessu)*'
  },
  so: {
    errorNotRegistered: '⚠️ Fadlan marka hore is diiwaangeli.',
    errorGeneral: '⚠️ Waan soo celin kari waayay xogta tixraaca. Fadlan dib u tijaabi.',
    title: '🔗 **Barnaamijka Casuumaadda (Referral Program)**',
    subtitle: 'Ku casuum saaxiibadaada Bingo Habesha oo hel abaalmarino cajiib ah!',
    invitedCount: '👥 **Dadka aad ilaa iyo hadda casuuntay:**',
    peopleCount: 'qof',
    benefit: '🎁 **Faa\'iidadaada:** Waxaad heli doontaa boonoos marka saaxiibkaa uu sameeyo dhigashadiisa ugu horreysa.',
    linkPrompt: '👇 **Link-gaaga gaarka ah ee tixraaca:**',
    footer: '*(Waxaad la wadaagi kartaa link-gan saaxiibadaada)*'
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

    const botUsername = ctx.botInfo?.username || 'BingoHabeshaBot';
    const referralLink = `https://t.me/${botUsername}?start=${user.referralCode}`;

    // ⚡ Fast count using lean database indexing
    const invitedCount = await User.countDocuments({ referredBy: user._id });

    const text = `${t.title}

${t.subtitle}

${t.invitedCount} ${invitedCount} ${t.peopleCount}
${t.benefit}

${t.linkPrompt}
\`${referralLink}\`

${t.footer}`;

    await ctx.reply(text, { parse_mode: 'Markdown', ...mainMenuMarkup });
  } catch (err) {
    console.error('❌ Error in referral.handler:', err);
    await ctx.reply('⚠️ ሪፈራል መረጃውን ማምጣት አልተቻለም። እባክዎ እንደገና ይሞክሩ።');
  }
};