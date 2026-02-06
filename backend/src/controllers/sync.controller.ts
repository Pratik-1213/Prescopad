import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { pushChanges, pullChanges, fullRestore, PushPayload } from '../services/sync.service';
import { AppError } from '../middleware/errorHandler';

export async function push(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const clinicId = req.clinicId;
    if (!clinicId) {
      throw new AppError('No clinic associated with this account. Please set up your clinic first.', 400);
    }

    const data: PushPayload = req.body;
    const result = await pushChanges(clinicId, data);

    res.json({
      success: true,
      pushed: result.pushed,
    });
  } catch (error) {
    next(error);
  }
}

export async function pull(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const clinicId = req.clinicId;
    if (!clinicId) {
      throw new AppError('No clinic associated with this account. Please set up your clinic first.', 400);
    }

    const { since, deviceId } = req.body;
    const result = await pullChanges(clinicId, since || '1970-01-01T00:00:00Z', deviceId || 'unknown');

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function restore(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const clinicId = req.clinicId;
    if (!clinicId) {
      throw new AppError('No clinic associated with this account. Please set up your clinic first.', 400);
    }

    const result = await fullRestore(clinicId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}
