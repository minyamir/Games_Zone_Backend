import { Bot } from 'node-telegram-bot-api';
import { run } from 'node-telegram-bot-api/node';
import { config } from '../config/env.js';
import { handleStartCommand, handleContactShare } from './start.handler.js';
import { mainMenuKeyboard } from './keyboards.js';

// ⭐️ የሰርቨር ሰርቪሶችን ማስገባት (Services Integration)
import { userService } from '../services/user.service.js';
import { walletService } from '../services/wallet.service.js';

let botInstance = null;

// የ ተጠቃሚዎችን ጊዜያዊ ሁኔታ (State) ለመያዝ
const userStates = new Map();

export const initTelegramBot = () => {
  if (botInstance) return botInstance;

  if (!config.telegramBotToken) {
    console.warn('⚠ Telegram Bot token missing. Bot service skipped.');
    return null;
  }

  botInstance = new Bot(config.telegramBotToken);

  // 1. የ /start ትዕዛዝ ማስተናገጃ
  botInstance.command('start', async (ctx) => {
    await handleStartCommand(ctx);
  });

  // 2. ኢንላይን ቁልፎች (Inline Buttons) ሲጫኑ
  botInstance.on('callback_query', async (msg) => {
    try {
      console.log('🔍 DEBUG - Callback Query Received:', JSON.stringify(msg, null, 2));

      const query = msg.update?.callback_query || msg;
      const data = query.data;
      const chatId = query.message?.chat?.id || query.chat?.id;
      const telegramId = String(query.from?.id || msg.update?.callback_query?.from?.id);

      if (!chatId) {
        console.log('⚠ DEBUG - Chat ID is missing in callback query!');
        return;
      }

      console.log(`🔍 DEBUG - Action Data: ${data}, Chat ID: ${chatId}, User ID: ${telegramId}`);

      // ─── DEPOSIT: TELEBIRR ───
      if (data === 'deposit_telebirr') {
        userStates.set(telegramId, { step: 'WAITING_DEPOSIT_AMOUNT', bank: 'TeleBirr' });

        const text = 
`🏦 **ባንክ: TeleBirr**

⚠️ **ማስታወሻ:** እባክዎ ከቴሌብር ወደ ቴሌብር (Telebirr to Telebirr) ብቻ ያስገቡ!

እባክዎ ብሩን ወደዚህ አካውንት ያስገቡ:
👤 **ስም:** Selemon Mebrat
👉 **ቁጥር:** 0953839231

ከዚያም ያስገቡትን **የብር መጠን** ብቻ እዚህ ይጻፉልኝ (ምሳሌ: 100):`;

        await botInstance.api.sendMessage({
          chat_id: chatId,
          text: text,
          parse_mode: 'Markdown'
        });

        if (query.id) {
          await botInstance.api.answerCallbackQuery({ callback_query_id: query.id });
        }
        console.log('✅ DEBUG - TeleBirr Deposit prompt sent successfully.');

      } 
      // ─── DEPOSIT: CBEBIRR ───
      else if (data === 'deposit_cbebirr') {
        userStates.set(telegramId, { step: 'WAITING_DEPOSIT_AMOUNT', bank: 'CBEBirr' });

        const text = 
`🏦 **ባንክ: CBEBirr**

⚠️ **ማስታወሻ:** እባክዎ ከንግድ ባንክ (CBE) ወደ ንግድ ባንክ ብቻ ያስገቡ!

እባክዎ ብሩን ወደዚህ አካውንት ያስገቡ:
👤 **ስም:** Selemon Mebrat
🏦 **አካውንት ቁጥር:** 1000123456789

ከዚያም ያስገቡትን **የብር መጠን** ብቻ እዚህ ይጻፉልኝ (ምሳሌ: 100):`;

        await botInstance.api.sendMessage({
          chat_id: chatId,
          text: text,
          parse_mode: 'Markdown'
        });

        if (query.id) {
          await botInstance.api.answerCallbackQuery({ callback_query_id: query.id });
        }
        console.log('✅ DEBUG - CBEBirr Deposit prompt sent successfully.');

      }
      // ─── WITHDRAWAL: TELEBIRR / CBEBIRR ───
      else if (data === 'withdraw_telebirr' || data === 'withdraw_cbebirr') {
        const bankName = data === 'withdraw_telebirr' ? 'TeleBirr' : 'CBEBirr';
        
        // ተጠቃሚው መጀመሪያ ባንኩን መረጠ፣ አሁን የሚቀጥለው ስቴት አካውንት ቁጥር መጠየቅ ይሆናል
        userStates.set(telegramId, { step: 'WAITING_WITHDRAW_ACCOUNT', bank: bankName });

        const text = 
`📤 **ወጪ (Withdraw)**
🏦 **ባንክ:** ${bankName}

እባክዎ ገንዘብ የሚቀበሉበትን ትክክለኛ **የስልክ/አካውንት ቁጥር** እና **ስም** ይላኩለት (ምሳሌ: 0940896360 - ስምዎ):`;

        await botInstance.api.sendMessage({
          chat_id: chatId,
          text: text,
          parse_mode: 'Markdown'
        });

        if (query.id) {
          await botInstance.api.answerCallbackQuery({ callback_query_id: query.id });
        }
        console.log(`✅ DEBUG - Withdrawal account prompt for ${bankName} sent successfully.`);
      } else {
        console.log(`⚠ DEBUG - Unhandled callback data: ${data}`);
      }
    } catch (err) {
      console.error('❌ ERROR in callback_query handler:', err);
    }
  });

  // 3. ጽሑፍ መልዕክቶችን እና የሜኑ ቁልፎችን መቆጣጠር
  botInstance.on('message', async (ctx) => {
    try {
      if (ctx.message?.contact) {
        console.log('📱 Contact detected in message handler');
        await handleContactShare(ctx);
        return;
      }

      const text = ctx.message?.text;
      if (!text) return;

      const telegramId = String(ctx.from?.id);
      const userState = userStates.get(telegramId);

      console.log(`🔍 DEBUG - Message from ${telegramId}: "${text}". Current State:`, userState);

      // ─── የጊዜያዊ ስቴቶች አስተዳደር (Deposit & Withdrawal States) ───
      if (userState) {
        // 1. የዲፖዚት የብር መጠን መቀበል
        if (userState.step === 'WAITING_DEPOSIT_AMOUNT') {
          userStates.set(telegramId, { 
            step: 'WAITING_DEPOSIT_SMS', 
            bank: userState.bank, 
            amount: text 
          });

          const replyText = 
`መጠን: ${text} ETB

እባክዎ ክፍያ የፈጸሙበትን ትክክለኛውን የባንክ SMS ማረጋገጫ (Tx Ref) ጽሁፍ አሁን እዚህ ይላኩ፦`;

          await ctx.reply(replyText);
          return;

        } 
        // 2. የዲፖዚት SMS (Tx Ref) መቀበል
        else if (userState.step === 'WAITING_DEPOSIT_SMS') {
          const txRef = text;
          const amount = userState.amount;
          const bank = userState.bank;

          userStates.delete(telegramId);

          await ctx.reply(`✅ የክፍያ ጥያቄዎ (${amount} ETB በ ${bank}) በትክክል ተቀብለናል! አስተዳዳሪው አረጋግጦ የኪስ ቦርሳዎን ያስተካክለዋል። እናመሰግናለን!`, mainMenuKeyboard);
          return;
        } 
        // 3. የወጪ (Withdraw) አካውንት ቁጥር መቀበል -> አሁን የብር መጠን እንጠይቃለን
        else if (userState.step === 'WAITING_WITHDRAW_ACCOUNT') {
          userStates.set(telegramId, {
            step: 'WAITING_WITHDRAW_AMOUNT',
            bank: userState.bank,
            accountInfo: text
          });

          const replyText = 
`✅ አካውንት: ${text}

ማውጣት የሚፈልጉትን መጠን ያስገቡ (ቢያንስ 100 ብር):`;

          await ctx.reply(replyText);
          return;
        }
        // 4. የወጪ (Withdraw) የብር መጠን መቀበል
        else if (userState.step === 'WAITING_WITHDRAW_AMOUNT') {
          const amount = Number(text);
          const bank = userState.bank;
          const accountInfo = userState.accountInfo;

          if (isNaN(amount) || amount < 100) {
            await ctx.reply('⚠️ እባክዎ ትክክለኛ የብር መጠን ያስገቡ። ዝቅተኛው የማውጣት ገደብ **100 ብር** ነው።');
            return;
          }

          userStates.delete(telegramId);

          const finalWithdrawText = 
`✅ **የወጪ ጥያቄዎ በተሳካ ሁኔታ ተመዝግቧል!**

🏦 **ባንክ:** ${bank}
👤 **አካውንት/ስልክ:** ${accountInfo}
💰 **መጠን:** ${amount} ETB

አስተዳዳሪው አረጋግጦ ገንዘቡን ይልክልዎታል። እናመሰግናለን!`;

          await ctx.reply(finalWithdrawText, mainMenuKeyboard);
          return;
        }
      }

      // ─── መደበኛ የሜኑ ትዕዛዞች ───
      const user = await userService.getUserByTelegramId(telegramId);

      if (!user || !user.phoneNumber) {
        await ctx.reply('⚠️ እባክዎ መጀመሪያ ከላይ ያለውን ቁልፍ በመጫን ስልክ ቁጥርዎን ያጋሩ።');
        return;
      }

      if (text === '🎮 ጌም ጨወቱ (PLAY)' || text === '/play') {
        await ctx.reply('🎮 ጨዋታውን ለመጀመር ከታች ያለውን ሚኒ አፕ (Mini App) ይክፈቱ።', mainMenuKeyboard);
        
      } else if (text === '👤 ፕሮፋይል' || text === '/profile') {
        const profileText = 
`👤 **የእርስዎ ፕሮፋይል መረጃ**

🔹 **ስም:** ${user.firstName} ${user.lastName || ''}
🔹 **ስልክ ቁጥር:** ${user.phoneNumber}
🔹 **ዩዘርናም:** @${user.username || 'N/A'}
🔹 **ሪፈራል ኮድ:** ${user.referralCode}

👇 ከታች ከሚገኙት አማራጮች አንዱን ይምረጡ።`;

        await ctx.reply(profileText, mainMenuKeyboard);

      } else if (text === '💰 ሒሳብ' || text === '/account') {
        const wallet = await walletService.getWalletByUserId(user._id);

        const balanceText = 
`💰 **የእርስዎ የሒሳብ ዝርዝር (Wallet Balance)**

💰 **ዋና ሒሳብ:** ${wallet ? wallet.balance : 0}.00 ETB
💰 **ቦነስ ሒሳብ:** ${wallet ? wallet.bonusBalance : 0}.00 ETB
🔒 **የታሰረ ሒሳብ:** ${wallet ? wallet.lockedBalance : 0}.00 ETB

👇 ከታች ከሚገኙት አማራጮች አንዱን ይምረጡ።`;

        await ctx.reply(balanceText, mainMenuKeyboard);

      } else if (text === '📥 ገቢ (Deposit)' || text === '/deposit') {
        const depositKeyboard = {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📱 TeleBirr', callback_data: 'deposit_telebirr' },
                { text: '🏦 CBEBirr', callback_data: 'deposit_cbebirr' }
              ]
            ]
          }
        };

        await ctx.reply('🏛️ **እባክዎ ገንዘብ ማስገባት የሚፈልጉበትን የክፍያ አማራጭ ይምረጡ:**', depositKeyboard);

      } else if (text === '📤 ወጪ (Withdraw)' || text === '/withdraw') {
        const wallet = await walletService.getWalletByUserId(user._id);
        const currentBalance = wallet ? wallet.balance : 0;

        const withdrawKeyboard = {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📱 TeleBirr', callback_data: 'withdraw_telebirr' },
                { text: '🏦 CBEBirr', callback_data: 'withdraw_cbebirr' }
              ]
            ]
          }
        };

        const withdrawText = 
