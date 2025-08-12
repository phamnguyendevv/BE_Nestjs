import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger'

import { CreateCheckoutSessionUseCase } from '@use-cases/payment/create-checkout-session.use-case'
import { HandleWebhookUseCase } from '@use-cases/payment/handle-webhook.use-case'

import { ApiResponseType } from '../common/decorators/swagger-response.decorator'
import { User } from '../common/decorators/user.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CreateCheckoutSessionDto2 } from './dto/create-checkout-session.dto'
import { CreateCheckoutSessionPresenter } from './presenters/create-checkout-session.presenters'
import { GetStatusSessionUseCase } from '@use-cases/payment/get-status-session.use-case'



@Controller('payments')
@ApiTags('Payments')
export class PaymentController {
  constructor(
    private handleWebhookUseCase: HandleWebhookUseCase,
    private createCheckoutSessionUseCase: CreateCheckoutSessionUseCase,
    private getSessionStatusUseCase: GetStatusSessionUseCase,
  ) {}


  @Post('create-checkout-session')
  @UseGuards(JwtAuthGuard)
  @ApiExtraModels(
    CreateCheckoutSessionDto2,
    CreateCheckoutSessionPresenter,
  )
  @ApiOperation({
    summary: 'Create a checkout session for payment',
  })
  @ApiBody({
    type: CreateCheckoutSessionDto2,
    description: 'Details for creating a checkout session',
  })
  @ApiResponseType(CreateCheckoutSessionPresenter, false)
  @ApiBearerAuth()
  async createCheckoutSession(
    @Body() createCheckoutSessionDto: CreateCheckoutSessionDto2,
    @User('id') userId: number,
  ) {
    const checkoutSession = await this.createCheckoutSessionUseCase.execute(
      createCheckoutSessionDto,
      userId,
    )
    return new CreateCheckoutSessionPresenter(checkoutSession)
  }


  @Get(':sessionId/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get session status',
  })
  @ApiResponseType(CreateCheckoutSessionPresenter, false)
  @ApiBearerAuth()
  async getSessionStatus(
    @Param('sessionId') sessionId: string,
  ) {
    return await this.getSessionStatusUseCase.execute(
      sessionId,  
    )
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const payload = req.rawBody as Buffer
    return this.handleWebhookUseCase.execute(payload, signature)
  }
}
