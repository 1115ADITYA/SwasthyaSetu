import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../../core/db/prisma';

const registerSchema = z.object({
  phoneNumber: z.string().min(10).max(15),
  password: z.string().min(6),
  role: z.enum(['PATIENT', 'ASHA', 'DOCTOR', 'ADMIN']).optional(),
});

const loginSchema = z.object({
  phoneNumber: z.string().min(10).max(15),
  password: z.string().min(6),
});


export const register = async (req: Request, res: Response) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: 'Validation error', errors: validation.error.flatten() });
    }

    const { phoneNumber, password, role } = validation.data;

    const existingUser = await prisma.user.findUnique({ where: { phoneNumber } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        phoneNumber,
        passwordHash,
        role: role || 'PATIENT',
      },
    });

    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: 'Validation error', errors: validation.error.flatten() });
    }

    const { phoneNumber, password } = validation.data;

    const user = await prisma.user.findUnique({ where: { phoneNumber } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = { userId: user.id, role: user.role };
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    // Using explicit string type assertion for ms-compatible string
    const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];
    const token = jwt.sign(
      payload,
      secret,
      { expiresIn }
    );

    res.status(200).json({ token, role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
