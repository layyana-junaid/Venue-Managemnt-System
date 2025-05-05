import mongoose from 'mongoose';
import User from '../../models/User.js';
import bcrypt from 'bcryptjs';

describe('User Model', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should create a new user successfully', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };

    const user = await User.create(userData);
    expect(user).toBeDefined();
    expect(user.name).toBe(userData.name);
    expect(user.email).toBe(userData.email);
    expect(user.isVerified).toBe(false);
    expect(user.balance).toBe(1000);
    expect(user.bookings).toHaveLength(0);
  });

  it('should hash the password before saving', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };

    const user = await User.create(userData);
    const isMatch = await bcrypt.compare('password123', user.password);
    expect(isMatch).toBe(true);
  });

  it('should not allow duplicate emails', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };

    await User.create(userData);
    await expect(User.create(userData)).rejects.toThrow();
  });

  it('should require name, email, and password', async () => {
    const userData = {
      name: 'Test User'
    };

    await expect(User.create(userData)).rejects.toThrow();
  });
}); 