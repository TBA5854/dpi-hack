import prisma from '../prisma'

export class AuditService {
  async log(action: string, details?: object, userId?: string, ipAddress?: string) {
    try {
      await prisma.auditLog.create({
        data: {
          action,
          details: details ? JSON.stringify(details) : undefined,
          userId,
          ipAddress,
        },
      })
    } catch (error) {
      console.error('Failed to create audit log:', error)
    }
  }
}

export const auditService = new AuditService()
