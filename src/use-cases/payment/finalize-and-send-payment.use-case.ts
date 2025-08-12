import { Inject, Injectable } from '@nestjs/common'

import { PaymentStatusEnum } from '@domain/entities/payment.entity'
import { EXCEPTIONS, IException } from '@domain/exceptions/exceptions.interface'
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY,
} from '@domain/repositories/payment.repository.interface'
import {
  IMailerService,
  MAILER_SERVICE,
} from '@domain/services/mailer.interface'
import { STRIPE_SERVICE } from '@domain/services/stripe.interface'

import { StripeService } from '@infrastructure/services/stripe/stripe.service'

@Injectable()
export class FinalizeAndSendPaymentUseCase {
  constructor(
    @Inject(STRIPE_SERVICE)
    private readonly stripeService: StripeService,

    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,

    @Inject(EXCEPTIONS)
    private readonly exceptionsService: IException,

    @Inject(MAILER_SERVICE)
    private readonly mailerService: IMailerService,
  ) {}
  async execute(invoiceId: string) {
    // const result = await this.stripeService.finalizeAndSendInvoice(invoiceId)
    const invoice = await this.stripeService.getInvoice(invoiceId)
    if (!invoice) {
      throw this.exceptionsService.notFoundException({
        type: 'NotFound',
        message: `Invoice with ID ${invoiceId} not found`,
      })
    }
    await this.mailerService.sendInvoiceEmail(
      invoice.id!,
      invoice.customer_email!,
    )
    return true
  }
}
