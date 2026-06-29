import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GeneratePixDto {
  @ApiProperty() @IsString() orderId: string;
  @ApiProperty() @IsNumber() @Min(0.01) amount: number;
  @IsOptional() @IsString() description?: string;
}

export class CreateCheckoutDto {
  @ApiProperty({ enum: ['stripe', 'asaas'] })
  @IsString() provider: string;
  @ApiProperty() @IsString() planId: string;
  @IsOptional() @IsString() successUrl?: string;
  @IsOptional() @IsString() cancelUrl?: string;
}

export class RefundDto {
  @IsOptional() @IsNumber() @Min(0.01) amount?: number;
  @IsOptional() @IsString() reason?: string;
}
