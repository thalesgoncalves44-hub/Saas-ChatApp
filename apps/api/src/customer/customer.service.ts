import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async getCustomers(restaurantId: string, filters: any = {}) {
    const where: any = { restaurantId };
    if (filters.segment) where.segment = filters.segment;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { lastOrderAt: 'desc' },
        skip: filters.skip || 0,
        take: filters.limit || 50,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { customers, total };
  }

  async getCustomer(restaurantId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, restaurantId },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { items: true },
        },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async createCustomer(restaurantId: string, data: any) {
    return this.prisma.customer.create({
      data: {
        restaurantId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        address: data.address,
        city: data.city,
        state: data.state,
        notes: data.notes,
      },
    });
  }

  async updateCustomer(restaurantId: string, customerId: string, data: any) {
    await this.assertOwnership(restaurantId, customerId);
    return this.prisma.customer.update({
      where: { id: customerId },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        notes: data.notes,
        isBlocked: data.isBlocked,
      },
    });
  }

  async deleteCustomer(restaurantId: string, customerId: string) {
    await this.assertOwnership(restaurantId, customerId);
    await this.prisma.customer.delete({ where: { id: customerId } });
    return { message: 'Customer deleted' };
  }

  async addLoyaltyPoints(restaurantId: string, customerId: string, points: number, reason: string) {
    await this.assertOwnership(restaurantId, customerId);
    return this.prisma.customer.update({
      where: { id: customerId },
      data: { loyaltyPoints: { increment: points } },
    });
  }

  async redeemLoyaltyPoints(restaurantId: string, customerId: string, points: number) {
    const customer = await this.assertOwnership(restaurantId, customerId);
    if (customer.loyaltyPoints < points) {
      throw new Error('Insufficient loyalty points');
    }
    return this.prisma.customer.update({
      where: { id: customerId },
      data: { loyaltyPoints: { decrement: points } },
    });
  }

  async getSegmentStats(restaurantId: string) {
    const segments = await this.prisma.customer.groupBy({
      by: ['segment'],
      where: { restaurantId },
      _count: true,
      _sum: { totalSpent: true },
    });

    return segments;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async autoSegmentCustomers() {
    // Get all restaurants
    const restaurants = await this.prisma.restaurant.findMany({ select: { id: true } });

    for (const restaurant of restaurants) {
      await this.segmentRestaurantCustomers(restaurant.id);
    }
  }

  async segmentRestaurantCustomers(restaurantId: string) {
    const customers = await this.prisma.customer.findMany({ where: { restaurantId } });
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(now.getDate() - 90);

    for (const customer of customers) {
      let segment = 'new';

      if (customer.totalOrders >= 10 && customer.lastOrderAt > thirtyDaysAgo) {
        segment = 'loyal';
      } else if (customer.totalOrders >= 3 && customer.lastOrderAt > thirtyDaysAgo) {
        segment = 'regular';
      } else if (customer.totalOrders >= 1 && customer.lastOrderAt > ninetyDaysAgo) {
        segment = 'occasional';
      } else if (customer.totalOrders >= 1 && customer.lastOrderAt <= ninetyDaysAgo) {
        segment = 'at_risk';
      } else if (customer.totalOrders >= 1) {
        segment = 'lost';
      }

      if (segment !== customer.segment) {
        await this.prisma.customer.update({
          where: { id: customer.id },
          data: { segment },
        });
      }
    }
  }

  private async assertOwnership(restaurantId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, restaurantId },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }
}
