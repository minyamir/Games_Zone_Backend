import { BingoGame } from '../models/BingoGame.model.js';
import { gameManager } from './game.manager.js';
import { BINGO_CONSTANTS } from './game.constants.js';

/**
 * Scan and recover active (in_progress) games when the server restarts.
 */
export const recoverActiveGames = async (ioServer) => {
  try {
    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: Scanning database for ongoing/in_progress games to recover...`);
    }

    // ከ BingoGame ሞዴል 'in_progress' status ያላቸውን መፈለግ
    const activeGamesFromDb = await BingoGame.find({ status: 'in_progress' });

    if (activeGamesFromDb.length === 0) {
      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.log(`[DEBUG]: No active games found in database.`);
      }
      console.log('🔄 [GameRecovery] No active games to recover.');
      return;
    }

    console.log(`🔄 [GameRecovery] Found ${activeGamesFromDb.length} in-progress games. Recovering state...`);

    for (const gameDb of activeGamesFromDb) {
      const gameId = gameDb._id.toString();
      
      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.log(`[DEBUG]: Recovering game session for ID: ${gameId}`);
      }

      // Recreate and start the game engine session (await በመጠቀም)
      const engine = await gameManager.createGameSession(gameId, ioServer);
      
      // calledNumbers ከዳታቤዝ ወደ RAM ኤንጂን መመለስ
      // (ማስታወሻ: BingoGame ሞዴል ውስጥ calledNumbers የሚለው field ጥቅም ላይ ውሏል)
      if (gameDb.calledNumbers && gameDb.calledNumbers.length > 0) {
        engine.drawnNumbers = [...gameDb.calledNumbers];
        
        // ከ availableBalls ውስጥ ከዚህ በፊት የተጠሩትን ማጣራት (Filter out already drawn balls)
        engine.availableBalls = engine.availableBalls.filter(
          (ball) => !engine.drawnNumbers.includes(ball)
        );

        if (BINGO_CONSTANTS.DEBUG_MODE) {
          console.log(`[DEBUG]: Restored ${engine.drawnNumbers.length} drawn numbers. Remaining balls: ${engine.availableBalls.length}`);
        }
      }

      console.log(`✅ [GameRecovery] Successfully recovered game ID: ${gameId} with ${engine.drawnNumbers.length} balls already drawn.`);
    }
  } catch (err) {
    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.error(`[DEBUG ERROR]: Failed to recover active games:`, err);
    }
    console.error('❌ [GameRecovery Error]:', err.message);
  }
};