import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/telegram-bingo',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};