import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';

@ApiTags('Orders')
@Controller()
export class OrderController {
  constructor(private orderService: OrderService) {}

  // Public endpoint for customers to create orders
  @Post('public/orders')
  createPublicOrder(@Body() body: any) {
    return this.orderService.createOrder(body.restaurantId, body);
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getOrders(@CurrentRestaurant() restaurantId: string, @Query() filters: any) {
    return this.orderService.getOrders(restaurantId, filters);
  }

  @Get('orders/summary/today')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getTodaySummary(@CurrentRestaurant() restaurantId: string) {
    return this.orderService.getTodaySummary(restaurantId);
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getOrder(@CurrentRestaurant() restaurantId: string, @Param('id') id: string) {
    return this.orderService.getOrder(restaurantId, id);
  }

  @Post('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createOrder(@CurrentRestaurant() restaurantId: string, @Body() body: any) {
    return this.orderService.createOrder(restaurantId, body);
  }

  @Patch('orders/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateStatus(
    @CurrentRestaurant() restaurantId: string,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.orderService.updateStatus(restaurantId, id, body.status);
  }

  @Patch('orders/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  cancelOrder(
    @CurrentRestaurant() restaurantId: string,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.orderService.cancelOrder(restaurantId, id, body.reason);
  }

  @Post('orders/:id/payments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  addPayment(
    @CurrentRestaurant() restaurantId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.orderService.addPayment(restaurantId, id, body);
  }
}
