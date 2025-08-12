import { OrderEntity } from '@domain/entities/order.entity'
import { PaymentStatusEnum } from '@domain/entities/payment.entity'

export const ORDER_REPOSITORY = 'ORDER_REPOSITORY_INTERFACE'

export interface ISearchOrderParams {
  date?: string
  serviceId?: number
  serviceName?: string
  size?: number
  page?: number
  paymentStatus?: PaymentStatusEnum
  providerId?: number
  userId?: number
  startDate?: Date
  endDate?: Date
  month?: number
  year?: number
}

export interface IOrderRepository {
  createOrder(order: Partial<OrderEntity>): Promise<OrderEntity>
  findOrders(
    params: ISearchOrderParams & { userId: number },
  ): Promise<OrderEntity[]>
}
