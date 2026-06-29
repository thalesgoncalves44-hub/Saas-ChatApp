import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';

@ApiTags('Webhooks')
@Controller('webhooks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WebhookController {
  constructor(private webhookService: WebhookService) {}

  @Get()
  getWebhooks(@CurrentRestaurant() restaurantId: string) {
    return this.webhookService.getWebhooks(restaurantId);
  }

  @Post()
  createWebhook(@CurrentRestaurant() restaurantId: string, @Body() body: any) {
    return this.webhookService.createWebhook(restaurantId, body);
  }

  @Put(':id')
  updateWebhook(@CurrentRestaurant() restaurantId: string, @Param('id') id: string, @Body() body: any) {
    return this.webhookService.updateWebhook(restaurantId, id, body);
  }

  @Delete(':id')
  deleteWebhook(@CurrentRestaurant() restaurantId: string, @Param('id') id: string) {
    return this.webhookService.deleteWebhook(restaurantId, id);
  }
}
