import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';
import { CurrentUser } from '../auth/decorators/current-restaurant.decorator';

@ApiTags('Stock')
@Controller('stock')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StockController {
  constructor(private stockService: StockService) {}

  @Get()
  getStockLevels(@CurrentRestaurant() restaurantId: string) {
    return this.stockService.getStockLevels(restaurantId);
  }

  @Get('movements')
  getMovements(@CurrentRestaurant() restaurantId: string, @Query('productId') productId?: string) {
    return this.stockService.getMovements(restaurantId, productId);
  }

  @Post('movements')
  registerMovement(@CurrentRestaurant() restaurantId: string, @CurrentUser() user: any, @Body() body: any) {
    return this.stockService.registerMovement(restaurantId, { ...body, userId: user.id });
  }
}
