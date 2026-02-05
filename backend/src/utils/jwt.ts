import jwt, { SignOptions } from 'jsonwebtoken';
import { ENV } from '../config/env';

interface TokenPayload {
  userId: string;
  role: string;
  phone: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: ENV.jwt.expiresIn as any };
  return jwt.sign(payload, ENV.jwt.secret, options);
}

export function generateRefreshToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: ENV.jwt.refreshExpiresIn as any };
  return jwt.sign(payload, ENV.jwt.refreshSecret, options);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ENV.jwt.secret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, ENV.jwt.refreshSecret) as TokenPayload;
}
