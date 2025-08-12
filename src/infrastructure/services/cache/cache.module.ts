import { CacheModule } from '@nestjs/cache-manager'
import { Global, Logger, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { redisStore } from 'cache-manager-redis-store'
import { KeyvCacheableMemory } from 'cacheable'
import Keyv from 'keyv'

import { EXCEPTIONS } from '@domain/exceptions/exceptions.interface'
import { CACHE__SERVICE } from '@domain/services/redis-cache.interface'

import { ExceptionsModule } from '@infrastructure/exceptions/exceptions.module'
import { ExceptionsService } from '@infrastructure/exceptions/exceptions.service'

@Global()
@Module({
  imports: [
    ConfigModule.forRoot(),
    ExceptionsModule,
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('CacheModule')
        const redisUrl =
          'redis://default:SsrVXI2aTA6UuUdFBH0KOCSHLdJ6nP0o@redis-16947.c245.us-east-1-3.ec2.redns.redis-cloud.com:16947'
        const memoryCacheTTL = configService.get<number>(
          'MEMORY_CACHE_TTL',
          60000,
        )
        const memoryCacheSize = configService.get<number>(
          'MEMORY_CACHE_SIZE',
          5000,
        )

        if (!redisUrl) {
          throw new Error('REDIS_URL is not defined in environment variables')
        }

        try {
          // Parse Redis URL
          const url = new URL(redisUrl)
          const redisConfig = {
            socket: {
              host: url.hostname,
              port: parseInt(url.port),
            },
            password: url.password,
            ttl: memoryCacheTTL,
          }

          // Redis store (single level cache compatible with NestJS CacheModule)
          const redisStoreInstance = await redisStore(redisConfig)

          return {
            store: redisStoreInstance,
            ttl: memoryCacheTTL,
            max: memoryCacheSize,
            isCacheableValue: (value: unknown) =>
              value !== undefined && value !== null,
          }
        } catch (error) {
          logger.error('Failed to initialize cache stores', error)
          throw error
        }
      },
    }),
  ],
  providers: [
    {
      provide: EXCEPTIONS,
      useClass: ExceptionsService,
    },
  ],
  exports: [CacheModule, CACHE__SERVICE],
})
export class RedisCacheModule {}
