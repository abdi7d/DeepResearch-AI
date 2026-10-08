import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../models/store.js';
import { generateToken, AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        res.status(400).json({ error: 'Name, email, and password are required.' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters.' });
        return;
      }

      const existing = await db.users.findByEmail(email);
      if (existing) {
        res.status(409).json({ error: 'A user with this email address already exists.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await db.users.create({
        email: email.toLowerCase().trim(),
        passwordHash,
        name: name.trim(),
      });

      const token = generateToken({
        id: user.id,
        email: user.email,
        name: user.name,
        isGuest: false,
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        user: { id: user.id, email: user.email, name: user.name, isGuest: false },
        token,
      });
    } catch (error) {
      console.error('[AuthController.register] Error:', error);
      res.status(500).json({ error: 'Registration failed.' });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }

      const user = await db.users.findByEmail(email);
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
        name: user.name,
        isGuest: false,
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        user: { id: user.id, email: user.email, name: user.name, isGuest: false },
        token,
      });
    } catch (error) {
      console.error('[AuthController.login] Error:', error);
      res.status(500).json({ error: 'Login failed.' });
    }
  }

  static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }
    res.json({ user: req.user });
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully.' });
  }

  static async guest(req: Request, res: Response): Promise<void> {
    const guestId = `guest_${Math.random().toString(36).substring(2, 9)}`;
    const guestUser = {
      id: guestId,
      email: `${guestId}@research.engine`,
      name: 'Guest Scholar',
      isGuest: true,
    };
    const token = generateToken(guestUser);

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user: guestUser, token });
  }
}
