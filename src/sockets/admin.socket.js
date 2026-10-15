export const registerAdminSocketHandlers = (io, socket) => {
  console.log(`⚡ Admin socket connected: ${socket.id}`);

  // አድሚኑ ወደ 'admin_dashboard' ሩም መቀላቀል
  socket.on('join_admin_dashboard', () => {
    socket.join('admin_dashboard');
    console.log(`🛡️ Socket ${socket.id} joined admin_dashboard room`);
  });

  // ሶኬቱ ሲቋረጥ
  socket.on('disconnect', () => {
    console.log(`❌ Admin socket disconnected: ${socket.id}`);
  });
};