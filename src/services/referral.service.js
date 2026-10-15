import { User } from '../models/User.model.js';
import { Wallet } from '../models/Wallet.model.js';
import { Referral } from '../models/Referral.model.js';
import { Transaction } from '../models/Transaction.model.js';

/**
 * ሪፈራልን መመዝገብ እና ለጋባዡ 10 ብር ቦነስ መስጠት
 */
export const processReferralOnStart = async (newUserId, referralCode) => {
  try {
    if (!referralCode) return null;

    // 1. ሪፈራል ኮዱን የሰጠውን ሰው (Inviter) መፈለግ
    const inviter = await User.findOne({ referralCode });
    if (!inviter || inviter._id.toString() === newUserId.toString()) {
      return null; // ራሱኝ ሪፈራል መጠቀም ከከለከለ ወይም ካልተገኘ
    }

    // 2. ይህ ተጠቃሚ ከዚህ በፊት በሌላ ሪፈራል መመዝገቡን ማረጋገጥ
    const existingReferral = await Referral.findOne({ referred: newUserId });
    if (existingReferral) return null;

    // 3. የሪፈራል ሪኮርድ መፍጠር
    await Referral.create({
      inviter: inviter._id,
      referred: newUserId,
      rewardAmount: 10,
      status: 'completed'
    });

    // 4. ለጋባዡ (Inviter) 10 ብር ወደ playWallet መጨመር
    let inviterWallet = await Wallet.findOne({ user: inviter._id });
    if (!inviterWallet) {
      inviterWallet = await Wallet.create({ user: inviter._id, mainWallet: 0, playWallet: 0 });
    }

    inviterWallet.playWallet += 10;
    await inviterWallet.save();

    // 5. የትራንዛክሽን ሪኮርድ ማስቀመጥ (ለሪፈራል ቦነስ)
    await Transaction.create({
      user: inviter._id,
      wallet: inviterWallet._id,
      type: 'bonus',
      amount: 10,
      status: 'completed',
      description: 'Referral bonus reward'
    });

    return { inviter, reward: 10 };
  } catch (err) {
    console.error('❌ Referral Processing Error:', err.message);
    return null;
  }
};