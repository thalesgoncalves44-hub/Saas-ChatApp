import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { PlanLimitService } from '../subscription/plan-limit.service';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
    private planLimit: PlanLimitService,
  ) {}

  async getOrders(restaurantId: string, filters: any = {}) {
    const where: any = { restaurantId };
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.date) {
      const start = new Date(filters.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.date);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { gte: start, lte: end };
    }

    return this.prisma.order.findMany({
      where,
      include: {
        customer: true,
        table: true,
        coupon: true,
        items: {
          include: {
            options: true,
            addons: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrder(restaurantId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, restaurantId },
      include: {
        customer: true,
        table: true,
        coupon: true,
        items: { include: { options: true, addons: true } },
        payments: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async getTodaySummary(restaurantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [orders, revenue, pendingOrders] = await Promise.all([
      this.prisma.order.count({
        where: { restaurantId, createdAt: { gte: today, lt: tomorrow } },
      }),
      this.prisma.order.aggregate({
        where: {
          restaurantId,
          createdAt: { gte: today, lt: tomorrow },
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
        _sum: { total: true },
      }),
      this.prisma.order.count({
        where: { restaurantId, status: 'PENDING' },
      }),
    ]);

    const ordersByStatus = await this.prisma.order.groupBy({
      by: ['status'],
      where: { restaurantId, createdAt: { gte: today, lt: tomorrow } },
      _count: true,
    });

    return {
      totalOrders: orders,
      totalRevenue: revenue._sum.total || 0,
      pendingOrders,
      ordersByStatus,
    };
  }

  async createOrder(restaurantId: string, data: any) {
    await this.planLimit.checkOrderLimit(restaurantId);

    // Get next order number
    const lastOrder = await this.prisma.order.findFirst({
      where: { restaurantId },
      orderBy: { orderNumber: 'desc' },
    });
    const orderNumber = (lastOrder?.orderNumber ?? 0) + 1;

    // Calculate subtotal
    let subtotal = 0;
    const itemsWithPrices = [];

    for (const item of data.items) {
      const product = await this.prisma.product.findFirst({
        where: { id: item.productId, restaurantId, isActive: true },
      });
      if (!product) throw new BadRequestException(`Product ${item.productId} not found`);

      let itemPrice = Number(product.promotionalPrice || product.price);

      // Add variation prices
      if (item.options?.length) {
        for (const opt of item.options) {
          const varOpt = await this.prisma.productVariationOption.findUnique({ where: { id: opt.variationOptionId } });
          if (varOpt) itemPrice += Number(varOpt.price);
        }
      }

      // Add addon prices
      if (item.addons?.length) {
        for (const addon of item.addons) {
          const addonOpt = await this.prisma.productAddonOption.findUnique({ where: { id: addon.addonOptionId } });
          if (addonOpt) itemPrice += Number(addonOpt.price) * (addon.quantity || 1);
        }
      }

      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;

      itemsWithPrices.push({
        ...item,
        name: product.name,
        price: itemPrice,
        total: itemTotal,
      });
    }

    // Apply coupon
    let discount = 0;
    let couponId = null;
    if (data.couponCode) {
      const coupon = await this.prisma.coupon.findFirst({
        where: {
          code: data.couponCode,
          restaurantId,
          isActive: true,
          OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
        },
      });
      if (coupon && subtotal >= Number(coupon.minimumOrder)) {
        if (coupon.discountType === 'percentage') {
          discount = (subtotal * Number(coupon.discountValue)) / 100;
        } else {
          discount = Number(coupon.discountValue);
        }
        couponId = coupon.id;
        await this.prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    // Get delivery fee
    const deliveryFee = data.type === 'DELIVERY' ? (data.deliveryFee || 0) : 0;
    const total = subtotal - discount + deliveryFee;

    // Create or find customer
    let customerId = data.customerId;
    if (!customerId && data.customerPhone) {
      let customer = await this.prisma.customer.findFirst({
        where: { phone: data.customerPhone, restaurantId },
      });
      if (!customer) {
        customer = await this.prisma.customer.create({
          data: {
            restaurantId,
            name: data.customerName || 'Cliente',
            phone: data.customerPhone,
            email: data.customerEmail,
          },
        });
      }
      customerId = customer.id;
    }

    // Create order
    const order = await this.prisma.order.create({
      data: {
        restaurantId,
        customerId,
        tableId: data.tableId,
        couponId,
        orderNumber,
        status: 'PENDING',
        type: data.type || 'DELIVERY',
        channel: data.channel || 'WEBSITE',
        subtotal,
        discount,
        deliveryFee,
        total,
        notes: data.notes,
        deliveryAddress: data.deliveryAddress,
        items: {
          create: itemsWithPrices.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.total,
            notes: item.notes,
            options: item.options?.length ? {
              create: item.options.map((opt: any) => ({
                variationOptionId: opt.variationOptionId,
                name: opt.name || '',
                price: opt.price || 0,
              })),
            } : undefined,
            addons: item.addons?.length ? {
              create: item.addons.map((addon: any) => ({
                addonOptionId: addon.addonOptionId,
                name: addon.name || '',
                price: addon.price || 0,
                quantity: addon.quantity || 1,
              })),
            } : undefined,
          })),
        },
      },
      include: {
        customer: true,
        table: true,
        items: { include: { options: true, addons: true } },
        payments: true,
      },
    });

    // Update table status
    if (order.tableId) {
      await this.prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'OCCUPIED' },
      });
    }

    // Update customer metrics
    if (customerId) {
      await this.prisma.customer.update({
        where: { id: customerId },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: total },
          lastOrderAt: new Date(),
        },
      });
    }

    // Emit WebSocket event
    this.events.emitToRestaurant(restaurantId, 'order:new', { order });
    this.events.emitToKitchen(restaurantId, 'order:new', { order });

    // Create notification
    await this.prisma.notification.create({
      data: {
        restaurantId,
        type: 'ORDER_NEW',
        title: `Novo pedido #${orderNumber}`,
        message: `Pedido de ${order.customer?.name || 'cliente'} - R$ ${total.toFixed(2)}`,
        data: { orderId: order.id },
      },
    });

    return order;
  }

  async updateStatus(restaurantId: string, orderId: string, status: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, restaurantId },
    });
    if (!order) throw new NotFoundException('Order not found');

    const updateData: any = { status };
    const now = new Date();

    if (status === 'CONFIRMED') updateData.confirmedAt = now;
    if (status === 'PREPARING') updateData.preparingAt = now;
    if (status === 'READY') updateData.readyAt = now;
    if (status === 'DELIVERED') updateData.deliveredAt = now;
    if (status === 'CANCELLED') updateData.cancelledAt = now;

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        customer: true,
        table: true,
        items: { include: { options: true, addons: true } },
        payments: true,
      },
    });

    // Emit WebSocket event
    this.events.emitToRestaurant(restaurantId, 'order:updated', { orderId, status, order: updatedOrder });
    this.events.emitToKitchen(restaurantId, 'order:updated', { orderId, status, order: updatedOrder });

    // Update table on delivery/cancellation
    if (['DELIVERED', 'CANCELLED'].includes(status) && order.tableId) {
      const activeOrders = await this.prisma.order.count({
        where: { tableId: order.tableId, status: { notIn: ['DELIVERED', 'CANCELLED', 'REFUNDED'] } },
      });
      if (activeOrders === 0) {
        await this.prisma.table.update({
          where: { id: order.tableId },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    return updatedOrder;
  }

  async cancelOrder(restaurantId: string, orderId: string, reason?: string) {
    return this.updateStatus(restaurantId, orderId, 'CANCELLED');
  }

  async addPayment(restaurantId: string, orderId: string, paymentData: any) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, restaurantId } });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.payment.create({
      data: {
        orderId,
        method: paymentData.method,
        amount: paymentData.amount,
        status: 'PAID',
        paidAt: new Date(),
        reference: paymentData.reference,
      },
    });
  }
}
