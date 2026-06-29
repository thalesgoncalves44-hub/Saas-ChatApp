import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import * as QRCode from 'qrcode';

@Injectable()
export class TableService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  async getTables(restaurantId: string) {
    return this.prisma.table.findMany({
      where: { restaurantId },
      include: {
        _count: { select: { orders: true } },
        orders: {
          where: { status: { notIn: ['DELIVERED', 'CANCELLED', 'REFUNDED'] } },
          include: { items: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getTable(restaurantId: string, tableId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, restaurantId },
      include: {
        orders: {
          where: { status: { notIn: ['DELIVERED', 'CANCELLED', 'REFUNDED'] } },
          include: { items: { include: { options: true, addons: true } }, customer: true },
        },
      },
    });
    if (!table) throw new NotFoundException('Table not found');
    return table;
  }

  async createTable(restaurantId: string, data: any) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    const qrData = `${process.env.FRONTEND_URL}/r/${restaurant.slug}/table/${data.name}`;
    const qrCodeUrl = await QRCode.toDataURL(qrData);

    return this.prisma.table.create({
      data: {
        restaurantId,
        name: data.name,
        capacity: data.capacity || 4,
        section: data.section,
        qrCodeData: qrData,
        qrCodeUrl,
        isActive: true,
      },
    });
  }

  async updateTable(restaurantId: string, tableId: string, data: any) {
    await this.assertOwnership(restaurantId, tableId);
    return this.prisma.table.update({
      where: { id: tableId },
      data: {
        name: data.name,
        capacity: data.capacity,
        section: data.section,
        isActive: data.isActive,
      },
    });
  }

  async deleteTable(restaurantId: string, tableId: string) {
    await this.assertOwnership(restaurantId, tableId);
    await this.prisma.table.delete({ where: { id: tableId } });
    return { message: 'Table deleted' };
  }

  async updateTableStatus(restaurantId: string, tableId: string, status: string) {
    await this.assertOwnership(restaurantId, tableId);
    const table = await this.prisma.table.update({
      where: { id: tableId },
      data: { status: status as any },
    });
    this.events.emitToRestaurant(restaurantId, 'table:updated', { tableId, status });
    return table;
  }

  async closeTable(restaurantId: string, tableId: string) {
    await this.assertOwnership(restaurantId, tableId);

    // Cancel pending orders on this table
    await this.prisma.order.updateMany({
      where: { tableId, status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] } },
      data: { status: 'DELIVERED' },
    });

    const table = await this.prisma.table.update({
      where: { id: tableId },
      data: { status: 'AVAILABLE' },
    });

    this.events.emitToRestaurant(restaurantId, 'table:updated', { tableId, status: 'AVAILABLE' });
    return table;
  }

  async generateQrCode(restaurantId: string, tableId: string) {
    const table = await this.assertOwnership(restaurantId, tableId);
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });

    const qrData = `${process.env.FRONTEND_URL}/r/${restaurant.slug}/table/${table.name}`;
    const qrCodeUrl = await QRCode.toDataURL(qrData);

    return this.prisma.table.update({
      where: { id: tableId },
      data: { qrCodeData: qrData, qrCodeUrl },
    });
  }

  private async assertOwnership(restaurantId: string, tableId: string) {
    const table = await this.prisma.table.findFirst({ where: { id: tableId, restaurantId } });
    if (!table) throw new NotFoundException('Table not found');
    return table;
  }
}
