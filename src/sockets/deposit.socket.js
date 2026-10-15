/**
 * ⚡ Deposit Socket Handlers
 * Handles real-time deposit events for users and admins
 */
export const registerDepositSocketHandlers = (io, socket) => {
  // ተጠቃሚው የራሱን ዲፖዚት ሩም መቀላቀል ሲፈልግ (ለምሳሌ: user_telegramId)
  socket.on('join_user_deposit_room', (telegramId) => {
    if (telegramId) {
      socket.join(`user_deposit_${telegramId}`);
      console.log(`📥 Socket ${socket.id} joined user deposit room: user_deposit_${telegramId}`);
    }
  });

  // ዲፖዚት ሲሳካ ወይም ሲጸድቅ ለተጠቃሚው በሬል-ታይም ኖቲፊኬሽን ለመላክ
  socket.on('deposit_status_updated', (data) => {
    const { telegramId, status, amount } = data;
    if (telegramId) {
      io.to(`user_deposit_${telegramId}`).emit('deposit_notification', {
        status,
        amount,
        message: `Your deposit of ${amount} ETB has been ${status}!`
      });
    }
  });

  socket.on('disconnect', () => {
    // Socket disconnected
  });
};