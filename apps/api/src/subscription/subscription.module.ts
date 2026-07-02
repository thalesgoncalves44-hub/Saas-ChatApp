import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { PlanLimitService } from './plan-limit.service';

@Module({
  controllers: [SubscriptionController],
  providers: [SubscriptionService, PlanLimitService],
  exports: [SubscriptionService, PlanLimitService],
})
export class SubscriptionModule {}
