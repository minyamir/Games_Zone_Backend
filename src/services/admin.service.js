import { User } from '../models/User.model.js';
import { Transaction } from '../models/Transaction.model.js';
import { Wallet } from '../models/Wallet.model.js';

/**
 * 1. Get Overall Platform Statistics for the Web Dashboard
 */
export const getAdminDashboardStatsService = async () => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeUsers = await User.countDocuments({ role: 'user', status: 'active' });
    
    // Calculate total money across wallets
    const wallets = await Wallet.find({});
    let totalMainWallet = 0;
    let totalPlayWallet = 0;
    let totalLockedBalance = 0;

    wallets.forEach(w => {
      totalMainWallet += w.mainWallet || 0;
      totalPlayWallet += w.playWallet || 0;
      totalLockedBalance += w.lockedBalance || 0;
    });

    // Count pending transactions
    const pendingDepositsCount = await Transaction.countDocuments({ type: 'deposit', status: 'pending' });
    const pendingWithdrawalsCount = await Transaction.countDocuments({ type: 'withdrawal', status: 'pending' });

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      finances: {
        totalMainWallet,
        totalPlayWallet,
        totalLockedBalance,
      },
      pendingActions: {
        deposits: pendingDepositsCount,
        withdrawals: pendingWithdrawalsCount,
      }
    };
  } catch (err) {
    throw new Error('Error fetching admin stats: ' + err.message);
  }
};

/**
 * 2. Manage User Status (Suspend, Ban, or Activate)
 */
export const updateUserStatusService = async (targetUserId, newStatus) => {
  try {
    if (!['active', 'suspended', 'banned'].includes(newStatus)) {
      throw new Error('INVALID_STATUS_VALUE');
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    user.status = newStatus;
    await user.save();

    return { user };
  } catch (err) {
    throw new Error('Error updating user status: ' + err.message);
  }
};

/**
 * 3. Get Paginated Users List for Admin Management
 */
export const getAllUsersService = async (page = 1, limit = 20, search = '') => {
  try {
    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { telegramId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    return {
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalUsers: total
    };
  } catch (err) {
    throw new Error('Error fetching users list: ' + err.message);
  }
};