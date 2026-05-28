import { prisma } from '../prisma';

export async function logActivity(
  userId: string,
  business: string,
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN',
  recordName: string
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        business,
        actionType,
        recordName,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
