import { Request, Response } from 'express';
import prisma from '../../core/db/prisma';

// ---------------------------------------------------------------------------
// Shared facility-scope helper
// ---------------------------------------------------------------------------

/**
 * Returns the Prisma `where` clause fragment that enforces facility scoping:
 *   - DOCTOR  → only visits where facilityId matches their authoritative facility.
 *   - ADMIN   → no filter (district-wide).
 *   - Other roles are blocked at the route level before reaching this function.
 */
function visitFacilityFilter(role: string, facilityId: string | null) {
  if (role === 'DOCTOR') {
    return { facilityId: facilityId ?? undefined };
  }
  return {};
}

// ---------------------------------------------------------------------------
// Full include spec for GET /api/visits/:id
// ---------------------------------------------------------------------------
const VISIT_FULL_INCLUDE = {
  patient:      { include: { facility: true } },
  facility:     true,
  asha:         { select: { id: true, phoneNumber: true, role: true } },
  doctor:       { select: { id: true, phoneNumber: true, role: true } },
  vitals:       true,
  symptoms:     true,
  consultation: true,
  referral:     true,
} as const;

// Lean include for list endpoints
const VISIT_LIST_INCLUDE = {
  patient:  { select: { id: true, firstName: true, lastName: true } },
  facility: { select: { id: true, name: true } },
  vitals:   true,
  symptoms: true,
} as const;

// ---------------------------------------------------------------------------
// GET /api/visits
// ---------------------------------------------------------------------------

/**
 * List visits with optional filters: status, patientId, date (YYYY-MM-DD),
 * page, limit.
 *
 * DOCTOR  → facility-scoped.
 * ADMIN   → district-wide.
 */
export const getVisits = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { status, patientId, date, page, limit } = req.query;

    // Build the where clause
    const where: Record<string, unknown> = {
      ...visitFacilityFilter(user.role, user.facilityId),
    };

    if (status && typeof status === 'string') {
      where['status'] = status;
    }

    if (patientId && typeof patientId === 'string') {
      where['patientId'] = patientId;
    }

    if (date && typeof date === 'string') {
      const day = new Date(date);
      if (!isNaN(day.getTime())) {
        const nextDay = new Date(day);
        nextDay.setDate(nextDay.getDate() + 1);
        where['visitDate'] = { gte: day, lt: nextDay };
      }
    }

    // Pagination
    const pageNum  = Math.max(1, parseInt(String(page  ?? '1'),  10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit ?? '20'), 10) || 20));
    const skip     = (pageNum - 1) * limitNum;

    const [visits, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        include: VISIT_LIST_INCLUDE,
        orderBy: { visitDate: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.visit.count({ where }),
    ]);

    res.status(200).json({
      data: visits,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ---------------------------------------------------------------------------
// GET /api/visits/:id
// ---------------------------------------------------------------------------

/**
 * Fetch a single visit with full related data (vitals, symptoms,
 * consultation, referral, patient, facility).
 *
 * DOCTOR → 404 if the visit belongs to a different facility.
 * ADMIN  → unrestricted.
 */
export const getVisitById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id   = req.params['id'] as string;
    const user = req.user!;

    const visit = await prisma.visit.findUnique({
      where:   { id },
      include: VISIT_FULL_INCLUDE,
    });

    if (!visit) {
      res.status(404).json({ message: 'Visit not found' });
      return;
    }

    // DOCTOR: cross-facility access returns 404 (not 403) — avoids leaking
    // that a visit with this ID exists in another facility.
    if (user.role === 'DOCTOR' && visit.facilityId !== user.facilityId) {
      res.status(404).json({ message: 'Visit not found' });
      return;
    }

    res.status(200).json(visit);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ---------------------------------------------------------------------------
// GET /api/patients/:id/visits
// ---------------------------------------------------------------------------

/**
 * Visit history for a specific patient.
 *
 * DOCTOR → 404 if the patient belongs to a different facility (consistent
 *           with GET /api/patients/:id behaviour).
 * ADMIN  → unrestricted.
 */
export const getPatientVisits = async (req: Request, res: Response): Promise<void> => {
  try {
    const patientId = req.params['id'] as string;
    const user = req.user!;

    // First verify the patient exists and enforce facility scoping
    const patient = await prisma.patientProfile.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }

    // DOCTOR: cross-facility patient → 404 (mirrors patients controller)
    if (user.role === 'DOCTOR' && patient.facilityId !== user.facilityId) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }

    const visits = await prisma.visit.findMany({
      where: {
        patientId,
        // Extra safety: also scope the visits themselves to the DOCTOR's facility
        ...visitFacilityFilter(user.role, user.facilityId),
      },
      include: VISIT_LIST_INCLUDE,
      orderBy: { visitDate: 'desc' },
    });

    res.status(200).json(visits);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

