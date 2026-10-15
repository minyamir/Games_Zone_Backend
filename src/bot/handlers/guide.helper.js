// src/bot/handlers/guide.helper.js
import { config } from '../../config/env.js';

export const guideTexts = {
  am: '📖 **የጨዋታ መመሪያ እና ደንቦች**\n\n1. ሚኒ አፑን ይክፈቱ\n2. የቢንጎ ካርድ ይምረጡ\n3. ቁጥሮች ሲጠሩ ይጫወቱ እና ያሸንፉ!\n\n👇 ሙሉ መመሪያውን እና ደንቡን ለማየት ከታች ያለውን ቁልፍ ይጫኑ:',
  en: '📖 **Game Guide & Rules**\n\n1. Open the Mini App\n2. Select your Bingo card\n3. Play and win as numbers are called!\n\n👇 Click the button below to view the full guide and rules:',
  om: '📖 **Qajeelfama Taphaa fi Seerota**\n\n1. Mini App banaa\n2. Kaardii BiiNGO filadhaa\n3. Lakkoofsi yeroo waamamu taphadhaa injifadhaa!\n\n👇 Qajeelfama guutuu fi seera ilaaluuf tuqaa armaan gadii cuqaasaa:',
  so: '📖 **Hagaha Ciyaarta & Xeerarka**\n\n1. Fur Mini App-ka\n2. Dooro kaarkaaga Bingo\n3. Ciyaar oo guulayso marka lambarada la yeero!\n\n👇 Riix badhanka hoose si aad u aragto hagaha iyo xeerarka buuxa:'
};

const buttonTexts = {
  am: '📖 መመሪያውን እና ደንቡን ክፈት',
  en: '📖 Open Guide & Rules',
  om: '📖 Qajeelfama Banuu',
  so: '📖 Fur Hagaha'
};

/**
 * Handles the guide / instructions command or text with an inline web_app button.
 * @param {Object} ctx - The bot context (Telegram/Telegraf context)
 * `param {String} lang - User language code ('am', 'en', 'om', 'so') default to 'am'
 */
export async function handleGuide(ctx, lang = 'am') {
  try {
    const text = guideTexts[lang] || guideTexts['am'];
    const btnText = buttonTexts[lang] || buttonTexts['am'];
    
    // የዌብሳይቱ ወይም ሚኒ አፑ ሊንክ (ከ env.js የሚመጣው ወይም ትክክለኛው የሊንክ አድራሻዎ)
    const miniAppUrl = config.miniAppUrl || 'https://rule-and-regulations.vercel.app/';

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: btnText,
              web_app: { url: miniAppUrl } // ተጠቃሚው ሲጫነው በቀጥታ ሊንኩን በብሮውዘር/ሚኒ አፕ ይከፍታል
            }
          ]
        ]
      }
    };

    return await ctx.reply(text, {
      parse_mode: 'Markdown',
      ...keyboard
    });
  } catch (err) {
    console.error('❌ Error in handleGuide:', err);
  }
}