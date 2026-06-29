import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class CampaignService {
  constructor(private prisma: PrismaService) {}

  async getCampaigns(restaurantId: string) {
    return this.prisma.campaign.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCampaign(restaurantId: string, data: any) {
    return this.prisma.campaign.create({
      data: {
        restaurantId,
        name: data.name,
        subject: data.subject,
        message: data.message,
        channel: data.channel || 'WHATSAPP',
        status: 'DRAFT',
        targetSegment: data.targetSegment,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      },
    });
  }

  async updateCampaign(restaurantId: string, campaignId: string, data: any) {
    await this.assertOwnership(restaurantId, campaignId);
    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        name: data.name,
        subject: data.subject,
        message: data.message,
        channel: data.channel,
        targetSegment: data.targetSegment,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      },
    });
  }

  async deleteCampaign(restaurantId: string, campaignId: string) {
    await this.assertOwnership(restaurantId, campaignId);
    await this.prisma.campaign.delete({ where: { id: campaignId } });
    return { message: 'Campaign deleted' };
  }

  async sendCampaign(restaurantId: string, campaignId: string) {
    const campaign = await this.assertOwnership(restaurantId, campaignId);

    // Get target customers
    const where: any = { restaurantId };
    if (campaign.targetSegment) where.segment = campaign.targetSegment;

    const customers = await this.prisma.customer.findMany({ where, select: { phone: true, email: true, name: true } });

    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'SENDING', recipientCount: customers.length },
    });

    let sentCount = 0;

    for (const customer of customers) {
      try {
        if (['WHATSAPP', 'BOTH'].includes(campaign.channel) && customer.phone) {
          await this.sendWhatsApp(restaurantId, customer.phone, campaign.message, customer.name);
          sentCount++;
        }

        if (['EMAIL', 'BOTH'].includes(campaign.channel) && customer.email) {
          await this.sendEmail(customer.email, campaign.subject || campaign.name, campaign.message);
          sentCount++;
        }
      } catch (err) {
        console.error(`Failed to send to ${customer.phone || customer.email}:`, err.message);
      }
    }

    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'SENT', sentCount, sentAt: new Date() },
    });
  }

  private async sendWhatsApp(restaurantId: string, phone: string, message: string, name: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant?.evolutionInstance) return;

    const personalizedMessage = message.replace('{{name}}', name);

    await axios.post(
      `${process.env.EVOLUTION_API_URL}/message/sendText/${restaurant.evolutionInstance}`,
      { number: phone, textMessage: { text: personalizedMessage } },
      { headers: { apikey: process.env.EVOLUTION_API_KEY } },
    );
  }

  private async sendEmail(to: string, subject: string, body: string) {
    if (!process.env.RESEND_API_KEY) return;

    await axios.post(
      'https://api.resend.com/emails',
      { from: process.env.EMAIL_FROM, to, subject, html: body },
      { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } },
    );
  }

  private async assertOwnership(restaurantId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({ where: { id: campaignId, restaurantId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }
}
