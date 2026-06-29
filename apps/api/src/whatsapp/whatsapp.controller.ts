import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private whatsappService: WhatsappService) {}

  @Post('webhook/:restaurantId')
  handleWebhook(@Param('restaurantId') restaurantId: string, @Body() body: any) {
    return this.whatsappService.handleWebhook(restaurantId, body);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getStatus(@CurrentRestaurant() restaurantId: string) {
    return this.whatsappService.getStatus(restaurantId);
  }

  @Post('instance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createInstance(@CurrentRestaurant() restaurantId: string) {
    return this.whatsappService.createInstance(restaurantId);
  }

  @Get('qrcode')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getQrCode(@CurrentRestaurant() restaurantId: string) {
    return this.whatsappService.getQrCode(restaurantId);
  }

  @Post('send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  sendMessage(@CurrentRestaurant() restaurantId: string, @Body() body: { phone: string; message: string }) {
    return this.whatsappService.sendMessage(restaurantId, body.phone, body.message);
  }
}
