import { EXCEPTIONS, IException } from "@domain/exceptions/exceptions.interface"
import { IOrderRepository, ISearchOrderParams, ORDER_REPOSITORY } from "@domain/repositories/order.repository.interface"
import { IPaymentRepository, PAYMENT_REPOSITORY } from "@domain/repositories/payment.repository.interface"
import { Inject, Injectable } from "@nestjs/common"

@Injectable()
export class GetMonthlyRevenueUseCase { 
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,

    @Inject(EXCEPTIONS)
    private readonly exceptionsService: IException,
  ) {}

  async execute( queryParams: ISearchOrderParams & { userId: number }) {
    const {month, year} = queryParams

    const monthIndex = Number(month) - 1 
    queryParams.startDate = new Date(Number(year), monthIndex, 1)
    queryParams.endDate = new Date(Number(year), monthIndex + 1, 0)
    const orders = await this.checkOrdersExits(queryParams)
    return orders
  }
  private async checkOrdersExits(queryParams: ISearchOrderParams & { userId: number }) {
    const orders = await this.orderRepository.findOrders(queryParams)
    if (!orders) {
      throw this.exceptionsService.notFoundException({
        type: 'OrderNotFoundException',
        message: 'Order not found',
      })
    }
    return orders
  }
    
}