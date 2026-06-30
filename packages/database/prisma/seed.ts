import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Plan
  const plan = await prisma.plan.upsert({
    where: { slug: 'pro' },
    update: {},
    create: {
      name: 'Pro',
      slug: 'pro',
      price: 297,
      currency: 'BRL',
      interval: 'month',
      trialDays: 7,
      maxProducts: -1,
      maxOrders: -1,
      maxUsers: 10,
      features: [
        'Cardápio digital',
        'Gestão de pedidos Kanban',
        'CRM de clientes',
        'Bot WhatsApp',
        'PDV integrado',
        'Impressora térmica',
        'Relatórios financeiros',
        'Controle de estoque',
        'Programa de fidelidade',
        'Campanhas de marketing',
      ],
      isActive: true,
    },
  });

  console.log('Plan created:', plan.name);

  // Create Restaurant
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: 'burguer-demo' },
    update: {},
    create: {
      name: 'Burguer Demo',
      slug: 'burguer-demo',
      description: 'O melhor hambúrguer artesanal da cidade',
      phone: '(11) 99999-9999',
      email: 'demo@burguer.com',
      address: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01001-000',
      country: 'BR',
      primaryColor: '#FF6B00',
      secondaryColor: '#1a1a2e',
      isOpen: true,
      acceptsDelivery: true,
      acceptsTakeaway: true,
      acceptsDineIn: true,
      minimumOrder: 25,
      deliveryFee: 5,
      estimatedTime: 35,
    },
  });

  console.log('Restaurant created:', restaurant.name);

  // Create RestaurantUser (owner)
  const hashedPassword = await bcrypt.hash('demo123456', 10);
  const user = await prisma.restaurantUser.upsert({
    where: { email_restaurantId: { email: 'demo@burguer.com', restaurantId: restaurant.id } },
    update: {},
    create: {
      restaurantId: restaurant.id,
      name: 'Demo Owner',
      email: 'demo@burguer.com',
      password: hashedPassword,
      role: 'OWNER',
      emailVerifiedAt: new Date(),
    },
  });

  console.log('User created:', user.email);

  // Create Subscription
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 7);

  await prisma.subscription.upsert({
    where: { restaurantId: restaurant.id },
    update: {},
    create: {
      restaurantId: restaurant.id,
      planId: plan.id,
      status: 'TRIAL',
      trialEndsAt,
    },
  });

  // Create Operating Hours
  for (let i = 0; i <= 6; i++) {
    await prisma.operatingHour.upsert({
      where: { restaurantId_dayOfWeek: { restaurantId: restaurant.id, dayOfWeek: i } },
      update: {},
      create: {
        restaurantId: restaurant.id,
        dayOfWeek: i,
        isOpen: i !== 0,
        openTime: '11:00',
        closeTime: '23:00',
      },
    });
  }

  // Create Loyalty Program
  await prisma.loyaltyProgram.upsert({
    where: { restaurantId: restaurant.id },
    update: {},
    create: {
      restaurantId: restaurant.id,
      name: 'Burguer Points',
      pointsPerReal: 1,
      redemptionRate: 100,
      minimumPoints: 500,
      isActive: true,
    },
  });

  // Clean up existing demo data — must delete in dependency order
  await prisma.coupon.deleteMany({ where: { restaurantId: restaurant.id } });
  await prisma.customer.deleteMany({ where: { restaurantId: restaurant.id } });
  await prisma.table.deleteMany({ where: { restaurantId: restaurant.id } });
  await prisma.deliveryArea.deleteMany({ where: { restaurantId: restaurant.id } });
  // Delete product children before products, products before categories
  const productIds = (await prisma.product.findMany({
    where: { restaurantId: restaurant.id },
    select: { id: true },
  })).map((p) => p.id);
  if (productIds.length > 0) {
    await prisma.productVariationOption.deleteMany({ where: { variation: { productId: { in: productIds } } } });
    await prisma.productAddonOption.deleteMany({ where: { addon: { productId: { in: productIds } } } });
    await prisma.productVariation.deleteMany({ where: { productId: { in: productIds } } });
    await prisma.productAddon.deleteMany({ where: { productId: { in: productIds } } });
    await prisma.product.deleteMany({ where: { id: { in: productIds } } });
  }
  await prisma.category.deleteMany({ where: { restaurantId: restaurant.id } });

  console.log('Cleaned up existing demo data.');

  // Create Delivery Area
  await prisma.deliveryArea.create({
    data: {
      restaurantId: restaurant.id,
      name: 'São Paulo - Centro',
      cities: ['São Paulo'],
      fee: 5,
      minimumOrder: 25,
      estimatedTime: 35,
      isActive: true,
    },
  });

  // Create Categories
  const burguersCategory = await prisma.category.create({
    data: {
      restaurantId: restaurant.id,
      name: 'Hambúrgueres',
      description: 'Nossas especialidades artesanais',
      position: 0,
      isActive: true,
    },
  });

  const drinksCategory = await prisma.category.create({
    data: {
      restaurantId: restaurant.id,
      name: 'Bebidas',
      description: 'Refrigerantes, sucos e mais',
      position: 1,
      isActive: true,
    },
  });

  const sidesCategory = await prisma.category.create({
    data: {
      restaurantId: restaurant.id,
      name: 'Acompanhamentos',
      description: 'Batatas, onion rings e mais',
      position: 2,
      isActive: true,
    },
  });

  // Create Products
  const classicBurger = await prisma.product.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: burguersCategory.id,
      name: 'Classic Burguer',
      description: 'Pão brioche, 150g de carne, queijo, alface e tomate',
      price: 28.90,
      cost: 12.00,
      isFeatured: true,
      isActive: true,
      isAvailable: true,
      position: 0,
      preparationTime: 15,
    },
  });

  await prisma.product.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: burguersCategory.id,
      name: 'Smash Burguer',
      description: 'Dois discos de carne smashada, queijo americano duplo, picles e molho especial',
      price: 36.90,
      promotionalPrice: 32.90,
      cost: 15.00,
      isFeatured: true,
      isActive: true,
      isAvailable: true,
      position: 1,
      preparationTime: 12,
    },
  });

  await prisma.product.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: sidesCategory.id,
      name: 'Batata Frita',
      description: 'Porção de batatas fritas crocantes',
      price: 12.90,
      cost: 3.00,
      isActive: true,
      isAvailable: true,
      position: 0,
      preparationTime: 10,
    },
  });

  await prisma.product.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: drinksCategory.id,
      name: 'Refrigerante Lata',
      description: 'Coca-Cola, Guaraná ou Sprite - 350ml',
      price: 6.90,
      cost: 2.50,
      isActive: true,
      isAvailable: true,
      position: 0,
    },
  });

  // Create Variations for Classic Burger
  await prisma.productVariation.create({
    data: {
      productId: classicBurger.id,
      name: 'Ponto da Carne',
      required: true,
      min: 1,
      max: 1,
      position: 0,
      options: {
        create: [
          { name: 'Mal passado', price: 0, isDefault: false },
          { name: 'Ao ponto', price: 0, isDefault: true },
          { name: 'Bem passado', price: 0, isDefault: false },
        ],
      },
    },
  });

  // Create Addons for Classic Burger
  await prisma.productAddon.create({
    data: {
      productId: classicBurger.id,
      name: 'Extras',
      required: false,
      min: 0,
      max: 5,
      position: 0,
      options: {
        create: [
          { name: 'Bacon extra', price: 4.00 },
          { name: 'Queijo extra', price: 3.00 },
          { name: 'Ovo frito', price: 3.00 },
          { name: 'Cebola caramelizada', price: 4.00 },
        ],
      },
    },
  });

  // Create Tables
  for (let i = 1; i <= 10; i++) {
    await prisma.table.create({
      data: {
        restaurantId: restaurant.id,
        name: `Mesa ${i}`,
        capacity: i <= 5 ? 4 : 6,
        status: 'AVAILABLE',
        section: i <= 5 ? 'Salão Principal' : 'Área Externa',
        isActive: true,
      },
    });
  }

  // Create Sample Customer
  await prisma.customer.create({
    data: {
      restaurantId: restaurant.id,
      name: 'João Silva',
      phone: '(11) 98888-8888',
      email: 'joao@email.com',
      totalOrders: 5,
      totalSpent: 189.50,
      averageTicket: 37.90,
      loyaltyPoints: 189,
      segment: 'loyal',
      lastOrderAt: new Date(),
    },
  });

  // Create a sample Coupon
  await prisma.coupon.create({
    data: {
      restaurantId: restaurant.id,
      code: 'BEMVINDO10',
      description: '10% de desconto no primeiro pedido',
      discountType: 'percentage',
      discountValue: 10,
      minimumOrder: 30,
      maxUses: 100,
      isActive: true,
    },
  });

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
