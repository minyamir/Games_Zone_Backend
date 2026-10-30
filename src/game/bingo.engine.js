import { BINGO_CONSTANTS } from './game.constants.js';
import { BingoGame } from '../models/BingoGame.model.js';

export class BingoEngine {
  constructor(gameId, ioServer) {
    this.gameId = gameId;
    this.io = ioServer;
    this.drawnNumbers = [];
    this.availableBalls = [];
    this.timer = null;
    this.isRunning = false;

    // 1. ባሎችን አስቀድሞ በ RAM ውስጥ ማዘጋጀት (Pre-populate balls for O(1) performance)
    for (let i = BINGO_CONSTANTS.MIN_BALL; i <= BINGO_CONSTANTS.MAX_BALL; i++) {
      this.availableBalls.push(i);
    }

    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: High-performance BingoEngine initialized for Game ID: ${this.gameId}`);
    }
  }

  // Start the game loop
  async startEngine(intervalMs = BINGO_CONSTANTS.DEFAULT_DRAW_INTERVAL_MS) {
    if (this.isRunning) return;
    this.isRunning = true;

    // ጨዋታው ሲጀምር ብቻ ዳታቤዝ ማዘመን (Status -> in_progress)
    await BingoGame.findByIdAndUpdate(this.gameId, {
      status: 'in_progress',
      startTime: new Date()
    }).catch(err => console.error('DB Start Error:', err));

    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: Engine started for Game ID: ${this.gameId} with interval ${intervalMs}ms`);
    }

    this.timer = setInterval(() => {
      this.drawNextBall();
    }, intervalMs);
  }

  // Draw the next random ball (Optimized with In-Memory Array & Async DB Batching)
  async drawNextBall() {
    if (this.availableBalls.length === 0) {
      this.stopEngine('ALL_BALLS_DRAWN');
      return;
    }

    // በ RAM ውስጥ ካለው ማርኬት በዘፈቀደ መምረጥ (Ultra Fast)
    const randomIndex = Math.floor(Math.random() * this.availableBalls.length);
    const selectedBall = this.availableBalls.splice(randomIndex, 1)[0];
    this.drawnNumbers.push(selectedBall);

    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: Game ID: ${this.gameId} drew ball: ${selectedBall} | Total: ${this.drawnNumbers.length}`);
    }

    // 1. በሶኬት በኩል ለተጠቃሚዎች ወዲያውኑ ማዳረስ (Zero Lag for Players)
    if (this.io) {
      this.io.to(`game_${this.gameId}`).emit('ball_drawn', {
        gameId: this.gameId,
        ball: selectedBall,
        drawnNumbers: this.drawnNumbers
      });
    }

    // 2. ዳታቤዝን ከብሎኬጅ ለመከላከል (Background DB Sync) - ሰርቨሩን ሳያከብድ ማዘመን
    BingoGame.findByIdAndUpdate(this.gameId, {
      $push: { calledNumbers: selectedBall },
      currentCalledNumber: selectedBall
    }).catch(err => console.error('DB Background Sync Error:', err));

    console.log(`🎱 [Game ${this.gameId}] Ball Drawn: ${selectedBall} | Total Drawn: ${this.drawnNumbers.length}`);
  }

  // Stop the game engine
  async stopEngine(reason) {
    if (!this.isRunning) return;
    clearInterval(this.timer);
    this.isRunning = false;

    // ጨዋታው ሲያልቅ ዳታቤዝ ማዘመን (Status -> completed)
    await BingoGame.findByIdAndUpdate(this.gameId, {
      status: 'completed',
      endTime: new Date()
    }).catch(err => console.error('DB Stop Error:', err));

    if (this.io) {
      this.io.to(`game_${this.gameId}`).emit('game_ended', {
        gameId: this.gameId,
        reason
      });
    }

    console.log(`🛑 [Game ${this.gameId}] Engine Stopped. Reason: ${reason}`);
  }
}