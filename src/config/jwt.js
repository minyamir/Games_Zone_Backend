import { config } from './env.js';

export const jwtConfig = {
  secret: config.jwtSecret || 'supersecretkey',
  expiresIn: '7d',
};