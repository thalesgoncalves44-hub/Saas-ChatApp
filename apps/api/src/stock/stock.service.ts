import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class StockService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  async getStockLevels(restaurantId: string) {
    return this.prisma.product.findMany({
      where: { restaurantId, trackStock: true },
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        stockMinimum: true,
        category: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getMovements(restaurantId: string, productId?: string) {
    const where: any = { restaurantId };
    if (productId) where.productId = productId;

    return this.prisma.stockMovement.findMany({
      where,
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async registerMovement(restaurantId: string, data: any) {
    const product = await this.prisma.product.findFirst({
      where: { id: data.productId, restaurantId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const previousQty = product.stockQuantity;
    let newQty = previousQty;

    if (data.type === 'IN' || data.type === 'ADJUSTMENT') {
      newQty = data.type === 'ADJUSTMENT' ? data.quantity : previousQty + data.quantity;
    } else if (data.type === 'OUT' || data.type === 'LOSS') {
      newQty = previousQty - data.quantity;
    }

    await this.prisma.product.update({
      where: { id: data.productId },
      data: { stockQuantity: newQty },
    });

    const movement = await this.prisma.stockMovement.create({
      data: {
        restaurantId,
        productId: data.productId,
        type: data.type,
        quantity: data.quantity,
        previousQty,
        newQty,
        reason: data.reason,
        orderId: data.orderId,
        createdById: data.userId,
      },
    });

    // Check for low stock
    if (newQty <= product.stockMinimum && product.trackStock) {
      await this.prisma.notification.create({
        data: {
          restaurantId,
          type: 'LOW_STOCK',
          title: `Estoque baixo: ${product.name}`,
          message: `O produto ${product.name} tem apenas ${newQty} unidades em estoque (mínimo: ${product.stockMinimum})`,
          data: { productId: product.id },
        },
      });
      this.events.emitToRestaurant(restaurantId, 'stock:low', { product, currentQty: newQty });
    }

    return movement;
  }

  async autoDeductStock(restaurantId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return;

    for (const item of order.items) {
      const product = await this.prisma.product.findFirst({ where: { id: item.productId } });
      if (product?.trackStock) {
        await this.registerMovement(restaurantId, {
          productId: item.productId,
          type: 'OUT',
          quantity: item.quantity,
          reason: `Pedido #${order.orderNumber}`,
          orderId,
        });
      }
    }
  }

  async getLowStockAlerts(restaurantId: string) {
    return this.prisma.product.findMany({
      where: {
        restaurantId,
        trackStock: true,
        stockQuantity: { lte: this.prisma.product.fields.stockMinimum as any },
      },
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        stockMinimum: true,
      },
    });
  }
}
