import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CouponService } from './coupon.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponController {
  constructor(private couponService: CouponService) {}

  // Public coupon validation
  @Get('validate')
  validateCoupon(
    @Query('restaurantId') restaurantId: string,
    @Query('code') code: string,
    @Query('total') total: string,
  ) {
    return this.couponService.validateCoupon(restaurantId, code, parseFloat(total));
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getCoupons(@CurrentRestaurant() restaurantId: string) {
    return this.couponService.getCoupons(restaurantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createCoupon(@CurrentRestaurant() restaurantId: string, @Body() body: any) {
    return this.couponService.createCoupon(restaurantId, body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateCoupon(@CurrentRestaurant() restaurantId: string, @Param('id') id: string, @Body() body: any) {
    return this.couponService.updateCoupon(restaurantId, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deleteCoupon(@CurrentRestaurant() restaurantId: string, @Param('id') id: string) {
    return this.couponService.deleteCoupon(restaurantId, id);
  }
}
