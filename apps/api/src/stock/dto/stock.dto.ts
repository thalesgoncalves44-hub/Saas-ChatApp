import { IsString, IsOptional, IsInt, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStockMovementDto {
  @ApiProperty() @IsString() productId: string;
  @ApiProperty({ enum: ['in', 'out', 'adjustment'] })
  @IsEnum(['in', 'out', 'adjustment']) type: string;
  @ApiProperty() @IsInt() quantity: number;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() notes?: string;
}

export class StockQueryDto {
  @IsOptional() @IsString() productId?: string;
  @IsOptional() page?: number;
  @IsOptional() limit?: number;
}
