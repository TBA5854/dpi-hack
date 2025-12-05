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
      where: { 
        toUserId: userId,
        status: 'PENDING'
      },
      include: { fromUser: { select: { username: true, phoneNumber: true } } },
    })
  }

  async getOutgoingRequests(userId: string) {
    return prisma.shareRequest.findMany({
      where: { 
        fromUserId: userId,
        status: 'PENDING'
      },
      include: { toUser: { select: { username: true, phoneNumber: true } } },
    })
  }

  // "My Shares": People I am sharing with
  async getActiveSentShares(userId: string) {
    const now = new Date()
    return prisma.shareRequest.findMany({
      where: {
        status: 'APPROVED',
        validUntil: { gt: now },
        OR: [
          { fromUserId: userId, type: 'SHARE_DPI' }, // I shared with them
          { toUserId: userId, type: 'REQUEST_DPI' }  // They asked, I approved
        ]
      },
      include: {
        toUser: { select: { username: true, phoneNumber: true } }, // For SHARE_DPI
        fromUser: { select: { username: true, phoneNumber: true } } // For REQUEST_DPI
      }
    })
  }

  // "Others Shared to Me": People sharing with me
  async getActiveReceivedShares(userId: string) {
    const now = new Date()
    return prisma.shareRequest.findMany({
      where: {
        status: 'APPROVED',
        validUntil: { gt: now },
        OR: [
          { toUserId: userId, type: 'SHARE_DPI' },   // They shared with me
          { fromUserId: userId, type: 'REQUEST_DPI' } // I asked, they approved
        ]
      },
      include: {
        toUser: { include: { location: true } },   // If I asked (REQUEST_DPI), target is toUser
        fromUser: { include: { location: true } }  // If they shared (SHARE_DPI), sharer is fromUser
      }
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

  async revokeShare(requestId: string, userId: string) {
    const request = await prisma.shareRequest.findUnique({ where: { id: requestId } })
    if (!request) throw new AppError('Request not found', 404)

    // Only the creator of the share (fromUser for SHARE_DPI) or the approver (toUser for REQUEST_DPI) can revoke?
    // Actually, "Stop Sharing" implies I am sharing my location and I want to stop.
    // Case 1: SHARE_DPI (I sent it). I am fromUser.
    // Case 2: REQUEST_DPI (They asked, I approved). I am toUser.
    
    // So if I am EITHER fromUser OR toUser, I should be able to revoke/cancel it?
    // If I am the receiver of a share (toUser in SHARE_DPI), I can "remove" it from my list, effectively revoking my own access?
    // Let's allow either party to revoke for now.
    
    if (request.fromUserId !== userId && request.toUserId !== userId) {
      throw new AppError('Not authorized to revoke this share', 403)
    }

    return prisma.shareRequest.update({
      where: { id: requestId },
      data: { status: 'REVOKED' } // Or delete? Let's use a status for history.
    })
  }
}

export const shareService = new ShareService()
