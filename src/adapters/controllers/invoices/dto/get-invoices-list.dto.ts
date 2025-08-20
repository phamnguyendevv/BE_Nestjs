import { ApiProperty } from '@nestjs/swagger'

import { Type } from 'class-transformer'
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'

import { InvoiceStatusEnum } from '@domain/entities/invoice.entity'

export class GetInvoicesListDto {
  @ApiProperty({
    description: 'Search term',
    example: 'INV-2024',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string

  @ApiProperty({
    description: 'Page number',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number

  @ApiProperty({
    description: 'Page size',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  size?: number

  @ApiProperty({
    description: 'Invoice number',
    example: 'INV-202401-0001',
    required: false,
  })
  @IsOptional()
  @IsString()
  invoiceNumber?: string

  @ApiProperty({
    description: 'Appointment ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  appointmentId?: number

  @ApiProperty({
    description: 'Order ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  orderId?: number

  @ApiProperty({
    description: 'Provider ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  providerId?: number

  @ApiProperty({
    description: 'Client ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  clientId?: number

  @ApiProperty({
    description: 'Invoice status',
    enum: InvoiceStatusEnum,
    example: InvoiceStatusEnum.Paid,
    required: false,
  })
  @IsOptional()
  @IsEnum(InvoiceStatusEnum)
  status?: InvoiceStatusEnum

  @ApiProperty({
    description: 'Currency code',
    example: 'usd',
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string

  @ApiProperty({
    description: 'Minimum amount',
    example: 50.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minAmount?: number

  @ApiProperty({
    description: 'Maximum amount',
    example: 500.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxAmount?: number

  @ApiProperty({
    description: 'Start date for filtering',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: Date

  @ApiProperty({
    description: 'End date for filtering',
    example: '2024-12-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: Date

  @ApiProperty({
    description: 'Issue date',
    example: '2024-01-15T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  issueDate?: Date

  @ApiProperty({
    description: 'Due date',
    example: '2024-02-15T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dueDate?: Date
}
