import { Inject, Injectable } from '@nestjs/common'

import { AppointmentEntity } from '@domain/entities/appointment.entity'
import { IPaginationParams } from '@domain/entities/search.entity'
import {
  APPOINTMENT_REPOSITORY,
  IAppointmentRepository,
  ISearchAppointmentsParams,
} from '@domain/repositories/appointment.repository.interface'

@Injectable()
export class GetListAppointmentUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
  ) {}

  async execute(queryParams: ISearchAppointmentsParams): Promise<{
    data: AppointmentEntity[]
    pagination: IPaginationParams
  }> {
    return await this.appointmentRepository.findAppointments(queryParams)
  }
}
