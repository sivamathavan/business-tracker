import { Request, Response, NextFunction } from 'express';
import * as bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { logActivity } from '../utils/activityLogger';

// Helper to clean mobile numbers (keep only digits)
export const cleanMobile = (num: string): string => {
  return num.replace(/\D/g, '');
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, passcode, businessSlug, isAdmin } = req.body;

    // 1. Find User by ID
    const user = await prisma.user.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
      include: {
        business: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User ID not found.',
      });
    }

    // 2. Validate role configuration
    if (isAdmin && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Account does not have administrator privileges.',
      });
    }

    // 3. Verify Passcode PIN
    const isMatch = bcrypt.compareSync(passcode, user.passcodeHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Wrong passcode PIN.',
      });
    }

    // 4. Validate Business status for normal users
    if (user.role !== 'ADMIN') {
      if (!user.business) {
        return res.status(403).json({
          success: false,
          message: 'Account error. No business associated with this profile.',
        });
      }
      if (!user.business.isActive) {
        return res.status(403).json({
          success: false,
          message: `The business "${user.business.name}" is currently deactivated. Please contact support.`,
        });
      }
      // If client selected a different business than their assigned one
      if (businessSlug && user.business.slug !== businessSlug) {
        return res.status(403).json({
          success: false,
          message: `Your account does not have access to the selected business dashboard.`,
        });
      }
    }

    // 5. Generate Payload and JWTs
    const businessSlugStr = user.business?.slug || 'admin';
    const payload = {
      id: user.id,
      userId: user.userId,
      role: user.role,
      businessId: user.businessId,
      businessSlug: businessSlugStr,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // 6. Set httpOnly cookies
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false, // set to true in production
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 7. Log LOGIN activity
    await logActivity(
      user.userId,
      user.role === 'ADMIN' ? 'Admin Panel' : user.business?.name || 'Unknown',
      'LOGIN',
      'User logged in successfully'
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      accessToken,
      user: {
        id: user.id,
        userId: user.userId,
        role: user.role,
        businessId: user.businessId,
        businessName: user.business?.name || 'Master Admin',
        businessSlug: businessSlugStr,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = req.cookies?.refresh_token;

    if (!token && req.body.refreshToken) {
      token = req.body.refreshToken;
    }

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.',
      });
    }

    const payload = verifyRefreshToken(token);
    
    // Find user
    const user = await prisma.user.findFirst({
      where: { id: payload.id, deletedAt: null },
      include: { business: true }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh session.',
      });
    }

    const newPayload = {
      id: user.id,
      userId: user.userId,
      role: user.role,
      businessId: user.businessId,
      businessSlug: user.business?.slug || 'admin',
    };

    const accessToken = generateAccessToken(newPayload);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      accessToken,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please login again.',
    });
  }
};

export const me = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized profile request.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { business: true }
    });

    if (!user || user.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        userId: user.userId,
        role: user.role,
        businessId: user.businessId,
        businessName: user.business?.name || 'Master Admin',
        businessSlug: user.business?.slug || 'admin',
      }
    });
  } catch (error) {
    next(error);
  }
};
