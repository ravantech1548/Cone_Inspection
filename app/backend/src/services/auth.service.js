import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db/pool.js';
import { config } from '../config.js';
import { AppError } from '../middleware/errorHandler.js';

export const login = async (username, password) => {
  const result = await query(
    'SELECT id, username, password_hash, role FROM users WHERE username = $1',
    [username]
  );
  
  if (result.rows.length === 0) {
    throw new AppError('Invalid credentials', 401);
  }
  
  const user = result.rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);
  
  if (!isValid) {
    throw new AppError('Invalid credentials', 401);
  }
  
  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  };
};

export const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};
