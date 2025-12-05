import prisma from '../prisma'
import * as argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import { AppError } from '../utils/AppError'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'

export class AuthService {
  async register(username: string, phoneNumber: string, password: string) {
    const passwordHash = await argon2.hash(password)
    
    try {
      const user = await prisma.user.create({
        data: {
          username,
          phoneNumber,
          passwordHash,
        },
      })
      return this.generateToken(user.id)
    } catch (error) {
      throw new AppError('User already exists', 409)
    }
  }

  async login(identifier: string, password: string) {
    // Identifier can be username or phone number
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { phoneNumber: identifier },
        ],
      },
    })

    if (!user) {
      throw new AppError('Invalid credentials', 401)
    }

    const validPassword = await argon2.verify(user.passwordHash, password)
    if (!validPassword) {
      throw new AppError('Invalid credentials', 401)
    }

    return this.generateToken(user.id)
  }

  async setDpiPin(userId: string, pin: string) {
    if (pin.length < 4 || pin.length > 6) {
      throw new AppError('PIN must be 4-6 digits', 400)
    }
    const dpiPinHash = await argon2.hash(pin)
    await prisma.user.update({
      where: { id: userId },
      data: { dpiPinHash },
    })
  }

  async verifyDpiPin(userId: string, pin: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.dpiPinHash) return false
    return argon2.verify(user.dpiPinHash, pin)
  }

  private generateToken(userId: string) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
  }
  
  verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: string }
    } catch (e) {
      return null
    }
  }
}

export const authService = new AuthService()
