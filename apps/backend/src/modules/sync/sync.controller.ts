import { Request, Response } from 'express';
import { syncPushBodySchema } from './sync.schema';
import { processSyncBatch } from './sync.service';

/**
 * POST /api/sync/push
 *
 * ASHA-only endpoint.  Authentication and role enforcement are applied in
 * sync.routes.ts via the existing authenticate + authorize middleware.
 *
 * HTTP contract:
 *   200  — authenticated ASHA, valid body (even if individual items fail)
 *   400  — malformed / invalid request body
 *   401  — handled by authenticate middleware (no token / bad token)
 *   403  — handled by authorize middleware (non-ASHA role)
 */
export const syncPush = async (req: Request, res: Response): Promise<void> => {
  // Validate the request body
  const validation = syncPushBodySchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      message: 'Validation error',
      errors: validation.error.flatten(),
    });
    return;
  }

  const { items } = validation.data;
  const ashaId = req.user!.userId;

  // Delegate to the service layer (Phase 2B-2 will fill this in)
  const results = await processSyncBatch(items, ashaId);

  // 200 for any authenticated valid batch — individual item status is inside results[]
  res.status(200).json({ results });
};
