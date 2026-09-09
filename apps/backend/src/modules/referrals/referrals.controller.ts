import { Request, Response } from 'express';
import prisma from '../../core/db/prisma';

// ---------------------------------------------------------------------------
// Referral status transition rules
// ---------------------------------------------------------------------------
//
// Valid transitions and who may make them:
//
//   INITIATED  → IN_TRANSIT  : source-facility DOCTOR
//   IN_TRANSIT → RECEIVED    : destination-facility DOCTOR
//   RECEIVED   → COMPLETED   : destination-facility DOCTOR
//   any active → CANCELLED   : source-facility OR destination-facility DOCTOR
//
// Terminal states: COMPLETED, CANCELLED — no further transitions allowed.

type ReferralStatus = 'INITIATED' | 'IN_TRANSIT' | 'RECEIVED' | 'COMPLETED' | 'CANCELLED';

const FORWARD_TRANSITIONS: Record<string, ReferralStatus> = {
  INITIATED:  'IN_TRANSIT',
  IN_TRANSIT: 'RECEIVED',
  RECEIVED:   'COMPLETED',
};

// ---------------------------------------------------------------------------
// POST /api/referrals
// ---------------------------------------------------------------------------

/**
 * Create a referral for a COMPLETED visit.
 *
 * DOCTOR only.
 *   - Visit must exist and belong to the doctor's facility (sourceFacilityId).
 *   - Visit must be in COMPLETED status.
 *   - A referral must not already exist for the visit (one-per-visit FK).
 *   - referringDoctorId, sourceFacilityId, patientId are all derived
 *     server-side — the client cannot spoof them.
 */
export const createReferral = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId       = req.user!.userId;
    const doctorFacility = req.user!.facilityId;

    const { visitId, destinationFacilityId, reason } = req.body ?? {};

    // Basic payload validation
    if (!visitId || typeof visitId !== 'string') {
      res.status(400).json({ message: 'visitId is required' });
      return;
    }
    if (!destinationFacilityId || typeof destinationFacilityId !== 'string') {
      res.status(400).json({ message: 'destinationFacilityId is required' });
      return;
    }
    if (!reason || typeof reason !== 'string' || reason.trim() === '') {
      res.status(400).json({ message: 'reason is required' });
      return;
    }

    // Fetch visit with existing referral
    const visit = await prisma.visit.findUnique({
      where:   { id: visitId },
      include: { referral: true },
    });

    if (!visit) {
      res.status(404).json({ message: 'Visit not found' });
      return;
    }

    // Facility scope: doctor can only refer from their own facility
    if (doctorFacility !== null && visit.facilityId !== doctorFacility) {
      res.status(404).json({ message: 'Visit not found' });
      return;
    }

    // Visit must be COMPLETED
    if (visit.status !== 'COMPLETED') {
      res.status(422).json({
        message: `Referral can only be created for a COMPLETED visit (current status: ${visit.status})`,
      });
      return;
    }

    // Prevent duplicate referral (one-per-visit unique constraint)
    if (visit.referral) {
      res.status(422).json({ message: 'A referral already exists for this visit' });
      return;
    }

    // Verify the destination facility exists
    const destFacility = await prisma.facility.findUnique({
      where: { id: destinationFacilityId },
    });
    if (!destFacility) {
      res.status(404).json({ message: 'Destination facility not found' });
      return;
    }

    // Prevent self-referral (source === destination)
    const sourceFacilityId = visit.facilityId;
    if (sourceFacilityId === destinationFacilityId) {
      res.status(422).json({ message: 'Source and destination facility must differ' });
      return;
    }

    const referral = await prisma.referral.create({
      data: {
        visitId,
        patientId:            visit.patientId,   // derived server-side
        referringDoctorId:    doctorId,            // authenticated doctor
        sourceFacilityId,                          // visit's facility
        destinationFacilityId,
        reason:               reason.trim(),
        status:               'INITIATED',
      },
      include: {
        sourceFacility:      true,
        destinationFacility: true,
        referringDoctor:     { select: { id: true, phoneNumber: true } },
      },
    });

    res.status(201).json(referral);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ---------------------------------------------------------------------------
// GET /api/referrals
// ---------------------------------------------------------------------------

