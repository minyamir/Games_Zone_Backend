import { User } from '../../models/User.model.js';
import { Wallet } from '../../models/Wallet.model.js';

// Helper function to escape markdown special characters if using Markdown mode
const escapeMarkdown = (text) => {
  if (!text) return '';
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
};

export const handleProfileCommand = async (ctx, telegramId) => {
  try {
    const user = await User.findOne({ telegramId }).lean();
    if (!user) {
      await ctx.reply('⚠️ እባክዎ መጀመሪያ /start በመጫን ይመዝገቡ።');
      return;
    }

    const wallet = await Wallet.findOne({ user: user._id }).lean();

    const text = `👤 *የተጠቃሚ ፕሮፋይል (Profile)*

🆔 *መለያ ቁጥር:* ${user.telegramId}
📛 *ስም:* ${escapeMarkdown(user.firstName)}
📱 *ስልክ ቁጥር:* ${escapeMarkdown(user.phoneNumber || 'አልተመዘገበም')}
🔗 *የእርስዎ ሪፈራል ኮድ:* \`${user.referralCode}\`
📅 *የተመዘገቡበት ቀን:* ${new Date(user.createdAt).toLocaleDateString()}

💰 *ዋና ሒሳብ:* ${wallet?.balance || 0}.00 ETB
🎁 *ቦነስ ሒሳብ:* ${wallet?.bonusBalance || 0}.00 ETB`;

    await ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('❌ Error in profile.handler:', err);
    await ctx.reply('⚠️ ፕሮፋይልዎን ማምጣት አልተቻለም። እባክዎ እንደገና ይሞክሩ።');
  }
};