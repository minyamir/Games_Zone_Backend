import { User } from '../../models/User.model.js';
import { getMainMenuKeyboard } from '../keyboards.js';

// ⚡ O(1) Static Rules Translations for ultra-fast, low-latency execution
const RULES_TEXTS = {
  am: `📜 **የቢንጎ ሀበሻ ጨዋታ ደንቦች እና መመሪያዎች**

1️⃣ **ዕድሜ:** ተጫዋቾች ከ 18 ዓመት በላይ መሆን አለባቸው።
2️⃣ **ዴፖዚት እና ዊዝድሮዋል:** ገንዘብ ሲያስገቡም ሆነ ሲያወጡ ትክክለኛ የባንክ አካውንት ወይም ስልክ ቁጥር መጠቀም ግዴታ ነው።
3️⃣ **ፍትሃዊነት:** ማንኛውንም ሕገ-ወጥ የሶፍትዌር አጠቃቀም (Bot/Cheat) መጠቀም በጥብቅ የተከለከለ ሲሆን አካውንትዎን ሊያስቀጣ ይችላል።
4️⃣ **ኃላፊነት:** በጨዋታው ላይ የሚደረጉ ውርርዶች ሙሉ በሙሉ በተጫዋቹ ፍላጎት ላይ የተመሰረቱ ናቸው።

መልካም ዕድል! 🎮`,

  en: `📜 **Bingo Habesha Game Rules & Guidelines**

1️⃣ **Age:** Players must be 18 years of age or older.
2️⃣ **Deposit & Withdrawal:** It is mandatory to use a valid bank account or phone number when depositing or withdrawing funds.
3️⃣ **Fair Play:** Any use of unauthorized software, bots, or cheats is strictly prohibited and will result in account suspension.
4️⃣ **Responsibility:** All game activities and wagers are entirely based on the player's own discretion and choice.

Good luck! 🎮`,

  om: `📜 **Seerota & Qajeelfamoota Tapha BiiNGO Habesha**

1️⃣ **Umrii:** Taphattoonni waggaa 18 ol ta'uu qabu.
2️⃣ **Galii & Baasii:** Maallaqa yeroo galitanii fi baafatan lakkoofsa baankii ykn bilbilaa sirrii fayyadamuun dirqama.
3️⃣ **Qajeelfama Haqa Qabeessaa:** Sooftweerii seeraan alaa (Bot/Cheat) fayyadamuun dhorkaa dha; kana yoo gootan akkaawuntii keessan irratti tarkaanfiin fudhatama.
4️⃣ **Gaafatamummaa:** Taphaarratti hirmaachuun fedhii dhuunfaa taphatichaarratti hundaa'a.

Carraa gaarii! 🎮`,

  so: `📜 **Xeerarka & Tilmaamaha Ciyaarta Bingo Habesha**

1️⃣ **Da'da:** Ciyaartooydu waa inay jiraadaan 18 sano ama ka badan.
2️⃣ **Dhigashada & Kala bixista:** Waa qasab in la isticmaalo akoon bangi ama lambar telefoon oo sax ah marka la dhigto ama la kala baxo lacagta.
3️⃣ **Ciyaarta Caddaaladda ah:** Isticmaalka software-ka aan la oggolayn (Bot/Cheat) waa mamnuuc waxaana laga yaabaa inay keento in akoonkaaga la xiro.
4️⃣ **Mas'uuliyadda:** Ciyaaraha iyo sharadka la dhigo waxay ku saleysan yihiin ikhtiyaarka iyo doonista ciyaaryahanka.

Nasiib wacan! 🎮`
};

export const handleRulesCommand = async (ctx, telegramId) => {
  try {
    let lang = 'am';

    // ⚡ High-speed non-blocking lean query for language preference
    if (telegramId) {
      const user = await User.findOne({ telegramId }).select('language').lean();
      if (user?.language) {
        lang = user.language;
      }
    }

    const text = RULES_TEXTS[lang] || RULES_TEXTS['am'];
    const mainMenuMarkup = getMainMenuKeyboard(lang);

    await ctx.reply(text, { parse_mode: 'Markdown', ...mainMenuMarkup });
  } catch (err) {
    console.error('❌ Error in rules.handler:', err);
    await ctx.reply('⚠️ ደንቦቹን ማምጣት አልተቻለም። እባክዎ እንደገና ይሞክሩ።');
  }
};