import { Controller, Get, Put, Patch, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RestaurantService } from './restaurant.service';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';

@ApiTags('Restaurant')
@Controller()
export class RestaurantController {
  constructor(private restaurantService: RestaurantService) {}

  // Public endpoint
  @Get('public/r/:slug')
  @ApiOperation({ summary: 'Get public restaurant by slug' })
  async getPublic(@Param('slug') slug: string) {
    return this.restaurantService.findBySlug(slug);
  }

  @Get('restaurant')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMyRestaurant(@CurrentRestaurant() restaurantId: string) {
    return this.restaurantService.findById(restaurantId);
  }

  @Put('restaurant')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(@CurrentRestaurant() restaurantId: string, @Body() dto: UpdateRestaurantDto) {
    return this.restaurantService.update(restaurantId, dto);
  }

  @Patch('restaurant/toggle-open')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async toggleOpen(@CurrentRestaurant() restaurantId: string) {
    return this.restaurantService.toggleOpen(restaurantId);
  }

  @Put('restaurant/operating-hours')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateOperatingHours(@CurrentRestaurant() restaurantId: string, @Body() body: { hours: any[] }) {
    return this.restaurantService.updateOperatingHours(restaurantId, body.hours);
  }

  @Get('restaurant/users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getUsers(@CurrentRestaurant() restaurantId: string) {
    return this.restaurantService.getUsers(restaurantId);
  }

  @Post('restaurant/users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async inviteUser(@CurrentRestaurant() restaurantId: string, @Body() body: any) {
    return this.restaurantService.inviteUser(restaurantId, body);
  }

  @Delete('restaurant/users/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async removeUser(@CurrentRestaurant() restaurantId: string, @Param('userId') userId: string) {
    return this.restaurantService.removeUser(restaurantId, userId);
  }

  @Post('restaurant/import-menu')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async importMenu(@CurrentRestaurant() restaurantId: string, @Body() body: any) {
    return this.restaurantService.importMenu(restaurantId, body);
  }
}
