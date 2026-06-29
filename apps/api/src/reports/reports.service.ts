import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(restaurantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const [
      todayOrders,
      todayRevenue,
      monthRevenue,
      totalCustomers,
      pendingOrders,
      revenueByDay,
      topProducts,
      recentOrders,
    ] = await Promise.all([
      this.prisma.order.count({
        where: { restaurantId, createdAt: { gte: today, lt: tomorrow }, status: { not: 'CANCELLED' } },
      }),
      this.prisma.order.aggregate({
        where: { restaurantId, createdAt: { gte: today, lt: tomorrow }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: { restaurantId, createdAt: { gte: last30Days }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
        _sum: { total: true },
      }),
      this.prisma.customer.count({ where: { restaurantId } }),
      this.prisma.order.count({ where: { restaurantId, status: 'PENDING' } }),
      this.getRevenueByDay(restaurantId, 30),
      this.getTopProducts(restaurantId, 5),
      this.prisma.order.findMany({
        where: { restaurantId },
        include: { customer: true, items: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      today: {
        orders: todayOrders,
        revenue: todayRevenue._sum.total || 0,
        pendingOrders,
      },
      month: {
        revenue: monthRevenue._sum.total || 0,
      },
      totalCustomers,
      revenueByDay,
      topProducts,
      recentOrders,
    };
  }

  async getRevenueByDay(restaurantId: string, days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: startDate },
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
      },
      select: { createdAt: true, total: true },
    });

    // Group by day
    const byDay: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const key = date.toISOString().split('T')[0];
      byDay[key] = 0;
    }

    for (const order of orders) {
      const key = order.createdAt.toISOString().split('T')[0];
      if (byDay[key] !== undefined) {
        byDay[key] += Number(order.total);
      }
    }

    return Object.entries(byDay).map(([date, revenue]) => ({ date, revenue }));
  }

  async getTopProducts(restaurantId: string, limit: number = 10) {
    const items = await this.prisma.orderItem.groupBy({
      by: ['productId', 'name'],
      where: { order: { restaurantId, status: { notIn: ['CANCELLED', 'REFUNDED'] } } },
      _count: { productId: true },
      _sum: { total: true },
      orderBy: { _count: { productId: 'desc' } },
      take: limit,
    });

    return items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: item._count.productId,
      revenue: item._sum.total || 0,
    }));
  }

  async getFinancialReport(restaurantId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const [orders, paymentsByMethod, totalRevenue] = await Promise.all([
      this.prisma.order.count({
        where: { restaurantId, createdAt: { gte: start, lte: end }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
      }),
      this.prisma.payment.groupBy({
        by: ['method'],
        where: { order: { restaurantId, createdAt: { gte: start, lte: end } }, status: 'PAID' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.order.aggregate({
        where: { restaurantId, createdAt: { gte: start, lte: end }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
        _sum: { total: true, discount: true, deliveryFee: true },
      }),
    ]);

    return {
      totalOrders: orders,
      totalRevenue: totalRevenue._sum.total || 0,
      totalDiscount: totalRevenue._sum.discount || 0,
      totalDeliveryFee: totalRevenue._sum.deliveryFee || 0,
      paymentsByMethod: paymentsByMethod.map((p) => ({
        method: p.method,
        total: p._sum.amount || 0,
        count: p._count,
      })),
    };
  }

  async getCustomersReport(restaurantId: string) {
    const [totalCustomers, segmentCounts, topCustomers, newThisMonth] = await Promise.all([
      this.prisma.customer.count({ where: { restaurantId } }),
      this.prisma.customer.groupBy({
        by: ['segment'],
        where: { restaurantId },
        _count: true,
        _sum: { totalSpent: true },
      }),
      this.prisma.customer.findMany({
        where: { restaurantId },
        orderBy: { totalSpent: 'desc' },
        take: 10,
      }),
      this.prisma.customer.count({
        where: {
          restaurantId,
          createdAt: { gte: new Date(new Date().setDate(1)) },
        },
      }),
    ]);

    return {
      totalCustomers,
      newThisMonth,
      segments: segmentCounts,
      topCustomers,
    };
  }
}
