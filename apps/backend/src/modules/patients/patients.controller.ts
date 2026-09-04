import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../core/db/prisma';

const patientSchema = z.object({
  id: z.string().uuid().optional(),
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

    const { id, firstName, lastName, dateOfBirth, gender, abhaId, facilityId, userId } = validation.data;

    // Idempotency: the mobile offline-sync fallback retries this endpoint with the same
    // client-generated id if it never received the previous response. Without this check,
    // a retried request creates a duplicate PatientProfile under a new id and the original
    // local-only record on the device never gets marked as synced.
    if (id) {
      const existing = await prisma.patientProfile.findUnique({ where: { id } });
      if (existing) {
        return res.status(200).json({ message: 'Patient profile already exists', patient: existing });
      }
    }

    const patient = await prisma.patientProfile.create({
      data: {
        ...(id && { id }),
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
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getPatients = async (req: Request, res: Response) => {
  try {
    const patients = await prisma.patientProfile.findMany();
    res.status(200).json(patients);
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

    const patients = await prisma.patientProfile.findMany({
      where: {
        OR: [
          { firstName: { contains: searchQuery, mode: 'insensitive' } },
          { lastName: { contains: searchQuery, mode: 'insensitive' } },
          { abhaId: { contains: searchQuery, mode: 'insensitive' } }
        ]
      },
    });
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

