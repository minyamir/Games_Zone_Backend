// import fs from 'fs';
// import path from 'path';
// import { fromPath } from 'node-telegram-bot-api/node';
// import { User } from '../models/User.model.js';
// import { Wallet } from '../models/Wallet.model.js';
// import { phoneRequestKeyboard, mainMenuKeyboard } from '../keyboards.js';
// import crypto from 'crypto';

// export const handleStartCommand = async (ctx) => {
//   try {
//     const telegramId = String(ctx.from?.id);
//     const user = await User.findOne({ telegramId }).lean(); // .lean() ለከፍተኛ ፍጥነት (Performance)

//     if (!user || !user.phoneNumber) {
//       const welcomeText = `🟢 ቢንጎ ⚪️ ሀበሻ\n\n👋 እንኳን ወደ BINGO HABESHA መጡ!\n\nጌሙን ለመጀመር ከታች ያለውን ቁልፍ ይጫኑ።`;
//       const imagePath = path.resolve('src/assets/images/image.png');
      
//       if (fs.existsSync(imagePath)) {
//         await ctx.api.sendPhoto({
//           chat_id: ctx.chat.id,
//           photo: await fromPath(imagePath),
//           caption: welcomeText,
//           reply_markup: phoneRequestKeyboard.reply_markup,
//         });
//       } else {
//         await ctx.reply(welcomeText, phoneRequestKeyboard);
//       }
//     } else {
//       const wallet = await Wallet.findOne({ user: user._id }).lean();
//       const registeredText = `🟢 ቢንጎ ⚪ ሀበሻ\n\n🎉 እንኳን ደህና መጡ ${user.firstName}!\n\n💰 ዋና ሒሳብ: ${wallet?.balance || 0}.00 ETB\n💰 ቦነስ ሒሳብ: ${wallet?.bonusBalance || 0}.00 ETB\n\n👇 ጨዋታውን ለመጀመር '🎮 ጌም ጨወቱ (PLAY)' የሚለውን ይጫኑ።`;
//       await ctx.reply(registeredText, mainMenuKeyboard);
//     }
//   } catch (err) {
//     console.error('❌ Error in start.handler:', err);
//   }
// };

// export const handleContactShare = async (ctx) => {
//   try {
//     const contact = ctx.message?.contact;
//     if (!contact) return;

//     const telegramId = String(ctx.from?.id || contact.user_id);
//     const phoneNumber = contact.phone_number;
//     const firstName = ctx.from?.first_name || 'Player';
//     const username = ctx.from?.username || `user_${telegramId}`;

//     let user = await User.findOne({ telegramId });
//     if (!user) {
//       const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
//       user = await User.create({ telegramId, phoneNumber, firstName, username, referralCode });
//       await Wallet.create({ user: user._id, balance: 0, lockedBalance: 0, bonusBalance: 0, currency: 'ETB' });
//     } else {
//       user.phoneNumber = phoneNumber;
//       await user.save();
//     }

//     await ctx.reply(`🎉 ምዝገባዎ ተጠናቋል!`, mainMenuKeyboard);
//   } catch (err) {
//     console.error('❌ Error in contact share:', err);
//   }
// };