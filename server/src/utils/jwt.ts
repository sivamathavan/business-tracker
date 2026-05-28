import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'rturox_super_secret_access_token_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'rturox_super_secret_refresh_token_key_2026';

export interface TokenPayload {
  id: string;
  userId: string;
  role: string;
  businessId: string | null;
  businessSlug?: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
};
