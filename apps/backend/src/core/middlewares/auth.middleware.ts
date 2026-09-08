import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db/prisma';

interface JwtPayload {
  userId: string;
  role: string;
}

export interface DecodedToken {
  userId: string;
  role: string;
  facilityId: string | null;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as JwtPayload;

    // Authoritative DB lookup — attaches server-side facilityId to req.user.
    // This prevents any client from injecting a fake facilityId via the token.
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { facilityId: true },
    });

    (req as any).user = {
      userId: payload.userId,
      role: payload.role,
      facilityId: dbUser?.facilityId ?? null,
    } satisfies DecodedToken;

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as DecodedToken | undefined;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }
    next();
  };
};
