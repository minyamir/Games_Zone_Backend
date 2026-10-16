import { BingoTicket } from '../models/BingoTicket.model.js';
import { BingoGame } from '../models/BingoGame.model.js';
import { Wallet } from '../models/Wallet.model.js';
import { generateBingoTicketMatrix } from '../game/bingo.generator.js';

export const ticketService = {
  async buyTickets(userId, gameId, count = 1) {
    if (count > 10) throw new Error('MAX_10_TICKETS_ALLOWED');

    const game = await BingoGame.findById(gameId);
    if (!game || game.status !== 'waiting') throw new Error('GAME_NOT_AVAILABLE');

    const totalCost = game.ticketPrice * count;
    const wallet = await Wallet.findOne({ user: userId });
    
    if (!wallet || wallet.playWallet < totalCost) {
      throw new Error('INSUFFICIENT_PLAY_WALLET_BALANCE');
    }

    // Deduct balance
    wallet.playWallet -= totalCost;
    await wallet.save();

    // Update game pot
    game.totalPot += totalCost;
    await game.save();

    const createdTickets = [];
    for (let i = 0; i < count; i++) {
      const matrix = generateBingoTicketMatrix();
      const ticket = await BingoTicket.create({
        game: gameId,
        user: userId,
        ticketNumber: Math.floor(1000 + Math.random() * 9000),
        matrix
      });
      createdTickets.push(ticket);
    }

    return { createdTickets, remainingBalance: wallet.playWallet };
  }
};