`📤 **ወጪ (Withdraw)**
🏦 **በየትኛው ባንክ ወጪ ማድረግ ይፈልጋሉ?**

💰 **ቀሪ ዋና ሒሳብዎ:** ${currentBalance}.00 ETB

👇 ከታች ባሉት አማራጮች ውስጥ ይምረጡ፡`;

        await ctx.reply(withdrawText, withdrawKeyboard);

      } else if (text === '🔗 ጋብዝ & አግኝ' || text === '/referral') {
        const referralText = 
`🔗 **ጓደኞችዎን በመጋበዝ ቦነስ ያግኙ!**

እያንዳንዱን ጓደኛ ሲጋብዙ የቦነስ ሒሳብ ይሸለማሉ። 

የእርስዎ ልዩ የሪፈራል ሊንክ:
https://t.me/${ctx.botInfo?.username}?start=${user.referralCode}

ይህንን ሊንክ ለጓደኞችዎ በማጋራት ይጀምሩ!`;

        await ctx.reply(referralText, mainMenuKeyboard);

      } else if (text === '🆘 እርዳታ' || text === '/help') {
        const helpText = 
`🆘 **የእርዳታ ማዕከል**

ማንኛውም ጥያቄ፣ የክፍያ መዘግየት ወይም የቴክኒክ ችግር ካሎት ከታች ባለው አድራሻ ማነጋገር ይችላሉ፡

👨‍💻 **የድጋፍ ሰጪ ሰራተኛ:** @Support_Admin
📢 **ኦፊሻል ቻናል:** @BingoHabeshaChannel`;

        await ctx.reply(helpText, mainMenuKeyboard);
      }
    } catch (err) {
      console.error('❌ ERROR in message handler:', err);
    }
  });

  // 4. ቦቱን ማስኬጃ (Runner)
  run(botInstance);

  console.log('Telegram Bot v2 fixed polling service initialized successfully.');
  return botInstance;
};