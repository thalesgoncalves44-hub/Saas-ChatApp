import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCampaignDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ enum: ['whatsapp', 'email', 'both'] })
  @IsEnum(['whatsapp', 'email', 'both']) type: string;
  @ApiProperty({ enum: ['all', 'loyal', 'at_risk', 'lost', 'promising', 'new'] })
  @IsEnum(['all', 'loyal', 'at_risk', 'lost', 'promising', 'new']) target: string;
  @ApiProperty() @IsString() message: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() couponId?: string;
}

export class ScheduleCampaignDto {
  @ApiProperty() @IsDateString() scheduledAt: string;
}
