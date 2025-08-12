// import { MailerService } from '@nestjs-modules/mailer'
// import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager'
// import { Inject, Injectable } from '@nestjs/common'

// import { EXCEPTIONS, IException } from '@domain/exceptions/exceptions.interface'
// import { IRedisCacheService } from '@domain/services/redis-cache.interface'

// @Injectable()
// export class RedisCacheService implements IRedisCacheService {
//   constructor(
//     @Inject(EXCEPTIONS)
//     private readonly exceptionsService: IException,
//     @Inject(CACHE_MANAGER)
//     private cacheManager: Cache,
//   ) {}
//   async getValue<T>(key: string): Promise<T | null> {
//     try {
//       const value = await this.cacheManager.get<T>(key)
//       return value === undefined ? null : value
//     } catch (error) {
//       this.exceptionsService.internalServerErrorException({
//         type: 'CacheGetError',
//         message: `Failed to get value from cache for key: ${key}`,
//       })
//       return null
//     }
//   }
//   async setValue<T>(key: string, value: T, ttl?: number): Promise<void> {
//     try {
//       await this.cacheManager.set(key, value, 500)
//     } catch (error) {
//       this.exceptionsService.internalServerErrorException({
//         type: 'CacheSetError',
//         message: `Failed to set value in cache for key: ${key}`,
//       })
//     }
//   }
// }
