import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if email already exists globally
    const existingUser = await this.prisma.restaurantUser.findFirst({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Generate unique slug
    let slug = dto.restaurantName.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const existing = await this.prisma.restaurant.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    // Get selected plan or fall back to starter
    const plan = await this.prisma.plan.findFirst({
      where: { isActive: true, slug: dto.planSlug ?? 'starter' },
    }) ?? await this.prisma.plan.findFirst({ where: { isActive: true }, orderBy: { price: 'asc' } });
    if (!plan) {
      throw new BadRequestException('No active plans available');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create restaurant + user + subscription in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.create({
        data: {
          name: dto.restaurantName,
          slug,
          phone: dto.phone,
          email: dto.email,
          isOpen: false,
        },
      });

      const user = await tx.restaurantUser.create({
        data: {
          restaurantId: restaurant.id,
          name: dto.name,
          email: dto.email,
          password: hashedPassword,
          role: 'OWNER',
          phone: dto.phone,
        },
      });

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + plan.trialDays);

      await tx.subscription.create({
        data: {
          restaurantId: restaurant.id,
          planId: plan.id,
          status: 'TRIAL',
          trialEndsAt,
        },
      });

      // Create default operating hours
      for (let i = 0; i <= 6; i++) {
        await tx.operatingHour.create({
          data: {
            restaurantId: restaurant.id,
            dayOfWeek: i,
            isOpen: i !== 0,
            openTime: '11:00',
            closeTime: '23:00',
          },
        });
      }

      return { restaurant, user };
    });

    const tokens = await this.generateTokens(result.user);
    await this.updateRefreshToken(result.user.id, tokens.refreshToken);

    return {
      ...tokens,
      restaurant: result.restaurant,
      user: this.sanitizeUser(result.user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.restaurantUser.findFirst({
      where: { email: dto.email },
      include: { restaurant: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.restaurantUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      restaurant: user.restaurant,
      user: this.sanitizeUser(user),
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.restaurantUser.findFirst({ where: { email } });
    if (user && await bcrypt.compare(password, user.password)) {
      return this.sanitizeUser(user);
    }
    return null;
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.prisma.restaurantUser.findUnique({
      where: { id: userId },
      include: { restaurant: true },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access denied');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return { ...tokens, restaurant: user.restaurant, user: this.sanitizeUser(user) };
  }

  async logout(userId: string) {
    await this.prisma.restaurantUser.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.restaurantUser.findFirst({ where: { email: dto.email } });
    if (!user) {
      // Return success to prevent email enumeration
      return { message: 'If the email exists, a reset link was sent' };
    }

    const token = randomBytes(32).toString('hex');
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);

    await this.prisma.restaurantUser.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpiry: expiry,
      },
    });

    // In production: send email with reset link
    console.log(`Password reset token for ${user.email}: ${token}`);

    return { message: 'If the email exists, a reset link was sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.restaurantUser.findFirst({
      where: {
        passwordResetToken: dto.token,
        passwordResetExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    await this.prisma.restaurantUser.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
        refreshToken: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  async verifyEmail(token: string) {
    // Simple implementation - in production use proper email verification
    return { message: 'Email verified successfully' };
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET || 'super-secret-jwt-key',
        expiresIn: process.env.JWT_EXPIRATION || '7d',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key',
        expiresIn: process.env.JWT_REFRESH_EXPIRATION || '30d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.restaurantUser.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }

  private sanitizeUser(user: any) {
    const { password, refreshToken, passwordResetToken, passwordResetExpiry, ...safe } = user;
    return safe;
  }
}
