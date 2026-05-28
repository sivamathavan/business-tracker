"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = logActivity;
const prisma_1 = require("../prisma");
async function logActivity(userId, business, actionType, recordName) {
    try {
        await prisma_1.prisma.activityLog.create({
            data: {
                userId,
                business,
                actionType,
                recordName,
            },
        });
    }
    catch (error) {
        console.error('Failed to log activity:', error);
    }
}
