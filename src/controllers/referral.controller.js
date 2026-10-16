import { referralService } from '../services/referral.service.js'; // 👈 ሰርቪሱን ማስገባት

/**
 * የተጠቃሚውን የሪፈራል መረጃ ማምጣት (ለሚኒ አፕ / ዌብ ዳሽቦርድ)
 */
export const getUserReferrals = async (req, res, next) => {
  try {
    const userId = req.user._id; // ከ Auth Middleware የሚመጣ የተጠቃሚ መታወቂያ

    // 👈 የዳታቤዝ ጥያቄዎችን የያዘውን ሰርቪስ እንጠራዋለን
    const result = await referralService.getUserReferrals(userId);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('❌ Get User Referrals Error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching referrals' 
    });
  }
};