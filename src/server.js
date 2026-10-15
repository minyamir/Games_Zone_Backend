import http from 'http';
import { app } from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/database.js';
import { initTelegramBot } from './bot/bot.js';
import { initSocket } from './sockets/socket.js'; // 👈 ሶኬቱን ከ sockets/socket.js እናመጣለን

const server = http.createServer(app);

// ⚡ Socket.io ን ማስጀመር
initSocket(server);

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Start Telegram Bot Polling
    initTelegramBot();

    // 3. Start HTTP & Socket Server
    server.listen(config.port, () => {
      console.log(`Server running in ${config.env} mode on port ${config.port}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();