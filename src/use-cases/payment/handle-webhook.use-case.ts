import {
  Inject,
  Injectable,
  NotFoundException,
  RawBodyRequest,
} from '@nestjs/common'

import Stripe from 'stripe'

import { PaymentStatusEnum } from '@domain/entities/payment.entity'
import { PAYMENT_REPOSITORY } from '@domain/repositories/payment.repository.interface'
import { STRIPE_SERVICE } from '@domain/services/stripe.interface'

import { Payment } from '@infrastructure/databases/postgressql/entities/payment.entity'
import { PaymentRepository } from '@infrastructure/databases/postgressql/repositories/payment.repository'
import { StripeService } from '@infrastructure/services/stripe/stripe.service'

@Injectable()
export class HandleWebhookUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepository,
    @Inject(STRIPE_SERVICE)
    private readonly stripeService: StripeService,
  ) {}
  execute(payload: Buffer, signature: string) {
    const event = this.stripeService.constructEventFromPayload(
      payload.toString(),
      signature,
    )
    console.log(event.type)
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', event.data.object)
        break
      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object)
        break
      case 'checkout.session.completed':
        console.log('Checkout completed:', event.data.object)
        break

      case 'payment_intent.created':
        console.log('Payment created:', event.data.object)
        const data = {
          amount: event.data.object.amount,
          currency: event.data.object.currency,
          status: PaymentStatusEnum.Pending,
          stripeSessionId: event.data.object.id,
          paymentDate: new Date(),
          appointmentId: event.data.object.metadata.appointmentId,
          clientId: event.data.object.metadata.clientId,
          providerId: event.data.object.metadata.providerId,
          
                 }
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
        break
    }

    return { received: true }
  }
}
