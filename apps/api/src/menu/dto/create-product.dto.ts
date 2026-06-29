import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty() @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() availableFrom?: string;
  @IsOptional() @IsString() availableTo?: string;
}

export class CreateProductDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() categoryId: string;
  @ApiProperty() @IsNumber() @Min(0) price: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsNumber() @Min(0) originalPrice?: number;
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsBoolean() isVegetarian?: boolean;
  @IsOptional() @IsBoolean() isVegan?: boolean;
  @IsOptional() @IsBoolean() isGlutenFree?: boolean;
  @IsOptional() @IsBoolean() isLactoseFree?: boolean;
  @IsOptional() @IsBoolean() isSpicy?: boolean;
  @IsOptional() @IsBoolean() trackStock?: boolean;
  @IsOptional() @IsNumber() @Min(0) stockQuantity?: number;
  @IsOptional() @IsNumber() calories?: number;
  @IsOptional() @IsString() servingSize?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

export class ReorderDto {
  items: { id: string; sortOrder: number }[];
}
