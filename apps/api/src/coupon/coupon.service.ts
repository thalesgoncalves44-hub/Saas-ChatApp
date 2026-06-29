import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CouponService {
  constructor(private prisma: PrismaService) {}

  async getCoupons(restaurantId: string) {
    return this.prisma.coupon.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCoupon(restaurantId: string, data: any) {
    return this.prisma.coupon.create({
      data: {
        restaurantId,
        code: data.code.toUpperCase(),
        description: data.description,
        discountType: data.discountType || 'percentage',
        discountValue: data.discountValue,
        minimumOrder: data.minimumOrder || 0,
        maxUses: data.maxUses,
        maxUsesPerCustomer: data.maxUsesPerCustomer,
        validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        isActive: data.isActive ?? true,
      },
    });
  }

  async updateCoupon(restaurantId: string, couponId: string, data: any) {
    await this.assertOwnership(restaurantId, couponId);
    return this.prisma.coupon.update({
      where: { id: couponId },
      data: {
        description: data.description,
        discountValue: data.discountValue,
        minimumOrder: data.minimumOrder,
        maxUses: data.maxUses,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        isActive: data.isActive,
      },
    });
  }

  async deleteCoupon(restaurantId: string, couponId: string) {
    await this.assertOwnership(restaurantId, couponId);
    await this.prisma.coupon.delete({ where: { id: couponId } });
    return { message: 'Coupon deleted' };
  }

  async validateCoupon(restaurantId: string, code: string, orderTotal: number) {
    const coupon = await this.prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        restaurantId,
        isActive: true,
        OR: [{ validFrom: null }, { validFrom: { lte: new Date() } }],
        AND: [
          { OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }] },
        ],
      },
    });

    if (!coupon) throw new NotFoundException('Coupon not found or expired');

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Coupon has reached maximum uses');
    }

    if (orderTotal < Number(coupon.minimumOrder)) {
      throw new BadRequestException(`Minimum order of R$ ${coupon.minimumOrder} required`);
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (orderTotal * Number(coupon.discountValue)) / 100;
    } else {
      discount = Number(coupon.discountValue);
    }

    return { coupon, discount };
  }

  private async assertOwnership(restaurantId: string, couponId: string) {
    const coupon = await this.prisma.coupon.findFirst({ where: { id: couponId, restaurantId } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }
}