/**
 * List referrals.
 *
 * DOCTOR → referrals where sourceFacilityId OR destinationFacilityId matches
 *           their facility (they are involved in the referral chain).
 * ADMIN  → district-wide (all referrals).
 */
export const getReferrals = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    const where =
      user.role === 'DOCTOR'
        ? {
            OR: [
              { sourceFacilityId:      user.facilityId ?? undefined },
              { destinationFacilityId: user.facilityId ?? undefined },
            ],
          }
        : {};

    const referrals = await prisma.referral.findMany({
      where,
      include: {
        patient:             { select: { id: true, firstName: true, lastName: true } },
        sourceFacility:      { select: { id: true, name: true } },
        destinationFacility: { select: { id: true, name: true } },
        referringDoctor:     { select: { id: true, phoneNumber: true } },
        visit:               { select: { id: true, visitDate: true, reason: true } },
      },
      orderBy: { initiatedAt: 'desc' },
    });

    res.status(200).json(referrals);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/referrals/:id/status
// ---------------------------------------------------------------------------

/**
 * Advance a referral's status along its state machine.
 *
 * Allowed body: { status: <next-status> }
 *
 * Forward-progression rules (who may trigger each transition):
 *   INITIATED  → IN_TRANSIT : source-facility DOCTOR
 *   IN_TRANSIT → RECEIVED   : destination-facility DOCTOR
 *   RECEIVED   → COMPLETED  : destination-facility DOCTOR
 *
 * Cancellation:
 *   any non-terminal status → CANCELLED : source-facility OR
 *                                         destination-facility DOCTOR
 *
 * COMPLETED and CANCELLED are terminal — no further transitions.
 */
export const patchReferralStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const referralId = req.params['id'] as string;
    const user       = req.user!;
    const { status: requestedStatus } = req.body ?? {};

    if (!requestedStatus || typeof requestedStatus !== 'string') {
      res.status(400).json({ message: 'status is required' });
      return;
    }

    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
    });
    if (!referral) {
      res.status(404).json({ message: 'Referral not found' });
      return;
    }

    // Facility access check: doctor must be at source OR destination
    if (user.role === 'DOCTOR') {
      const isSource      = referral.sourceFacilityId      === user.facilityId;
      const isDestination = referral.destinationFacilityId === user.facilityId;
      if (!isSource && !isDestination) {
        res.status(403).json({ message: 'Access denied: not involved in this referral' });
        return;
      }
    }

    const currentStatus = referral.status as ReferralStatus;

    // Terminal states block all transitions
    if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
      res.status(422).json({
        message: `Referral is already in a terminal state (${currentStatus})`,
      });
      return;
    }

    // Validate the requested target status
    const isCancellation   = requestedStatus === 'CANCELLED';
    const expectedForward  = FORWARD_TRANSITIONS[currentStatus];

    if (!isCancellation && requestedStatus !== expectedForward) {
      res.status(422).json({
        message: `Invalid transition: ${currentStatus} → ${requestedStatus}. ` +
                 `Expected ${expectedForward} or CANCELLED.`,
      });
      return;
    }

    // Enforce per-transition facility authority
    if (!isCancellation) {
      // Forward transitions
      if (currentStatus === 'INITIATED') {
        // Source-facility doctor dispatches the referral
        if (user.role === 'DOCTOR' && referral.sourceFacilityId !== user.facilityId) {
          res.status(403).json({
            message: 'Only the source-facility doctor may mark a referral as IN_TRANSIT',
          });
          return;
        }
      } else {
        // IN_TRANSIT → RECEIVED and RECEIVED → COMPLETED require destination facility
        if (user.role === 'DOCTOR' && referral.destinationFacilityId !== user.facilityId) {
          res.status(403).json({
            message: 'Only the destination-facility doctor may advance this referral',
          });
          return;
        }
      }
    }
    // Cancellation is allowed by either facility doctor — no extra check needed.

    const updated = await prisma.referral.update({
      where: { id: referralId },
      data:  { status: requestedStatus as ReferralStatus },
      include: {
        sourceFacility:      { select: { id: true, name: true } },
        destinationFacility: { select: { id: true, name: true } },
      },
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
