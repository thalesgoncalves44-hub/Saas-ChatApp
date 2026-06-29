import { IsString, IsOptional, IsArray, IsNumber, IsEnum, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class OrderItemOptionDto {
  @IsString() optionId: string;
  @IsString() name: string;
  @IsNumber() priceAdd: number;
}

class OrderItemAddonDto {
  @IsString() addonId: string;
  @IsString() name: string;
  @IsNumber() price: number;
  @IsNumber() @Min(1) quantity: number;
}

class CreateOrderItemDto {
  @ApiProperty() @IsString() productId: string;
  @ApiProperty() @IsNumber() @Min(1) quantity: number;
  @ApiProperty() @IsNumber() unitPrice: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => OrderItemOptionDto) options?: OrderItemOptionDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => OrderItemAddonDto) addons?: OrderItemAddonDto[];
}

export class CreateOrderDto {
  @ApiProperty({ enum: ['delivery', 'pickup', 'dine_in'] })
  @IsEnum(['delivery', 'pickup', 'dine_in']) type: string;

  @ApiProperty({ enum: ['whatsapp', 'website', 'qrcode', 'pdv'] })
  @IsEnum(['whatsapp', 'website', 'qrcode', 'pdv']) channel: string;

  @IsOptional() @IsString() customerId?: string;
  @IsOptional() @IsString() tableId?: string;
  @IsOptional() @IsString() couponCode?: string;
  @IsOptional() @IsString() paymentMethod?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() deliveryAddress?: any;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ['confirmed', 'preparing', 'ready', 'delivering', 'delivered'] })
  @IsEnum(['confirmed', 'preparing', 'ready', 'delivering', 'delivered']) status: string;
  @IsOptional() @IsString() internalNotes?: string;
}

export class CancelOrderDto {
  @ApiProperty() @IsString() reason: string;
}
