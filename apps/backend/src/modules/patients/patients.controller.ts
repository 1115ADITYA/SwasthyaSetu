import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../core/db/prisma';

const patientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date" }),
  gender: z.string(),
  abhaId: z.string().optional(),
  facilityId: z.string(),
  userId: z.string().optional(),
});


export const createPatient = async (req: Request, res: Response) => {
  try {
    const validation = patientSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: 'Validation error', errors: validation.error.flatten() });
    }

    const { firstName, lastName, dateOfBirth, gender, abhaId, facilityId, userId } = validation.data;

    const patient = await prisma.patientProfile.create({
      data: {
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        abhaId,
        facilityId,
        userId: userId || undefined,
      },
    });

    res.status(201).json({ message: 'Patient profile created', patient });
  } catch (error) {
    console.error('[patients.controller] createPatient error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getPatients = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    // DOCTOR: scoped to their own facility only.
    // ADMIN / ASHA: district-wide, no filter.
    const facilityFilter =
      user.role === 'DOCTOR'
        ? { facilityId: user.facilityId ?? undefined }
        : {};

    const patients = await prisma.patientProfile.findMany({
      where: facilityFilter,
      include: { facility: true },
    });
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getPatientById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const patient = await prisma.patientProfile.findUnique({
      where: { id: id as string },
      include: { facility: true },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // DOCTOR: cross-facility access returns 404 (not 403) to avoid leaking
    // that a patient with this ID exists in another facility.
    if (user.role === 'DOCTOR' && patient.facilityId !== user.facilityId) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updatePatient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Partial validation for update
    const updateSchema = patientSchema.partial();
    const validation = updateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: 'Validation error', errors: validation.error.flatten() });
    }

    const dataToUpdate = validation.data;
    if (dataToUpdate.dateOfBirth) {
      (dataToUpdate as any).dateOfBirth = new Date(dataToUpdate.dateOfBirth);
    }

    const patient = await prisma.patientProfile.update({
      where: { id: id as string },
      data: dataToUpdate as any,
    });
    res.status(200).json({ message: 'Patient updated', patient });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const searchPatient = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: 'Search query required' });
    }
    const searchQuery = q as string;
    const user = req.user!;

    // Build the text-match OR clause
    const textFilter = {
      OR: [
        { firstName: { contains: searchQuery, mode: 'insensitive' as const } },
        { lastName: { contains: searchQuery, mode: 'insensitive' as const } },
        { abhaId: { contains: searchQuery, mode: 'insensitive' as const } },
      ],
    };

    // DOCTOR: intersect with facility scope.
    // ADMIN / ASHA: district-wide search.
    const whereClause =
      user.role === 'DOCTOR'
        ? { AND: [{ facilityId: user.facilityId ?? undefined }, textFilter] }
        : textFilter;

    const patients = await prisma.patientProfile.findMany({
      where: whereClause,
      include: { facility: true },
    });
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
