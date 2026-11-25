import type { CookieOptions, NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';

export const AUTH_COOKIE_NAME = 'healthcare_auth';

export type AuthenticatedIdentity = {
  id: number;
  role: string;
};

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedIdentity;
    }
  }
}

type AuthenticationJwtPayload = JwtPayload & {
  sub?: string;
  role?: string;
};

export function getJwtConfiguration() {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN;
  if (!secret || !expiresIn) {
    throw new Error('JWT configuration is incomplete.');
  }
  return { secret, expiresIn };
}

export function createAuthenticationToken(identity: AuthenticatedIdentity) {
  const { secret, expiresIn } = getJwtConfiguration();
  return jwt.sign(
    { role: identity.role },
    secret,
    { subject: String(identity.id), expiresIn: expiresIn as SignOptions['expiresIn'] }
  );
}

export function authenticationCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  };
}

export function authenticate(request: Request, response: Response, next: NextFunction) {
  const token = request.cookies?.[AUTH_COOKIE_NAME];
  if (typeof token !== 'string' || !token) {
    response.status(401).json({ success: false, message: 'Unauthorized.' });
    return;
  }

  try {
    const { secret } = getJwtConfiguration();
    const payload = jwt.verify(token, secret) as AuthenticationJwtPayload;
    const id = Number(payload.sub);
    if (!Number.isSafeInteger(id) || id <= 0 || typeof payload.role !== 'string' || !payload.role) {
      response.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }
    request.authUser = { id, role: payload.role };
    next();
  } catch (_error) {
    response.status(401).json({ success: false, message: 'Unauthorized.' });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.authUser) {
      response.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }
    if (!allowedRoles.includes(request.authUser.role)) {
      response.status(403).json({ success: false, message: 'Forbidden.' });
      return;
    }
    next();
  };
}
