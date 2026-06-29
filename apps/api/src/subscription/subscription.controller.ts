import { Controller, Get, Post, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';

@ApiTags('Subscription')
@Controller('subscription')
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  @Get('plans')
  getPlans() {
    return this.subscriptionService.getPlans();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getSubscription(@CurrentRestaurant() restaurantId: string) {
    return this.subscriptionService.getSubscription(restaurantId);
  }

  @Delete('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  cancelSubscription(@CurrentRestaurant() restaurantId: string) {
    return this.subscriptionService.cancelSubscription(restaurantId);
  }
}
