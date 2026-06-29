import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function center(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width);
  const pad = Math.floor((width - text.length) / 2);
  return ' '.repeat(pad) + text;
}

function left(text: string, width: number): string {
  return text.slice(0, width).padEnd(width);
}

function right(text: string, width: number): string {
  return text.slice(0, width).padStart(width);
}

function line(char: string = '-', width: number = 48): string {
  return char.repeat(width);
}

function row(leftText: string, rightText: string, width: number): string {
  const rightLen = rightText.length;
  const leftMax = width - rightLen - 1;
  return left(leftText, leftMax) + ' ' + rightText;
}

export interface PrintJob {
  type: 'ORDER' | 'KITCHEN' | 'RECEIPT' | 'TEST';
  data: any;
}

export class ReceiptRenderer {
  constructor(private readonly width: number = 48) {}

  renderTest(): string[] {
    const lines: string[] = [];
    lines.push(center('=== TESTE DE IMPRESSAO ===', this.width));
    lines.push(center('ZappAI Print Agent', this.width));
    lines.push(line('-', this.width));
    lines.push(center(dayjs().format('DD/MM/YYYY HH:mm:ss'), this.width));
    lines.push(line('-', this.width));
    lines.push(center('Impressora funcionando!', this.width));
    lines.push('');
    lines.push('');
    lines.push('');
    return lines;
  }

  renderOrder(data: any): string[] {
    const lines: string[] = [];
    const order = data;

    lines.push('');
    lines.push(center('NOVO PEDIDO', this.width));
    lines.push(line('=', this.width));

    const orderNum = order.orderNumber || order.id?.slice(-6).toUpperCase() || '------';
    lines.push(center(`#${orderNum}`, this.width));
    lines.push(center(dayjs(order.createdAt).format('DD/MM/YYYY HH:mm'), this.width));
    lines.push(line('-', this.width));

    // Type
    const typeLabels: Record<string, string> = {
      DELIVERY: 'ENTREGA',
      TAKEOUT: 'RETIRADA',
      DINE_IN: 'MESA',
    };
    lines.push(center(`[ ${typeLabels[order.type] || order.type} ]`, this.width));

    if (order.tableNumber) {
      lines.push(center(`Mesa: ${order.tableNumber}`, this.width));
    }

    lines.push(line('-', this.width));

    // Customer
    if (order.customer) {
      lines.push(`Cliente: ${order.customer.name || 'Nao informado'}`);
      if (order.customer.phone) lines.push(`Fone: ${order.customer.phone}`);
    }

    if (order.deliveryAddress) {
      lines.push(`Endereco:`);
      // Word wrap address
      const words = order.deliveryAddress.split(' ');
      let currentLine = '';
      for (const word of words) {
        if ((currentLine + ' ' + word).length > this.width) {
          lines.push(`  ${currentLine.trim()}`);
          currentLine = word;
        } else {
          currentLine += (currentLine ? ' ' : '') + word;
        }
      }
      if (currentLine) lines.push(`  ${currentLine.trim()}`);
    }

    lines.push(line('-', this.width));

    // Items
    lines.push('ITENS:');
    for (const item of order.items || []) {
      const productName = item.product?.name || item.productName || 'Produto';
      const qty = item.quantity || 1;
      const price = Number(item.unitPrice || 0) * qty;
      lines.push(row(`${qty}x ${productName}`, formatCurrency(price), this.width));
      if (item.notes) {
        lines.push(`   OBS: ${item.notes}`);
      }
    }

    lines.push(line('-', this.width));

    // Totals
    if (Number(order.deliveryFee) > 0) {
      lines.push(row('Taxa entrega:', formatCurrency(Number(order.deliveryFee)), this.width));
    }
    if (Number(order.discount) > 0) {
      lines.push(row('Desconto:', `-${formatCurrency(Number(order.discount))}`, this.width));
    }
    lines.push(row('TOTAL:', formatCurrency(Number(order.total)), this.width));

    // Payment
    const payLabels: Record<string, string> = {
      PIX: 'PIX', CASH: 'Dinheiro', CREDIT_CARD: 'Cartao Cred.', DEBIT_CARD: 'Cartao Deb.',
    };
    lines.push(row('Pagamento:', payLabels[order.paymentMethod] || order.paymentMethod, this.width));

    if (order.notes) {
      lines.push(line('-', this.width));
      lines.push('OBS PEDIDO:');
      lines.push(order.notes);
    }

    lines.push(line('=', this.width));
    lines.push('');
    lines.push('');
    lines.push('');

    return lines;
  }

