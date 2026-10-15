import { Router } from 'express';
import { getUserReferrals } from '../controllers/referral.controller.js';
import { protect } from '../middleware/auth.middleware.js'; // የጸደቀ ዩዘር ማረጋገጫ

const router = Router();

router.get('/my-referrals', protect, getUserReferrals);

export const referralRoutes = router;