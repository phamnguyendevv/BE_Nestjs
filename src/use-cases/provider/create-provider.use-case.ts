import { Inject, Injectable } from '@nestjs/common'

import { DataSource } from 'typeorm'

import { UserRoleEnum } from '@domain/entities/role.entity'
import {
  ProviderStatusEnum,
  UserStatusEnum,
} from '@domain/entities/status.entity'
import { EXCEPTIONS, IException } from '@domain/exceptions/exceptions.interface'
import {
  IProviderProfileRepositoryInterface,
  PROVIDER_PROFILE_REPOSITORY,
} from '@domain/repositories/provider-profile.respository.interface'
import {
  IUserRepositoryInterface,
  USER_REPOSITORY,
} from '@domain/repositories/user.repository.interface'
import {
  BCRYPT_SERVICE,
  IBcryptService,
} from '@domain/services/bcrypt.interface'

import { RegisterProviderDto } from '@adapters/controllers/users/dto/create-provider.dto'

@Injectable()
export class CreateProviderUseCase {
  constructor(
    @Inject(PROVIDER_PROFILE_REPOSITORY)
    private readonly providerProfileRepository: IProviderProfileRepositoryInterface,

    @Inject(BCRYPT_SERVICE)
    private readonly bcryptService: IBcryptService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepositoryInterface,
    @Inject(EXCEPTIONS)
    private readonly exceptionsService: IException,
    private readonly dataSource: DataSource,
  ) {}

  async execute(providerProfile: RegisterProviderDto): Promise<boolean> {
    await this.checkUserExistence(providerProfile.email)
    await this.createProviderWithProfile(providerProfile)
    return true
  }

  private async checkUserExistence(email: string): Promise<void> {
    const user = await this.userRepository.getUserByEmail(email)

    if (user) {
      throw this.exceptionsService.badRequestException({
        type: 'BadRequest',
        message: 'User already exists with this email',
      })
    }
  }

  private async createProviderWithProfile(
    providerProfile: RegisterProviderDto,
  ): Promise<void> {
    const passwordMatches = await this.bcryptService.hash(
      providerProfile.password,
    )
    await this.dataSource.transaction(async (manager) => {
      const user = await this.userRepository.createUser(
        {
          email: providerProfile.email,
          password: passwordMatches,
          username: providerProfile.email,
          role: UserRoleEnum.Provider,
          status: UserStatusEnum.InActive,
          isProvider: true,
          emailVerified: true,
        },
        manager,
      )

      await this.providerProfileRepository.createProvider(
        {
          userId: user.id,
          businessName: providerProfile.businessName || '',
          businessDescription: providerProfile.businessDescription || '',
          bankAccountInfo: providerProfile.bankAccountInfo || {},
          commissionRate: 0,
          status: ProviderStatusEnum.Pending,
        },
        manager,
      )
    })
  }
}
