import {
  Body,
  Controller,
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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'

import { ChangePasswordUseCase } from '@use-cases/users/change-password.use-case'
import { GetListUsersUseCase } from '@use-cases/users/get-list-users.use-case'
import { UpdateUsersUseCase } from '@use-cases/users/update-user.use-case'

import { CheckPolicies } from '../common/decorators/check-policies.decorator'
import { ApiResponseType } from '../common/decorators/swagger-response.decorator'
import { User } from '../common/decorators/user.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { PoliciesGuard } from '../common/guards/policies.guard'
import { ChangePasswordDto } from './dto/change-password.dto'
import { GetListUsersDto } from './dto/get-list-users.dto'
import { AdminUpdateUserDto, UpdateUserDto } from './dto/update-users.dto'
import { SimpleUserPresenter } from './presenters/get-detail-user-presenters'
import { GetListUserPresenter } from './presenters/get-list-users.presenter'

@Controller()
@ApiTags('Users')
@ApiResponse({
  status: 401,
  description: 'No authorization token was found',
})
@ApiResponse({ status: 500, description: 'Internal error' })
@ApiResponse({ status: 403, description: 'Forbidden access' })
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class UsersController {
  constructor(
    private readonly getListUserUseCase: GetListUsersUseCase,
    private readonly updateUserUseCase: UpdateUsersUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}
  @Get('admin/users')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List users for admin ',
    description: 'Only admin can access this endpoint',
  })
  @ApiResponseType(GetListUserPresenter, true)
  @ApiExtraModels(GetListUserPresenter)
  @ApiOkResponse({ type: GetListUserPresenter })
  @CheckPolicies({ action: 'search', subject: 'User' })
  async findAll(@Query() querySearchParams: GetListUsersDto) {
    const { data, pagination } =
      await this.getListUserUseCase.execute(querySearchParams)
    return new GetListUserPresenter(data, pagination)
  }

  @Put('admin/users/:id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user by admin ',
    description: 'Update role or status or email_verified   a user',
  })
  @ApiOkResponse({ description: 'User updated' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @CheckPolicies(
    { action: 'update', subject: 'User', field: 'role' },
    { action: 'update', subject: 'User', field: 'status' },
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() adminFields: AdminUpdateUserDto,
  ) {
    const isUpdated = await this.updateUserUseCase.execute(
      { id: id },
      adminFields,
    )
    return isUpdated
  }

  @Get('admin/users/:id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user by admin',
    description: 'Get user information by admin',
  })
  @ApiOkResponse({ description: 'User found' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @CheckPolicies({ action: 'read', subject: 'User' })
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    const users = await this.getListUserUseCase.execute({
      id: id,
    })
    return new SimpleUserPresenter(users.data[0])
  }

  @Get('users/profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user profile by user',
    description: 'Get user profile information by user',
  })
  @ApiOkResponse({ description: 'User found' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @CheckPolicies({ action: 'read', subject: 'User' })
  async getUsers(@User('id') userId: number) {
    const users = await this.getListUserUseCase.execute({
      id: userId,
    })
    return new SimpleUserPresenter(users.data[0])
  }

  @Put('users/profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update  user profile by user',
    description: 'Update user profile information',
  })
  @ApiOkResponse({ description: 'User updated' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @CheckPolicies({ action: 'update', subject: 'User' })
  async updateUsers(
    @Body() updateUserDto: UpdateUserDto,
    @User('id') userId: number,
  ) {
    const isUpdated = await this.updateUserUseCase.execute(
      { id: userId },
      updateUserDto,
    )
    return isUpdated
  }

  @Put('users/change-password')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change user password',
    description: 'Change password of a user',
  })
  @ApiOkResponse({ description: 'Password changed successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @CheckPolicies({ action: 'update', subject: 'User', field: 'password' })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @User('id') userId: number,
  ) {
    const isUpdated = await this.changePasswordUseCase.execute(
      { id: userId },
      changePasswordDto,
    )
    return isUpdated
  }
}
