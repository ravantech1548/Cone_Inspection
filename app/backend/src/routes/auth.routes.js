import express from 'express';
import { login } from '../services/auth.service.js';
import { LoginSchema } from '@textile-inspector/shared';

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = LoginSchema.parse(req.body);
    const result = await login(username, password);
    
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

export default router;
