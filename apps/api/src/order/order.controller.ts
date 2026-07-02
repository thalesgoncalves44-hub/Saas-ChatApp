import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Orders')
@Controller()
export class OrderController {
  constructor(
    private orderService: OrderService,
    private prisma: PrismaService,
  ) {}

  // Public endpoint for customers to create orders
  @Post('public/orders')
  createPublicOrder(@Body() body: any) {
    return this.orderService.createOrder(body.restaurantId, body);
  }

  // Public endpoint: lookup customer by phone for checkout auto-fill
  @Get('public/customer/lookup')
  async lookupCustomer(@Query('phone') phone: string, @Query('restaurantId') restaurantId: string) {
    if (!phone || !restaurantId) return null;
    const customer = await this.prisma.customer.findFirst({
      where: { phone: phone.replace(/\D/g, '').replace(/^(\d{2})(\d)/,'($1) $2'), restaurantId },
      select: { id: true, name: true, phone: true, email: true, address: true, city: true, zipCode: true, birthDate: true },
    });
    if (!customer) {
      // try raw digits match
      const all = await this.prisma.customer.findMany({
        where: { restaurantId },
        select: { id: true, name: true, phone: true, email: true, address: true, city: true, zipCode: true, birthDate: true },
      });
      return all.find(c => c.phone?.replace(/\D/g,'') === phone.replace(/\D/g,'')) || null;
    }
    return customer;
  }

  // Public endpoint: track order by id (no auth needed for customer)
  @Get('public/orders/:id')
  getPublicOrder(@Param('id') id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: { items: true, restaurant: { select: { name: true, primaryColor: true, logoUrl: true } } },
    });
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
