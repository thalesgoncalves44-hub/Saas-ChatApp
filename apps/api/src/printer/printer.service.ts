import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class PrinterService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  async getPrinters(restaurantId: string) {
    return this.prisma.printer.findMany({
      where: { restaurantId },
      include: { _count: { select: { printJobs: true } } },
    });
  }

  async createPrinter(restaurantId: string, data: any) {
    return this.prisma.printer.create({
      data: {
        restaurantId,
        name: data.name,
        type: data.type || 'usb',
        connectionString: data.connectionString,
        paperWidth: data.paperWidth || 80,
        printOnNewOrder: data.printOnNewOrder ?? true,
        printOnReady: data.printOnReady ?? false,
      },
    });
  }

  async updatePrinter(restaurantId: string, printerId: string, data: any) {
    await this.assertOwnership(restaurantId, printerId);
    return this.prisma.printer.update({
      where: { id: printerId },
      data: {
        name: data.name,
        type: data.type,
        connectionString: data.connectionString,
        paperWidth: data.paperWidth,
        printOnNewOrder: data.printOnNewOrder,
        printOnReady: data.printOnReady,
      },
    });
  }

  async deletePrinter(restaurantId: string, printerId: string) {
    await this.assertOwnership(restaurantId, printerId);
    await this.prisma.printer.delete({ where: { id: printerId } });
    return { message: 'Printer deleted' };
  }

  async createPrintJob(printerId: string, template: string, data: any) {
    const job = await this.prisma.printJob.create({
      data: {
        printerId,
        template,
        data,
        status: 'PENDING',
      },
    });

    // Emit to printer agent via WebSocket
    this.events.emitToPrinter(printerId, 'printer:job', { printJobId: job.id, template, data });

    return job;
  }

  async getPrintJobs(restaurantId: string, printerId: string) {
    await this.assertOwnership(restaurantId, printerId);
    return this.prisma.printJob.findMany({
      where: { printerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async updateJobStatus(jobId: string, status: string, error?: string) {
    return this.prisma.printJob.update({
      where: { id: jobId },
      data: {
        status: status as any,
        error,
        printedAt: status === 'DONE' ? new Date() : undefined,
      },
    });
  }

  async updatePrinterHeartbeat(printerId: string, version?: string) {
    return this.prisma.printer.update({
      where: { id: printerId },
      data: {
        isOnline: true,
        lastSeenAt: new Date(),
        agentVersion: version,
      },
    });
  }

  async printOrderOnNewOrder(restaurantId: string, orderId: string) {
    const printers = await this.prisma.printer.findMany({
      where: { restaurantId, printOnNewOrder: true, isOnline: true },
    });

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { options: true, addons: true } }, customer: true, table: true },
    });

    for (const printer of printers) {
      await this.createPrintJob(printer.id, 'order', { order });
    }
  }

  private async assertOwnership(restaurantId: string, printerId: string) {
    const printer = await this.prisma.printer.findFirst({ where: { id: printerId, restaurantId } });
    if (!printer) throw new NotFoundException('Printer not found');
    return printer;
  }
}
