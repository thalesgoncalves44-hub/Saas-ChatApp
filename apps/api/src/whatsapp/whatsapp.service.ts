import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private logger = new Logger('WhatsappService');

  constructor(private prisma: PrismaService) {}

  async getStatus(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant?.evolutionInstance) return { connected: false, instance: null };

    try {
      const response = await axios.get(
        `${process.env.EVOLUTION_API_URL}/instance/connectionState/${restaurant.evolutionInstance}`,
        { headers: { apikey: process.env.EVOLUTION_API_KEY } },
      );
      return { connected: response.data?.instance?.state === 'open', instance: restaurant.evolutionInstance };
    } catch {
      return { connected: false, instance: restaurant.evolutionInstance };
    }
  }

  async createInstance(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    const instanceName = `zappai-${restaurant.slug}`;

    try {
      await axios.post(
        `${process.env.EVOLUTION_API_URL}/instance/create`,
        {
          instanceName,
          qrcode: true,
          webhook: `${process.env.APP_URL}/api/whatsapp/webhook/${restaurantId}`,
          webhookByEvents: true,
          events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
        },
        { headers: { apikey: process.env.EVOLUTION_API_KEY } },
      );

      await this.prisma.restaurant.update({
        where: { id: restaurantId },
        data: { evolutionInstance: instanceName },
      });

      return { instanceName };
    } catch (err) {
      this.logger.error('Failed to create WhatsApp instance', err.message);
      return { error: err.message };
    }
  }

  async getQrCode(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant?.evolutionInstance) return { qrcode: null };

    try {
      const response = await axios.get(
        `${process.env.EVOLUTION_API_URL}/instance/qrcode/${restaurant.evolutionInstance}`,
        { headers: { apikey: process.env.EVOLUTION_API_KEY } },
      );
      return { qrcode: response.data?.qrcode };
    } catch {
      return { qrcode: null };
    }
  }

  async sendMessage(restaurantId: string, phone: string, message: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant?.evolutionInstance) return { sent: false };

    try {
      await axios.post(
        `${process.env.EVOLUTION_API_URL}/message/sendText/${restaurant.evolutionInstance}`,
        { number: phone, textMessage: { text: message } },
        { headers: { apikey: process.env.EVOLUTION_API_KEY } },
      );
      return { sent: true };
    } catch (err) {
      this.logger.error(`Failed to send WhatsApp message to ${phone}`, err.message);
      return { sent: false, error: err.message };
    }
  }

  async handleWebhook(restaurantId: string, payload: any) {
    const { event, data } = payload;

    if (event === 'messages.upsert' && data?.message?.conversation) {
      const from = data.key.remoteJid.replace('@s.whatsapp.net', '');
      const text = data.message.conversation.toLowerCase().trim();

      await this.processChatbot(restaurantId, from, text);
    }

    return { received: true };
  }

  private async processChatbot(restaurantId: string, phone: string, text: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });

    let response = '';

    if (text.includes('cardápio') || text.includes('menu') || text.includes('1')) {
      response = `🍽️ *Cardápio ${restaurant.name}*\n\nAcesse nosso cardápio digital:\n${process.env.FRONTEND_URL}/r/${restaurant.slug}\n\nOu responda:\n2️⃣ Fazer pedido\n3️⃣ Status do pedido\n4️⃣ Falar com atendente`;
    } else if (text.includes('pedido') || text.includes('2')) {
      response = `📦 Para fazer seu pedido, acesse:\n${process.env.FRONTEND_URL}/r/${restaurant.slug}\n\nOu nos chame que te atendemos! 😊`;
    } else if (text.includes('status') || text.includes('3')) {
      // Check last order for this customer
      const customer = await this.prisma.customer.findFirst({
        where: { phone, restaurantId },
        include: {
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (customer?.orders[0]) {
        const order = customer.orders[0];
        const statusMap: Record<string, string> = {
          PENDING: '⏳ Aguardando confirmação',
          CONFIRMED: '✅ Confirmado',
          PREPARING: '👨‍🍳 Em preparo',
          READY: '🔔 Pronto para retirada',
          DELIVERING: '🛵 Saiu para entrega',
          DELIVERED: '✅ Entregue',
          CANCELLED: '❌ Cancelado',
        };
        response = `📋 *Pedido #${order.orderNumber}*\nStatus: ${statusMap[order.status] || order.status}\nTotal: R$ ${Number(order.total).toFixed(2)}`;
      } else {
        response = 'Não encontramos pedidos para o seu número. Faça seu primeiro pedido! 🛒';
      }
    } else {
      response = `Olá! Bem-vindo ao *${restaurant.name}* 🍽️\n\nComo posso ajudar?\n1️⃣ Ver cardápio\n2️⃣ Fazer pedido\n3️⃣ Verificar status do pedido\n4️⃣ Falar com atendente`;
    }

    if (response) {
      await this.sendMessage(restaurantId, phone, response);
    }
  }

  async sendPixConfirmation(restaurantId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId },
      include: {
        customer: true,
        items: true,
        restaurant: true,
      },
    });
    if (!order?.customer?.phone) return;

    const firstName = order.customer.name?.split(' ')[0] || 'Cliente';
    const restaurantName = order.restaurant?.name || 'restaurante';

    const itemLines = order.items
      .map((i: any) => `  • ${i.quantity}x ${i.name} — R$ ${(Number(i.unitPrice) * i.quantity).toFixed(2).replace('.', ',')}`)
      .join('\n');

    const total = `R$ ${Number(order.total).toFixed(2).replace('.', ',')}`;
    const eta = order.estimatedTime || 30;

    const typeMap: Record<string, string> = {
      DELIVERY: `🛵 Entrega em até *${eta} minutos*`,
      TAKEOUT: `🏪 Retirada em loja em até *${eta} minutos*`,
      DINE_IN: `🍽️ Será servido na mesa em breve`,
    };
    const typeMsg = typeMap[order.type as string] || `⏱️ Estimativa: *${eta} min*`;

    const trackUrl = `${process.env.CARDAPIO_URL || process.env.FRONTEND_URL}/r/${order.restaurant?.slug}/order/${order.id}`;

    const message =
      `✅ *Pagamento confirmado!*\n\n` +
      `Olá, *${firstName}*! Seu pedido foi confirmado no *${restaurantName}* 🎉\n\n` +
      `📋 *Pedido #${order.orderNumber}*\n` +
      `${itemLines}\n\n` +
      `💰 *Total: ${total}*\n` +
      `${typeMsg}\n\n` +
      `Acompanhe seu pedido:\n${trackUrl}\n\n` +
      `Obrigado pela preferência! 😊`;

    await this.sendMessage(restaurantId, order.customer.phone, message);
  }

  async sendOrderNotification(restaurantId: string, orderId: string, event: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId },
      include: { customer: true },
    });
    if (!order?.customer?.phone) return;

    const messages: Record<string, string> = {
      CONFIRMED: `✅ *Pedido #${order.orderNumber} confirmado!*\nEstimativa: ${order.estimatedTime || 30} minutos\n\nAcompanhe em: ${process.env.FRONTEND_URL}/r/*/order/${order.id}`,
      PREPARING: `👨‍🍳 *Pedido #${order.orderNumber} em preparo!*\nSeu pedido está sendo preparado com carinho 💚`,
      READY: `🔔 *Pedido #${order.orderNumber} pronto!*\nSeu pedido está pronto para retirada!`,
      DELIVERING: `🛵 *Pedido #${order.orderNumber} saiu para entrega!*\nSeu pedido está a caminho! Fique de olho 😊`,
      DELIVERED: `✅ *Pedido #${order.orderNumber} entregue!*\nObrigado por pedir no ${(await this.prisma.restaurant.findUnique({ where: { id: restaurantId } }))?.name}! Avalie nosso atendimento 🌟`,
    };

    if (messages[event]) {
      await this.sendMessage(restaurantId, order.customer.phone, messages[event]);
    }
  }
}
