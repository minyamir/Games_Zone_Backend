import { User } from '../models/User.model.js';
import { Wallet } from '../models/Wallet.model.js';
import { Referral } from '../models/Referral.model.js';
import { Transaction } from '../models/Transaction.model.js';

export const referralService = {
  /**
   * ሪፈራልን መመዝገብ እና ለጋባዡ 10 ብር ቦነስ መስጠት (ለቴሌግራም ቦት)
   */
  async processReferralOnStart(newUserId, referralCode, firstName) {
    try {
      if (!referralCode) return null;

      // 1. ሪፈራል ኮዱን የሰጠውን ሰው (Inviter) መፈለግ
      const inviter = await User.findOne({ referralCode });
      if (!inviter || inviter._id.toString() === newUserId.toString()) {
        return null; // ራሱን ሪፈራል መጠቀም ከከለከለ ወይም ካልተገኘ
      }

      // 2. ይህ ተጠቃሚ ከዚህ በፊት በሌላ ሪፈራል መመዝገቡን ማረጋገጥ
      const existingReferral = await Referral.findOne({ referred: newUserId });
      if (existingReferral) return null;

      // 3. የሪፈራል ሪኮርድ መፍጠር (referrer እና rewarded በመጠቀም)
      await Referral.create({
        referrer: inviter._id,
        referred: newUserId,
        bonusEarned: 10,
        status: 'rewarded'
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
        description: `Referral bonus for inviting ${firstName || 'Player'}`
      });

      return { inviter, reward: 10 };
    } catch (err) {
      console.error('❌ Referral Processing Error:', err.message);
      return null;
    }
  },

  /**
   * የተጠቃሚውን የሪፈራል መረጃዎች ማምጣት (ለሚኒ አፕ / ዌብ ዳሽቦርድ)
   */
  async getUserReferrals(userId) {
    try {
      // inviter ፋንታ referrer መጠቀም
      const referrals = await Referral.find({ referrer: userId })
        .populate('referred', 'firstName username createdAt')
        .sort({ createdAt: -1 });

      const totalEarned = referrals.length * 10;

      return {
        totalInvited: referrals.length,
        totalEarned,
        referrals
      };
    } catch (err) {
      console.error('❌ Get User Referrals Service Error:', err.message);
      throw err;
    }
  }
};