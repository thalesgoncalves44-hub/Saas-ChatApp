import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanLimitService } from '../subscription/plan-limit.service';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Injectable()
export class RestaurantService {
  constructor(
    private prisma: PrismaService,
    private planLimit: PlanLimitService,
  ) {}

  async findById(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        subscription: { include: { plan: true } },
        operatingHours: { orderBy: { dayOfWeek: 'asc' } },
        deliveryAreas: { where: { isActive: true } },
        _count: {
          select: { products: true, orders: true, customers: true }
        }
      },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    return restaurant;
  }

  async findBySlug(slug: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug },
      include: {
        operatingHours: { orderBy: { dayOfWeek: 'asc' } },
        deliveryAreas: { where: { isActive: true } },
      },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    return restaurant;
  }

  async update(restaurantId: string, dto: UpdateRestaurantDto) {
    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: dto,
    });
  }

  async toggleOpen(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { isOpen: !restaurant.isOpen },
    });
  }

  async updateLogo(restaurantId: string, url: string) {
    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { logoUrl: url },
    });
  }

  async updateBanner(restaurantId: string, url: string) {
    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { bannerUrl: url },
    });
  }

  async updateOperatingHours(restaurantId: string, hours: any[]) {
    const updates = hours.map((hour) =>
      this.prisma.operatingHour.upsert({
        where: { restaurantId_dayOfWeek: { restaurantId, dayOfWeek: hour.dayOfWeek } },
        update: { isOpen: hour.isOpen, openTime: hour.openTime, closeTime: hour.closeTime },
        create: {
          restaurantId,
          dayOfWeek: hour.dayOfWeek,
          isOpen: hour.isOpen,
          openTime: hour.openTime,
          closeTime: hour.closeTime,
        },
      })
    );
    return Promise.all(updates);
  }

  async getUsers(restaurantId: string) {
    return this.prisma.restaurantUser.findMany({
      where: { restaurantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async inviteUser(restaurantId: string, data: any) {
    await this.planLimit.checkUserLimit(restaurantId);

    const bcrypt = require('bcrypt');
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    return this.prisma.restaurantUser.create({
      data: {
        restaurantId,
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
      },
    });
  }

  async removeUser(restaurantId: string, userId: string) {
    const user = await this.prisma.restaurantUser.findFirst({
      where: { id: userId, restaurantId },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'OWNER') throw new ForbiddenException('Cannot remove owner');

    await this.prisma.restaurantUser.delete({ where: { id: userId } });
    return { message: 'User removed' };
  }

  async importMenu(restaurantId: string, menuData: any) {
    const { categories } = menuData;

    for (const cat of categories) {
      const category = await this.prisma.category.create({
        data: {
          restaurantId,
          name: cat.name,
          description: cat.description,
          position: cat.position || 0,
        },
      });

      if (cat.products) {
        for (const prod of cat.products) {
          await this.prisma.product.create({
            data: {
              restaurantId,
              categoryId: category.id,
              name: prod.name,
              description: prod.description,
              price: prod.price,
              position: prod.position || 0,
            },
          });
        }
      }
    }

    return { message: 'Menu imported successfully' };
  }
}
