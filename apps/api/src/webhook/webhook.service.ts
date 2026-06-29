import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class WebhookService {
  constructor(private prisma: PrismaService) {}

  async getWebhooks(restaurantId: string) {
    return this.prisma.webhook.findMany({ where: { restaurantId } });
  }

  async createWebhook(restaurantId: string, data: any) {
    return this.prisma.webhook.create({
      data: {
        restaurantId,
        url: data.url,
        events: data.events,
        secret: data.secret,
        isActive: true,
      },
    });
  }

  async updateWebhook(restaurantId: string, webhookId: string, data: any) {
    return this.prisma.webhook.updateMany({
      where: { id: webhookId, restaurantId },
      data: { url: data.url, events: data.events, secret: data.secret, isActive: data.isActive },
    });
  }

  async deleteWebhook(restaurantId: string, webhookId: string) {
    await this.prisma.webhook.deleteMany({ where: { id: webhookId, restaurantId } });
    return { message: 'Webhook deleted' };
  }

  async fireEvent(restaurantId: string, event: string, data: any) {
    const webhooks = await this.prisma.webhook.findMany({
      where: { restaurantId, isActive: true },
    });

    for (const webhook of webhooks) {
      const events = webhook.events as string[];
      if (events.includes(event) || events.includes('*')) {
        await this.deliverWebhook(webhook, event, data);
      }
    }
  }

  private async deliverWebhook(webhook: any, event: string, data: any) {
    const payload = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
    const headers: any = { 'Content-Type': 'application/json' };

    if (webhook.secret) {
      const sig = crypto.createHmac('sha256', webhook.secret).update(payload).digest('hex');
      headers['X-ZappAI-Signature'] = `sha256=${sig}`;
    }

    try {
      await axios.post(webhook.url, payload, { headers, timeout: 5000 });
      await this.prisma.webhook.update({
        where: { id: webhook.id },
        data: { lastCalledAt: new Date(), failureCount: 0 },
      });
    } catch {
      await this.prisma.webhook.update({
        where: { id: webhook.id },
        data: { failureCount: { increment: 1 } },
      });
    }
  }
}
