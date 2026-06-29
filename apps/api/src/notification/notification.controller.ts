import { Controller, Get, Patch, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  getNotifications(@CurrentRestaurant() restaurantId: string, @Query('unread') unread: string) {
    return this.notificationService.getNotifications(restaurantId, unread === 'true');
  }

  @Get('unread-count')
  getUnreadCount(@CurrentRestaurant() restaurantId: string) {
    return this.notificationService.getUnreadCount(restaurantId);
  }

  @Patch(':id/read')
  markAsRead(@CurrentRestaurant() restaurantId: string, @Param('id') id: string) {
    return this.notificationService.markAsRead(restaurantId, id);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentRestaurant() restaurantId: string) {
    return this.notificationService.markAllAsRead(restaurantId);
  }

  @Delete(':id')
  deleteNotification(@CurrentRestaurant() restaurantId: string, @Param('id') id: string) {
    return this.notificationService.deleteNotification(restaurantId, id);
  }
}
