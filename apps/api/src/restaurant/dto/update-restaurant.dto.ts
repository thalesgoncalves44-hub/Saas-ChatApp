import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRestaurantDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  primaryColor?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  secondaryColor?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  acceptsDelivery?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  acceptsTakeaway?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  acceptsDineIn?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  minimumOrder?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  deliveryFee?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  estimatedTime?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pixKey?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pixKeyType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bannerUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  instagram?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  whatsapp?: string;
}
