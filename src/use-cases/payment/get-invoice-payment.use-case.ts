import { PaymentStatusEnum } from "@domain/entities/payment.entity"
import { EXCEPTIONS, IException } from "@domain/exceptions/exceptions.interface"
import { IPaymentRepository, PAYMENT_REPOSITORY } from "@domain/repositories/payment.repository.interface"
import { STRIPE_SERVICE } from "@domain/services/stripe.interface"
import { StripeService } from "@infrastructure/services/stripe/stripe.service"
import { Inject, Injectable } from "@nestjs/common"

@Injectable()
export class GetInvoicePaymentUseCase {
  constructor(
    @Inject(STRIPE_SERVICE)
    private readonly stripeService: StripeService,

    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,

    @Inject(EXCEPTIONS)
    private readonly exceptionsService: IException,
  ) {}
  async execute(invoiceId: string) {
    const invoice = await this.stripeService.getInvoiceDetails(invoiceId)
    if (!invoice) {
      throw this.exceptionsService.notFoundException({
        type: 'InvoiceNotFoundException',
        message: 'Invoice not found',
      })
    }
    
    return invoice
  }
}
