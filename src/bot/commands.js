import { handleStartCommand } from './start.handler.js';

export const setupCommands = (botInstance) => {
  botInstance.command('start', async (ctx) => {
    await handleStartCommand(ctx);
  });
};