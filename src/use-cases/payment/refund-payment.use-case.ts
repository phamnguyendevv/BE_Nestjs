import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { PaymentStatusEnum } from '@domain/entities/payment.entity'
import { PAYMENT_REPOSITORY } from '@domain/repositories/payment.repository.interface'
import { STRIPE_SERVICE } from '@domain/services/stripe.interface'

import { RefundPaymentDto } from '@adapters/controllers/payments/dto/refund-payment.dto'

import { PaymentRepository } from '@infrastructure/databases/postgressql/repositories/payment.repository'
import { StripeService } from '@infrastructure/services/stripe/stripe.service'

@Injectable()
export class RefundPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepository,

    @Inject(STRIPE_SERVICE)
    private readonly stripeService: StripeService,
  ) {}

  async execute(refundPaymentDto: RefundPaymentDto): Promise<boolean> {
    try {
      const payment = await this.paymentRepository.findOnePaymentById(
        refundPaymentDto.paymentId,
      )

      if (!payment) {
        throw new NotFoundException('Payment not found')
      }

      if (payment.status !== PaymentStatusEnum.Paid) {
        throw new BadRequestException('Can only refund completed payments')
      }

      const refundAmount = refundPaymentDto.amount || payment.amount * 100

      await this.paymentRepository.updatePayment(payment.id, {
        status: PaymentStatusEnum.Refunded,
        refundAmount: refundAmount / 100,
        refundDate: new Date(),
      })

      return true
    } catch {
      throw new BadRequestException(`Failed to refund payment`)
    }
  }
}
