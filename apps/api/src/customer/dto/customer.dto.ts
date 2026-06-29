import { IsString, IsOptional, IsEmail, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() phone: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() defaultAddress?: any;
  @IsOptional() @IsBoolean() acceptsMarketing?: boolean;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateCustomerDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() defaultAddress?: any;
  @IsOptional() @IsBoolean() acceptsMarketing?: boolean;
  @IsOptional() @IsString() notes?: string;
}

export class AddPointsDto {
  @ApiProperty() points: number;
  @IsOptional() @IsString() reason?: string;
}

export class CustomerQueryDto {
  @IsOptional() @IsString() segment?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() page?: number;
  @IsOptional() limit?: number;
}
