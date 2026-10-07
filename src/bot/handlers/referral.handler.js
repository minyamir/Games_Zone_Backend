import { User } from '../../models/User.model.js';

export const handleReferralCommand = async (ctx, telegramId) => {
  try {
    const user = await User.findOne({ telegramId }).lean();
    if (!user) {
      await ctx.reply('⚠️ እባክዎ መጀመሪያ ይመዝገቡ።');
      return;
    }

    const botUsername = ctx.botInfo?.username || 'BingoHabeshaBot';
    const referralLink = `https://t.me/${botUsername}?start=${user.referralCode}`;

    // የተጋበዙ ሰዎችን ብዛት ለማግኘት (ሪፈራል ሰርቪስ ካለ መጠቀም ይቻላል)
    const invitedCount = await User.countDocuments({ referredBy: user._id });

    const text = `🔗 **የጋብዝ & አግኝ ፕሮግራም (Referral Program)**

ጓደኞችዎን ወደ ቢንጎ ሀበሻ በመጋበዝ አስደናቂ ሽልማቶችን ያግኙ!

👥 **እስከአሁን የጋበዟቸው:** ${invitedCount} ሰዎች
🎁 **የሚያገኙት ጥቅም:** ጓደኛዎ የመጀመሪያ ዴፖዚት ሲያደርግ ቦነስ ይመሰገንልዎታል።

👇 **የእርስዎ ልዩ ሪፈራል ሊንክ:**
\`${referralLink}\`

*(ሊንኩን በመንካት ለጓደኞችዎ ማጋራት ይችላሉ)*`;

    await ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('❌ Error in referral.handler:', err);
  }
};