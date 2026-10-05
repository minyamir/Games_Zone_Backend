import { userService } from '../services/user.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

export const userController = {
  // የተጠቃሚውን ፕሮፋይል ማምጣት
  async getProfile(req, res, next) {
    try {
      const telegramId = req.user?.telegramId || req.params.telegramId;
      const user = await userService.getUserByTelegramId(telegramId);

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      return res.status(200).json(
        new ApiResponse(200, { user }, 'User profile fetched successfully')
      );
    } catch (error) {
      next(error);
    }
  },

  // የተጠቃሚውን መረጃ ማዘመን
  async updateProfile(req, res, next) {
    try {
      const telegramId = req.user?.telegramId;
      const updatedUser = await userService.updateUser(telegramId, req.body);

      if (!updatedUser) {
        throw new ApiError(404, 'User not found or update failed');
      }

      return res.status(200).json(
        new ApiResponse(200, { user: updatedUser }, 'User profile updated successfully')
      );
    } catch (error) {
      next(error);
    }
  }
};