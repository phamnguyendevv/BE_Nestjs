import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { REVIEW_REPOSITORY } from '@domain/repositories/review.repository.interface'

import { CreateReviewUseCase } from '@use-cases/reviews/create-review.use-case'
import { DeleteReviewUseCase } from '@use-cases/reviews/delete-review.use-case'
import { GetListReviewUseCase } from '@use-cases/reviews/get-list-review.use-case'
import { GetDetailReviewUseCase } from '@use-cases/reviews/get-detail-review.use-case'
import { UpdateReviewUseCase } from '@use-cases/reviews/update-review.use-case'

import { ReviewsController } from '@adapters/controllers/reviews/reviews.controller'

import { Review } from '@infrastructure/databases/postgressql/entities/review.entity'
import { ReviewRepository } from '@infrastructure/databases/postgressql/repositories/review.repository'
import { EXCEPTIONS } from '@domain/exceptions/exceptions.interface'
import { ExceptionsService } from '@infrastructure/exceptions/exceptions.service'

import { ExceptionsModule } from '@infrastructure/exceptions/exceptions.module'
import { JwtModule } from '@infrastructure/services/jwt/jwt.module'

@Module({
  imports: [TypeOrmModule.forFeature([Review]), JwtModule ,ExceptionsModule],
  controllers: [ReviewsController],
  providers: [
    {
      provide: REVIEW_REPOSITORY,
      useClass: ReviewRepository,
    },
    {
      provide: EXCEPTIONS,
      useClass: ExceptionsService,
    },
    CreateReviewUseCase,
    DeleteReviewUseCase,
    GetListReviewUseCase,
    GetDetailReviewUseCase,
    UpdateReviewUseCase,
  ],
})
export class ReviewsModule {}
