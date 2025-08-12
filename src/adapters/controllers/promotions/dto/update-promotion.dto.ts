import { ApiProperty } from '@nestjs/swagger'

import { Type } from 'class-transformer'
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator'

import { DiscountTypeEnum } from '@domain/entities/promotion.entity'

export class UpdatePromotionDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  code?: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty()
  @IsOptional()
  @IsEnum(DiscountTypeEnum)
  discountType?: DiscountTypeEnum

  @ApiProperty()
  @IsOptional()
  discountValue?: number

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date

  @ApiProperty()
  @IsOptional()
  usageLimit?: number

  @ApiProperty()
  @IsOptional()
  usedCount?: number

  @ApiProperty()
  @IsOptional()
  minAmount?: number

  @ApiProperty()
  @IsOptional()
  maxDiscount?: number


  @ApiProperty()
  @IsOptional()
  @IsString()
  name?: string


}
