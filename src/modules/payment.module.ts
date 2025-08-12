import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { EXCEPTIONS } from '@domain/exceptions/exceptions.interface'
import { APPOINTMENT_REPOSITORY } from '@domain/repositories/appointment.repository.interface'
import { PAYMENT_REPOSITORY } from '@domain/repositories/payment.repository.interface'
import { USER_REPOSITORY } from '@domain/repositories/user.repository.interface'
import { MAILER_SERVICE } from '@domain/services/mailer.interface'
import { STRIPE_SERVICE } from '@domain/services/stripe.interface'

import { CreateCheckoutSessionUseCase } from '@use-cases/payment/create-checkout-session.use-case'
import { CreateInvoicesPaymentUseCase } from '@use-cases/payment/create-invoices-payment.use-case'
import { FinalizeAndSendPaymentUseCase } from '@use-cases/payment/finalize-and-send-payment.use-case'
import { GetInvoicePaymentUseCase } from '@use-cases/payment/get-invoice-payment.use-case'
import { HandleWebhookUseCase } from '@use-cases/payment/handle-webhook.use-case'
import { RefundPaymentUseCase } from '@use-cases/payment/refund-payment.use-case'

import { PaymentController } from '@adapters/controllers/payments/payment.controller'

import { EnvironmentConfigModule } from '@infrastructure/config/environment/environment-config.module'
import { Appointment } from '@infrastructure/databases/postgressql/entities/appointment.entity'
import { Payment } from '@infrastructure/databases/postgressql/entities/payment.entity'
import { User } from '@infrastructure/databases/postgressql/entities/user.entity'
import { AppointmentRepository } from '@infrastructure/databases/postgressql/repositories/appointment.repository'
import { PaymentRepository } from '@infrastructure/databases/postgressql/repositories/payment.repository'
import { UserRepository } from '@infrastructure/databases/postgressql/repositories/user.repository'
import { ExceptionsModule } from '@infrastructure/exceptions/exceptions.module'
import { ExceptionsService } from '@infrastructure/exceptions/exceptions.service'
import { NodeMailerService } from '@infrastructure/services/mailer/mailer.service'
import { StripeModule } from '@infrastructure/services/stripe/stripe.module'
import { StripeService } from '@infrastructure/services/stripe/stripe.service'
import { GetStatusSessionUseCase } from '@use-cases/payment/get-status-session.use-case'
import { ORDER_REPOSITORY } from '@domain/repositories/order.repository.interface'
import { OrderRepository } from '@infrastructure/databases/postgressql/repositories/order.repository'
import { Order } from '@infrastructure/databases/postgressql/entities/order.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, User, Appointment, Order]),
    ExceptionsModule,
    EnvironmentConfigModule,
    StripeModule,
  ],

  controllers: [PaymentController],
  providers: [
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PaymentRepository,
    },
    {
      provide: EXCEPTIONS,
      useClass: ExceptionsService,
    },
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    {
      provide: APPOINTMENT_REPOSITORY,
      useClass: AppointmentRepository,
    },
    {
      provide: MAILER_SERVICE,
      useClass: NodeMailerService,
    },
    {
      provide: STRIPE_SERVICE,
      useClass: StripeService,
    },
    {
      provide: ORDER_REPOSITORY,
      useClass: OrderRepository
    },
    HandleWebhookUseCase,
    RefundPaymentUseCase,
    CreateInvoicesPaymentUseCase,
    FinalizeAndSendPaymentUseCase,
    GetInvoicePaymentUseCase,
    CreateCheckoutSessionUseCase,
    GetStatusSessionUseCase,
  ],
})
export class PaymentsModule {}