  renderKitchen(data: any): string[] {
    const lines: string[] = [];
    const order = data;

    lines.push('');
    lines.push(line('*', this.width));
    lines.push(center('COZINHA', this.width));
    lines.push(line('*', this.width));

    const orderNum = order.orderNumber || order.id?.slice(-6).toUpperCase() || '------';
    lines.push(center(`PEDIDO #${orderNum}`, this.width));
    lines.push(center(dayjs(order.createdAt).format('HH:mm'), this.width));

    const typeLabels: Record<string, string> = {
      DELIVERY: 'ENTREGA', TAKEOUT: 'RETIRADA', DINE_IN: 'MESA',
    };
    lines.push(center(`[ ${typeLabels[order.type] || order.type} ]`, this.width));

    if (order.tableNumber) {
      lines.push(center(`MESA ${order.tableNumber}`, this.width));
    }

    lines.push(line('-', this.width));

    // Items - larger format for kitchen
    for (const item of order.items || []) {
      const productName = item.product?.name || item.productName || 'Produto';
      const qty = item.quantity || 1;
      lines.push(`${qty}x ${productName}`);
      if (item.notes) {
        lines.push(`  *** ${item.notes} ***`);
      }
      // Variations
      if (item.variations?.length > 0) {
        for (const v of item.variations) {
          lines.push(`  + ${v.name}: ${v.option}`);
        }
      }
      // Addons
      if (item.addons?.length > 0) {
        for (const a of item.addons) {
          lines.push(`  + ${a.name} x${a.quantity || 1}`);
        }
      }
    }

    if (order.notes) {
      lines.push(line('-', this.width));
      lines.push(`OBS: ${order.notes}`);
    }

    lines.push(line('*', this.width));
    lines.push('');
    lines.push('');
    lines.push('');

    return lines;
  }

  renderReceipt(data: any): string[] {
    const lines: string[] = [];
    const { order, restaurant } = data;

    lines.push('');
    if (restaurant?.name) {
      lines.push(center(restaurant.name.toUpperCase(), this.width));
    }
    if (restaurant?.address) {
      lines.push(center(restaurant.address, this.width));
    }
    if (restaurant?.phone) {
      lines.push(center(restaurant.phone, this.width));
    }

    lines.push(line('=', this.width));
    lines.push(center('COMPROVANTE', this.width));
    lines.push(line('=', this.width));

    const orderNum = order.orderNumber || order.id?.slice(-6).toUpperCase() || '------';
    lines.push(`Pedido: #${orderNum}`);
    lines.push(`Data: ${dayjs(order.createdAt).format('DD/MM/YYYY HH:mm')}`);

    if (order.customer?.name) {
      lines.push(`Cliente: ${order.customer.name}`);
    }

    lines.push(line('-', this.width));
    lines.push(row('Item', 'Total', this.width));
    lines.push(line('-', this.width));

    for (const item of order.items || []) {
      const productName = item.product?.name || item.productName || 'Produto';
      const qty = item.quantity || 1;
      const price = Number(item.unitPrice || 0) * qty;
      lines.push(row(`${qty}x ${productName}`, formatCurrency(price), this.width));
    }

    lines.push(line('-', this.width));

    if (Number(order.deliveryFee) > 0) {
      lines.push(row('Taxa entrega:', formatCurrency(Number(order.deliveryFee)), this.width));
    }
    if (Number(order.discount) > 0) {
      lines.push(row('Desconto:', `-${formatCurrency(Number(order.discount))}`, this.width));
    }
    lines.push(row('TOTAL:', formatCurrency(Number(order.total)), this.width));

    const payLabels: Record<string, string> = {
      PIX: 'PIX', CASH: 'Dinheiro', CREDIT_CARD: 'Cartao Cred.', DEBIT_CARD: 'Cartao Deb.',
    };
    lines.push(row('Pagamento:', payLabels[order.paymentMethod] || order.paymentMethod, this.width));

    lines.push(line('=', this.width));
    lines.push(center('Obrigado pela preferencia!', this.width));
    lines.push(center('ZappAI - zappai.com.br', this.width));
    lines.push('');
    lines.push('');
    lines.push('');

    return lines;
  }

  render(job: PrintJob): string[] {
    switch (job.type) {
      case 'ORDER':
        return this.renderOrder(job.data);
      case 'KITCHEN':
        return this.renderKitchen(job.data);
      case 'RECEIPT':
        return this.renderReceipt(job.data);
      case 'TEST':
        return this.renderTest();
      default:
        return this.renderTest();
    }
  }
}
