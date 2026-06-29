import { Controller, Post, Body, Param, UseGuards, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';
import { Request } from 'express';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('pix/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createPixPayment(@CurrentRestaurant() restaurantId: string, @Param('orderId') orderId: string) {
    return this.paymentService.createPixPayment(restaurantId, orderId);
  }

  @Post('stripe/checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createStripeCheckout(@CurrentRestaurant() restaurantId: string, @Body() body: { priceId: string }) {
    return this.paymentService.createStripeCheckout(restaurantId, body.priceId);
  }

  @Post('webhooks/asaas')
  handleAsaasWebhook(@Body() body: any) {
    return this.paymentService.handleAsaasWebhook(body);
  }

  @Post('webhooks/stripe')
  handleStripeWebhook(@Headers('stripe-signature') sig: string, @Req() req: RawBodyRequest<Request>) {
    return this.paymentService.handleStripeWebhook(sig, req.rawBody);
  }
}
