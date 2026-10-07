import { Wallet } from '../../models/Wallet.model.js';
import { User } from '../../models/User.model.js';

export const handleWalletCommand = async (ctx, telegramId) => {
  try {
    const user = await User.findOne({ telegramId }).lean();
    if (!user) {
      await ctx.reply('⚠️ እባክዎ መጀመሪያ ይመዝገቡ።');
      return;
    }

    const wallet = await Wallet.findOne({ user: user._id }).lean();

    const text = `💰 **የሒሳብ መግለጫ (Wallet)**

💵 **ዋና ሒሳብ (Balance):** ${wallet?.balance || 0}.00 ETB
🔒 **የታገደ ሒሳብ (Locked):** ${wallet?.lockedBalance || 0}.00 ETB
🎁 **ቦነስ ሒሳብ (Bonus):** ${wallet?.bonusBalance || 0}.00 ETB
💱 **ምንዛሬ:** ${wallet?.currency || 'ETB'}

📥 ገቢ ለማድረግ ከታች ካለው ሜኑ **'ገቢ (Deposit)'** የሚለውን ይጫኑ።`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📥 ገቢ (Deposit)', callback_data: 'deposit_menu' },
            { text: '📤 ወጪ (Withdraw)', callback_data: 'withdraw_menu' }
          ]
        ]
      }
    };

    await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
  } catch (err) {
    console.error('❌ Error in wallet.handler:', err);
  }
};