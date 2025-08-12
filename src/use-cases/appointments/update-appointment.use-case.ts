import { Inject, Injectable } from '@nestjs/common'

import {
  AppointmentEntity,
  AppointmentStatusEnum,
} from '@domain/entities/appointment.entity'
import { EXCEPTIONS, IException } from '@domain/exceptions/exceptions.interface'
import {
  APPOINTMENT_REPOSITORY,
  IAppointmentRepository,
} from '@domain/repositories/appointment.repository.interface'

@Injectable()
export class UpdateAppointmentUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
    @Inject(EXCEPTIONS)
    private readonly exceptionsService: IException,
  ) {}

  async execute(
    id: number,
    appointment: Partial<AppointmentEntity>,
    userId: number,
  ): Promise<boolean> {
    await this.checkAppointmentExists(id, userId)
    return await this.appointmentRepository.updateAppointment(id, appointment)
  }
  private async checkAppointmentExists(
    id: number,
    userId: number,
  ): Promise<void> {
    const appointment = await this.appointmentRepository.findAppointment({
      id,
      providerId: userId,
    })
    if (
      appointment[0].status === AppointmentStatusEnum.Completed ||
      appointment[0].status === AppointmentStatusEnum.Cancelled
    ) {
      throw this.exceptionsService.badRequestException({
        type: 'AppointmentUpdateException',
        message: 'Cannot update completed or cancelled appointment',
      })
    }
    if (!appointment[0]) {
      throw this.exceptionsService.notFoundException({
        type: 'AppointmentNotFoundException',
        message: 'Appointment not found',
      })
    }
  }
}
