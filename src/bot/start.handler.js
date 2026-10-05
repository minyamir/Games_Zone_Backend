import fs from 'fs';
import path from 'path';
import { fromPath } from 'node-telegram-bot-api/node';
import { User } from '../models/User.model.js';
import { Wallet } from '../models/Wallet.model.js';
import { phoneRequestKeyboard, mainMenuKeyboard } from './keyboards.js';
import crypto from 'crypto';
import { config } from '../config/env.js';

export const handleStartCommand = async (ctx) => {
  try {
    console.log('➡️ /start command received from:', ctx.from?.id);
    const telegramId = String(ctx.from?.id);
    let user = await User.findOne({ telegramId });

    if (!user || !user.phoneNumber) {
      const welcomeText = 
`🟢 ቢንጎ ⚪️ ሀበሻ

👋 እንኳን ወደ BINGO HABESHA መጡ!

ጌሙን ለመጀመር ከታች ያለውን '📱 ለመመዝገብ ስልክ ቁጥር ያጋሩ' ይጫኑ።`;

      const imagePath = path.resolve('src/assets/images/image.png');
      if (fs.existsSync(imagePath)) {
        await ctx.api.sendPhoto({
          chat_id: ctx.chat.id,
          photo: await fromPath(imagePath),
          caption: welcomeText,
          reply_markup: phoneRequestKeyboard.reply_markup,
        });
      } else {
        await ctx.reply(welcomeText, phoneRequestKeyboard);
      }
    } else {
      // ተጠቃሚው ቀደም ሲል ተመዝግቦ ከሆነ የሂሳብ መረጃውን አሳይ
      const wallet = await Wallet.findOne({ user: user._id });
      
      const registeredText = 
`🟢 ቢንጎ ⚪ ሀበሻ

🎉 እንኳን ደህና መጡ ${user.firstName}! ምዝገባዎ ተጠናቋል።

👤 **የርስዎ ፕሮፋይል**
🔹 ስም: ${user.firstName}
🔹 ስልክ: ${user.phoneNumber}
🔹 ሪፈራል ኮድ: ${user.referralCode}

💰 ቦነስ ሒሳብ: ${wallet ? wallet.bonusBalance : 0}.00 ETB
💰 ዋና ሒሳብ: ${wallet ? wallet.balance : 0}.00 ETB

👇 ጨዋታውን ለመጀመር ከታች '🎮 ጌም ጨወቱ (PLAY)' የሚለውን ይጫኑ።`;

      await ctx.reply(registeredText, mainMenuKeyboard);
    }
  } catch (err) {
    console.error('❌ Error inside handleStartCommand:', err);
  }
};

export const handleContactShare = async (ctx) => {
  try {
    console.log('➡️ Contact shared event received:', JSON.stringify(ctx.message?.contact));
    const contact = ctx.message?.contact;
    if (!contact) {
      console.log('⚠ No contact object found in message.');
      return;
    }

    const telegramId = String(ctx.from?.id || contact.user_id);
    const phoneNumber = contact.phone_number;
    const firstName = ctx.from?.first_name || contact.first_name || 'Player';
    const lastName = ctx.from?.last_name || contact.last_name || '';
    const username = ctx.from?.username || `user_${telegramId}`;

    console.log(`🔍 Processing registration for Telegram ID: ${telegramId}, Phone: ${phoneNumber}, Name: ${firstName}`);

    let user = await User.findOne({ telegramId });
    let wallet;

    if (!user) {
      const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();

      user = await User.create({
        telegramId,
        phoneNumber,
        firstName,
        lastName,
        username,
        referralCode,
      });

      wallet = await Wallet.create({
        user: user._id,
        balance: 0,
        lockedBalance: 0,
        bonusBalance: 0,
        currency: 'ETB',
      });
      console.log('✨ New user successfully created and saved to database!');
    } else {
      user.phoneNumber = phoneNumber;
      if (!user.firstName || user.firstName === 'Player') {
        user.firstName = firstName;
      }
      await user.save();
      
      wallet = await Wallet.findOne({ user: user._id });
      if (!wallet) {
        wallet = await Wallet.create({
          user: user._id,
          balance: 0,
          lockedBalance: 0,
          bonusBalance: 0,
          currency: 'ETB',
        });
      }
      console.log('🔄 Existing user phone number updated successfully!');
    }

    const successText = 
`🟢 ቢንጎ ⚪️️ ሀበሻ

🎉 እንኳን ደህና መጡ ${user.firstName}! ምዝገባዎ በትክክል ተጠናቋል።

👤 **የርስዎ ፕሮፋይል**
🔹 ስም: ${user.firstName}
🔹 ስልክ: ${user.phoneNumber}
🔹 ሪፈራል ኮድ: ${user.referralCode}

💰 ቦነስ ሒሳብ: ${wallet ? wallet.bonusBalance : 0}.00 ETB
💰 ዋና ሒሳብ: ${wallet ? wallet.balance : 0}.00 ETB

👇 ጨዋታውን ለመጀመር ከታች '🎮 ጌም ጨወቱ (PLAY)' የሚለውን ይጫኑ።`;

    await ctx.reply(successText, mainMenuKeyboard);
  } catch (err) {
    console.error('❌ Error inside handleContactShare:', err);
  }
};