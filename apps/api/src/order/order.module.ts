import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { SubscriptionModule } from '../subscription/subscription.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [SubscriptionModule, WhatsappModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
