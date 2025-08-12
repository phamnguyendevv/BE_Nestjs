import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'

import { CreateAppointmentUseCase } from '@use-cases/appointments/create-appointment.use-case'
import { DeleteAppointmentUseCase } from '@use-cases/appointments/delete-appointment.use-case'
import { GetDetailAppointmentUseCase } from '@use-cases/appointments/get-detali-appointment.use-case'
import { GetListAppointmentByClientUseCase } from '@use-cases/appointments/get-list-appointment-by-client.use-case'
import { GetListAppointmentUseCase } from '@use-cases/appointments/get-list-appointment.use-case'
import { UpdateAppointmentUseCase } from '@use-cases/appointments/update-appointment.use-case'

import { CheckPolicies } from '../common/decorators/check-policies.decorator'
import { ApiResponseType } from '../common/decorators/swagger-response.decorator'
import { User } from '../common/decorators/user.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CreateAppointmentDto } from './dto/create-appointment.dto'
import { GetListAppointmentByUserDto } from './dto/get-list-appointment-by-client.dto'
import { GetListAppointmentByProviderDto } from './dto/get-list-appointment-by-provider.dto'
import { GetListAppointmentDto } from './dto/get-list-appointment.dto'
import { UpdateAppointmentDto } from './dto/update-appointment.dto'
import { CreateAppointmentPresenter } from './presenters/create-appointment.presenters'
import {
  GetListAppointmentPresenter,
  GetListAppointmentPresenters,
} from './presenters/get-list-appointment.presenters'

@Controller()
@ApiTags('Appointments')
@ApiResponse({
  status: 401,
  description: 'No authorization token was found',
})
@ApiResponse({ status: 500, description: 'Internal error' })
@ApiResponse({ status: 403, description: 'Forbidden access' })
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(
    private readonly getListAppointmentUseCase: GetListAppointmentUseCase,
    private readonly getDetailAppointmentUseCase: GetDetailAppointmentUseCase,
    private readonly createAppointmentUseCase: CreateAppointmentUseCase,
    private readonly updateAppointmentUseCase: UpdateAppointmentUseCase,
    private readonly deleteAppointmentUseCase: DeleteAppointmentUseCase,
    private readonly getListAppointmentByClientUseCase: GetListAppointmentByClientUseCase,
  ) {}

  @Get('/admin/appointments/search')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Search appointments',
    description: 'Retrieve a list of appointments based on search criteria',
  })
  @ApiExtraModels(GetListAppointmentPresenter)
  @ApiResponseType(GetListAppointmentPresenter, true)
  @UseGuards(JwtAuthGuard)
  @CheckPolicies({ action: 'read', subject: 'Appointment' })
  async searchAppointments(
    @Query() searchAppointmentDto: GetListAppointmentDto,
  ) {
    const { data, pagination } =
      await this.getListAppointmentUseCase.execute(searchAppointmentDto)
    return new GetListAppointmentPresenters(data, pagination)
  }
  @Put('/provider/appointments/:id')
  @ApiBearerAuth()
  @CheckPolicies({ action: 'read', subject: 'Appointment' })
  @ApiOperation({
    summary: 'Update appointment',
    description: 'Update an existing appointment by ID',
  })
  @ApiResponseType(GetListAppointmentPresenter, true)
  @CheckPolicies({ action: 'update', subject: 'Appointment' })
  async updateAppointment(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @User('id') userId: number,
  ) {
    const updatedAppointment = await this.updateAppointmentUseCase.execute(
      id,
      updateAppointmentDto,
      userId,
    )
    return updatedAppointment
  }

  @Get('/admin/appointments/:id')
  @ApiBearerAuth()
  @CheckPolicies({ action: 'read', subject: 'Appointment' })
  @ApiOperation({
    summary: 'Get appointment by id',
    description: 'Retrieve a list of appointment by id',
  })
  @ApiResponseType(GetListAppointmentPresenter, true)
  @CheckPolicies({ action: 'read', subject: 'Appointment' })
  async getDetailAppointments(
    @Param('id', ParseIntPipe) id: number,
    @User('id') userId: number,
  ) {
    const appointments = await this.getDetailAppointmentUseCase.execute(
      id,
      userId,
    )
    return appointments
  }
  @Delete('/admin/appointments/:id')
  @ApiBearerAuth()
  @CheckPolicies({ action: 'delete', subject: 'Appointment' })
  @ApiOperation({
    summary: 'Delete appointment',
    description: 'Delete an existing appointment by ID',
  })
  @CheckPolicies({ action: 'delete', subject: 'Appointment' })
  async deleteAppointment(@Param('id', ParseIntPipe) id: number) {
    await this.deleteAppointmentUseCase.execute(id)
    return { message: 'Appointment deleted successfully' }
  }

  @Get('/users/appointments')
  @ApiBearerAuth()
  @CheckPolicies({ action: 'read', subject: 'Appointment' })
  @ApiOperation({
    summary: 'Get list of appointments by user',
    description:
      'Retrieve a list of appointments for the authenticated user ( appointment status : ( 1: confirmed, 2: pending, 3: completed, 4: canceled )',
  })
  @ApiResponseType(GetListAppointmentPresenter, true)
  @CheckPolicies({ action: 'read', subject: 'Appointment' })
  async getListAppointmentsByUser(
    @Query() getListAppointmentDto: GetListAppointmentByUserDto,
    @User('id') userId: number,
  ) {
    const { data, pagination } =
      await this.getListAppointmentByClientUseCase.execute(
        getListAppointmentDto,
        userId,
      )
    return new GetListAppointmentPresenters(data, pagination)
  }

  @Get('/provider/appointments')
  @ApiBearerAuth()
  @CheckPolicies({ action: 'read', subject: 'Appointment' })
  @ApiOperation({
    summary: 'Get list of appointments by provider',
    description:
      'Retrieve a list of appointments for the authenticated provider ( appointment status : ( 1: confirmed, 2: pending, 3: completed, 4: canceled )',
  })
  @ApiResponseType(GetListAppointmentPresenter, true)
  @CheckPolicies({ action: 'read', subject: 'Appointment' })
  async getListAppointmentsByProvider(
    @Query() getListAppointmentDto: GetListAppointmentByProviderDto,
    @User('id') userId: number,
  ) {
    const { data, pagination } =
      await this.getListAppointmentByClientUseCase.execute(
        getListAppointmentDto,
        userId,
      )
    return new GetListAppointmentPresenters(data, pagination)
  }

  @Post('/users/appointments')
  @ApiBearerAuth()
  @CheckPolicies({ action: 'create', subject: 'Appointment' })
  @ApiOperation({
    summary: 'Create appointment',
    description: 'Create a new appointment',
  })
  @ApiResponseType(GetListAppointmentPresenter, true)
  @CheckPolicies({ action: 'create', subject: 'Appointment' })
  async createAppointment(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @User('id') userId: number,
  ) {
    const appointment = await this.createAppointmentUseCase.execute(
      createAppointmentDto,
      userId,
    )
    return new CreateAppointmentPresenter(appointment)
  }
}
