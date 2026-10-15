import express from 'express';
import authRoutes from './auth.routes.js';
import adminRoutes from './admin.routes.js'; // ⚡ ሁሉንም የአድሚን ራውቶች (Auth + Dashboard) የያዘው ፋይል

const router = express.Router();

// 1. የተጠቃሚዎች አውትቲክኬሽን (ለምሳሌ: /api/auth/login)
router.use('/auth', authRoutes);

// 2. የአድሚን ራውቶች በሙሉ (ለምሳሌ: /api/admin/auth/register እና /api/admin/pending-transactions)
router.use('/admin', adminRoutes);

export default router;