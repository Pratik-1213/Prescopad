import { ENV } from '../config/env';
import { query, queryOne } from '../config/database';
import { hashOTP, compareOTP } from '../utils/hash';

export async function generateOTP(phone: string): Promise<string> {
  // In demo mode, always return the demo OTP
  if (ENV.otp.demoMode) {
    const otpHash = await hashOTP(ENV.otp.demoCode);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Update OTP in user record if exists
    await query(
      `UPDATE users SET otp_hash = $1, otp_expires_at = $2 WHERE phone = $3`,
      [otpHash, expiresAt.toISOString(), phone]
    );

    return ENV.otp.demoCode;
  }

  // Production: Generate random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await hashOTP(otp);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await query(
    `UPDATE users SET otp_hash = $1, otp_expires_at = $2 WHERE phone = $3`,
    [otpHash, expiresAt.toISOString(), phone]
  );

  // In production, integrate SMS provider here (MSG91, Twilio, etc.)
  console.log(`[OTP] Sending ${otp} to ${phone}`);

  return otp;
}

export async function verifyOTP(phone: string, otp: string): Promise<boolean> {
  const user = await queryOne<{
    otp_hash: string;
    otp_expires_at: string;
  }>(
    `SELECT otp_hash, otp_expires_at FROM users WHERE phone = $1`,
    [phone]
  );

  if (!user || !user.otp_hash) return false;

  // Check expiry
  const expiresAt = new Date(user.otp_expires_at);
  if (expiresAt < new Date()) return false;

  // Compare OTP
  const isValid = await compareOTP(otp, user.otp_hash);

  if (isValid) {
    // Clear OTP after successful verification
    await query(
      `UPDATE users SET otp_hash = NULL, otp_expires_at = NULL WHERE phone = $1`,
      [phone]
    );
  }

  return isValid;
}
