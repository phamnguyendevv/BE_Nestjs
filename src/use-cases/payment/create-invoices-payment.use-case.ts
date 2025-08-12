import { Inject, Injectable } from '@nestjs/common'

import { PaymentStatusEnum } from '@domain/entities/payment.entity'
import { EXCEPTIONS, IException } from '@domain/exceptions/exceptions.interface'
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY,
} from '@domain/repositories/payment.repository.interface'
import { STRIPE_SERVICE } from '@domain/services/stripe.interface'

import { CreateInvoiceFromOrderDto } from '@adapters/controllers/payments/dto/create-invoices-payment.dto'

import { StripeService } from '@infrastructure/services/stripe/stripe.service'

@Injectable()
export class CreateInvoicesPaymentUseCase {
  constructor(
    @Inject(STRIPE_SERVICE)
    private readonly stripeService: StripeService,

    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,

    @Inject(EXCEPTIONS)
    private readonly exceptionsService: IException,
  ) {}
  async execute(createInvoiceFromOrderDto: CreateInvoiceFromOrderDto) {
    const payment = await this.checkPaymentExits(
      createInvoiceFromOrderDto.paymentId,
    )

    if (payment.invoiceId) {
      throw this.exceptionsService.badRequestException({
        type: 'InvoiceAlreadyCreatedException',
        message: 'Invoice already created',
      })
    }

    const invoice = await this.stripeService.createInvoiceFromOrder(
      createInvoiceFromOrderDto,
    )

    await this.paymentRepository.updatePayment(
      createInvoiceFromOrderDto.paymentId,
      {
        status: PaymentStatusEnum.Paid,
        invoiceId: invoice.invoiceId,
        stripeInvoiceId: invoice.invoiceId,
        stripeCustomerId: invoice.customerId,
        customerEmail: invoice.customerEmail,
      },
    )

    return invoice
  }
  private async checkPaymentExits(paymentId: number) {
    const payment = await this.paymentRepository.findOnePaymentById(paymentId)
    if (!payment) {
      throw this.exceptionsService.notFoundException({
        type: 'PaymentNotFoundException',
        message: 'Payment not found',
      })
    }
    return payment
  }
}
