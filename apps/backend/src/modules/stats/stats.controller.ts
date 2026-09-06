import { Request, Response } from 'express';
import prisma from '../../core/db/prisma';

export const getStats = async (req: Request, res: Response) => {
  try {
    const [totalPatients, totalFacilities, countByFacilityRaw] = await Promise.all([
      prisma.patientProfile.count(),
      prisma.facility.count(),
      prisma.patientProfile.groupBy({
        by: ['facilityId'],
        _count: { id: true },
      }),
    ]);

    // Enrich countByFacility with facility names
    const facilityIds = countByFacilityRaw.map((r) => r.facilityId);
    const facilities = await prisma.facility.findMany({
      where: { id: { in: facilityIds } },
      select: { id: true, name: true, location: true },
    });

    const facilityMap = new Map(facilities.map((f) => [f.id, f]));

    const countByFacility = countByFacilityRaw.map((r) => ({
      facilityId: r.facilityId,
      facilityName: facilityMap.get(r.facilityId)?.name ?? 'Unknown',
      facilityLocation: facilityMap.get(r.facilityId)?.location ?? '',
      patientCount: r._count.id,
    }));

    res.status(200).json({
      totalPatients,
      totalFacilities,
      countByFacility,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
