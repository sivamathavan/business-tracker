"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.refresh = exports.logout = exports.login = exports.cleanMobile = void 0;
const bcrypt = __importStar(require("bcryptjs"));
const prisma_1 = require("../prisma");
const jwt_1 = require("../utils/jwt");
const activityLogger_1 = require("../utils/activityLogger");
// Helper to clean mobile numbers (keep only digits)
const cleanMobile = (num) => {
    return num.replace(/\D/g, '');
};
exports.cleanMobile = cleanMobile;
const login = async (req, res, next) => {
    try {
        const { userId, passcode, businessSlug, isAdmin } = req.body;
        // 1. Find User by ID
        const user = await prisma_1.prisma.user.findFirst({
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
        const accessToken = (0, jwt_1.generateAccessToken)(payload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(payload);
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
        await (0, activityLogger_1.logActivity)(user.userId, user.role === 'ADMIN' ? 'Admin Panel' : user.business?.name || 'Unknown', 'LOGIN', 'User logged in successfully');
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
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const logout = async (req, res, next) => {
    try {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        return res.status(200).json({
            success: true,
            message: 'Logged out successfully.',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
const refresh = async (req, res, next) => {
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
        const payload = (0, jwt_1.verifyRefreshToken)(token);
        // Find user
        const user = await prisma_1.prisma.user.findFirst({
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
        const accessToken = (0, jwt_1.generateAccessToken)(newPayload);
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
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired session. Please login again.',
        });
    }
};
exports.refresh = refresh;
const me = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized profile request.',
            });
        }
        const user = await prisma_1.prisma.user.findUnique({
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
    }
    catch (error) {
        next(error);
    }
};
exports.me = me;
