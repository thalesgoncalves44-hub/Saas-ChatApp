import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsInt, Min, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCouponDto {
  @ApiProperty() @IsString() code: string;
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ enum: ['percentage', 'fixed', 'free_delivery'] })
  @IsEnum(['percentage', 'fixed', 'free_delivery']) type: string;
  @ApiProperty() @IsNumber() @Min(0) value: number;
  @IsOptional() @IsNumber() @Min(0) minOrder?: number;
  @IsOptional() @IsNumber() maxDiscount?: number;
  @IsOptional() @IsInt() maxUses?: number;
  @IsOptional() @IsInt() maxUsesPerCustomer?: number;
  @IsOptional() @IsDateString() validFrom?: string;
  @IsOptional() @IsDateString() validUntil?: string;
  @IsOptional() @IsBoolean() firstOrderOnly?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ValidateCouponDto {
  @ApiProperty() @IsString() code: string;
  @ApiProperty() @IsNumber() @Min(0) orderTotal: number;
  @IsOptional() @IsString() customerId?: string;
}
