import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { sendEmail } from '../utils/emailSender.js';
// Register a new user
export const register = async (req, res) => {
  try {
    const { name, email, password, balance, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user with optional role
    const user = await User.create({ 
      name, 
      email, 
      password,
      balance,
      role: role || 'user'
    });

    // Generate verification token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Send verification email
    const verificationUrl = `http://localhost:5173/verify-email`;
    await sendEmail({
      email: user.email,
      subject: 'Verify Your Email',
      message: `Hi ${user.name}, Please click on this link to verify your email: ${verificationUrl}`
    });

    res.status(201).json({ message: 'User registered. Verification email sent.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    res.status(200).json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        balance: user.balance,
        role: user.role 
      } 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user balance
export const updateBalance = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    // Find user and update balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure balance doesn't go negative
    if (user.balance + amount < 0) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    user.balance -= amount;
    await user.save();

    res.status(200).json({ 
      balance: user.balance,
      message: 'Balance updated successfully'
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user details
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, password, balance } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) {
      // Check if new email is already taken
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }
    if (password) {
      user.password = password; // Password will be hashed by pre-save middleware
    }
    if (balance !== undefined) {
      user.balance = balance;
    }

    await user.save();

    res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        balance: user.balance,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};