"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireBusiness = exports.requireAuth = void 0;
const jwt_1 = require("../utils/jwt");
const requireAuth = (req, res, next) => {
    try {
        let token = '';
        // Check authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        // Check cookies
        else if (req.cookies && req.cookies.access_token) {
            token = req.cookies.access_token;
        }
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. No token provided.',
            });
        }
        const payload = (0, jwt_1.verifyAccessToken)(token);
        req.user = payload;
        next();
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired authentication token.',
        });
    }
};
exports.requireAuth = requireAuth;
// Enforces business-level data isolation
const requireBusiness = (allowedSlugs) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
        }
        // Admins have access to everything
        if (req.user.role === 'ADMIN') {
            return next();
        }
        // Regular users are constrained to their own business slug
        if (req.user.businessSlug && allowedSlugs.includes(req.user.businessSlug)) {
            return next();
        }
        return res.status(403).json({
            success: false,
            message: 'Access denied. You do not have permissions to view this business.',
        });
    };
};
exports.requireBusiness = requireBusiness;
// Enforces admin-only routes
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Administrator privileges required.',
        });
    }
    next();
};
exports.requireAdmin = requireAdmin;
