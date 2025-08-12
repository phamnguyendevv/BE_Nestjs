import { PaymentEntity } from '@domain/entities/payment.entity'

export const PAYMENT_REPOSITORY = 'PAYMENT_REPOSITORY_INTERFACE'

export interface IPaymentRepository {
  createPayment(payment: Partial<PaymentEntity>): Promise<PaymentEntity>
  findOnePayment(params: {
    stripeSessionId: string
  }): Promise<PaymentEntity | null>
  findOnePaymentById(id: number): Promise<PaymentEntity | null>
  updatePayment(id: number, payment: Partial<PaymentEntity>): Promise<boolean>
}
