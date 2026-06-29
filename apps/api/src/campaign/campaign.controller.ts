import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignService } from './campaign.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';

@ApiTags('Campaigns')
@Controller('campaigns')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CampaignController {
  constructor(private campaignService: CampaignService) {}

  @Get()
  getCampaigns(@CurrentRestaurant() restaurantId: string) {
    return this.campaignService.getCampaigns(restaurantId);
  }

  @Post()
  createCampaign(@CurrentRestaurant() restaurantId: string, @Body() body: any) {
    return this.campaignService.createCampaign(restaurantId, body);
  }

  @Put(':id')
  updateCampaign(@CurrentRestaurant() restaurantId: string, @Param('id') id: string, @Body() body: any) {
    return this.campaignService.updateCampaign(restaurantId, id, body);
  }

  @Delete(':id')
  deleteCampaign(@CurrentRestaurant() restaurantId: string, @Param('id') id: string) {
    return this.campaignService.deleteCampaign(restaurantId, id);
  }

  @Post(':id/send')
  sendCampaign(@CurrentRestaurant() restaurantId: string, @Param('id') id: string) {
    return this.campaignService.sendCampaign(restaurantId, id);
  }
}
