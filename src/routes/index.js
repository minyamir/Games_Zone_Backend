import express from 'express';
import authRoutes from './auth.routes.js';

const router = express.Router();

// Register Feature Routes
router.use('/auth', authRoutes);

export default router;