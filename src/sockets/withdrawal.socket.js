/**
 * ⚡ Withdrawal Socket Handlers
 * Handles real-time withdrawal events for users and admins
 */
export const registerWithdrawalSocketHandlers = (io, socket) => {
  // ተጠቃሚው የራሱን ዊዝድሮዋል ሩም መቀላቀል ሲፈልግ (ለምሳሌ: user_withdrawal_telegramId)
  socket.on('join_user_withdrawal_room', (telegramId) => {
    if (telegramId) {
      socket.join(`user_withdrawal_${telegramId}`);
      console.log(`📤 Socket ${socket.id} joined user withdrawal room: user_withdrawal_${telegramId}`);
    }
  });

  // ዊዝድሮዋል ሲጸድቅ ወይም ውድቅ ሲደረግ ለተጠቃሚው በሬል-ታይም ኖቲፊኬሽን ለመላክ
  socket.on('withdrawal_status_updated', (data) => {
    const { telegramId, status, amount } = data;
    if (telegramId) {
      io.to(`user_withdrawal_${telegramId}`).emit('withdrawal_notification', {
        status,
        amount,
        message: `Your withdrawal request of ${amount} ETB has been ${status}!`
      });
    }
  });

  socket.on('disconnect', () => {
    // Socket disconnected
  });
};