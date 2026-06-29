import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  async getNotifications(restaurantId: string, onlyUnread = false) {
    return this.prisma.notification.findMany({
      where: {
        restaurantId,
        ...(onlyUnread ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(restaurantId: string, notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(restaurantId: string) {
    await this.prisma.notification.updateMany({
      where: { restaurantId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { message: 'All notifications marked as read' };
  }

  async deleteNotification(restaurantId: string, notificationId: string) {
    await this.prisma.notification.deleteMany({
      where: { id: notificationId, restaurantId },
    });
    return { message: 'Notification deleted' };
  }

  async createAndEmit(restaurantId: string, data: any) {
    const notification = await this.prisma.notification.create({
      data: {
        restaurantId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
      },
    });
    this.events.emitToRestaurant(restaurantId, 'notification:new', { notification });
    return notification;
  }

  async getUnreadCount(restaurantId: string) {
    return this.prisma.notification.count({ where: { restaurantId, isRead: false } });
  }
}
