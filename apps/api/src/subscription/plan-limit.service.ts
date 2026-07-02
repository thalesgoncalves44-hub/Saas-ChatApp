import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlanLimitService {
  constructor(private prisma: PrismaService) {}

  private async getPlanLimits(restaurantId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { restaurantId },
      include: { plan: true },
    });
    return sub?.plan ?? null;
  }

  async checkOrderLimit(restaurantId: string) {
    const plan = await this.getPlanLimits(restaurantId);
    if (!plan || plan.maxOrders === -1) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const count = await this.prisma.order.count({
      where: {
        restaurantId,
        createdAt: { gte: startOfMonth },
      },
    });

    if (count >= plan.maxOrders) {
      throw new ForbiddenException(
        `Limite de ${plan.maxOrders} pedidos/mês atingido no plano ${plan.name}. Faça upgrade para continuar recebendo pedidos.`,
      );
    }
  }

  async checkUserLimit(restaurantId: string) {
    const plan = await this.getPlanLimits(restaurantId);
    if (!plan || plan.maxUsers === -1) return;

    const count = await this.prisma.restaurantUser.count({
      where: { restaurantId, isActive: true },
    });

    if (count >= plan.maxUsers) {
      throw new ForbiddenException(
        `Limite de ${plan.maxUsers} usuário(s) atingido no plano ${plan.name}. Faça upgrade para adicionar mais usuários.`,
      );
    }
  }

  async checkProductLimit(restaurantId: string) {
    const plan = await this.getPlanLimits(restaurantId);
    if (!plan || plan.maxProducts === -1) return;

    const count = await this.prisma.product.count({
      where: { restaurantId },
    });

    if (count >= plan.maxProducts) {
      throw new ForbiddenException(
        `Limite de ${plan.maxProducts} produtos atingido no plano ${plan.name}. Faça upgrade para cadastrar mais produtos.`,
      );
    }
  }

  async getLimitsStatus(restaurantId: string) {
    const plan = await this.getPlanLimits(restaurantId);
    if (!plan) return null;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [ordersThisMonth, usersCount, productsCount] = await Promise.all([
      this.prisma.order.count({ where: { restaurantId, createdAt: { gte: startOfMonth } } }),
      this.prisma.restaurantUser.count({ where: { restaurantId, isActive: true } }),
      this.prisma.product.count({ where: { restaurantId } }),
    ]);

    return {
      plan: plan.name,
      orders: { used: ordersThisMonth, limit: plan.maxOrders, unlimited: plan.maxOrders === -1 },
      users: { used: usersCount, limit: plan.maxUsers, unlimited: plan.maxUsers === -1 },
      products: { used: productsCount, limit: plan.maxProducts, unlimited: plan.maxProducts === -1 },
    };
  }
}
