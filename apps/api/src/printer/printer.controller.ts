import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrinterService } from './printer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';

@ApiTags('Printers')
@Controller('printers')
export class PrinterController {
  constructor(private printerService: PrinterService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getPrinters(@CurrentRestaurant() restaurantId: string) {
    return this.printerService.getPrinters(restaurantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createPrinter(@CurrentRestaurant() restaurantId: string, @Body() body: any) {
    return this.printerService.createPrinter(restaurantId, body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updatePrinter(@CurrentRestaurant() restaurantId: string, @Param('id') id: string, @Body() body: any) {
    return this.printerService.updatePrinter(restaurantId, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deletePrinter(@CurrentRestaurant() restaurantId: string, @Param('id') id: string) {
    return this.printerService.deletePrinter(restaurantId, id);
  }

  @Get(':id/jobs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getPrintJobs(@CurrentRestaurant() restaurantId: string, @Param('id') id: string) {
    return this.printerService.getPrintJobs(restaurantId, id);
  }

  // Called by print agent
  @Post('agent/heartbeat')
  agentHeartbeat(@Body() body: { printerId: string; version?: string }) {
    return this.printerService.updatePrinterHeartbeat(body.printerId, body.version);
  }

  @Post('agent/job-status')
  updateJobStatus(@Body() body: { jobId: string; status: string; error?: string }) {
    return this.printerService.updateJobStatus(body.jobId, body.status, body.error);
  }
}
