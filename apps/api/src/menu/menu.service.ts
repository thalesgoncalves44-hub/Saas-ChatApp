import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  // ======== CATEGORIES ========

  async getCategories(restaurantId: string) {
    return this.prisma.category.findMany({
      where: { restaurantId },
      include: {
        _count: { select: { products: true } }
      },
      orderBy: { position: 'asc' },
    });
  }

  async createCategory(restaurantId: string, data: any) {
    const lastCategory = await this.prisma.category.findFirst({
      where: { restaurantId },
      orderBy: { position: 'desc' },
    });

    return this.prisma.category.create({
      data: {
        restaurantId,
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        position: lastCategory ? lastCategory.position + 1 : 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  async updateCategory(restaurantId: string, categoryId: string, data: any) {
    await this.assertCategoryOwnership(restaurantId, categoryId);
    return this.prisma.category.update({
      where: { id: categoryId },
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        isActive: data.isActive,
      },
    });
  }

  async deleteCategory(restaurantId: string, categoryId: string) {
    await this.assertCategoryOwnership(restaurantId, categoryId);
    await this.prisma.category.delete({ where: { id: categoryId } });
    return { message: 'Category deleted' };
  }

  async reorderCategories(restaurantId: string, order: { id: string; position: number }[]) {
    const updates = order.map((item) =>
      this.prisma.category.updateMany({
        where: { id: item.id, restaurantId },
        data: { position: item.position },
      })
    );
    await Promise.all(updates);
    return this.getCategories(restaurantId);
  }

  // ======== PRODUCTS ========

  async getProducts(restaurantId: string, filters?: any) {
    const where: any = { restaurantId };
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    return this.prisma.product.findMany({
      where,
      include: {
        category: true,
        variations: { include: { options: { orderBy: { position: 'asc' } } }, orderBy: { position: 'asc' } },
        addons: { include: { options: { orderBy: { position: 'asc' } } }, orderBy: { position: 'asc' } },
      },
      orderBy: [{ category: { position: 'asc' } }, { position: 'asc' }],
    });
  }

  async getProduct(restaurantId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, restaurantId },
      include: {
        category: true,
        variations: { include: { options: { orderBy: { position: 'asc' } } }, orderBy: { position: 'asc' } },
        addons: { include: { options: { orderBy: { position: 'asc' } } }, orderBy: { position: 'asc' } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async createProduct(restaurantId: string, data: any) {
    const { variations, addons, ...productData } = data;

    const lastProduct = await this.prisma.product.findFirst({
      where: { restaurantId, categoryId: data.categoryId },
      orderBy: { position: 'desc' },
    });

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        restaurantId,
        position: lastProduct ? lastProduct.position + 1 : 0,
      },
    });

    if (variations?.length) {
      for (const variation of variations) {
        await this.prisma.productVariation.create({
          data: {
            productId: product.id,
            name: variation.name,
            required: variation.required ?? true,
            min: variation.min ?? 1,
            max: variation.max ?? 1,
            options: {
              create: variation.options?.map((opt: any, idx: number) => ({
                name: opt.name,
                price: opt.price ?? 0,
                isDefault: opt.isDefault ?? false,
                position: idx,
              })) ?? [],
            },
          },
        });
      }
    }

    if (addons?.length) {
      for (const addon of addons) {
        await this.prisma.productAddon.create({
          data: {
            productId: product.id,
            name: addon.name,
            required: addon.required ?? false,
            min: addon.min ?? 0,
            max: addon.max ?? 5,
            options: {
              create: addon.options?.map((opt: any, idx: number) => ({
                name: opt.name,
                price: opt.price ?? 0,
                position: idx,
              })) ?? [],
            },
          },
        });
      }
    }

    return this.getProduct(restaurantId, product.id);
  }

  async updateProduct(restaurantId: string, productId: string, data: any) {
    await this.assertProductOwnership(restaurantId, productId);
    const { variations, addons, ...productData } = data;

    return this.prisma.product.update({
      where: { id: productId },
      data: productData,
      include: {
        variations: { include: { options: true } },
        addons: { include: { options: true } },
      },
    });
  }

  async deleteProduct(restaurantId: string, productId: string) {
    await this.assertProductOwnership(restaurantId, productId);
    await this.prisma.product.delete({ where: { id: productId } });
    return { message: 'Product deleted' };
  }

  async toggleProductAvailability(restaurantId: string, productId: string) {
    await this.assertProductOwnership(restaurantId, productId);
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    return this.prisma.product.update({
      where: { id: productId },
      data: { isAvailable: !product.isAvailable },
    });
  }

  async getPublicMenu(slug: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { slug } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const categories = await this.prisma.category.findMany({
      where: { restaurantId: restaurant.id, isActive: true },
      include: {
        products: {
          where: { isActive: true, isAvailable: true },
          include: {
            variations: {
              include: { options: { where: { isAvailable: true }, orderBy: { position: 'asc' } } },
              orderBy: { position: 'asc' },
            },
            addons: {
              include: { options: { where: { isAvailable: true }, orderBy: { position: 'asc' } } },
              orderBy: { position: 'asc' },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { position: 'asc' },
    });

    return { restaurant, categories };
  }

  private async assertCategoryOwnership(restaurantId: string, categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, restaurantId },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  private async assertProductOwnership(restaurantId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, restaurantId },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
