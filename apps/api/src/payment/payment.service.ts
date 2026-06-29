import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import axios from 'axios';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  async createPixPayment(restaurantId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, restaurantId },
      include: { customer: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Try Asaas API
    try {
      const response = await axios.post(
        `${process.env.ASAAS_BASE_URL}/payments`,
        {
          customer: order.customer?.email || 'cliente@email.com',
          billingType: 'PIX',
          value: Number(order.total),
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: `Pedido #${order.orderNumber} - ZappAI`,
        },
        {
          headers: {
            access_token: process.env.ASAAS_API_KEY,
            'Content-Type': 'application/json',
          },
        },
      );

      const payment = response.data;

      // Get Pix QR code
      const qrResponse = await axios.get(
        `${process.env.ASAAS_BASE_URL}/payments/${payment.id}/pixQrCode`,
        { headers: { access_token: process.env.ASAAS_API_KEY } },
      );

      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          pixQrCode: qrResponse.data.encodedImage,
          pixCopyPaste: qrResponse.data.payload,
          asaasPaymentId: payment.id,
        },
      });

      return { qrCode: qrResponse.data.encodedImage, copyPaste: qrResponse.data.payload };
    } catch (err) {
      // Generate mock Pix QR for demo
      const mockPixCode = `00020126580014br.gov.bcb.pix01363b4a7ad2-b0a5-4b05-9e10-dc6d3e956ea05204000053039865802BR5925ZappAI Restaurante6009SAO PAULO62070503***6304`;
      const QRCode = require('qrcode');
      const qrCodeImage = await QRCode.toDataURL(mockPixCode);

      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          pixQrCode: qrCodeImage,
          pixCopyPaste: mockPixCode,
        },
      });

      return { qrCode: qrCodeImage, copyPaste: mockPixCode };
    }
  }

  async handleAsaasWebhook(payload: any) {
    const { event, payment } = payload;

    if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
      const order = await this.prisma.order.findFirst({
        where: { asaasPaymentId: payment.id },
      });

      if (order) {
        await this.prisma.payment.create({
          data: {
            orderId: order.id,
            method: 'PIX',
            amount: payment.value,
            status: 'PAID',
            paidAt: new Date(),
            reference: payment.id,
          },
        });

        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: 'CONFIRMED', confirmedAt: new Date() },
        });

        this.events.emitToRestaurant(order.restaurantId, 'order:updated', {
          orderId: order.id,
          status: 'CONFIRMED',
        });

        await this.prisma.notification.create({
          data: {
            restaurantId: order.restaurantId,
            type: 'PAYMENT_CONFIRMED',
            title: `Pagamento confirmado #${order.orderNumber}`,
            message: `Pix recebido de R$ ${payment.value}`,
            data: { orderId: order.id },
          },
        });
      }
    }

    return { received: true };
  }

  async createStripeCheckout(restaurantId: string, priceId: string) {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/settings/subscription?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/settings/subscription?cancelled=true`,
      metadata: { restaurantId },
    });

    return { url: session.url };
  }

  async handleStripeWebhook(signature: string, body: Buffer) {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      throw new Error(`Webhook signature verification failed`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { restaurantId } = session.metadata;

      await this.prisma.subscription.update({
        where: { restaurantId },
        data: {
          status: 'ACTIVE',
          stripeSubscriptionId: session.subscription,
        },
      });
    }

    return { received: true };
  }
}
