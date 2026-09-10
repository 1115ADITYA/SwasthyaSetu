import { Request, Response } from 'express';
import prisma from '../../core/db/prisma';

export const getFacilities = async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    if (user.role === 'DOCTOR') {
      // DOCTOR: return only their own assigned facility.
      if (!user.facilityId) {
        return res.status(200).json([]);
      }
      const facility = await prisma.facility.findUnique({
        where: { id: user.facilityId },
      });
      return res.status(200).json(facility ? [facility] : []);
    }

    // ADMIN / ASHA: return all facilities ordered by name.
    const facilities = await prisma.facility.findMany({
      orderBy: { name: 'asc' },
    });
    res.status(200).json(facilities);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
