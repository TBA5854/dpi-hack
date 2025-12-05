import prisma from '../prisma'
import { authService } from '../auth/auth.service'
import { AppError } from '../utils/AppError'

export class ShareService {
  async createRequest(fromUserId: string, targetIdentifier: string, type: 'REQUEST_DPI' | 'SHARE_DPI', validForHours: number) {
    // Find target user
    const toUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: targetIdentifier },
          { phoneNumber: targetIdentifier },
        ],
      },
    })

    if (!toUser) throw new AppError('User not found', 404)
    if (toUser.id === fromUserId) throw new AppError('Cannot share with yourself', 400)

    const validFrom = new Date()
    const validUntil = new Date(validFrom.getTime() + validForHours * 60 * 60 * 1000)

    return prisma.shareRequest.create({
      data: {
        fromUserId,
        toUserId: toUser.id,
        type,
        status: 'PENDING',
        validFrom,
        validUntil,
      },
    })
  }

  async respondToRequest(requestId: string, userId: string, action: 'APPROVE' | 'DENY', pin?: string) {
    const request = await prisma.shareRequest.findUnique({ where: { id: requestId } })
    if (!request) throw new AppError('Request not found', 404)

    // Only the target (toUserId) can approve/deny incoming requests
    // UNLESS it's a "SHARE_DPI" type where the sender is sharing THEIR location?
    // Let's clarify:
    // Type REQUEST_DPI: User A asks User B for location. User B (toUser) must approve.
    // Type SHARE_DPI: User A shares location with User B. User B (toUser) can accept/deny? Or auto-accept?
    // Let's assume strict approval for everything for now.
    
    if (request.toUserId !== userId) {
      throw new AppError('Not authorized to respond to this request', 403)
    }

    if (action === 'APPROVE') {
      return prisma.shareRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' },
      })
    } else {
      return prisma.shareRequest.update({
        where: { id: requestId },
        data: { status: 'DENIED' },
      })
    }
  }

  async getIncomingRequests(userId: string) {
    return prisma.shareRequest.findMany({
      where: { toUserId: userId },
      include: { fromUser: { select: { username: true, phoneNumber: true } } },
    })
  }

  async getOutgoingRequests(userId: string) {
    return prisma.shareRequest.findMany({
      where: { fromUserId: userId },
      include: { toUser: { select: { username: true, phoneNumber: true } } },
    })
  }

  async getShareDetails(requestId: string, viewerUserId: string) {
    const request = await prisma.shareRequest.findUnique({
      where: { id: requestId },
      include: { 
        toUser: { 
          include: { 
            location: true 
          } 
        } 
      }
    })

    if (!request) throw new AppError('Request not found', 404)

    // Check authorization
    if (request.fromUserId !== viewerUserId) {
      throw new AppError('Not authorized to view this share', 403)
    }

    // Check status
    if (request.status !== 'APPROVED') {
      throw new AppError('Share request is not approved', 403)
    }

    // Check time window
    const now = new Date()
    if (request.validFrom && now < request.validFrom) {
      throw new AppError('Share is not yet active', 403)
    }
    if (request.validUntil && now > request.validUntil) {
      throw new AppError('Share has expired', 410) // 410 Gone
    }

    // Return the location data
    const location = request.toUser.location
    if (!location) {
      throw new AppError('User has no location set', 404)
    }

    return {
      username: request.toUser.username,
      dpi: location.dpi,
      address: location.humanReadableAddress,
      latitude: location.latitude,
      longitude: location.longitude,
      updatedAt: location.updatedAt,
      validUntil: request.validUntil
    }
  }
}

export const shareService = new ShareService()
