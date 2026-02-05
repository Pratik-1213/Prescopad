import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query, queryOne } from '../config/database';
import { AppError } from '../middleware/errorHandler';

interface ClinicRow {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string;
  owner_id: string;
}

export async function getClinic(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // Find clinic where user is owner or member
    const user = await queryOne<{ clinic_id: string | null }>(
      `SELECT clinic_id FROM users WHERE id = $1`,
      [req.userId]
    );

    let clinic: ClinicRow | null = null;

    if (user?.clinic_id) {
      clinic = await queryOne<ClinicRow>(
        `SELECT * FROM clinics WHERE id = $1`,
        [user.clinic_id]
      );
    } else if (req.userRole === 'doctor') {
      // Doctor might own a clinic
      clinic = await queryOne<ClinicRow>(
        `SELECT * FROM clinics WHERE owner_id = $1`,
        [req.userId]
      );
    }

    if (!clinic) {
      res.json({ success: true, clinic: null });
      return;
    }

    res.json({
      success: true,
      clinic: {
        id: clinic.id,
        name: clinic.name,
        address: clinic.address,
        phone: clinic.phone,
        email: clinic.email,
        logoUrl: clinic.logo_url,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createOrUpdateClinic(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.userRole !== 'doctor') {
      throw new AppError('Only doctors can manage clinics', 403);
    }

    const { name, address, phone, email, logoUrl } = req.body;

    if (!name) {
      throw new AppError('Clinic name is required', 400);
    }

    // Check if doctor already has a clinic
    let clinic = await queryOne<ClinicRow>(
      `SELECT * FROM clinics WHERE owner_id = $1`,
      [req.userId]
    );

    if (clinic) {
      // Update existing clinic
      await query(
        `UPDATE clinics SET name = $1, address = $2, phone = $3, email = $4, logo_url = COALESCE($5, logo_url)
         WHERE id = $6`,
        [name, address || '', phone || '', email || '', logoUrl, clinic.id]
      );
    } else {
      // Create new clinic
      const rows = await query<ClinicRow>(
        `INSERT INTO clinics (name, address, phone, email, logo_url, owner_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [name, address || '', phone || '', email || '', logoUrl || '', req.userId]
      );
      clinic = rows[0];

      // Link user to clinic
      await query(
        `UPDATE users SET clinic_id = $1 WHERE id = $2`,
        [clinic.id, req.userId]
      );
    }

    res.json({
      success: true,
      message: 'Clinic saved',
      clinic: {
        id: clinic.id,
        name: name,
        address: address || '',
        phone: phone || '',
        email: email || '',
        logoUrl: logoUrl || clinic.logo_url,
      },
    });
  } catch (error) {
    next(error);
  }
}
