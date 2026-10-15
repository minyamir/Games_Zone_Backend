import { Referral } from '../models/Referral.model.js';
import { User } from '../models/User.model.js';

/**
 * የተጠቃሚውን የሪፈራል መረጃ ማምጣት (برای Web Dashboard / API)
 */
export const getUserReferrals = async (req, res) => {
  try {
    const userId = req.user._id; // ከ Auth Middleware የሚመጣ

    const referrals = await Referral.find({ inviter: userId })
      .populate('referred', 'firstName username createdAt')
      .sort({ createdAt: -1 });

    const totalEarned = referrals.length * 10;

    return res.status(200).json({
      success: true,
      data: {
        totalInvited: referrals.length,
        totalEarned,
        referrals
      }
    });
  } catch (err) {
    console.error('❌ Get User Referrals Error:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching referrals' });
  }
};