import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../core/db/prisma';
import { CreateVisitRequest } from '@swasthyasetu/shared-types';

const vitalsSchema = z.object({
  temperature: z.number().min(25).max(45).optional(),
  systolic: z.number().min(50).max(300).optional(),
  diastolic: z.number().min(30).max(200).optional(),
  heartRate: z.number().min(20).max(250).optional(),
  spO2: z.number().min(0).max(100).optional(),
  respiratoryRate: z.number().min(5).max(80).optional(),
  weight: z.number().min(1).max(300).optional(),
});

const symptomSchema = z.object({
  name: z.string().min(1),
  severity: z.string().min(1),
  durationDays: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const createVisitSchema = z.object({
  patientId: z.string().uuid(),
  status: z.string().min(1),
  notes: z.string().optional(),
  vitals: vitalsSchema.optional(),
  symptoms: z.array(symptomSchema).optional(),
});

export const createVisit = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const validation = createVisitSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: 'Validation error', errors: validation.error.flatten() });
    }

    const { patientId, status, notes, vitals, symptoms } = validation.data;

    // Verify patient exists
    const patient = await prisma.patientProfile.findUnique({ where: { id: patientId } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const visit = await prisma.healthVisit.create({
      data: {
        patientId,
        recordedById: user.userId,
        status,
        notes,
        ...(vitals && {
          vitals: {
            create: vitals,
          }
        }),
        ...(symptoms && symptoms.length > 0 && {
          symptoms: {
            create: symptoms,
          }
        })
      },
      include: {
        vitals: true,
        symptoms: true,
      }
    });

    res.status(201).json({ message: 'Visit created successfully', visitId: visit.id, visit });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getVisitsByPatient = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const visits = await prisma.healthVisit.findMany({
      where: { patientId: patientId as string },
      include: {
        vitals: true,
        symptoms: true,
        recordedBy: {
          select: { id: true, role: true, phoneNumber: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ visits });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
