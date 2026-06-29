import { IsString, IsOptional, IsInt, IsBoolean, Min, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTableDto {
  @ApiProperty() @IsInt() @Min(1) number: number;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsInt() @Min(1) capacity?: number;
  @IsOptional() @IsString() section?: string;
}

export class UpdateTableDto {
  @IsOptional() @IsInt() @Min(1) number?: number;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsInt() @Min(1) capacity?: number;
  @IsOptional() @IsString() section?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateTableStatusDto {
  @ApiProperty({ enum: ['available', 'occupied', 'cleaning', 'reserved'] })
  @IsEnum(['available', 'occupied', 'cleaning', 'reserved']) status: string;
}

export class SplitBillDto {
  @ApiProperty() @IsInt() @Min(2) splits: number;
}

export class CreateReservationDto {
  @ApiProperty() @IsString() customerName: string;
  @ApiProperty() @IsString() customerPhone: string;
  @ApiProperty() @IsInt() @Min(1) partySize: number;
  @ApiProperty() @IsString() date: string;
  @IsOptional() @IsString() tableId?: string;
  @IsOptional() @IsString() notes?: string;
}
