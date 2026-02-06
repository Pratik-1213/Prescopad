import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database';
import { generateOTP, verifyOTP } from '../services/otp.service';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { createWalletForUser } from '../services/wallet.service';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

interface UserRow {
  id: string;
  phone: string;
  role: string;
  name: string;
  password_hash: string | null;
  clinic_id: string | null;
  is_active: boolean;
  specialty: string;
  reg_number: string;
}

export async function sendOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone, role } = req.body;

    // Check if user exists
    let user = await queryOne<UserRow>(
      `SELECT * FROM users WHERE phone = $1`,
      [phone]
    );

    if (user && user.role !== role) {
      throw new AppError(`This phone number is already registered as ${user.role}. Please use a different number.`, 409);
    }

    if (!user) {
      // Auto-register new user
      const rows = await query<UserRow>(
        `INSERT INTO users (phone, role, name) VALUES ($1, $2, $3) RETURNING *`,
        [phone, role, role === 'doctor' ? 'Doctor' : 'Assistant']
      );
      user = rows[0];

      // Create wallet and clinic for doctor
      if (role === 'doctor') {
        await createWalletForUser(user.id, 100); // Free starting balance

        // Auto-create clinic for new doctor
        const clinicRows = await query<{ id: string }>(
          `INSERT INTO clinics (name, owner_id) VALUES ($1, $2) RETURNING id`,
          ['My Clinic', user.id]
        );
        const clinicId = clinicRows[0].id;
        await query(`UPDATE users SET clinic_id = $1 WHERE id = $2`, [clinicId, user.id]);
        user.clinic_id = clinicId;
      }
    }

    const otp = await generateOTP(phone);

    res.json({
      success: true,
      message: `OTP sent to ${phone}`,
      // In demo mode, return OTP for testing
      ...(process.env.OTP_DEMO_MODE === 'true' ? { otp } : {}),
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyOTPHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone, otp, role } = req.body;

    const isValid = await verifyOTP(phone, otp);
    if (!isValid) {
      throw new AppError('Invalid or expired OTP', 401);
    }

    const user = await queryOne<UserRow>(
      `SELECT * FROM users WHERE phone = $1 AND role = $2`,
      [phone, role]
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Auto-create clinic for existing doctors who don't have one yet
    if (user.role === 'doctor' && !user.clinic_id) {
      const clinicRows = await query<{ id: string }>(
        `INSERT INTO clinics (name, owner_id) VALUES ($1, $2) RETURNING id`,
        ['My Clinic', user.id]
      );
      const clinicId = clinicRows[0].id;
      await query(`UPDATE users SET clinic_id = $1 WHERE id = $2`, [clinicId, user.id]);
      user.clinic_id = clinicId;
    }

    const tokenPayload = { userId: user.id, role: user.role, phone: user.phone, clinicId: user.clinic_id || undefined };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        clinicId: user.clinic_id || '',
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone, password, role } = req.body;

    const user = await queryOne<UserRow>(
      `SELECT * FROM users WHERE phone = $1 AND role = $2`,
      [phone, role]
    );

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (user.password_hash) {
      const isValid = await comparePassword(password, user.password_hash);
      if (!isValid) {
        throw new AppError('Invalid credentials', 401);
      }
    } else {
      // First login - set password
      const hash = await hashPassword(password);
      await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, user.id]);
    }

    const tokenPayload = { userId: user.id, role: user.role, phone: user.phone, clinicId: user.clinic_id || undefined };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        clinicId: user.clinic_id || '',
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await queryOne<UserRow>(
      `SELECT * FROM users WHERE id = $1`,
      [req.userId]
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        clinicId: user.clinic_id || '',
        specialty: user.specialty || '',
        regNumber: user.reg_number || '',
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, phone, specialty, regNumber } = req.body;
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (name) { fields.push(`name = $${paramIndex++}`); values.push(name); }
    if (phone) { fields.push(`phone = $${paramIndex++}`); values.push(phone); }
    if (specialty !== undefined) { fields.push(`specialty = $${paramIndex++}`); values.push(specialty); }
    if (regNumber !== undefined) { fields.push(`reg_number = $${paramIndex++}`); values.push(regNumber); }

    if (fields.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    values.push(req.userId);
    await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    res.json({ success: true, message: 'Profile updated' });
  } catch (error) {
    next(error);
  }
}

export async function heartbeat(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await query(
      `UPDATE users SET last_active_at = NOW() WHERE id = $1`,
      [req.userId]
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      throw new AppError('Refresh token required', 400);
    }

    const payload = verifyRefreshToken(token);
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      role: payload.role,
      phone: payload.phone,
      clinicId: payload.clinicId,
    });

    res.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}
