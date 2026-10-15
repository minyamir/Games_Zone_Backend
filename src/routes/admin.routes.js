import express from 'express';
import {
  adminLogin,
  adminRegister,
  getPendingTransactions,
  handleDepositAction,
  handleWithdrawalAction
} from '../controllers/admin.controller.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';

const router = express.Router();

// 🐞 DEBUGGING MIDDLEWARE
router.use((req, res, next) => {
  console.log(`[DEBUG ADMIN ROUTE] Method: ${req.method}, Path: ${req.path}, OriginalUrl: ${req.originalUrl}`);
  next();
});

// 1. 🔓 Public Routes (ከ /admin/auth በታች ስለሚገባ ፓዞቹ /auth/login እና /auth/register መሆን አለባቸው)
router.post('/auth/login', adminLogin);
router.post('/auth/register', adminRegister);

// 2. 🔒 Protected Routes (ከዚህ በታች ሚድልዌር ይደረግበታል)
router.use(adminMiddleware);

router.get('/pending-transactions', getPendingTransactions);
router.post('/deposit-action', handleDepositAction);
router.post('/withdrawal-action', handleWithdrawalAction);

export default router;