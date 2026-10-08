import { User } from '../../models/User.model.js';
import { getMainMenuKeyboard } from '../keyboards.js';

// ⚡ O(1) Static Help Center Translations for blazing-fast response
const HELP_TEXTS = {
  am: `🆘 የእርዳታ ማዕከል (Help Center)

ማንኛውም ጥያቄ ወይም የሚያጋጥምዎት ችግር ካለ ከታች ባሉት አድራሻዎች ማነጋገር ይችላሉ፡

👨‍💻 ዋና አስተዳዳሪ: @Support_Admin
📢 ቻናል: @BingoHabeshaChannel
⏰ የስራ ሰዓት: 24/7 (ከሰዓት ውጪም ጭምር)

እባክዎ ሲያነጋግሩን የቴሌግራም መለያዎን (Telegram ID) እና የችግሩን ዝርዝር በአጭሩ ይግለጹልን።`,
  
  en: `🆘 Help Center

If you have any questions or encounter any issues, you can contact us through the addresses below:

👨‍💻 Main Admin: @Support_Admin
📢 Channel: @BingoHabeshaChannel
⏰ Working Hours: 24/7

When contacting us, please briefly state your Telegram ID and the details of your issue.`,
  
  om: `🆘 Giddugala Gargaarsaa (Help Center)

Gaaffii ykn rakkoo kamiyyuu yoo qabaattan karaa teessoo armaan gadiitiin nu qunnamuu dandeessu:

👨‍💻 Bulchaa Guddaa: @Support_Admin
📢 Chaanaalii: @BingoHabeshaChannel
⏰ Sa'aatii Hojjii: 24/7

Yeroo nu qunnamtan lakkoofsa eenyummaa Telegiraamaa (Telegram ID) keessanifi ibsa rakkoo keessanii gabaabsanii nuuf barreessaa.`,
  
  so: `🆘 Xarunta Caawinta (Help Center)

Haddii aad qabtid wax su'aal ah ama dhibaato ah, waxaad nagala soo xiriiri kartaa cinwaanada hoose:

👨‍💻 Maamulaha: @Support_Admin
📢 Kanaalka: @BingoHabeshaChannel
⏰ Saacadaha Shaqada: 24/7

Marka aad na soo wacdid, fadlan si kooban u sheeg Telegram ID-gaaga iyo faahfaahinta dhibaatadaada.`
};

export const handleHelpCommand = async (ctx, telegramId) => {
  try {
    let lang = 'am';
    
    // ⚡ Fast language lookup using projection and lean query
    if (telegramId) {
      const user = await User.findOne({ telegramId }).select('language').lean();
      if (user?.language) {
        lang = user.language;
      }
    }

    const text = HELP_TEXTS[lang] || HELP_TEXTS['am'];
    const mainMenuMarkup = getMainMenuKeyboard(lang);

    await ctx.reply(text, mainMenuMarkup);
  } catch (err) {
    console.error('❌ Error in help.handler:', err);
    await ctx.reply('⚠️ እርዳታ ማዕከልን ማምጣት አልተቻለም። እባክዎ እንደገና ይሞክሩ።');
  }
};