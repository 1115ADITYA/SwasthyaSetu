import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../core/db/prisma';
import { SyncRequest, SyncItemResult } from '@swasthyasetu/shared-types';

const vitalsSchema = z.object({
  temperature: z.number().min(25).max(115).optional(),
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

const syncItemSchema = z.object({
  clientSyncId: z.string().uuid(),
  operation: z.enum(['CREATE_VISIT', 'REGISTER_PATIENT']),
  entityType: z.string(),
  entityId: z.string().optional(),
  payload: z.any(),
});

const registerPatientPayloadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date" }),
  gender: z.string(),
  abhaId: z.string().optional(),
  facilityId: z.string(),
  userId: z.string().optional(),
});

const syncRequestSchema = z.object({
  items: z.array(syncItemSchema),
});

const createVisitPayloadSchema = z.object({
  patientId: z.string().uuid(),
  status: z.string().min(1),
  notes: z.string().optional(),
  vitals: vitalsSchema.optional(),
  symptoms: z.array(symptomSchema).optional(),
});

export const syncData = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const validation = syncRequestSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ message: 'Invalid sync payload', errors: validation.error.flatten() });
    }

    const items = validation.data.items;
    const results: SyncItemResult[] = [];

    for (const item of items) {
      try {
        await prisma.$transaction(async (tx) => {
          // 1. Check idempotency
          const existingReceipt = await tx.syncReceipt.findUnique({
            where: { clientSyncId: item.clientSyncId }
          });

          if (existingReceipt) {
            results.push({
              clientSyncId: item.clientSyncId,
              status: 'duplicate',
              serverEntityId: existingReceipt.entityId || undefined
            });
            return;
          }

          // 2. Process based on operation
          if (item.operation === 'CREATE_VISIT') {
            const payloadValidation = createVisitPayloadSchema.safeParse(item.payload);
            if (!payloadValidation.success) {
              throw new Error(`Invalid payload for CREATE_VISIT: ${JSON.stringify(payloadValidation.error.flatten())}`);
            }

            const { patientId, status, notes, vitals, symptoms } = payloadValidation.data;

            const visit = await tx.healthVisit.create({
              data: {
                id: item.entityId, // Use client generated ID if provided
                patientId,
                recordedById: user.userId,
                status,
                notes,
                ...(vitals && { vitals: { create: vitals } }),
                ...(symptoms && symptoms.length > 0 && { symptoms: { create: symptoms } })
              }
            });

            // 3. Create Sync Receipt
            await tx.syncReceipt.create({
              data: {
                clientSyncId: item.clientSyncId,
                userId: user.userId,
                operation: item.operation,
                entityType: item.entityType,
                entityId: visit.id,
                status: 'SUCCESS'
              }
            });

            results.push({
              clientSyncId: item.clientSyncId,
              status: 'success',
              serverEntityId: visit.id
            });
          } else if (item.operation === 'REGISTER_PATIENT') {
            const payloadValidation = registerPatientPayloadSchema.safeParse(item.payload);
            if (!payloadValidation.success) {
              throw new Error(`Invalid payload for REGISTER_PATIENT: ${JSON.stringify(payloadValidation.error.flatten())}`);
            }

            const { firstName, lastName, dateOfBirth, gender, abhaId, facilityId, userId } = payloadValidation.data;

            const patient = await tx.patientProfile.create({
              data: {
                id: item.entityId, // Use client generated ID if provided
                firstName,
                lastName,
                dateOfBirth: new Date(dateOfBirth),
                gender,
                abhaId,
                facilityId,
                userId: userId || undefined,
              },
            });

            // 3. Create Sync Receipt
            await tx.syncReceipt.create({
              data: {
                clientSyncId: item.clientSyncId,
                userId: user.userId,
                operation: item.operation,
                entityType: item.entityType,
                entityId: patient.id,
                status: 'SUCCESS'
              }
            });

            results.push({
              clientSyncId: item.clientSyncId,
              status: 'success',
              serverEntityId: patient.id
            });
          } else {
            throw new Error(`Unsupported operation: ${item.operation}`);
          }
        });
      } catch (err: any) {
        // Record failure but don't stop the batch
        results.push({
          clientSyncId: item.clientSyncId,
          status: 'failed',
          error: err.message
        });
      }
    }

    res.status(200).json({ message: 'Sync processed', results });
  } catch (error) {
    res.status(500).json({ message: 'Server error during sync processing', error });
  }
};
