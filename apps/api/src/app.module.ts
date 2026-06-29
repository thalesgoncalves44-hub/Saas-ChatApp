import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { RestaurantModule } from './restaurant/restaurant.module';
import { MenuModule } from './menu/menu.module';
import { OrderModule } from './order/order.module';
import { CustomerModule } from './customer/customer.module';
import { TableModule } from './table/table.module';
import { CouponModule } from './coupon/coupon.module';
import { CampaignModule } from './campaign/campaign.module';
import { PaymentModule } from './payment/payment.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { ReportsModule } from './reports/reports.module';
import { StockModule } from './stock/stock.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { PrinterModule } from './printer/printer.module';
import { NotificationModule } from './notification/notification.module';
import { WebhookModule } from './webhook/webhook.module';
import { EventsModule } from './events/events.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    RestaurantModule,
    MenuModule,
    OrderModule,
    CustomerModule,
    TableModule,
    CouponModule,
    CampaignModule,
    PaymentModule,
    SubscriptionModule,
    ReportsModule,
    StockModule,
    WhatsappModule,
    PrinterModule,
    NotificationModule,
    WebhookModule,
    EventsModule,
  ],
})
export class AppModule {}
