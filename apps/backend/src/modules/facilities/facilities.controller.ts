import { Request, Response } from 'express';
import prisma from '../../core/db/prisma';

export const getFacilities = async (req: Request, res: Response) => {
  try {
    // Facility name/type/location is non-sensitive reference data (no patient
    // data attached), and the only consumer of this endpoint — the web
    // referral form's destination-facility dropdown — needs the full list
    // for every role, DOCTOR included: a doctor referring a patient out must
    // be able to pick a facility other than their own. Restricting DOCTOR to
    // a single-facility result here always left that dropdown empty once the
    // form filters out the referring doctor's own facility.
    const facilities = await prisma.facility.findMany({
      orderBy: { name: 'asc' },
    });
    res.status(200).json(facilities);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
