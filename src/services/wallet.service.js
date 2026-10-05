import { Wallet } from '../models/Wallet.model.js';

export const walletService = {
  // በተጠቃሚው MongoDB _id አማካኝነት ቦርሳውን መፈለግ
  async getWalletByUserId(userId) {
    try {
      return await Wallet.findOne({ user: userId });
    } catch (error) {
      console.error('❌ Error in walletService.getWalletByUserId:', error);
      throw error;
    }
  },

  // አዲስ የኪስ ቦርሳ መፍጠር
  async createWallet(walletData) {
    try {
      return await Wallet.create(walletData);
    } catch (error) {
      console.error('❌ Error in walletService.createWallet:', error);
      throw error;
    }
  }
};