import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('dashboard')
  getDashboard(@CurrentRestaurant() restaurantId: string) {
    return this.reportsService.getDashboard(restaurantId);
  }

  @Get('revenue')
  getRevenue(@CurrentRestaurant() restaurantId: string, @Query('days') days: string) {
    return this.reportsService.getRevenueByDay(restaurantId, parseInt(days) || 30);
  }

  @Get('products')
  getTopProducts(@CurrentRestaurant() restaurantId: string, @Query('limit') limit: string) {
    return this.reportsService.getTopProducts(restaurantId, parseInt(limit) || 10);
  }

  @Get('financial')
  getFinancialReport(
    @CurrentRestaurant() restaurantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getFinancialReport(restaurantId, startDate, endDate);
  }

  @Get('customers')
  getCustomersReport(@CurrentRestaurant() restaurantId: string) {
    return this.reportsService.getCustomersReport(restaurantId);
  }
}
