import { User } from '../models/User.model.js';

export const userService = {
  // በቴሌግራም ID ተጠቃሚን መፈለግ
  async getUserByTelegramId(telegramId) {
    try {
      return await User.findOne({ telegramId });
    } catch (error) {
      console.error('❌ Error in userService.getUserByTelegramId:', error);
      throw error;
    }
  },

  // አዲስ ተጠቃሚ መፍጠር
  async createUser(userData) {
    try {
      return await User.create(userData);
    } catch (error) {
      console.error('❌ Error in userService.createUser:', error);
      throw error;
    }
  },

  // ተጠቃሚን ማዘመን (Update)
  async updateUser(telegramId, updateData) {
    try {
      return await User.findOneAndUpdate({ telegramId }, updateData, { new: true });
    } catch (error) {
      console.error('❌ Error in userService.updateUser:', error);
      throw error;
    }
  }
};