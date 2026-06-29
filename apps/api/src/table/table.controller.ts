import { Controller, Get, Post, Put, Delete, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TableService } from './table.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';

@ApiTags('Tables')
@Controller('tables')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TableController {
  constructor(private tableService: TableService) {}

  @Get()
  getTables(@CurrentRestaurant() restaurantId: string) {
    return this.tableService.getTables(restaurantId);
  }

  @Get(':id')
  getTable(@CurrentRestaurant() restaurantId: string, @Param('id') id: string) {
    return this.tableService.getTable(restaurantId, id);
  }

  @Post()
  createTable(@CurrentRestaurant() restaurantId: string, @Body() body: any) {
    return this.tableService.createTable(restaurantId, body);
  }

  @Put(':id')
  updateTable(@CurrentRestaurant() restaurantId: string, @Param('id') id: string, @Body() body: any) {
    return this.tableService.updateTable(restaurantId, id, body);
  }

  @Delete(':id')
  deleteTable(@CurrentRestaurant() restaurantId: string, @Param('id') id: string) {
    return this.tableService.deleteTable(restaurantId, id);
  }

  @Patch(':id/status')
  updateStatus(@CurrentRestaurant() restaurantId: string, @Param('id') id: string, @Body() body: { status: string }) {
    return this.tableService.updateTableStatus(restaurantId, id, body.status);
  }

  @Post(':id/close')
  closeTable(@CurrentRestaurant() restaurantId: string, @Param('id') id: string) {
    return this.tableService.closeTable(restaurantId, id);
  }

  @Post(':id/qrcode')
  generateQrCode(@CurrentRestaurant() restaurantId: string, @Param('id') id: string) {
    return this.tableService.generateQrCode(restaurantId, id);
  }
}
