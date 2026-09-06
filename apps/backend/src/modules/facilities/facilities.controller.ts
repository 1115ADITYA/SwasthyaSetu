import { Request, Response } from 'express';
import prisma from '../../core/db/prisma';

export const getFacilities = async (req: Request, res: Response) => {
  try {
    const facilities = await prisma.facility.findMany({
      orderBy: { name: 'asc' },
    });
    res.status(200).json(facilities);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
