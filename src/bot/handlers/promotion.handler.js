import { User } from '../../models/User.model.js';
import { getMainMenuKeyboard } from '../keyboards.js';

// ⚡ O(1) Static Promotion Translations for ultra-fast performance
const PROMOTION_TEXTS = {
  am: `🎁 **ልዩ ማስተዋወቂያዎች እና ሽልማቶች**

በአሁኑ ሰዓት ያሉን አዳዲስ ማስተዋወቂያዎች፡
1️⃣ **የመጀመሪያ ዴፖዚት ቦነስ:** ከ 100 ብር በላይ ሲያስገቡ 10% ተጨማሪ ቦነስ ያግኙ!
2️⃣ **የሪፈራል ሽልማት:** ጓደኛዎን ሲጋብዙ እና ገቢ ሲያደርግ የብር ሽልማት ይሸለሙ።

📢 አዳዲስ ሽልማቶችን ለማግኘት ቻናላችንን ይከታተሉ!`,

  en: `🎁 **Special Promotions & Rewards**

Current active promotions:
1️⃣ **First Deposit Bonus:** Get an extra 10% bonus when you deposit over 100 ETB!
2️⃣ **Referral Reward:** Earn cash rewards when you invite friends who make a deposit.

📢 Stay tuned to our channel for new rewards!`,

  om: `🎁 **Beeksisa Addaa & Badhaasota**

Beeksisoonni amma jiran:
1️⃣ **Boonasii Galii Duraa:** Maallaqa 100 Birrii ol yeroo galitan boonasii dabalataa 10% argadhaa!
2️⃣ **Badhaasa Referaalaa:** Hiriyoota keessan yeroo affeertanifi yeroo galii godhan badhaasa argadhaa.

📢 Badhaasota haaraa argachuuf chaanaalii keenya hordofaa!`,

  so: `🎁 **Promotions Gaarka ah & Abaalmarino**

Xayeysiisyada hadda jiraan:
1️⃣ **Boonaska Dhigashada Koowaad:** Hel 10% boonoos dheera ah marka aad dhigato in ka badan 100 Birr!
2️⃣ **Abaalmarinta Tixraaca:** Hel abaalmarin lacageed marka aad martiqaadid saaxiibada oo dhigta lacag.

📢 La soco kanaalkayaga si aad u hesho abaalmarino cusub!`
};

export const handlePromotionCommand = async (ctx, telegramId) => {
  try {
    let lang = 'am';

    // ⚡ High-speed non-blocking lean query for language preference
    if (telegramId) {
      const user = await User.findOne({ telegramId }).select('language').lean();
      if (user?.language) {
        lang = user.language;
      }
    }

    const text = PROMOTION_TEXTS[lang] || PROMOTION_TEXTS['am'];
    const mainMenuMarkup = getMainMenuKeyboard(lang);

    await ctx.reply(text, { parse_mode: 'Markdown', ...mainMenuMarkup });
  } catch (err) {
    console.error('❌ Error in promotion.handler:', err);
    await ctx.reply('⚠️ ማስተዋወቂያውን ማምጣት አልተቻለም። እባክዎ እንደገና ይሞክሩ።');
  }
};