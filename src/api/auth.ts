import express from 'express';
import asyncHandler from 'express-async-handler';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

const authRouter = express.Router();


authRouter.post('/signup', asyncHandler(async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Missing username, password, or role' });
  }

  
  const existing = await db.select().from(users).where(eq(users.username, username)).get();
  if (existing) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  
  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({ username, passwordHash, role });

  res.status(201).json({ message: 'Signup successful', username, role });
}));

authRouter.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

  const user = await db.select().from(users).where(eq(users.username, username)).get();
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  
  res.json({ message: 'Login successful', id: user.id, username: user.username, role: user.role });
}));

export default authRouter;