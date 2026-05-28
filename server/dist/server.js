"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const tech_routes_1 = __importDefault(require("./routes/tech.routes"));
const re_routes_1 = __importDefault(require("./routes/re.routes"));
const training_routes_1 = __importDefault(require("./routes/training.routes"));
const coaching_routes_1 = __importDefault(require("./routes/coaching.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
// Global Middlewares
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false // Allow loading of external/local images if needed
}));
app.use((0, cors_1.default)({
    origin: true, // Reflects the request origin, great for local dev
    credentials: true, // Crucial for reading/writing httpOnly cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Logger middleware for debugging
app.use((req, _res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Request] ${req.method} ${req.url}`);
    }
    next();
});
// Root check route
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', service: 'Rturox Command Center API' });
});
// Mounting Sub-routes
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/tech', tech_routes_1.default);
app.use('/api/v1/re', re_routes_1.default);
app.use('/api/v1/training', training_routes_1.default);
app.use('/api/v1/coaching', coaching_routes_1.default);
app.use('/api/v1/admin', admin_routes_1.default);
// Fallback Route
app.use('*', (_req, res) => {
    res.status(404).json({ success: false, message: 'Resource API path not found.' });
});
// Global Error Handler Middleware
app.use(errorHandler_1.errorHandler);
// Start Server
app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`⚡ Rturox Command Center API Server running...`);
    console.log(`👉 Base URL: http://localhost:${PORT}/api/v1`);
    console.log(`👉 CORS Origin: ${CLIENT_URL}`);
    console.log(`===============================================`);
});
exports.default = app;
