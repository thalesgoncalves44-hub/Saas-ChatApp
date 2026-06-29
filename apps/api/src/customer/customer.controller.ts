import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Get()
  getCustomers(@CurrentRestaurant() restaurantId: string, @Query() filters: any) {
    return this.customerService.getCustomers(restaurantId, filters);
  }

  @Get('segments')
  getSegmentStats(@CurrentRestaurant() restaurantId: string) {
    return this.customerService.getSegmentStats(restaurantId);
  }

  @Get(':id')
  getCustomer(@CurrentRestaurant() restaurantId: string, @Param('id') id: string) {
    return this.customerService.getCustomer(restaurantId, id);
  }

  @Post()
  createCustomer(@CurrentRestaurant() restaurantId: string, @Body() body: any) {
    return this.customerService.createCustomer(restaurantId, body);
  }

  @Put(':id')
  updateCustomer(@CurrentRestaurant() restaurantId: string, @Param('id') id: string, @Body() body: any) {
    return this.customerService.updateCustomer(restaurantId, id, body);
  }

  @Delete(':id')
  deleteCustomer(@CurrentRestaurant() restaurantId: string, @Param('id') id: string) {
    return this.customerService.deleteCustomer(restaurantId, id);
  }

  @Post(':id/loyalty-points')
  addLoyaltyPoints(
    @CurrentRestaurant() restaurantId: string,
    @Param('id') id: string,
    @Body() body: { points: number; reason: string },
  ) {
    return this.customerService.addLoyaltyPoints(restaurantId, id, body.points, body.reason);
  }

  @Post(':id/redeem-points')
  redeemLoyaltyPoints(
    @CurrentRestaurant() restaurantId: string,
    @Param('id') id: string,
    @Body() body: { points: number },
  ) {
    return this.customerService.redeemLoyaltyPoints(restaurantId, id, body.points);
  }
}
