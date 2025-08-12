import { OrderEntity } from "@domain/entities/order.entity"
import { ApiProperty } from "@nestjs/swagger"

export class RevenueByServicePresenter {
    @ApiProperty({ example: '1', description: 'Service ID' })
    serviceId?: number
  
    @ApiProperty({ example: 'Service name', description: 'Service name' })
    serviceName?: string
  
    @ApiProperty({ example: '1000', description: 'Total revenue' })
    totalRevenue?: number
  
    @ApiProperty({ example: '10', description: 'Total orders' })
    totalOrders?: number
  
    @ApiProperty({ example: '100', description: 'Average order value' })
    averageOrderValue?: number
  
    @ApiProperty({ example: 'usd', description: 'Currency' })
    currency?: string
  
  
    constructor(orders: OrderEntity[]) {
      this.totalRevenue = orders.reduce((total, order) => {
        return total + parseFloat(order.totalAmount.toString())
      }, 0)
    
      this.totalOrders = orders.length
    
      this.averageOrderValue = this.totalOrders > 0 
        ? this.totalRevenue / this.totalOrders 
        : 0
    
      this.currency = this.totalOrders > 0 ? orders[0].currency : 'usd'
    
      if (this.totalOrders > 0) {
        this.serviceId = orders[0].appointment?.service?.id || 0
        this.serviceName = orders[0].appointment?.service?.name || ''
      } else {
        this.serviceId = 0
        this.serviceName = ''
      }
    }
    
}