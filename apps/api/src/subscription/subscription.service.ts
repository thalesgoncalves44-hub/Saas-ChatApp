import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  async getPlans() {
    return this.prisma.plan.findMany({ where: { isActive: true }, orderBy: { price: 'asc' } });
  }

  async getSubscription(restaurantId: string) {
    return this.prisma.subscription.findUnique({
      where: { restaurantId },
      include: { plan: true },
    });
  }

  async checkSubscriptionAccess(restaurantId: string): Promise<boolean> {
    const sub = await this.prisma.subscription.findUnique({ where: { restaurantId } });
    if (!sub) return false;

    if (sub.status === 'ACTIVE') return true;
    if (sub.status === 'TRIAL' && sub.trialEndsAt > new Date()) return true;
    return false;
  }

  async cancelSubscription(restaurantId: string) {
    return this.prisma.subscription.update({
      where: { restaurantId },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }

  async activateSubscription(restaurantId: string, data: any) {
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    return this.prisma.subscription.update({
      where: { restaurantId },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        stripeSubscriptionId: data.stripeSubscriptionId,
        asaasSubscriptionId: data.asaasSubscriptionId,
      },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkTrialExpiry() {
    const now = new Date();

    // D-5
    const d5 = new Date(now);
    d5.setDate(now.getDate() + 5);

    // D-1
    const d1 = new Date(now);
    d1.setDate(now.getDate() + 1);

    // Subscriptions expiring in 5 days
    const expiring5 = await this.prisma.subscription.findMany({
      where: {
        status: 'TRIAL',
        trialEndsAt: {
          gte: new Date(d5.setHours(0, 0, 0, 0)),
          lte: new Date(d5.setHours(23, 59, 59, 999)),
        },
      },
      include: { restaurant: true },
    });

    for (const sub of expiring5) {
      await this.prisma.notification.create({
        data: {
          restaurantId: sub.restaurantId,
          type: 'SUBSCRIPTION_EXPIRING',
          title: 'Trial expirando em 5 dias',
          message: 'Seu período de teste expira em 5 dias. Assine agora para continuar usando o ZappAI.',
        },
      });
    }

    // Subscriptions expired
    const expired = await this.prisma.subscription.findMany({
      where: { status: 'TRIAL', trialEndsAt: { lt: now } },
    });

    for (const sub of expired) {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' },
      });
    }
  }
}
