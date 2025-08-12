import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { Repository } from 'typeorm'

import { AppointmentStatusEnum } from '@domain/entities/appointment.entity'
import { OrderEntity, OrderStatusEnum } from '@domain/entities/order.entity'
import { PaymentStatusEnum } from '@domain/entities/payment.entity'
import {
  IOrderRepository,
  ISearchOrderParams,
} from '@domain/repositories/order.repository.interface'

import { Order } from '../entities/order.entity'

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  createOrder(order: Partial<OrderEntity>): Promise<OrderEntity> {
    return this.orderRepository.save(order)
  }

  findOrders(
    params: ISearchOrderParams & { userId: number },
  ): Promise<OrderEntity[]> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.appointment', 'appointment')
      .leftJoinAndSelect('appointment.service', 'service')
      .leftJoinAndSelect('appointment.provider', 'provider')
      .leftJoinAndSelect('order.payments', 'payment')
      .andWhere('appointment.isDelete = :isDelete', { isDelete: false })
      .andWhere('service.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('order.status = :orderStatus', {
        orderStatus: OrderStatusEnum.Completed,
      })
      .andWhere('appointment.status = :appointmentStatus', {
        appointmentStatus: AppointmentStatusEnum.Completed,
      })
      .andWhere('payment.status = :paymentStatus', {
        paymentStatus: PaymentStatusEnum.Paid,
      })

    if (params.userId) {
      queryBuilder.andWhere('appointment.providerId = :providerId', {
        providerId: params.userId,
      })
    }
    if (params.paymentStatus) {
      queryBuilder.andWhere('payment.status = :paymentStatus', {
        paymentStatus: params.paymentStatus,
      })
    }
    if (params.startDate) {
      queryBuilder.andWhere('payment.paymentDate >= :startDate', {
        startDate: params.startDate,
      })
    }
    if (params.endDate) {
      queryBuilder.andWhere('payment.paymentDate <= :endDate', {
        endDate: params.endDate,
      })
    }
    if (params.serviceId) {
      queryBuilder.andWhere('service.id = :serviceId', {
        serviceId: Number(params.serviceId),
      })
    }
    if (params.serviceName) {
      queryBuilder.andWhere('service.name ILIKE :serviceName', {
        serviceName: `%${params.serviceName}%`,
      })
    }
    return queryBuilder.getMany()
  }
}
