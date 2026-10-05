import { walletService } from '../services/wallet.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

export const walletController = {
  // የተጠቃሚውን የኪስ ቦርሳ ሒሳብ ማምጣት
  async getWallet(req, res, next) {
    try {
      // req.user በ auth middleware በኩል የሚመጣ ከሆነ
      const userId = req.user?._id || req.params.userId;
      const wallet = await walletService.getWalletByUserId(userId);

      if (!wallet) {
        throw new ApiError(404, 'Wallet not found for this user');
      }

      return res.status(200).json(
        new ApiResponse(200, { wallet }, 'Wallet details fetched successfully')
      );
    } catch (error) {
      next(error);
    }
  }
};