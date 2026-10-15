import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Transaction } from '../models/Transaction.model.js';
import { User } from '../models/User.model.js';
import { config } from '../config/env.js';
import { approveDepositService, rejectDepositService } from '../services/deposit.service.js';
import { approveWithdrawalService, rejectWithdrawalService } from '../services/withdrawal.service.js';

/**
 * 1. Admin Login (ለዌብ አድሚን መግቢያ)
 */
export const adminLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const admin = await User.findOne({ username, role: 'admin' });
    if (!admin || admin.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Invalid credentials or account inactive' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: admin.role },
      config.jwtSecret || 'bingo_super_secret_key',
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. Admin Register (አዲስ አድሚን በዌብ በኩል ለመመዝገብ)
 */
export const adminRegister = async (req, res, next) => {
  try {
    const { username, password, firstName, telegramId } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const existingAdmin = await User.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await User.create({
      telegramId: telegramId || `admin_${Date.now()}`,
      username,
      firstName: firstName || 'Admin',
      password: hashedPassword,
      role: 'admin',
      status: 'active'
    });

    return res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        id: newAdmin._id,
        username: newAdmin.username,
        role: newAdmin.role
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. በመጠባበቅ ላይ ያሉ የዲፖዚት እና ዊዝድሮዋል ጥያቄዎችን ማምጣት
 */
export const getPendingTransactions = async (req, res, next) => {
  try {
    const pendingDeposits = await Transaction.find({ type: 'deposit', status: 'pending' })
      .populate('user', 'telegramId firstName username phoneNumber language')
      .sort({ createdAt: -1 });

    const pendingWithdrawals = await Transaction.find({ type: 'withdrawal', status: 'pending' })
      .populate('user', 'telegramId firstName username phoneNumber language')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        deposits: pendingDeposits,
        withdrawals: pendingWithdrawals
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 4. የዲፖዚት ጥያቄን ማጽደቅ ወይም ውድቅ ማድረግ
 */
export const handleDepositAction = async (req, res, next) => {
  try {
    const { transactionId, action } = req.body; // action: 'approve' ወይም 'reject'
    const adminId = req.admin?._id || req.body.adminId; // ከአድሚን ሚድልዌር የሚመጣ

    if (!transactionId || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid parameters provided' });
    }

    let result;
    if (action === 'approve') {
      result = await approveDepositService(transactionId, adminId);
    } else {
      result = await rejectDepositService(transactionId, adminId);
    }

    res.status(200).json({
      success: true,
      message: `Deposit transaction ${action}d successfully`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 5. የዊዝድሮዋል ጥያቄን ማጽደቅ ወይም ውድቅ ማድረግ
 */
export const handleWithdrawalAction = async (req, res, next) => {
  try {
    const { transactionId, action } = req.body; // action: 'approve' ወይም 'reject'
    const adminId = req.admin?._id || req.body.adminId;

    if (!transactionId || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid parameters provided' });
    }

    let result;
    if (action === 'approve') {
      result = await approveWithdrawalService(transactionId, adminId);
    } else {
      result = await rejectWithdrawalService(transactionId, adminId);
    }

    res.status(200).json({
      success: true,
      message: `Withdrawal transaction ${action}d successfully`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};