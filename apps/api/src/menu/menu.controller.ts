import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';

@ApiTags('Menu')
@Controller()
export class MenuController {
  constructor(private menuService: MenuService) {}

  // Public endpoints
  @Get('public/menu/:slug')
  getPublicMenu(@Param('slug') slug: string) {
    return this.menuService.getPublicMenu(slug);
  }

  // Categories
  @Get('categories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getCategories(@CurrentRestaurant() restaurantId: string) {
    return this.menuService.getCategories(restaurantId);
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createCategory(@CurrentRestaurant() restaurantId: string, @Body() body: any) {
    return this.menuService.createCategory(restaurantId, body);
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateCategory(@CurrentRestaurant() restaurantId: string, @Param('id') id: string, @Body() body: any) {
    return this.menuService.updateCategory(restaurantId, id, body);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deleteCategory(@CurrentRestaurant() restaurantId: string, @Param('id') id: string) {
    return this.menuService.deleteCategory(restaurantId, id);
  }

  @Post('categories/reorder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  reorderCategories(@CurrentRestaurant() restaurantId: string, @Body() body: { order: any[] }) {
    return this.menuService.reorderCategories(restaurantId, body.order);
  }

  // Products
  @Get('products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getProducts(@CurrentRestaurant() restaurantId: string, @Query() filters: any) {
    return this.menuService.getProducts(restaurantId, filters);
  }

  @Get('products/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getProduct(@CurrentRestaurant() restaurantId: string, @Param('id') id: string) {
    return this.menuService.getProduct(restaurantId, id);
  }

  @Post('products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createProduct(@CurrentRestaurant() restaurantId: string, @Body() body: any) {
    return this.menuService.createProduct(restaurantId, body);
  }

  @Put('products/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateProduct(@CurrentRestaurant() restaurantId: string, @Param('id') id: string, @Body() body: any) {
    return this.menuService.updateProduct(restaurantId, id, body);
  }

  @Delete('products/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deleteProduct(@CurrentRestaurant() restaurantId: string, @Param('id') id: string) {
    return this.menuService.deleteProduct(restaurantId, id);
  }

  @Patch('products/:id/toggle-availability')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  toggleAvailability(@CurrentRestaurant() restaurantId: string, @Param('id') id: string) {
    return this.menuService.toggleProductAvailability(restaurantId, id);
  }
}
