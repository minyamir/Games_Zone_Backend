import express from 'express';
import { telegramLogin } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/telegram', telegramLogin);

export default router;