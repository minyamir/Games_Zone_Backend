import { BingoTicket } from '../models/BingoTicket.model.js';
import { BingoGame } from '../models/BingoGame.model.js';
import { Wallet } from '../models/Wallet.model.js';
import { generateBingoCard } from '../game/bingo.generator.js';
import { BINGO_CONSTANTS } from '../game/game.constants.js';

class TicketService {
  // 1. [አዲስ የተጨመረ] ተጠቃሚው ከ 1 እስከ 700 ካሉት ግሪዶች ውስጥ የተወሰነውን ቲኬት ቁጥር መርጦ ሲገዛ
  async buySpecificTicket({ userId, gameId, ticketNumber }) {
    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: TicketService.buySpecificTicket starting for user ${userId}, game ${gameId}, ticketNumber: ${ticketNumber}`);
    }

    // A. የቲኬት ቁጥሩ ከ 1 እስከ 700 መካከል መሆኑን ማረጋገጥ
    const parsedTicketNum = Number(ticketNumber);
    if (isNaN(parsedTicketNum) || parsedTicketNum < 1 || parsedTicketNum > 700) {
      throw new Error('Invalid ticket number. Must be between 1 and 700.');
    }

    // B. ጨዋታው መኖሩን እና ለግዢ ክፍት መሆኑን ማረጋገጥ
    const game = await BingoGame.findById(gameId);
    if (!game) {
      throw new Error('Game session not found.');
    }

    const allowedStatuses = ['scheduled', 'open_for_bets'];
    if (!allowedStatuses.includes(game.status)) {
      throw new Error('Tickets can only be purchased for scheduled or open games.');
    }

    // C. ይህ የተወሰነ ቲኬት ቁጥር ቀደም ብሎ በሌላ ሰው መያዙን (Duplicate check) ማረጋገጥ
    const existingTicket = await BingoTicket.findOne({ game: gameId, ticketNumber: parsedTicketNum });
    if (existingTicket) {
      throw new Error(`Ticket #${parsedTicketNum} is already sold.`);
    }

    // D. ዩዘሩ የያዛቸውን कुल ቲኬቶች ብዛት ማረጋገጥ (მაክስ 10 ገደብ ካለ)
    const existingTicketsCount = await BingoTicket.countDocuments({ user: userId, game: gameId });
    const maxAllowedPerUser = 10;
    if (existingTicketsCount >= maxAllowedPerUser) {
      throw new Error(`Maximum limit reached. You can only own up to ${maxAllowedPerUser} tickets per game session.`);
    }

    // E. የቲኬቱን ዋጋ ማስላት (በነባር ጌም ቲኬት ፕራይስ ወይም 10 ብር)
    const pricePerTicket = Number(game.ticketPrice || 10);

    // F. ዋሌቱን (Wallet) መፈለግ
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      throw new Error('Wallet not found for this user.');
    }

    // G. የዋሌት ቀሪ ሂሳብ ማረጋገጥ
    const currentBalance = Number(wallet.playWallet || 0);
    if (currentBalance < pricePerTicket) {
      throw new Error('Insufficient wallet balance.');
    }

    // H. ከዋሌት ሂሳብ መቀነስ እና ማስቀመጥ
    wallet.playWallet = currentBalance - pricePerTicket;
    await wallet.save();

    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: Deducted ${pricePerTicket} from user ${userId} playWallet. New balance: ${wallet.playWallet}`);
    }

    // I. የቢንጎ ካርድ ማትሪክስ ማመንጨት
    const cardData = generateBingoCard(parsedTicketNum);

    // J. አዲሱን ቲኬት በዳታቤዝ መመዝገብ
    const newTicket = await BingoTicket.create({
      user: userId,
      game: gameId,
      ticketNumber: cardData.ticketNumber, // ወይም parsedTicketNum
      matrix: cardData.matrix
    });

    // K. የጨዋታውን ፕራይዝ ፑል ማዘመን
    game.prizePool = Number(game.prizePool || 0) + pricePerTicket;
    await game.save();

    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: Successfully created ticket #${parsedTicketNum}. Updated game prize pool to: ${game.prizePool}`);
    }

    return {
      tickets: [newTicket],
      newPrizePool: game.prizePool,
      remainingBalance: wallet.playWallet,
      totalUserTickets: existingTicketsCount + 1
    };
  }

  // Buy tickets, generate matrices, and save them to MongoDB (የቀድሞው ነባር ፋንክሽን)
  async buyTickets({ userId, gameId, ticketCount }) {
    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: TicketService.buyTickets starting for user ${userId}, game ${gameId}, count: ${ticketCount}`);
    }

    const game = await BingoGame.findById(gameId);
    if (!game) {
      throw new Error('Game session not found.');
    }

    const allowedStatuses = ['scheduled', 'open_for_bets'];
    if (!allowedStatuses.includes(game.status)) {
      throw new Error('Tickets can only be purchased for scheduled games.');
    }

    const requestedCount = Number(ticketCount || 0);
    if (requestedCount <= 0) {
      throw new Error('Invalid ticket count.');
    }

    const existingTicketsCount = await BingoTicket.countDocuments({ user: userId, game: gameId });
    const maxAllowedPerUser = 10;

    if (existingTicketsCount + requestedCount > maxAllowedPerUser) {
      throw new Error(`Maximum limit reached. You can only own up to ${maxAllowedPerUser} tickets per game session. You currently own ${existingTicketsCount}.`);
    }

    const pricePerTicket = Number(game.ticketPrice || 10);
    const totalCost = requestedCount * pricePerTicket;

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      throw new Error('Wallet not found for this user.');
    }

    const currentBalance = Number(wallet.playWallet || 0);
    if (currentBalance < totalCost) {
      throw new Error('Insufficient wallet balance.');
    }

    wallet.playWallet = currentBalance - totalCost;
    await wallet.save();

    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: Deducted ${totalCost} from user ${userId} playWallet. New balance: ${wallet.playWallet}`);
    }

    const createdTickets = [];

    for (let i = 0; i < requestedCount; i++) {
      const ticketNumber = Math.floor(1000 + Math.random() * 9000);
      const cardData = generateBingoCard(ticketNumber);

      const newTicket = await BingoTicket.create({
        user: userId,
        game: gameId,
        ticketNumber: cardData.ticketNumber,
        matrix: cardData.matrix
      });

      createdTickets.push(newTicket);
    }

    game.prizePool = Number(game.prizePool || 0) + totalCost;
    await game.save();

    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: Successfully created ${createdTickets.length} tickets. Updated game prize pool to: ${game.prizePool}`);
    }

    return {
      tickets: createdTickets,
      newPrizePool: game.prizePool,
      remainingBalance: wallet.playWallet,
      totalUserTickets: existingTicketsCount + createdTickets.length
    };
  }

  // Fetch tickets belonging to a user for a specific game session
  async fetchUserTickets(userId, gameId) {
    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: TicketService.fetchUserTickets querying database for user ${userId}`);
    }

    const query = { game: gameId };
    if (userId) query.user = userId;

    const tickets = await BingoTicket.find(query);
    return tickets;
  }
}

export const ticketService = new TicketService();