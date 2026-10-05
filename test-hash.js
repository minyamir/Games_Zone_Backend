import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const botToken = process.env.TELEGRAM_BOT_TOKEN;

// Mock Telegram user object
const userObj = JSON.stringify({
  id: 99999999,
  first_name: "Test",
  last_name: "User",
  username: "testplayer",
  language_code: "en"
});

const authDate = Math.floor(Date.now() / 1000);
const params = new URLSearchParams();
params.set('auth_date', authDate);
params.set('user', userObj);
params.set('query_id', 'AAHdF6MUAAAAAN0XoxzW1g8l');

// Sort parameters alphabetically
params.sort();
const dataCheckArr = [];
for (const [key, value] of params.entries()) {
  dataCheckArr.push(`${key}=${value}`);
}
const dataCheckString = dataCheckArr.join('\n');

// Compute HMAC-SHA256 hash
const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

params.set('hash', hash);

console.log("\n--- COPY THIS initData FOR POSTMAN ---\n");
console.log(params.toString());
console.log("\n---------------------------------------\n");